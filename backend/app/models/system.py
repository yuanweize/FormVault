from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from uuid import uuid4
from ..database import Base


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), default="super_admin", nullable=False)  # super_admin, broker_agent, company_partner, compliance_auditor
    company_id = Column(Integer, ForeignKey("insurance_companies.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    display_name = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    company = relationship("InsuranceCompany")

    def __repr__(self):
        return f"<AdminUser {self.username} ({self.role})>"


class SystemConfig(Base):
    __tablename__ = "system_config"

    id = Column(Integer, primary_key=True)  # Singleton: Always ID 1

    # Storage Settings
    storage_provider = Column(String(20), default="local")  # local, s3

    # S3 Settings
    s3_endpoint = Column(String(255), nullable=True)
    s3_bucket = Column(String(100), nullable=True)
    s3_region = Column(String(50), default="us-east-1")
    s3_access_key = Column(String(100), nullable=True)
    s3_secret_key = Column(String(100), nullable=True)

    # Portal Branding & Support Settings
    site_title = Column(String(150), default="FormVault Insurance | Official Broker in Czechia", nullable=False)
    site_description = Column(
        String(255),
        default="Licensed insurance brokerage for international students and expatriates in the Czech Republic.",
        nullable=True,
    )
    site_icon_url = Column(String(255), default="/favicon.svg", nullable=False)
    support_email = Column(String(100), default="insurance@hktse.eu.org", nullable=False)
    crisp_website_id = Column(String(100), nullable=True)
    crisp_custom_color = Column(String(50), default="blue", nullable=True)

    # Broker Identity & Legal Disclosure (Accurate & Compliant)
    broker_legal_disclosure = Column(
        String(255),
        default="HKTSE s.r.o. (IČO: 10858032) in authorized cooperation with České pojištění a.s. representing PVZP, Slavia & SV pojišťovna.",
        nullable=True,
    )

    # Production Ingress & Domain Settings
    production_ingress_name = Column(String(100), default="Cloudflare Tunnel", nullable=True)
    primary_domain = Column(String(150), default="insure.hktse.eu.org", nullable=True)
    secondary_domain = Column(String(150), default="pojisteni.hktse.eu.org", nullable=True)

    # Form Profile / Configurable Application Recipe (JSON or text schema)
    form_profile_config = Column(
        Text,
        default='{"require_passport_dates": true, "require_study_confirmation": true, "require_gender": true, "require_place_of_birth": true}',
        nullable=True,
    )

    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<SystemConfig {self.site_title}>"

