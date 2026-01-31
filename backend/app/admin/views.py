from sqladmin import ModelView
from ..models.application import Application
from ..models.file import File
from ..models.email_export import EmailExport
from ..models.audit_log import AuditLog
from ..models.system import SystemConfig
from wtforms.fields import PasswordField

class ApplicationAdmin(ModelView, model=Application):
    column_list = [
        Application.reference_number,
        Application.status,
        Application.first_name,
        Application.last_name,
        Application.insurance_type,
        Application.created_at
    ]
    column_searchable_list = [Application.reference_number, Application.email, Application.last_name]
    column_sortable_list = [Application.created_at, Application.status]
    column_default_sort = ("created_at", True)
    icon = "fa-solid fa-file-invoice"

class SystemConfigAdmin(ModelView, model=SystemConfig):
    name = "System Configuration ⚙️"
    icon = "fa-solid fa-gears"
    
    can_create = True 
    can_delete = False
    
    column_list = [SystemConfig.storage_provider, SystemConfig.s3_endpoint, SystemConfig.updated_at]
    form_columns = [
        SystemConfig.storage_provider,
        SystemConfig.s3_endpoint,
        SystemConfig.s3_bucket,
        SystemConfig.s3_region,
        SystemConfig.s3_access_key,
        SystemConfig.s3_secret_key
    ]
    
    # Secure the Secret Key
    form_overrides = dict(s3_secret_key=PasswordField)
    form_args = dict(
        storage_provider=dict(choices=["local", "s3"], label="Storage Provider (local/s3)")
    )

    async def on_model_change(self, data, model, is_created, request):
        # Enforce Singleton Pattern
        if is_created:
            # Check if any config exists
            with request.state.db_session_factory() as session:
                existing = session.query(SystemConfig).first()
                if existing:
                    # Instead of creating new, prevent it or update existing?
                    # Admin UI generic create usually assumes new ID. 
                    # Raising error is safest to prevent duplicate confusing rows.
                    raise Exception("System Configuration already exists. Please edit the existing one.")
        return await super().on_model_change(data, model, is_created, request)


from ..models.system import AdminUser
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AdminUserAdmin(ModelView, model=AdminUser):
    name = "Admin Users 👤"
    name_plural = "Admin Users"
    icon = "fa-solid fa-users-gear"
    
    column_list = [AdminUser.username, AdminUser.created_at]
    form_columns = [AdminUser.username, AdminUser.password_hash]
    
    # Use PasswordField effectively
    form_overrides = dict(password_hash=PasswordField)
    form_args = dict(password_hash=dict(label="Password (Leave empty to keep unchanged)"))

    async def on_model_change(self, data, model, is_created, request):
        password = data.get("password_hash")
        
        if is_created:
             if not password:
                 raise Exception("Password is required for new users.")
             data["password_hash"] = pwd_context.hash(password)
        else:
            # Update mode
            if password:
                # User entered new password
                data["password_hash"] = pwd_context.hash(password)
            else:
                # Empty password field means "do not change"
                # We need to remove it from data to avoid overwriting with empty string/None
                del data["password_hash"]
                
        return await super().on_model_change(data, model, is_created, request)

class FileAdmin(ModelView, model=File):
    column_list = [
        File.id,
        File.original_filename,
        File.file_type,
        File.file_size,
        File.created_at
    ]
    can_create = False  # Files should be uploaded via App logic
    icon = "fa-solid fa-paperclip"

class EmailExportAdmin(ModelView, model=EmailExport):
    column_list = [
        EmailExport.status,
        EmailExport.recipient_email,
        EmailExport.sent_at,
        EmailExport.retry_count
    ]
    icon = "fa-solid fa-envelope"

class AuditLogAdmin(ModelView, model=AuditLog):
    column_list = [
        AuditLog.action,
        AuditLog.user_ip,
        AuditLog.created_at
    ]
    can_create = False
    can_edit = False
    can_delete = False
    column_default_sort = ("created_at", True)
    icon = "fa-solid fa-shield-halved"
