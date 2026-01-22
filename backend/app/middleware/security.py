"""
Security middleware for FormVault Insurance Portal.

This module provides comprehensive security middleware including:
- Rate limiting
- CSRF protection
- Security headers
- Input sanitization
- Request validation
"""

import time
import hashlib
import secrets
from typing import Dict, Optional, Set
from fastapi import Request, Response, HTTPException
from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import structlog
import re
import html
from urllib.parse import quote

logger = structlog.get_logger(__name__)

# In-memory rate limiting store (use Redis in production)
rate_limit_store: Dict[str, Dict[str, float]] = {}

# CSRF token store (use Redis in production)
csrf_tokens: Set[str] = set()

# Security patterns for input validation
SUSPICIOUS_PATTERNS = [
    r'<script[^>]*>.*?</script>',  # Script tags
    r'javascript:',  # JavaScript URLs
    r'on\w+\s*=',  # Event handlers
    r'<iframe[^>]*>.*?</iframe>',  # Iframes
    r'<object[^>]*>.*?</object>',  # Objects
    r'<embed[^>]*>.*?</embed>',  # Embeds
    r'<link[^>]*>',  # Link tags
    r'<meta[^>]*>',  # Meta tags
    r'<style[^>]*>.*?</style>',  # Style tags
    r'expression\s*\(',  # CSS expressions
    r'url\s*\(',  # CSS URLs
    r'@import',  # CSS imports
    r'vbscript:',  # VBScript URLs
    r'data:text/html',  # Data URLs with HTML
]

# SQL injection patterns
SQL_INJECTION_PATTERNS = [
    r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)',
    r'(\b(OR|AND)\s+\d+\s*=\s*\d+)',
    r'(\b(OR|AND)\s+[\'"]?\w+[\'"]?\s*=\s*[\'"]?\w+[\'"]?)',
    r'(--|#|/\*|\*/)',
    r'(\bUNION\s+(ALL\s+)?SELECT\b)',
    r'(\bINSERT\s+INTO\b)',
    r'(\bDROP\s+TABLE\b)',
    r'(\bEXEC\s*\()',
    r'(\bxp_cmdshell\b)',
]


