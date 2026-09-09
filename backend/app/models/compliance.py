"""
Compliance, provenance, evidence records, and versioned product models.

Enforces evidence-backed governance per Czech Act No. 170/2018 Coll. (tipař / makléř separation),
EU GDPR processing purpose delineation, and immutable workflow snapshots.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import uuid4

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Text,
    Float,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship

from ..database import Base


class EvidenceRecord(Base):
    """
    Provenance and evidence record for contractual, pricing, or authorization documents.
    Prevents unverified real-world claims and links product versions to verifiable sources.
    """

    __tablename__ = "evidence_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    evidence_type = Column(String(50), nullable=False, index=True)  # contract, price_list, dpa, license_filing
    title = Column(String(150), nullable=False)
    source_entity = Column(String(100), nullable=False)  # e.g. "České pojištění a.s."
    source_date = Column(DateTime, nullable=True)
    valid_from = Column(DateTime, nullable=True)
    valid_until = Column(DateTime, nullable=True)
    sha256 = Column(String(64), nullable=False, index=True)
    storage_reference = Column(String(255), nullable=True)  # e.g. "vault://evidence/dpa_2026.pdf"
    verification_status = Column(
        String(30), default="HISTORICAL", nullable=False, index=True
    )  # HISTORICAL, PENDING_CONFIRMATION, VERIFIED, SUPERSEDED, EXPIRED, DISABLED
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<EvidenceRecord {self.title} ({self.verification_status})>"


class ProductVersion(Base):
    """
    Versioned insurance product snapshot with strict validity windows.
    Prevents historical or outdated insurance products from being quoted as active.
    """

    __tablename__ = "product_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("insurance_companies.id", ondelete="CASCADE"), nullable=False)
    product_name = Column(String(150), nullable=False)
    product_code = Column(String(50), nullable=False, index=True)
    version = Column(String(30), nullable=False)  # e.g. "2025-08-15"
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=True)
    status = Column(
        String(30), default="HISTORICAL", nullable=False, index=True
    )  # HISTORICAL, PENDING_CONFIRMATION, VERIFIED, EXPIRED, DISABLED
    evidence_id = Column(String(36), ForeignKey("evidence_records.id", ondelete="SET NULL"), nullable=True)
    currency = Column(String(10), default="CZK", nullable=False)
    coverage_summary = Column(Text, nullable=False)
    eligibility_config = Column(Text, nullable=True)  # JSON for age/duration eligibility

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    company = relationship("InsuranceCompany")
    evidence = relationship("EvidenceRecord")
    price_books = relationship("PriceBook", back_populates="product_version")

    def is_currently_valid(self, at_time: Optional[datetime] = None) -> bool:
        """Check if product is verified and within its contractual active validity window."""
        t = at_time or datetime.now(timezone.utc)
        if self.status != "VERIFIED":
            return False
        if self.valid_from:
            vf = self.valid_from
            if vf.tzinfo is None and t.tzinfo is not None:
                vf = vf.replace(tzinfo=timezone.utc)
            elif vf.tzinfo is not None and t.tzinfo is None:
                t = t.replace(tzinfo=timezone.utc)
            if t < vf:
                return False
        if self.valid_until:
            vu = self.valid_until
            if vu.tzinfo is None and t.tzinfo is not None:
                vu = vu.replace(tzinfo=timezone.utc)
            elif vu.tzinfo is not None and t.tzinfo is None:
                t = t.replace(tzinfo=timezone.utc)
            if t > vu:
                return False
        return True


class PriceBook(Base):
    """
    Price book grouping versioned rate matrices linked to verifiable evidence.
    """

    __tablename__ = "price_books"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_version_id = Column(Integer, ForeignKey("product_versions.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), default="Standard Price Book", nullable=False)
    book_code = Column(String(50), nullable=True)
    version = Column(String(30), default="1.0.0", nullable=False)
    valid_from = Column(DateTime, nullable=True)
    valid_until = Column(DateTime, nullable=True)
    effective_from = Column(DateTime, nullable=True)
    effective_until = Column(DateTime, nullable=True)
    status = Column(String(30), default="HISTORICAL", nullable=False, index=True)  # HISTORICAL, VERIFIED, EXPIRED
    currency = Column(String(10), default="CZK", nullable=False)
    evidence_id = Column(String(36), ForeignKey("evidence_records.id", ondelete="SET NULL"), nullable=True)
    source_document_name = Column(String(150), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    product_version = relationship("ProductVersion", back_populates="price_books")
    evidence = relationship("EvidenceRecord")
    rates = relationship("PriceRate", back_populates="price_book", cascade="all, delete-orphan")


class PriceRate(Base):
    """
    Granular rate table entry for exact insurance premium calculations.
    """

    __tablename__ = "price_rates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    price_book_id = Column(Integer, ForeignKey("price_books.id", ondelete="CASCADE"), nullable=False)
    plan_variant = Column(String(100), default="Standard", nullable=False)
    age_min = Column(Integer, default=0, nullable=False)
    age_max = Column(Integer, default=100, nullable=False)
    duration_months = Column(Integer, default=12, nullable=False)
    target_group = Column(String(50), default="student", nullable=False)  # student, adult
    stay_type = Column(String(50), default="student", nullable=False)  # student, standard, employee
    sports_category = Column(String(50), default="none", nullable=False)
    amount_czk = Column(Float, nullable=True)
    base_premium = Column(Float, default=0.0, nullable=False)
    extra_months_free = Column(Integer, default=0, nullable=False)

    # Relationships
    price_book = relationship("PriceBook", back_populates="rates")


class FormRecipe(Base):
    """
    Dynamic field definitions and validation recipes per insurer and product tier.
    """

    __tablename__ = "form_recipes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), default="Standard Underwriting Recipe", nullable=False)
    version = Column(String(30), default="1.0.0", nullable=False)
    recipe_version = Column(String(30), default="1.0.0", nullable=False)
    status = Column(String(30), default="VERIFIED", nullable=False)
    schema_json = Column(Text, nullable=True)  # JSON field definitions, rules, document requirements
    schema_definition = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class QuestionnaireVersion(Base):
    """
    Dedicated medical and health declaration questionnaires per underwriter.
    Isolated from general contact information to respect GDPR Article 9 special categories.
    """

    __tablename__ = "questionnaire_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("insurance_companies.id", ondelete="CASCADE"), nullable=False)
    questionnaire_type = Column(String(50), default="health", nullable=False)
    version = Column(String(30), nullable=False)
    questions_json = Column(Text, nullable=False)
    status = Column(String(30), default="PENDING_CONFIRMATION", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class LegalDocumentVersion(Base):
    """
    Versioned regulatory documents (IPID, General Insurance Conditions VPP, Terms, Complaint Info).
    """

    __tablename__ = "legal_document_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_type = Column(String(50), default="terms", nullable=False, index=True)  # IPID, VPP, Terms, PrivacyNotice
    doc_type = Column(String(50), default="terms", nullable=True)
    version = Column(String(30), nullable=False)
    title = Column(String(150), nullable=False)
    sha256 = Column(String(64), default="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", nullable=False)
    content_sha256 = Column(String(64), nullable=True)
    content_markdown = Column(Text, nullable=True)
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=True)
    effective_from = Column(DateTime, nullable=True)
    effective_until = Column(DateTime, nullable=True)
    source = Column(String(100), default="Internal Legal", nullable=False)
    verification_status = Column(String(30), default="VERIFIED", nullable=False)
    status = Column(String(30), default="ACTIVE", nullable=False)


class DisclosureBundleSnapshot(Base):
    """
    Immutable bundle snapshot recording exact disclosures provided to an applicant.
    """

    __tablename__ = "disclosure_bundle_snapshots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    ipid_version_id = Column(Integer, nullable=True)
    vpp_version_id = Column(Integer, nullable=True)
    terms_version = Column(String(30), nullable=False)
    privacy_notice_version = Column(String(30), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class PartnerHandoffConsent(Base):
    """
    Contractually required authorization for transmitting applicant intake data
    from HKTSE (tipař) to České pojištění (makléř / broker).
    """

    __tablename__ = "partner_handoff_consents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=True)
    recipient = Column(String(100), default="České pojištění a.s.", nullable=False)
    recipient_role = Column(String(50), default="makler", nullable=False)
    purpose = Column(
        String(150),
        default="Mediation of Czech foreigners health insurance and contract preparation",
        nullable=False,
    )
    data_categories = Column(Text, default="contact_info, identity_details, stay_parameters", nullable=False)
    consent_text_version = Column(String(30), default="v1.0", nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    consented_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    withdrawn_at = Column(DateTime, nullable=True)


class PrivacyRequest(Base):
    """
    GDPR data subject request ticketing and fulfillment log.
    Distinguishes HKTSE processor duties (forwarded to broker/controller) from platform controller duties.
    """

    __tablename__ = "privacy_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    reference_number = Column(String(50), nullable=True, index=True)
    request_type = Column(String(50), nullable=False)  # access, rectification, erasure, portability
    controller_scope = Column(
        String(50), default="HKTSE_PROCESSOR_FOR_BROKER", nullable=False
    )  # HKTSE_PROCESSOR_FOR_BROKER, HKTSE_CONTROLLER_PLATFORM
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, index=True)
    details = Column(Text, nullable=True)
    status = Column(String(30), default="RECEIVED", nullable=False, index=True)
    assigned_to = Column(String(50), nullable=True)
    received_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    deadline_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc) + timedelta(days=30),
        nullable=False,
    )
    forwarded_to_controller_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)


class SecurityIncident(Base):
    """
    Internal personal data security incident registry.
    Enforces the strict 24-hour notification deadline to Controller required under DPA Section 6.
    """

    __tablename__ = "security_incidents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    incident_title = Column(String(150), nullable=False)
    severity = Column(String(20), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(30), default="DETECTED", nullable=False, index=True)
    description = Column(Text, nullable=False)
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    controller_notification_deadline = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc) + timedelta(hours=24),
        nullable=False,
    )
    controller_notified_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
