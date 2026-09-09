"""
FormVault Insurance Portal - Main FastAPI Application

This module sets up the FastAPI application with CORS, security middleware,
error handlers, and API routes for the insurance application portal.
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from starlette.exceptions import HTTPException as StarletteHTTPException
import structlog
import time
import os
from datetime import datetime, timezone
from typing import Dict, Any
from contextlib import asynccontextmanager

from app.core.exceptions import FormVaultException
from app.core import config
from app.core.config import get_settings
from app.api.v1.router import api_router
from app.middleware.security import SecurityMiddleware
from app.middleware.audit import AuditMiddleware
from app.services.error_tracking import track_error

from starlette.middleware.sessions import SessionMiddleware
from app.admin.admin import FormVaultAdmin
from app.database import engine, Base, SessionLocal
import app.models  # Ensures all ORM models are registered with Base.metadata
from app.admin.auth import authentication_backend
from app.admin.views import (
    ApplicationAdmin,
    FileAdmin,
    EmailExportAdmin,
    AuditLogAdmin,
    SystemConfigAdmin,
    AdminUserAdmin,
    InsuranceCompanyAdmin,
    InsurancePlanAdmin,
    AgencyBannerAdmin,
)
from app.services.seed_service import seed_czech_broker_defaults

# Configure structured logging
logger = structlog.get_logger(__name__)

# Get application settings
settings = get_settings()


from sqlalchemy import inspect, text


def auto_upgrade_schema(bind_engine):
    """Safely migrate and add any missing columns to existing database tables."""
    try:
        inspector = inspect(bind_engine)
        table_names = set(inspector.get_table_names())

        with bind_engine.connect() as conn:
            # 1. system_config
            if "system_config" in table_names:
                cfg_cols = {c["name"] for c in inspector.get_columns("system_config")}
                if "site_title" not in cfg_cols:
                    conn.execute(text("ALTER TABLE system_config ADD COLUMN site_title VARCHAR(150) DEFAULT 'FormVault Insurance | Czech Health & Travel Insurance' NOT NULL"))
                if "site_description" not in cfg_cols:
                    conn.execute(text("ALTER TABLE system_config ADD COLUMN site_description VARCHAR(255) DEFAULT 'Digital application portal for Czech health insurance in authorized cooperation with České pojištění a.s.' NULL"))
                if "site_icon_url" not in cfg_cols:
                    conn.execute(text("ALTER TABLE system_config ADD COLUMN site_icon_url VARCHAR(255) DEFAULT '/favicon.svg' NOT NULL"))
                if "support_email" not in cfg_cols:
                    conn.execute(text("ALTER TABLE system_config ADD COLUMN support_email VARCHAR(100) DEFAULT 'insurance@hktse.eu.org' NOT NULL"))
                if "crisp_website_id" not in cfg_cols:
                    conn.execute(text("ALTER TABLE system_config ADD COLUMN crisp_website_id VARCHAR(100) NULL"))
                if "crisp_custom_color" not in cfg_cols:
                    conn.execute(text("ALTER TABLE system_config ADD COLUMN crisp_custom_color VARCHAR(50) DEFAULT 'blue' NULL"))
                if "broker_legal_disclosure" not in cfg_cols:
                    conn.execute(text("ALTER TABLE system_config ADD COLUMN broker_legal_disclosure VARCHAR(255) DEFAULT 'HKTSE s.r.o. (IČO: 10858032) technical platform in authorized cooperation with České pojištění a.s. (ČNB registered intermediary).' NULL"))
                if "production_ingress_name" not in cfg_cols:
                    conn.execute(text("ALTER TABLE system_config ADD COLUMN production_ingress_name VARCHAR(100) DEFAULT 'Cloudflare Tunnel' NULL"))
                if "primary_domain" not in cfg_cols:
                    conn.execute(text("ALTER TABLE system_config ADD COLUMN primary_domain VARCHAR(150) DEFAULT 'insure.hktse.eu.org' NULL"))
                if "secondary_domain" not in cfg_cols:
                    conn.execute(text("ALTER TABLE system_config ADD COLUMN secondary_domain VARCHAR(150) DEFAULT 'pojisteni.hktse.eu.org' NULL"))
                if "form_profile_config" not in cfg_cols:
                    conn.execute(text("ALTER TABLE system_config ADD COLUMN form_profile_config TEXT NULL"))
                if "features_config" not in cfg_cols:
                    conn.execute(text("ALTER TABLE system_config ADD COLUMN features_config TEXT NULL"))

                # Smoothly sanitize legacy unlicensed wording in existing rows
                try:
                    conn.execute(text("UPDATE system_config SET site_title = 'FormVault Insurance | Czech Health & Travel Insurance' WHERE site_title LIKE '%Official Broker%'"))
                    conn.execute(text("UPDATE system_config SET site_description = 'Digital application portal for Czech health insurance in authorized cooperation with České pojištění a.s.' WHERE site_description LIKE '%Licensed insurance brokerage%'"))
                except Exception:
                    pass

            # 2. admin_users (RBAC)
            if "admin_users" in table_names:
                user_cols = {c["name"] for c in inspector.get_columns("admin_users")}
                if "role" not in user_cols:
                    conn.execute(text("ALTER TABLE admin_users ADD COLUMN role VARCHAR(30) DEFAULT 'super_admin' NOT NULL"))
                if "company_id" not in user_cols:
                    conn.execute(text("ALTER TABLE admin_users ADD COLUMN company_id INT NULL"))
                if "is_active" not in user_cols:
                    conn.execute(text("ALTER TABLE admin_users ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL"))
                if "display_name" not in user_cols:
                    conn.execute(text("ALTER TABLE admin_users ADD COLUMN display_name VARCHAR(100) NULL"))
                if "email" not in user_cols:
                    conn.execute(text("ALTER TABLE admin_users ADD COLUMN email VARCHAR(100) NULL"))
                if "last_login_at" not in user_cols:
                    conn.execute(text("ALTER TABLE admin_users ADD COLUMN last_login_at DATETIME NULL"))

            # 3. applications (Underwriting & Partner Binding)
            if "applications" in table_names:
                app_cols = {c["name"] for c in inspector.get_columns("applications")}
                if "insurance_company_id" not in app_cols:
                    conn.execute(text("ALTER TABLE applications ADD COLUMN insurance_company_id INT NULL"))
                if "insurance_plan_id" not in app_cols:
                    conn.execute(text("ALTER TABLE applications ADD COLUMN insurance_plan_id INT NULL"))
                if "gender" not in app_cols:
                    conn.execute(text("ALTER TABLE applications ADD COLUMN gender VARCHAR(10) NULL"))
                if "nationality" not in app_cols:
                    conn.execute(text("ALTER TABLE applications ADD COLUMN nationality VARCHAR(50) NULL"))
                if "place_of_birth" not in app_cols:
                    conn.execute(text("ALTER TABLE applications ADD COLUMN place_of_birth VARCHAR(100) NULL"))
                if "passport_number" not in app_cols:
                    conn.execute(text("ALTER TABLE applications ADD COLUMN passport_number VARCHAR(50) NULL"))
                if "passport_expiry_date" not in app_cols:
                    conn.execute(text("ALTER TABLE applications ADD COLUMN passport_expiry_date DATE NULL"))
                if "passport_issued_by" not in app_cols:
                    conn.execute(text("ALTER TABLE applications ADD COLUMN passport_issued_by VARCHAR(50) NULL"))
                if "insurance_commencement_date" not in app_cols:
                    conn.execute(text("ALTER TABLE applications ADD COLUMN insurance_commencement_date DATE NULL"))
                if "insurance_duration_months" not in app_cols:
                    conn.execute(text("ALTER TABLE applications ADD COLUMN insurance_duration_months INT DEFAULT 12 NULL"))
                if "type_of_stay" not in app_cols:
                    conn.execute(text("ALTER TABLE applications ADD COLUMN type_of_stay VARCHAR(50) DEFAULT 'student' NULL"))
                if "study_confirmation_file_id" not in app_cols:
                    conn.execute(text("ALTER TABLE applications ADD COLUMN study_confirmation_file_id VARCHAR(36) NULL"))
                if "custom_fields_data" not in app_cols:
                    conn.execute(text("ALTER TABLE applications ADD COLUMN custom_fields_data TEXT NULL"))

            conn.commit()
    except Exception as exc:
        logger.warning(f"Schema auto-upgrade notice: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize application lifecycle."""
    logger.info("FormVault API starting up")
    try:
        Base.metadata.create_all(bind=engine)
        auto_upgrade_schema(engine)
        logger.info("Database tables initialized successfully")
        # Initialize default seed templates if database is fresh
        try:
            with SessionLocal() as db:
                seed_czech_broker_defaults(db)
        except Exception as seed_err:
            logger.warning(f"Default seed population skipped: {seed_err}")
    except Exception as e:
        logger.warning(f"Database auto-creation skipped or deferred: {e}")
    yield
    logger.info("FormVault API shutting down")