class SecurityMiddleware(BaseHTTPMiddleware):
    """Comprehensive security middleware for API protection."""
    
    def __init__(self, app, rate_limit_requests: int = 100, rate_limit_window: int = 3600):
        super().__init__(app)
        self.rate_limit_requests = rate_limit_requests
        self.rate_limit_window = rate_limit_window
        
    async def dispatch(self, request: Request, call_next):
        """Process request through security checks."""
        
        # Skip security checks for health endpoint
        if request.url.path == "/health":
            return await call_next(request)
            
        try:
            # 1. Rate limiting
            if not await self._check_rate_limit(request):
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": {
                            "message": "Rate limit exceeded",
                            "code": "RATE_LIMIT_EXCEEDED",
                            "retry_after": self.rate_limit_window
                        }
                    },
                    headers={"Retry-After": str(self.rate_limit_window)}
                )
            
            # 2. Input sanitization and validation
            await self._validate_request_input(request)
            
            # 3. Process request
            response = await call_next(request)
            
            # 4. Add security headers
            self._add_security_headers(response)
            
            return response
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(
                "Security middleware error",
                error=str(e),
                path=request.url.path,
                method=request.method,
                exc_info=True
            )
            return JSONResponse(
                status_code=500,
                content={
                    "error": {
                        "message": "Security validation failed",
                        "code": "SECURITY_ERROR"
                    }
                }
            )
    
    async def _check_rate_limit(self, request: Request) -> bool:
        """Check if request is within rate limits."""
        client_ip = self._get_client_ip(request)
        current_time = time.time()
        
        # Clean old entries
        if client_ip in rate_limit_store:
            rate_limit_store[client_ip] = {
                timestamp: count for timestamp, count in rate_limit_store[client_ip].items()
                if current_time - float(timestamp) < self.rate_limit_window
            }
        
        # Initialize if not exists
        if client_ip not in rate_limit_store:
            rate_limit_store[client_ip] = {}
        
        # Count requests in current window
        total_requests = sum(rate_limit_store[client_ip].values())
        
        if total_requests >= self.rate_limit_requests:
            logger.warning(
                "Rate limit exceeded",
                client_ip=client_ip,
                requests=total_requests,
                limit=self.rate_limit_requests
            )
            return False
        
        # Add current request
        timestamp_key = str(int(current_time))
        rate_limit_store[client_ip][timestamp_key] = rate_limit_store[client_ip].get(timestamp_key, 0) + 1
        
        return True
    
    async def _validate_request_input(self, request: Request):
        """Validate and sanitize request input."""
        
        # Check URL path for suspicious patterns
        path = request.url.path
        query = str(request.url.query) if request.url.query else ""
        
        # Validate path
        if self._contains_suspicious_content(path):
            logger.warning(
                "Suspicious path detected",
                path=path,
                client_ip=self._get_client_ip(request)
            )
            raise HTTPException(
                status_code=400,
                detail="Invalid request path"
            )
        
        # Validate query parameters
        if self._contains_suspicious_content(query):
            logger.warning(
                "Suspicious query parameters detected",
                query=query,
                client_ip=self._get_client_ip(request)
            )
            raise HTTPException(
                status_code=400,
                detail="Invalid query parameters"
            )
        
        # Validate headers
        for header_name, header_value in request.headers.items():
            if self._contains_suspicious_content(header_value):
                logger.warning(
                    "Suspicious header detected",
                    header=header_name,
                    client_ip=self._get_client_ip(request)
                )
                raise HTTPException(
                    status_code=400,
                    detail="Invalid request headers"
                )
        
        # Validate request body for POST/PUT requests
        if request.method in ["POST", "PUT", "PATCH"]:
            await self._validate_request_body(request)
    
    async def _validate_request_body(self, request: Request):
        """Validate request body content."""
        try:
            # Get content type
            content_type = request.headers.get("content-type", "")
            
            # Skip file uploads (they have their own validation)
            if "multipart/form-data" in content_type:
                return
            
            # For JSON content, we'll validate after parsing
            # The actual validation happens in Pydantic models
            # This is just for basic security checks
            
            # Check content length
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB limit
                raise HTTPException(
                    status_code=413,
                    detail="Request body too large"
                )
                
        except ValueError as e:
            logger.warning(
                "Invalid request body",
                error=str(e),
                client_ip=self._get_client_ip(request)
            )
            raise HTTPException(
                status_code=400,
                detail="Invalid request body format"
            )
    
    def _contains_suspicious_content(self, content: str) -> bool:
        """Check if content contains suspicious patterns."""
        if not content:
            return False
        
        content_lower = content.lower()
        
        # Check for XSS patterns
        for pattern in SUSPICIOUS_PATTERNS:
            if re.search(pattern, content_lower, re.IGNORECASE):
                return True
        
        # Check for SQL injection patterns
        for pattern in SQL_INJECTION_PATTERNS:
            if re.search(pattern, content_lower, re.IGNORECASE):
                return True
        
        return False
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address from request."""
        # Check for forwarded headers
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fallback to client host
        return request.client.host if request.client else "unknown"
    
    def _add_security_headers(self, response: Response):
        """Add security headers to response."""
        security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self'; "
                "connect-src 'self'; "
                "frame-ancestors 'none'"
            ),
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": (
                "geolocation=(), "
                "microphone=(), "
                "camera=(), "
                "payment=(), "
                "usb=(), "
                "magnetometer=(), "
                "gyroscope=(), "
                "speaker=()"
            )
        }
        
        for header, value in security_headers.items():
            response.headers[header] = value


class CSRFProtection:
    """CSRF protection utilities."""
    
    @staticmethod
    def generate_csrf_token() -> str:
        """Generate a new CSRF token."""
        token = secrets.token_urlsafe(32)
        csrf_tokens.add(token)
        return token
    
    @staticmethod
    def validate_csrf_token(token: str) -> bool:
        """Validate CSRF token."""
        if not token:
            return False
        
        if token in csrf_tokens:
            # Remove token after use (one-time use)
            csrf_tokens.discard(token)
            return True
        
        return False
    
    @staticmethod
    def cleanup_expired_tokens():
        """Clean up expired CSRF tokens."""
        # In production, implement proper expiration with timestamps
        # For now, limit the size of the token store
        if len(csrf_tokens) > 10000:
            # Remove oldest tokens (simplified approach)
            tokens_to_remove = list(csrf_tokens)[:5000]
            for token in tokens_to_remove:
                csrf_tokens.discard(token)


def sanitize_input(value: str) -> str:
    """Sanitize user input to prevent XSS and injection attacks."""
    if not isinstance(value, str):
        return value
    
    # HTML escape
    sanitized = html.escape(value)
    
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>"\']', '', sanitized)
    
    # Limit length
    if len(sanitized) > 10000:
        sanitized = sanitized[:10000]
    
    return sanitized


def validate_sql_input(value: str) -> str:
    """Validate input for SQL injection patterns."""
    if not isinstance(value, str):
        return value
    
    # Check for SQL injection patterns
    for pattern in SQL_INJECTION_PATTERNS:
        if re.search(pattern, value, re.IGNORECASE):
            raise ValueError(f"Invalid input detected: potential SQL injection")
    
    return value


def secure_filename(filename: str) -> str:
    """Secure a filename by removing dangerous characters."""
    if not filename:
        return "unnamed_file"
    
    # Remove path separators and dangerous characters
    filename = re.sub(r'[^\w\s.-]', '', filename)
    filename = re.sub(r'\.{2,}', '.', filename)  # Remove multiple dots
    filename = filename.strip('. ')
    
    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:250] + ('.' + ext if ext else '')
    
    return filename or "unnamed_file"


# Security utility functions
def hash_password(password: str) -> str:
    """Hash password using secure method."""
    import bcrypt
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash."""
    import bcrypt
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(length)


def constant_time_compare(a: str, b: str) -> bool:
    """Compare two strings in constant time to prevent timing attacks."""
    return secrets.compare_digest(a.encode('utf-8'), b.encode('utf-8'))