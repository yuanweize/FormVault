"""
FormVault Insurance Portal - Main FastAPI Application

This module sets up the FastAPI application with CORS, security middleware,
error handlers, and API routes for the insurance application portal.
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import structlog
import time
from datetime import datetime
from typing import Dict, Any

from app.core.exceptions import FormVaultException
from app.core.config import get_settings
from app.api.v1.router import api_router
from app.middleware.security import SecurityMiddleware
from app.middleware.audit import AuditMiddleware
from app.services.error_tracking import track_error

# Configure structured logging
logger = structlog.get_logger(__name__)

# Get application settings
settings = get_settings()

# Create FastAPI application instance
app = FastAPI(
    title="FormVault Insurance Portal API",
    description="Secure API for insurance application submissions and document management",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)


# Audit Middleware (should be first to capture all requests)
app.add_middleware(AuditMiddleware)

# Security Middleware
app.add_middleware(
    SecurityMiddleware,
    rate_limit_requests=settings.RATE_LIMIT_REQUESTS,
    rate_limit_window=settings.RATE_LIMIT_WINDOW
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests with timing information."""
    start_time = time.time()
    
    # Log request
    logger.info(
        "Request started",
        method=request.method,
        url=str(request.url),
        client_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    
    # Log response
    logger.info(
        "Request completed",
        method=request.method,
        url=str(request.url),
        status_code=response.status_code,
        process_time=round(process_time, 4),
    )
    
    # Add timing header
    response.headers["X-Process-Time"] = str(process_time)
    
    return response


# Custom Exception Handlers
@app.exception_handler(FormVaultException)
async def formvault_exception_handler(request: Request, exc: FormVaultException):
    """Handle custom FormVault exceptions."""
    logger.error(
        "FormVault exception occurred",
        error_code=exc.error_code,
        message=exc.message,
        status_code=exc.status_code,
        url=str(request.url),
    )
    
    # Track error for monitoring
    track_error(
        error=exc,
        severity="error" if exc.status_code >= 500 else "warning",
        context={
            "url": str(request.url),
            "method": request.method,
            "error_code": exc.error_code,
            "status_code": exc.status_code
        },
        user_ip=request.client.host if request.client else None
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.message,
                "code": exc.error_code,
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url.path),
            }
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors."""
    logger.warning(
        "Validation error occurred",
        errors=exc.errors(),
        url=str(request.url),
    )
    
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "message": "Validation failed",
                "code": "VALIDATION_ERROR",
                "details": exc.errors(),
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url.path),
            }
        }
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions."""
    logger.error(
        "HTTP exception occurred",
        status_code=exc.status_code,
        detail=exc.detail,
        url=str(request.url),
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.detail,
                "code": "HTTP_ERROR",
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url.path),
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(
        "Unexpected exception occurred",
        exception_type=type(exc).__name__,
        exception_message=str(exc),
        url=str(request.url),
        exc_info=True,
    )
    
    # Track critical error for monitoring
    track_error(
        error=exc,
        severity="critical",
        context={
            "url": str(request.url),
            "method": request.method,
            "exception_type": type(exc).__name__
        },
        user_ip=request.client.host if request.client else None
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "message": "Internal server error",
                "code": "INTERNAL_ERROR",
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url.path),
            }
        }
    )


# Health check endpoint
@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
    }


# Include API routes
app.include_router(api_router, prefix="/api/v1")


# Application startup event
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    logger.info("FormVault API starting up")


# Application shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    logger.info("FormVault API shutting down")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )