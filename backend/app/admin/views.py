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
    
    can_create = True # Allow creating the singleton
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
