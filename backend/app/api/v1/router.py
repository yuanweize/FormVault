"""
Main API router for FormVault Insurance Portal v1.

This module aggregates all API endpoints and provides the main router
for the FastAPI application.
"""

from fastapi import APIRouter

from .endpoints import applications, files, health, admin

# Create main API router
api_router = APIRouter()

# Include endpoint routers
api_router.include_router(
    health.router,
    prefix="/health",
    tags=["health"]
)

api_router.include_router(
    applications.router,
    prefix="/applications",
    tags=["applications"]
)

api_router.include_router(
    files.router,
    prefix="/files",
    tags=["files"]
)

api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["admin"]
)