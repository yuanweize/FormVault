"""
Application model for storing insurance application data.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Column,
    String,
    Date,
    DateTime,
    Enum,
    Index,
    Integer,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import VARCHAR, TIMESTAMP

from ..database import Base


class Application(Base):
    """
    Model for insurance applications containing personal information.
    """

    __tablename__ = "applications"

    # Primary key
    id = Column(VARCHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Unique reference number for tracking
    reference_number = Column(VARCHAR(20), unique=True, nullable=False)

    # Personal information
    first_name = Column(VARCHAR(100), nullable=False)
    last_name = Column(VARCHAR(100), nullable=False)
    email = Column(VARCHAR(255), nullable=False)
    phone = Column(VARCHAR(20), nullable=True)

    # Address information
    address_street = Column(VARCHAR(255), nullable=True)
    address_city = Column(VARCHAR(100), nullable=True)
    address_state = Column(VARCHAR(100), nullable=True)
    address_zip_code = Column(VARCHAR(20), nullable=True)
    address_country = Column(VARCHAR(100), nullable=True)

    # Application details
    date_of_birth = Column(Date, nullable=True)
    insurance_type = Column(
        Enum("health", "auto", "life", "travel", name="insurance_type_enum"),
        nullable=False,
    )
    preferred_language = Column(VARCHAR(5), default="en", nullable=False)

    # Underwriting Partner & Plan Binding
    insurance_company_id = Column(
        Integer,
        ForeignKey("insurance_companies.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    insurance_plan_id = Column(
        Integer,
        ForeignKey("insurance_plans.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Detailed Underwriting & Passport Information (České pojištění / PVZP / Slavia standard)
    gender = Column(VARCHAR(10), nullable=True)  # Male / Female
    nationality = Column(
        VARCHAR(50), nullable=True
    )  # Country of citizenship (e.g. China)
    place_of_birth = Column(VARCHAR(100), nullable=True)  # City, Country
    passport_number = Column(VARCHAR(50), nullable=True)
    passport_expiry_date = Column(Date, nullable=True)
    passport_issued_by = Column(
        VARCHAR(50), nullable=True
    )  # State which issued the passport
    insurance_commencement_date = Column(Date, nullable=True)  # Date of commencement
    insurance_duration_months = Column(
        Integer, default=12, nullable=True
    )  # Duration in months (e.g. 12, 24, 36)
    type_of_stay = Column(
        VARCHAR(50), default="student", nullable=True
    )  # student, adult, employee
    study_confirmation_file_id = Column(
        VARCHAR(36), nullable=True
    )  # Potvrzení o studiu scan reference
    custom_fields_data = Column(
        Text, nullable=True
    )  # Configurable recipe custom fields (JSON)

    # Application status
    status = Column(
        Enum(
            "draft",
            "submitted",
            "exported",
            "processed",
            name="application_status_enum",
        ),
        default="draft",
        nullable=False,
    )

    # Regulatory & Versioned Snapshots (Evidence-backed provenance)
    regulatory_mode_snapshot = Column(VARCHAR(30), default="LEAD_ONLY", nullable=True)
    product_version_id = Column(
        Integer,
        ForeignKey("product_versions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    price_book_id = Column(
        Integer,
        ForeignKey("price_books.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    form_recipe_id = Column(
        Integer,
        ForeignKey("form_recipes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    disclosure_bundle_id = Column(
        String(36),
        ForeignKey("disclosure_bundle_snapshots.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    handoff_consent_id = Column(
        String(36),
        ForeignKey(
            "partner_handoff_consents.id",
            ondelete="SET NULL",
            use_alter=True,
            name="fk_apps_handoff_consent",
        ),
        nullable=True,
        index=True,
    )
    quoted_price_czk = Column(Integer, nullable=True)

    # Timestamps & Soft Deletion (GDPR Article 17 / Retention policy)
    created_at = Column(TIMESTAMP, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    deleted_at = Column(DateTime, nullable=True, index=True)

    # Relationships
    company = relationship("InsuranceCompany", foreign_keys=[insurance_company_id])
    plan = relationship("InsurancePlan", foreign_keys=[insurance_plan_id])
    product_version = relationship("ProductVersion", foreign_keys=[product_version_id])
    price_book = relationship("PriceBook", foreign_keys=[price_book_id])
    form_recipe = relationship("FormRecipe", foreign_keys=[form_recipe_id])
    disclosure_bundle = relationship(
        "DisclosureBundleSnapshot", foreign_keys=[disclosure_bundle_id]
    )
    handoff_consent = relationship(
        "PartnerHandoffConsent", foreign_keys=[handoff_consent_id]
    )
    files = relationship(
        "File", back_populates="application", cascade="all, delete-orphan"
    )
    email_exports = relationship(
        "EmailExport", back_populates="application", cascade="all, delete-orphan"
    )
    audit_logs = relationship("AuditLog", back_populates="application")

    # Indexes
    __table_args__ = (
        Index("idx_apps_reference_number", "reference_number"),
        Index("idx_apps_email", "email"),
        Index("idx_apps_created_at", "created_at"),
        Index("idx_apps_status", "status"),
        Index("idx_apps_company_id", "insurance_company_id"),
        Index("idx_apps_deleted_at", "deleted_at"),
    )

    def __repr__(self) -> str:
        return f"<Application(id={self.id}, reference_number={self.reference_number}, email={self.email})>"

    @property
    def full_name(self) -> str:
        """Return the full name of the applicant."""
        return f"{self.first_name} {self.last_name}"

    @property
    def full_address(self) -> Optional[str]:
        """Return the formatted full address."""
        if not self.address_street:
            return None

        address_parts = [self.address_street]
        if self.address_city:
            address_parts.append(self.address_city)
        if self.address_state:
            address_parts.append(self.address_state)
        if self.address_zip_code:
            address_parts.append(self.address_zip_code)
        if self.address_country:
            address_parts.append(self.address_country)

        return ", ".join(address_parts)

    def generate_reference_number(self) -> str:
        """Generate a unique reference number for the application."""
        # Format: FV-YYYYMMDD-XXXX (FV + date + 4 random chars)
        from datetime import datetime
        import random
        import string

        date_str = datetime.now().strftime("%Y%m%d")
        random_suffix = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=4)
        )
        return f"FV-{date_str}-{random_suffix}"