# Create FastAPI application instance
app = FastAPI(
    title="FormVault Insurance Portal API",
    description="Secure API for insurance application submissions and document management",
    version="1.0.0",
    docs_url="/docs" if (settings.DEBUG or settings.ENABLE_DOCS) else None,
    redoc_url="/redoc" if (settings.DEBUG or settings.ENABLE_DOCS) else None,
    lifespan=lifespan,
)

admin_templates_dir = os.path.join(os.path.dirname(__file__), "templates")
admin = FormVaultAdmin(
    app, 
    engine, 
    authentication_backend=authentication_backend,
    title="FormVault Broker Admin",
    logo_url="/favicon.svg",
    favicon_url="/favicon.svg",
    templates_dir=admin_templates_dir,
)
admin.add_view(ApplicationAdmin)
admin.add_view(FileAdmin)
admin.add_view(EmailExportAdmin)
admin.add_view(InsuranceCompanyAdmin)
admin.add_view(InsurancePlanAdmin)
admin.add_view(AgencyBannerAdmin)
admin.add_view(SystemConfigAdmin)
admin.add_view(AdminUserAdmin)
admin.add_view(AuditLogAdmin)

# Session Middleware (Required for Admin Auth)
app.add_middleware(SessionMiddleware, secret_key=settings.ADMIN_SECRET_KEY)


