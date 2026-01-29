"""
Audit logging middleware for tracking all API requests and system activities.
"""

import time
import json
from typing import Optional, Dict, Any
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
import structlog

from ..database import get_db
from ..models.audit_log import AuditLog
from ..core.exceptions import FormVaultException

logger = structlog.get_logger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all API requests and responses for audit purposes.
    """

    def __init__(self, app, exclude_paths: Optional[list] = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
        ]

    async def dispatch(self, request: Request, call_next):
        """Process request and log audit information."""
        start_time = time.time()

        # Skip audit logging for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        # Extract request information
        request_info = await self._extract_request_info(request)

        # Process request
        response = await call_next(request)

        # Calculate processing time
        process_time = time.time() - start_time

        # Log audit entry
        await self._log_audit_entry(
            request=request,
            response=response,
            request_info=request_info,
            process_time=process_time,
        )

        return response

    async def _extract_request_info(self, request: Request) -> Dict[str, Any]:
        """Extract relevant information from the request."""
        try:
            # Get request body for POST/PUT requests (limited size)
            body = None
            if request.method in ["POST", "PUT", "PATCH"]:
                body_bytes = await request.body()
                if len(body_bytes) < 10000:  # Limit to 10KB
                    try:
                        body = body_bytes.decode("utf-8")
                        # Try to parse as JSON for better logging
                        json.loads(body)
                    except (UnicodeDecodeError, json.JSONDecodeError):
                        body = f"<binary data: {len(body_bytes)} bytes>"
                else:
                    body = f"<large payload: {len(body_bytes)} bytes>"

            return {
                "method": request.method,
                "url": str(request.url),
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "headers": dict(request.headers),
                "body": body,
                "client_ip": self._get_client_ip(request),
                "user_agent": request.headers.get("user-agent"),
            }
        except Exception as e:
            logger.error("Failed to extract request info", error=str(e))
            return {
                "method": request.method,
                "path": request.url.path,
                "error": "Failed to extract request info",
            }

    def _get_client_ip(self, request: Request) -> Optional[str]:
        """Extract client IP address from request."""
        # Check for forwarded headers first (for reverse proxy setups)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        # Fall back to direct client IP
        if request.client:
            return request.client.host

        return None

    async def _log_audit_entry(
        self,
        request: Request,
        response: Response,
        request_info: Dict[str, Any],
        process_time: float,
    ):
        """Create audit log entry in database."""
        try:
            # Determine action based on method and path
            action = self._determine_action(request.method, request.url.path)

            # Extract application ID if present in path
            application_id = self._extract_application_id(request.url.path)

            # Prepare audit details
            audit_details = {
                "request": {
                    "method": request_info["method"],
                    "path": request_info["path"],
                    "query_params": request_info["query_params"],
                    "content_type": request.headers.get("content-type"),
                    "content_length": request.headers.get("content-length"),
                },
                "response": {
                    "status_code": response.status_code,
                    "content_type": response.headers.get("content-type"),
                    "content_length": response.headers.get("content-length"),
                },
                "performance": {
                    "process_time": round(process_time, 4),
                },
                "metadata": {
                    "timestamp": time.time(),
                },
            }

            # Add request body for certain actions (excluding sensitive data)
            if request_info.get("body") and not self._contains_sensitive_data(
                request_info["body"]
            ):
                audit_details["request"]["body"] = request_info["body"]

            # Create audit log entry
            db: Session = next(get_db())
            try:
                audit_log = AuditLog.create_log(
                    action=action,
                    application_id=application_id,
                    user_ip=request_info["client_ip"],
                    user_agent=request_info["user_agent"],
                    details=audit_details,
                )

                db.add(audit_log)
                db.commit()

                logger.info(
                    "Audit log created",
                    action=action,
                    application_id=application_id,
                    status_code=response.status_code,
                    process_time=process_time,
                )

            except Exception as db_error:
                db.rollback()
                logger.error(
                    "Failed to create audit log", error=str(db_error), action=action
                )
            finally:
                db.close()

        except Exception as e:
            logger.error("Failed to log audit entry", error=str(e))

    def _determine_action(self, method: str, path: str) -> str:
        """Determine action name based on HTTP method and path."""
        # Map common API patterns to action names
        action_map = {
            ("POST", "/api/v1/applications"): "application.create",
            ("GET", "/api/v1/applications"): "application.list",
            ("PUT", "/api/v1/applications"): "application.update",
            ("DELETE", "/api/v1/applications"): "application.delete",
            ("POST", "/api/v1/files/upload"): "file.upload",
            ("GET", "/api/v1/files"): "file.list",
            ("DELETE", "/api/v1/files"): "file.delete",
        }

        # Check for exact matches
        key = (method, path)
        if key in action_map:
            return action_map[key]

        # Check for pattern matches
        if "/applications/" in path and "/export" in path:
            return "application.export"
        elif "/applications/" in path:
            if method == "GET":
                return "application.get"
            elif method == "PUT":
                return "application.update"
            elif method == "DELETE":
                return "application.delete"
        elif "/files/" in path:
            if method == "GET":
                return "file.get"
            elif method == "DELETE":
                return "file.delete"

        # Default action
        return f"api.{method.lower()}"

    def _extract_application_id(self, path: str) -> Optional[str]:
        """Extract application ID from URL path if present."""
        import re

        # Pattern to match UUID in path
        uuid_pattern = r"/applications/([a-f0-9-]{36})"
        match = re.search(uuid_pattern, path)

        if match:
            return match.group(1)

        return None

    def _contains_sensitive_data(self, body: str) -> bool:
        """Check if request body contains sensitive data that shouldn't be logged."""
        if not body:
            return False

        sensitive_fields = [
            "password",
            "token",
            "secret",
            "key",
            "ssn",
            "social_security",
            "credit_card",
            "passport",
        ]

        body_lower = body.lower()
        return any(field in body_lower for field in sensitive_fields)
