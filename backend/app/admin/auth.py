from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import RedirectResponse
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from ..core.config import get_settings
from ..database import SessionLocal
from ..models.system import AdminUser

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_current_admin(request: Request) -> dict:
    """
    Extract current authenticated admin identity and RBAC role from request session.
    Roles:
      - 'super_admin': Platform owner, full access to all resources & configurations.
      - 'broker_agent': Broker operations, handles applications & plans across all companies.
      - 'company_partner': Insurance partner underwriter, scoped strictly to assigned company_id.
      - 'compliance_auditor': Regulatory auditor, read-only across all applications & audit trails.
    """
    user_id = request.session.get("user_id")
    token = request.session.get("token")
    role = request.session.get("role")
    
    # Fail-close security: unauthenticated or corrupted session returns no role
    if not user_id or not token or not role:
        return {
            "user_id": None,
            "username": "Anonymous",
            "role": None,
            "company_id": None,
        }

    return {
        "user_id": str(user_id),
        "username": request.session.get("username", "Unknown"),
        "role": role,
        "company_id": request.session.get("company_id"),
    }


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")

        # 1. Try Database Auth
        db: Session = SessionLocal()
        try:
            user = db.query(AdminUser).filter(AdminUser.username == username).first()
            try:
                if user and pwd_context.verify(password, user.password_hash):
                    if not user.is_active:
                        return False  # Account suspended

                    # Record login timestamp
                    user.last_login_at = datetime.now(timezone.utc)
                    db.commit()

                    role = user.role or "super_admin"
                    request.session.update({
                        "token": f"db-user-{user.id}",
                        "user_id": str(user.id),
                        "username": user.username,
                        "role": role,
                        "company_id": user.company_id,
                    })
                    return True
            except Exception:
                pass  # Password likely too long or invalid encoding
        except Exception:
            pass  # Fallback if DB not ready or error
        finally:
            db.close()

        # 2. Fallback to Env Vars (Safety Net / Initial Bootstrap)
        if username == settings.ADMIN_USERNAME and password == settings.ADMIN_PASSWORD:
            request.session.update({
                "token": "admin-token",
                "user_id": "env-admin",
                "username": settings.ADMIN_USERNAME,
                "role": "super_admin",
                "company_id": None,
            })
            return True

        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        token = request.session.get("token")
        if not token:
            return False

        # If logged in via DB, verify account is still active and sync latest role
        if token.startswith("db-user-"):
            user_id = token.replace("db-user-", "")
            db: Session = SessionLocal()
            try:
                user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
                if not user or not user.is_active:
                    request.session.clear()
                    return False
                # Live sync session data
                request.session["role"] = user.role or "super_admin"
                request.session["company_id"] = user.company_id
                request.session["username"] = user.username
            except Exception:
                pass
            finally:
                db.close()

        return True


authentication_backend = AdminAuth(secret_key=settings.ADMIN_SECRET_KEY)

