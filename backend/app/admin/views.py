"""
SQLAdmin view configurations for FormVault Admin Dashboard.

Provides organized, clean, and categorized views with proper naming,
FontAwesome icons, and comprehensive field customization.
Implements robust Role-Based Access Control (RBAC) and row-level tenant scoping:
  - Super Admin: Full system control.
  - Broker Agent: Handles all applications & plans.
  - Company Partner: Scoped strictly to designated Insurance Company (row-level isolation).
  - Compliance Auditor: Read-only access across applications & audit trails.
"""

from sqladmin import ModelView
from wtforms.fields import PasswordField, SelectField
from passlib.context import CryptContext
from sqlalchemy import select, func
from starlette.requests import Request

from ..models.application import Application
from ..models.file import File
from ..models.email_export import EmailExport
from ..models.audit_log import AuditLog
from ..models.system import AdminUser, SystemConfig
from ..models.partner import InsuranceCompany, InsurancePlan, AgencyBanner
from .auth import get_current_admin

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
        Application.company,
        Application.insurance_duration_months,
        Application.created_at,
    ]
    column_labels = {
        Application.reference_number: "Reference #",
        Application.status: "Status",
        Application.first_name: "First Name",
        Application.last_name: "Last Name",
        Application.company: "Assigned Underwriter",
        Application.insurance_duration_months: "Duration (Mo.)",
        Application.created_at: "Submitted At",
    }
    column_searchable_list = [
        Application.reference_number,
        Application.email,
        Application.first_name,
        Application.last_name,
        Application.passport_number,
    ]
    column_sortable_list = [
        Application.created_at,
        Application.status,
        Application.reference_number,
        Application.last_name,
    ]
    column_default_sort = ("created_at", True)

    form_columns = [
        Application.reference_number,
        Application.status,
        Application.company,
        Application.plan,
        Application.first_name,
        Application.last_name,
        Application.gender,
        Application.nationality,
        Application.date_of_birth,
        Application.place_of_birth,
        Application.passport_number,
        Application.passport_expiry_date,
        Application.passport_issued_by,
        Application.email,
        Application.phone,
        Application.address_street,
        Application.address_city,
        Application.address_zip_code,
        Application.insurance_commencement_date,
        Application.insurance_duration_months,
        Application.type_of_stay,
    ]

    # Row-Level Security: Filter list & counts for Insurance Company Partners
    def list_query(self, request: Request):
        admin = get_current_admin(request)
        stmt = select(Application)
        if admin["role"] == "company_partner" and admin.get("company_id"):
            stmt = stmt.where(Application.insurance_company_id == admin["company_id"])
        return stmt

    def count_query(self, request: Request):
        admin = get_current_admin(request)
        stmt = select(func.count(Application.id)).select_from(Application)
        if admin["role"] == "company_partner" and admin.get("company_id"):
            stmt = stmt.where(Application.insurance_company_id == admin["company_id"])
        return stmt

    # Object-Level Security: Verify company binding before allowing details or edit
    async def check_can_view_details(self, request: Request, model) -> bool:
        admin = get_current_admin(request)
        if admin["role"] == "company_partner":
            return model.insurance_company_id == admin.get("company_id")
        return True

    async def check_can_edit(self, request: Request, model) -> bool:
        admin = get_current_admin(request)
        if admin["role"] == "compliance_auditor":
            return False
        if admin["role"] == "company_partner":
            return model.insurance_company_id == admin.get("company_id")
        return True

    async def check_can_delete(self, request: Request, model) -> bool:
        admin = get_current_admin(request)
        return admin["role"] in ("super_admin", "broker_agent")

    async def check_can_create(self, request: Request) -> bool:
        admin = get_current_admin(request)
        return admin["role"] in ("super_admin", "broker_agent")


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
    can_edit = False

    def list_query(self, request: Request):
        admin = get_current_admin(request)
        stmt = select(File)
        if admin["role"] == "company_partner" and admin.get("company_id"):
            stmt = stmt.join(Application).where(Application.insurance_company_id == admin["company_id"])
        return stmt

    def count_query(self, request: Request):
        admin = get_current_admin(request)
        stmt = select(func.count(File.id)).select_from(File)
        if admin["role"] == "company_partner" and admin.get("company_id"):
            stmt = stmt.join(Application).where(Application.insurance_company_id == admin["company_id"])
        return stmt

    async def check_can_delete(self, request: Request, model) -> bool:
        admin = get_current_admin(request)
        return admin["role"] in ("super_admin", "broker_agent")


