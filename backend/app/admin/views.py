"""
SQLAdmin view configurations for FormVault Admin Dashboard.

Provides organized, clean, and categorized views with proper naming,
FontAwesome icons, and comprehensive field customization.
"""

from sqladmin import ModelView
from wtforms.fields import PasswordField, SelectField
from passlib.context import CryptContext

from ..models.application import Application
from ..models.file import File
from ..models.email_export import EmailExport
from ..models.audit_log import AuditLog
from ..models.system import AdminUser, SystemConfig
from ..models.partner import InsuranceCompany, InsurancePlan, AgencyBanner

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==========================================
# 1. Application Operations Category
# ==========================================

class ApplicationAdmin(ModelView, model=Application):
    name = "Application"
    name_plural = "Applications"
    category = "Application Operations"
    icon = "fa-solid fa-file-invoice"

    column_list = [
        Application.reference_number,
        Application.status,
        Application.first_name,
        Application.last_name,
        Application.insurance_type,
        Application.created_at,
    ]
    column_labels = {
        Application.reference_number: "Reference #",
        Application.status: "Status",
        Application.first_name: "First Name",
        Application.last_name: "Last Name",
        Application.insurance_type: "Insurance Type",
        Application.created_at: "Submitted At",
    }
    column_searchable_list = [
        Application.reference_number,
        Application.email,
        Application.first_name,
        Application.last_name,
    ]
    column_sortable_list = [
        Application.created_at,
        Application.status,
        Application.reference_number,
        Application.last_name,
    ]
    column_default_sort = ("created_at", True)


class FileAdmin(ModelView, model=File):
    name = "Uploaded Document"
    name_plural = "Uploaded Documents"
    category = "Application Operations"
    icon = "fa-solid fa-paperclip"

    column_list = [
        File.id,
        File.application_id,
        File.original_filename,
        File.file_type,
        File.file_size,
        File.created_at,
    ]
    column_labels = {
        File.id: "Document ID",
        File.application_id: "Application Ref",
        File.original_filename: "Filename",
        File.file_type: "Category",
        File.file_size: "File Size (Bytes)",
        File.created_at: "Uploaded At",
    }
    column_searchable_list = [File.original_filename, File.id, File.application_id]
    column_sortable_list = [File.created_at, File.file_size, File.file_type]
    column_default_sort = ("created_at", True)
    can_create = False  # Uploads happen via client API


class EmailExportAdmin(ModelView, model=EmailExport):
    name = "Email Export"
    name_plural = "Email Exports"
    category = "Application Operations"
    icon = "fa-solid fa-envelope"

    column_list = [
        EmailExport.id,
        EmailExport.status,
        EmailExport.recipient_email,
        EmailExport.sent_at,
        EmailExport.retry_count,
        EmailExport.created_at,
    ]
    column_labels = {
        EmailExport.id: "Export ID",
        EmailExport.status: "Delivery Status",
        EmailExport.recipient_email: "Recipient",
        EmailExport.sent_at: "Dispatched At",
        EmailExport.retry_count: "Retries",
        EmailExport.created_at: "Created At",
    }
    column_sortable_list = [EmailExport.created_at, EmailExport.status, EmailExport.sent_at]
    column_default_sort = ("created_at", True)


# ==========================================
# 2. Insurance Broker & Partner Management Category
# ==========================================

class InsuranceCompanyAdmin(ModelView, model=InsuranceCompany):
    name = "Insurance Partner"
    name_plural = "Insurance Partners"
    category = "Broker & Partners"
    icon = "fa-solid fa-building-shield"

    column_list = [
        InsuranceCompany.display_order,
        InsuranceCompany.name,
        InsuranceCompany.code,
        InsuranceCompany.rating,
        InsuranceCompany.is_active,
        InsuranceCompany.updated_at,
    ]
    column_labels = {
        InsuranceCompany.display_order: "Order",
        InsuranceCompany.name: "Company Name",
        InsuranceCompany.code: "Partner Code",
        InsuranceCompany.rating: "Accreditation / Rating",
        InsuranceCompany.is_active: "Active",
        InsuranceCompany.updated_at: "Last Modified",
    }
    column_searchable_list = [InsuranceCompany.name, InsuranceCompany.code]
    column_sortable_list = [InsuranceCompany.display_order, InsuranceCompany.name, InsuranceCompany.is_active]
    column_default_sort = ("display_order", False)
    form_columns = [
        InsuranceCompany.name,
        InsuranceCompany.code,
        InsuranceCompany.rating,
        InsuranceCompany.website,
        InsuranceCompany.logo_url,
        InsuranceCompany.description,
        InsuranceCompany.is_active,
        InsuranceCompany.display_order,
    ]


