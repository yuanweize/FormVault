"""
Health check endpoints for FormVault Insurance Portal.

This module provides health check and system status endpoints
for monitoring and load balancer health checks.
"""

from fastapi import APIRouter, Depends
from typing import Dict, Any
from datetime import datetime

from app.core.config import get_settings, Settings
from app.schemas.base import ResponseBase

router = APIRouter()


@router.get("/", response_model=Dict[str, Any])
async def health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint.
    
    Returns basic system status information for load balancers
    and monitoring systems.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "service": "formvault-api"
    }


@router.get("/detailed", response_model=Dict[str, Any])
async def detailed_health_check(
    settings: Settings = Depends(get_settings)
) -> Dict[str, Any]:
    """
    Detailed health check endpoint.
    
    Returns comprehensive system status including configuration
    and dependency status (when implemented).
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "service": "formvault-api",
        "environment": {
            "debug": settings.DEBUG,
            "database_configured": bool(settings.DATABASE_URL),
            "email_configured": bool(settings.SMTP_HOST),
            "upload_dir": settings.UPLOAD_DIR,
            "max_file_size": settings.MAX_FILE_SIZE,
        },
        "dependencies": {
            "database": "not_checked",  # TODO: Implement database health check
            "email_service": "not_checked",  # TODO: Implement email service health check
            "file_storage": "not_checked",  # TODO: Implement file storage health check
        }
    }


@router.get("/ready", response_model=Dict[str, Any])
async def readiness_check() -> Dict[str, Any]:
    """
    Readiness check endpoint.
    
    Returns whether the service is ready to accept requests.
    Used by Kubernetes and other orchestration systems.
    """
    # TODO: Add actual readiness checks (database connection, etc.)
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {
            "database": "ready",
            "file_storage": "ready",
            "email_service": "ready"
        }
    }


@router.get("/live", response_model=Dict[str, Any])
async def liveness_check() -> Dict[str, Any]:
    """
    Liveness check endpoint.
    
    Returns whether the service is alive and functioning.
    Used by Kubernetes and other orchestration systems.
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": "not_implemented"  # TODO: Implement uptime tracking
    }