class EmailExportAdmin(ModelView, model=EmailExport):
    name = "Email Export History"
    name_plural = "Email Export History"
    category = "Application Operations"
    icon = "fa-solid fa-envelope-circle-check"

    column_list = [
        EmailExport.id,
        EmailExport.application_id,
        EmailExport.recipient_email,
        EmailExport.status,
        EmailExport.created_at,
    ]
    column_labels = {
        EmailExport.id: "Export ID",
        EmailExport.application_id: "Application",
        EmailExport.recipient_email: "Recipient",
        EmailExport.status: "Delivery Status",
        EmailExport.created_at: "Dispatched At",
    }
    column_sortable_list = [EmailExport.created_at, EmailExport.status]
    column_default_sort = ("created_at", True)
    can_create = False
    can_edit = False
    can_delete = False

    def is_accessible(self, request: Request) -> bool:
        return get_current_admin(request)["role"] in ("super_admin", "broker_agent")

    def is_visible(self, request: Request) -> bool:
        return get_current_admin(request)["role"] in ("super_admin", "broker_agent")


# ==========================================
# 2. Broker & Partners Category
# ==========================================

class InsuranceCompanyAdmin(ModelView, model=InsuranceCompany):
    name = "Partner Company"
    name_plural = "Partner Companies"
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

    def list_query(self, request: Request):
        admin = get_current_admin(request)
        stmt = select(InsuranceCompany)
        if admin["role"] == "company_partner" and admin.get("company_id"):
            stmt = stmt.where(InsuranceCompany.id == admin["company_id"])
        return stmt

    def count_query(self, request: Request):
        admin = get_current_admin(request)
        stmt = select(func.count(InsuranceCompany.id)).select_from(InsuranceCompany)
        if admin["role"] == "company_partner" and admin.get("company_id"):
            stmt = stmt.where(InsuranceCompany.id == admin["company_id"])
        return stmt

    async def check_can_create(self, request: Request) -> bool:
        return get_current_admin(request)["role"] in ("super_admin", "broker_agent")

    async def check_can_delete(self, request: Request, model) -> bool:
        return get_current_admin(request)["role"] in ("super_admin", "broker_agent")

    async def check_can_edit(self, request: Request, model) -> bool:
        admin = get_current_admin(request)
        if admin["role"] == "compliance_auditor":
            return False
        if admin["role"] == "company_partner":
            return model.id == admin.get("company_id")
        return True


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

    def list_query(self, request: Request):
        admin = get_current_admin(request)
        stmt = select(InsurancePlan)
        if admin["role"] == "company_partner" and admin.get("company_id"):
            stmt = stmt.where(InsurancePlan.company_id == admin["company_id"])
        return stmt

    def count_query(self, request: Request):
        admin = get_current_admin(request)
        stmt = select(func.count(InsurancePlan.id)).select_from(InsurancePlan)
        if admin["role"] == "company_partner" and admin.get("company_id"):
            stmt = stmt.where(InsurancePlan.company_id == admin["company_id"])
        return stmt

    async def check_can_create(self, request: Request) -> bool:
        return get_current_admin(request)["role"] != "compliance_auditor"

    async def check_can_edit(self, request: Request, model) -> bool:
        admin = get_current_admin(request)
        if admin["role"] == "compliance_auditor":
            return False
        if admin["role"] == "company_partner":
            return model.company_id == admin.get("company_id")
        return True

    async def check_can_delete(self, request: Request, model) -> bool:
        admin = get_current_admin(request)
        if admin["role"] == "compliance_auditor":
            return False
        if admin["role"] == "company_partner":
            return model.company_id == admin.get("company_id")
        return True


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

    def is_accessible(self, request: Request) -> bool:
        return get_current_admin(request)["role"] in ("super_admin", "broker_agent")

    def is_visible(self, request: Request) -> bool:
        return get_current_admin(request)["role"] in ("super_admin", "broker_agent")


# ==========================================
# 3. System & Security Category
# ==========================================