class InsurancePlanAdmin(ModelView, model=InsurancePlan):
    name = "Insurance Plan"
    name_plural = "Insurance Plans"
    category = "Broker & Partners"
    icon = "fa-solid fa-layer-group"

    column_list = [
        InsurancePlan.display_order,
        InsurancePlan.name,
        InsurancePlan.company,
        InsurancePlan.category,
        InsurancePlan.price_amount,
        InsurancePlan.currency,
        InsurancePlan.badge,
        InsurancePlan.is_featured,
        InsurancePlan.is_active,
    ]
    column_labels = {
        InsurancePlan.display_order: "Order",
        InsurancePlan.name: "Plan Name",
        InsurancePlan.company: "Provider",
        InsurancePlan.category: "Category",
        InsurancePlan.price_amount: "Price",
        InsurancePlan.currency: "Currency",
        InsurancePlan.badge: "Badge Tag",
        InsurancePlan.is_featured: "Featured",
        InsurancePlan.is_active: "Active",
    }
    column_searchable_list = [InsurancePlan.name, InsurancePlan.category, InsurancePlan.badge]
    column_sortable_list = [InsurancePlan.display_order, InsurancePlan.price_amount, InsurancePlan.is_active]
    column_default_sort = ("display_order", False)
    form_columns = [
        InsurancePlan.company,
        InsurancePlan.name,
        InsurancePlan.category,
        InsurancePlan.price_amount,
        InsurancePlan.currency,
        InsurancePlan.billing_period,
        InsurancePlan.coverage_summary,
        InsurancePlan.badge,
        InsurancePlan.target_audience,
        InsurancePlan.features,
        InsurancePlan.is_featured,
        InsurancePlan.is_active,
        InsurancePlan.display_order,
    ]


class AgencyBannerAdmin(ModelView, model=AgencyBanner):
    name = "Portal Banner"
    name_plural = "Portal Banners"
    category = "Broker & Partners"
    icon = "fa-solid fa-bullhorn"

    column_list = [
        AgencyBanner.display_order,
        AgencyBanner.title,
        AgencyBanner.tag,
        AgencyBanner.is_active,
        AgencyBanner.updated_at,
    ]
    column_labels = {
        AgencyBanner.display_order: "Order",
        AgencyBanner.title: "Headline",
        AgencyBanner.tag: "Tag",
        AgencyBanner.is_active: "Active",
        AgencyBanner.updated_at: "Updated At",
    }
    column_sortable_list = [AgencyBanner.display_order, AgencyBanner.is_active]
    column_default_sort = ("display_order", False)
    form_columns = [
        AgencyBanner.title,
        AgencyBanner.subtitle,
        AgencyBanner.tag,
        AgencyBanner.link_url,
        AgencyBanner.button_text,
        AgencyBanner.is_active,
        AgencyBanner.display_order,
    ]


# ==========================================
# 3. System & Security Category
# ==========================================

