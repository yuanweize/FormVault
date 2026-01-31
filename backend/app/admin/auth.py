from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import RedirectResponse
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from ..core.config import get_settings
from ..database import SessionLocal
from ..models.system import AdminUser

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
                    request.session.update({"token": f"db-user-{user.id}"})
                    return True
            except Exception:
                pass # Password likely too long or invalid encoding
        except Exception:
            pass # Fallback if DB not ready or error
        finally:
            db.close()

        # 2. Fallback to Env Vars (Safety Net)
        if username == settings.ADMIN_USERNAME and password == settings.ADMIN_PASSWORD:
            request.session.update({"token": "admin-token"})
            return True
            
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        token = request.session.get("token")
        if not token:
            return False
        return True

authentication_backend = AdminAuth(secret_key=settings.ADMIN_SECRET_KEY)