class SystemConfigAdmin(ModelView, model=SystemConfig):
    name = "System Configuration"
    name_plural = "System Configuration"
    category = "System & Security"
    icon = "fa-solid fa-gears"

    can_create = True
    can_delete = False

    column_list = [
        SystemConfig.site_title,
        SystemConfig.storage_provider,
        SystemConfig.production_ingress_name,
        SystemConfig.primary_domain,
        SystemConfig.support_email,
        SystemConfig.updated_at,
    ]
    column_labels = {
        SystemConfig.site_title: "Website Title",
        SystemConfig.storage_provider: "Storage Provider",
        SystemConfig.production_ingress_name: "Ingress Architecture",
        SystemConfig.primary_domain: "Primary Domain",
        SystemConfig.support_email: "Support Email",
        SystemConfig.updated_at: "Last Saved",
    }
    form_columns = [
        SystemConfig.site_title,
        SystemConfig.site_description,
        SystemConfig.site_icon_url,
        SystemConfig.support_email,
        SystemConfig.broker_legal_disclosure,
        SystemConfig.storage_provider,
        SystemConfig.s3_endpoint,
        SystemConfig.s3_bucket,
        SystemConfig.s3_region,
        SystemConfig.s3_access_key,
        SystemConfig.s3_secret_key,
        SystemConfig.crisp_website_id,
        SystemConfig.crisp_custom_color,
        SystemConfig.production_ingress_name,
        SystemConfig.primary_domain,
        SystemConfig.secondary_domain,
        SystemConfig.form_profile_config,
    ]
    form_overrides = dict(
        storage_provider=SelectField,
        crisp_custom_color=SelectField,
        production_ingress_name=SelectField,
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
            description="Enter your Crisp Website ID (36-char UUID, e.g. 168677e2-0aa6-45ec-a486-83855b18c6f4). Found in Crisp Dashboard > Settings > Website Settings.",
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
        broker_legal_disclosure=dict(
            label="Broker Legal & Regulatory Disclosure",
            description="Official regulatory disclosure displayed in website footer (Accurate intermediary status under Czech law).",
        ),
        production_ingress_name=dict(
            choices=[
                ("Cloudflare Tunnel", "Cloudflare Tunnel (Default / Zero Trust)"),
                ("Nginx Reverse Proxy", "Nginx Reverse Proxy"),
                ("Caddy Reverse Proxy", "Caddy Web Server / Reverse Proxy"),
                ("Traefik Ingress", "Traefik Cloud Native Ingress"),
                ("Direct Port Binding", "Direct Port Binding / IP"),
            ],
            label="Production Ingress Architecture",
            description="Preset selection for your production network ingress (No manual typing required).",
        ),
        primary_domain=dict(
            label="Primary Production Domain",
            description="Main domain where this portal is accessed by clients (e.g. insure.hktse.eu.org).",
        ),
        secondary_domain=dict(
            label="Secondary / Regional Domain",
            description="Alternate or regional domain (e.g. pojisteni.hktse.eu.org).",
        ),
        form_profile_config=dict(
            label="Configurable Application Form Recipe (JSON Profile)",
            description="Configures required/optional underwriting fields collected on the frontend form.",
        ),
    )

    def is_accessible(self, request: Request) -> bool:
        return get_current_admin(request)["role"] == "super_admin"

    def is_visible(self, request: Request) -> bool:
        return get_current_admin(request)["role"] == "super_admin"

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

    column_list = [
        AdminUser.username,
        AdminUser.display_name,
        AdminUser.role,
        AdminUser.company,
        AdminUser.is_active,
        AdminUser.last_login_at,
    ]
    column_labels = {
        AdminUser.username: "Username",
        AdminUser.display_name: "Display Name / Title",
        AdminUser.role: "Assigned Role",
        AdminUser.company: "Assigned Insurance Co.",
        AdminUser.is_active: "Active",
        AdminUser.last_login_at: "Last Login",
    }
    form_columns = [
        AdminUser.username,
        AdminUser.display_name,
        AdminUser.email,
        AdminUser.role,
        AdminUser.company,
        AdminUser.is_active,
        AdminUser.password_hash,
    ]
    form_overrides = dict(
        password_hash=PasswordField,
        role=SelectField,
    )
    form_args = dict(
        role=dict(
            choices=[
                ("super_admin", "Super Administrator (Full System & User Control)"),
                ("broker_agent", "Broker Agent / Underwriter (All Applications & Plans)"),
                ("company_partner", "Insurance Company Partner (Designated Company Only)"),
                ("compliance_auditor", "Compliance Auditor (Read-Only Audit & Applications)"),
            ],
            label="Assigned Role",
            description="Predefined role determining system privileges and data isolation.",
        ),
        company=dict(
            label="Assigned Insurance Company",
            description="Required if role is 'Insurance Company Partner'. Limits user to this company's applications and plans.",
        ),
        password_hash=dict(label="Password (Leave empty to keep current password)"),
        display_name=dict(label="Display Name / Contact Name", description="e.g. Viktoriia Chuvakova (PVZP Underwriting)"),
        email=dict(label="Contact Email"),
        is_active=dict(label="Account Active", description="Uncheck to immediately suspend access without deleting history."),
    )

    def is_accessible(self, request: Request) -> bool:
        return get_current_admin(request)["role"] == "super_admin"

    def is_visible(self, request: Request) -> bool:
        return get_current_admin(request)["role"] == "super_admin"

    async def on_model_change(self, data, model, is_created, request):
        role = data.get("role")
        company = data.get("company")
        if role == "company_partner" and not company:
            raise Exception("An Insurance Company Partner account MUST be assigned to an Insurance Company.")

        password = data.get("password_hash")
        if is_created:
            if not password:
                raise Exception("Password is required for newly created administrators.")
            data["password_hash"] = pwd_context.hash(password)
        else:
            if password:
                data["password_hash"] = pwd_context.hash(password)
            else:
                if "password_hash" in data:
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

    def is_accessible(self, request: Request) -> bool:
        return get_current_admin(request)["role"] in ("super_admin", "broker_agent", "compliance_auditor")

    def is_visible(self, request: Request) -> bool:
        return get_current_admin(request)["role"] in ("super_admin", "broker_agent", "compliance_auditor")