class SystemConfigAdmin(ModelView, model=SystemConfig):
    # Explicitly set singular and plural to avoid unwanted "⚙️s" pluralization
    name = "System Configuration"
    name_plural = "System Configuration"
    category = "System & Security"
    icon = "fa-solid fa-gears"

    can_create = True
    can_delete = False

    column_list = [
        SystemConfig.site_title,
        SystemConfig.site_icon_url,
        SystemConfig.support_email,
        SystemConfig.crisp_website_id,
        SystemConfig.crisp_custom_color,
        SystemConfig.storage_provider,
        SystemConfig.updated_at,
    ]
    column_labels = {
        SystemConfig.site_title: "Website Title",
        SystemConfig.site_description: "SEO Meta Description",
        SystemConfig.site_icon_url: "Brand Icon / Favicon URL",
        SystemConfig.support_email: "Official Support Email",
        SystemConfig.crisp_website_id: "Crisp Chat Website ID (Key)",
        SystemConfig.crisp_custom_color: "Crisp Widget Style / Theme",
        SystemConfig.storage_provider: "Storage Provider",
        SystemConfig.s3_endpoint: "S3 / Object Storage Endpoint",
        SystemConfig.updated_at: "Last Saved",
    }
    form_columns = [
        SystemConfig.site_title,
        SystemConfig.site_description,
        SystemConfig.site_icon_url,
        SystemConfig.support_email,
        SystemConfig.crisp_website_id,
        SystemConfig.crisp_custom_color,
        SystemConfig.storage_provider,
        SystemConfig.s3_endpoint,
        SystemConfig.s3_bucket,
        SystemConfig.s3_region,
        SystemConfig.s3_access_key,
        SystemConfig.s3_secret_key,
    ]

    form_overrides = dict(
        s3_secret_key=PasswordField,
        storage_provider=SelectField,
        crisp_custom_color=SelectField,
    )
    form_args = dict(
        storage_provider=dict(
            choices=[
                ("local", "Local Disk Storage (/app/uploads)"),
                ("s3", "S3 / Object Storage (AWS S3, Cloudflare R2, MinIO)"),
            ],
            label="Storage Provider",
            description="Choose where uploaded customer passport scans and insurance documents are stored.",
        ),
        crisp_custom_color=dict(
            choices=[
                ("blue", "Classic Blue (Default)"),
                ("azure", "Azure Cyan"),
                ("green", "Emerald Green"),
                ("orange", "Amber Orange"),
                ("red", "Crimson Red"),
                ("purple", "Indigo Purple"),
                ("grey", "Slate Grey"),
                ("black", "Dark Carbon"),
            ],
            label="Crisp Live Chat Widget Color Theme",
            description="Color scheme of the floating Crisp chat widget on your public portal.",
        ),
        crisp_website_id=dict(
            label="Crisp Live Chat Website ID (Key)",
            description="Enter your Crisp Website ID (UUID, e.g. 1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d). Found in Crisp Dashboard > Settings > Website Settings.",
        ),
        site_title=dict(
            label="Website Title",
            description="Brand title shown in the customer's browser tab and portal header.",
        ),
        site_description=dict(
            label="SEO Meta Description",
            description="Description shown in Google search results and social share previews.",
        ),
        site_icon_url=dict(
            label="Brand Icon / Favicon URL",
            description="Relative path (e.g. /favicon.svg) or full CDN URL to your logo/favicon.",
        ),
        support_email=dict(
            label="Official Support Email",
            description="Email shown on customer support pages and email receipts (e.g. insurance@hktse.eu.org).",
        ),
    )

    async def on_model_change(self, data, model, is_created, request):
        if is_created:
            with self.session_maker() as session:
                existing = session.query(SystemConfig).first()
                if existing:
                    raise Exception("System Configuration already exists. Please edit the existing entry.")
        return await super().on_model_change(data, model, is_created, request)


class AdminUserAdmin(ModelView, model=AdminUser):
    name = "Admin User"
    name_plural = "Admin Users"
    category = "System & Security"
    icon = "fa-solid fa-users-gear"

    column_list = [AdminUser.username, AdminUser.created_at]
    column_labels = {
        AdminUser.username: "Username",
        AdminUser.created_at: "Created At",
    }
    form_columns = [AdminUser.username, AdminUser.password_hash]
    form_overrides = dict(password_hash=PasswordField)
    form_args = dict(password_hash=dict(label="Password (Leave empty to keep current password)"))

    async def on_model_change(self, data, model, is_created, request):
        password = data.get("password_hash")
        if is_created:
            if not password:
                raise Exception("Password is required for newly created administrators.")
            data["password_hash"] = pwd_context.hash(password)
        else:
            if password:
                data["password_hash"] = pwd_context.hash(password)
            else:
                del data["password_hash"]
        return await super().on_model_change(data, model, is_created, request)


class AuditLogAdmin(ModelView, model=AuditLog):
    name = "Audit Log"
    name_plural = "Audit Logs"
    category = "System & Security"
    icon = "fa-solid fa-shield-halved"

    column_list = [
        AuditLog.action,
        AuditLog.user_ip,
        AuditLog.created_at,
    ]
    column_labels = {
        AuditLog.action: "Audit Action",
        AuditLog.user_ip: "Client IP",
        AuditLog.created_at: "Timestamp",
    }
    can_create = False
    can_edit = False
    can_delete = False
    column_sortable_list = [AuditLog.created_at, AuditLog.action]
    column_default_sort = ("created_at", True)