# Audit Middleware (should be first to capture all requests)
app.add_middleware(AuditMiddleware)

# Security Middleware
app.add_middleware(
    SecurityMiddleware,
    rate_limit_requests=settings.RATE_LIMIT_REQUESTS,
    rate_limit_window=settings.RATE_LIMIT_WINDOW,
)

# Proxy Headers Middleware (Trust X-Forwarded-Proto and X-Forwarded-For from Cloudflare / Nginx)
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# First-run setup detection: automatically redirect to /setup if no admin exists yet
@app.middleware("http")
async def check_first_run_setup(request: Request, call_next):
    """
    If no admin user exists in the database yet (first-time deployment),
    automatically redirect any request to /admin (including /admin/login) to /setup.
    """
    path = request.url.path
    if (path == "/admin" or path.startswith("/admin/")) and not path.startswith("/admin/statics"):
        from app.database import SessionLocal
        from app.models.system import AdminUser

        db = SessionLocal()
        try:
            admin_exists = db.query(AdminUser).first() is not None
            if not admin_exists:
                return RedirectResponse(url="/setup", status_code=303)
        except Exception:
            pass
        finally:
            db.close()

    return await call_next(request)


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
            "status_code": exc.status_code,
        },
        user_ip=request.client.host if request.client else None,
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "detail": exc.message,
            "error": {
                "message": exc.message,
                "code": exc.error_code,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": str(request.url.path),
            },
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors."""
    encoded_errors = jsonable_encoder(exc.errors())
    logger.warning(
        "Validation error occurred",
        errors=encoded_errors,
        url=str(request.url),
    )

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation failed",
            "detail": encoded_errors,
            "error": {
                "message": "Validation failed",
                "code": "VALIDATION_ERROR",
                "details": encoded_errors,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": str(request.url.path),
            },
        },
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
            "success": False,
            "message": exc.detail,
            "detail": exc.detail,
            "error": {
                "message": exc.detail,
                "code": "HTTP_ERROR",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": str(request.url.path),
            },
        },
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
            "error_type": type(exc).__name__,
        },
        user_ip=request.client.host if request.client else None,
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "detail": "Internal server error",
            "error": {
                "message": "Internal server error",
                "code": "INTERNAL_ERROR",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": str(request.url.path),
            },
        },
    )


# Root endpoint - supports both GET and HEAD for health checks
@app.get("/")
@app.head("/")
async def root() -> Dict[str, Any]:
    """Root endpoint - returns API information."""
    current_settings = get_settings()
    return {
        "name": "FormVault Insurance Portal API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs" if current_settings.DEBUG else None,
        "health": "/health",
        "api": "/api/v1",
    }


# Health check endpoint
@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }


static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/favicon.ico", include_in_schema=False)
@app.head("/favicon.ico", include_in_schema=False)
async def favicon_ico():
    ico_path = os.path.join(static_dir, "favicon.ico")
    if os.path.exists(ico_path):
        return FileResponse(ico_path, media_type="image/x-icon")
    return Response(status_code=404)


@app.get("/favicon.svg", include_in_schema=False)
@app.head("/favicon.svg", include_in_schema=False)
async def favicon_svg():
    svg_path = os.path.join(static_dir, "favicon.svg")
    if os.path.exists(svg_path):
        return FileResponse(svg_path, media_type="image/svg+xml")
    return Response(status_code=404)


@app.get("/docs", include_in_schema=False)
async def custom_docs(request: Request):
    """Serve Swagger UI docs dynamically based on current debug setting."""
    current_settings = config.get_settings()
    if current_settings.DEBUG:
        from fastapi.openapi.docs import get_swagger_ui_html
        return get_swagger_ui_html(
            openapi_url=app.openapi_url or "/openapi.json",
            title=app.title + " - Swagger UI",
            swagger_favicon_url="/favicon.svg",
        )
    raise HTTPException(status_code=404, detail="Not Found")


@app.get("/redoc", include_in_schema=False)
async def custom_redoc(request: Request):
    """Serve ReDoc docs dynamically based on current debug setting."""
    current_settings = config.get_settings()
    if current_settings.DEBUG:
        from fastapi.openapi.docs import get_redoc_html
        return get_redoc_html(
            openapi_url=app.openapi_url or "/openapi.json",
            title=app.title + " - ReDoc",
            redoc_favicon_url="/favicon.svg",
        )
    raise HTTPException(status_code=404, detail="Not Found")


# Include API routes
app.include_router(api_router, prefix="/api/v1")

# Include Setup Router (Mounted at root)
from app.api.setup import router as setup_router
app.include_router(setup_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )
