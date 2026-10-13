"""
Lead Inquiry model for FormVault.
Stores structured client information and insurance request parameters
collected once under LEAD_ONLY mode for handoff to licensed broker partner.
"""

from datetime import datetime, timezone, date
from uuid import uuid4
from typing import Optional
from sqlalchemy import (
    Column,
    String,
    Date,
    DateTime,
    Boolean,
    Integer,
    Text,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship
from ..database import Base


def calculate_age(date_of_birth: date, reference_date: Optional[date] = None) -> int:
    """Calculate exact age from date of birth against reference date (defaults to today)."""
    if reference_date is None:
        reference_date = date.today()
    return (
        reference_date.year
        - date_of_birth.year
        - (
            (reference_date.month, reference_date.day)
            < (date_of_birth.month, date_of_birth.day)
        )
    )


def derive_age_band(age: int) -> str:
    """
    Derive pricing and discount segmentation bracket from calculated age.
    Categories:
      - under 18: '0-17' (minor)
      - 18–26: '18-26' (student discounted bracket in Czech Republic)
      - 27–35: '27-35' (young professional)
      - 36–50: '36-50' (standard adult)
      - 51+: '51+' (senior)
    """
    if age < 18:
        return "0-17"
    elif 18 <= age <= 26:
        return "18-26"
    elif 27 <= age <= 35:
        return "27-35"
    elif 36 <= age <= 50:
        return "36-50"
    else:
        return "51+"


class LeadInquiry(Base):
    """
    Model representing an initial customer insurance enquiry.
    Adheres to 'Collect Once, Reuse Everywhere': gathers complete identity,
    stay parameters, and insurance requirements in a single intake session.
    """

    __tablename__ = "lead_inquiries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    reference_number = Column(String(25), unique=True, nullable=False, index=True)

    # 1. Identity & Personal Details
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(20), nullable=True)  # male, female, other, prefer_not_to_say
    nationality = Column(String(50), default="Chinese", nullable=False)

    # 2. Contact Information & Preferences
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    wechat_id = Column(String(100), nullable=True)
    preferred_contact_method = Column(
        String(20), default="email", nullable=False
    )  # email, phone, wechat
    preferred_language = Column(String(10), default="zh", nullable=False)

    # 3. Student & Academic Context
    student_status = Column(Boolean, default=True, nullable=False)
    school_or_university = Column(String(150), nullable=True)
    study_status = Column(String(50), nullable=True)
    expected_study_end_date = Column(Date, nullable=True)

    # 4. Stay & Insurance Request Parameters
    type_of_stay = Column(
        String(50), default="student", nullable=False
    )  # student, employee, family, other
    requested_start_date = Column(Date, nullable=False)
    requested_duration_months = Column(Integer, default=12, nullable=False)
    current_location = Column(
        String(100), nullable=True
    )  # Czech city or current residency
    general_insurance_need = Column(String(50), default="comprehensive", nullable=False)
    special_notes = Column(Text, nullable=True)

    # 5. Marketing Attribution & Referral Tracking
    utm_source = Column(String(100), nullable=True, index=True)
    utm_medium = Column(String(100), nullable=True)
    utm_campaign = Column(String(100), nullable=True, index=True)
    utm_term = Column(String(100), nullable=True)
    utm_content = Column(String(100), nullable=True)
    referrer_url = Column(String(255), nullable=True)
    landing_page = Column(String(255), nullable=True)
    referral_code = Column(String(100), nullable=True, index=True)

    # 6. Compliance & Partner Handoff Consent
    handoff_consent = Column(Boolean, default=True, nullable=False)
    handoff_consent_text_version = Column(String(30), default="v1.0", nullable=False)
    handoff_consent_ip = Column(String(45), nullable=True)
    handoff_consent_user_agent = Column(Text, nullable=True)
    consented_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # 7. Status & Intermediary Handoff Lifecycle
    status = Column(String(50), default="INQUIRY_RECEIVED", nullable=False, index=True)
    # Lifecycle stages:
    #   INQUIRY_RECEIVED -> FORWARDED_TO_INTERMEDIARY -> AWAITING_INTERMEDIARY_RESPONSE -> CONTACTED -> CLOSED
    #   Failure/Retry states: HANDOFF_FAILED, HANDOFF_RETRY_PENDING
    handoff_attempts = Column(Integer, default=0, nullable=False)
    last_handoff_attempt_at = Column(DateTime, nullable=True)
    handoff_error = Column(Text, nullable=True)

    # 8. Promotion / Conversion Link to Full Application
    converted_application_id = Column(
        String(36),
        ForeignKey("applications.id", ondelete="SET NULL"),
        nullable=True,
    )

    # 9. Continuation Token (For Future Assisted Self-Service Completion)
    continuation_token = Column(String(64), nullable=True, unique=True, index=True)

    # 10. Stay Specifics & Document Links
    czech_city = Column(String(100), nullable=True)
    current_insurance_expiry_date = Column(Date, nullable=True)
    passport_file_id = Column(String(36), nullable=True)
    study_confirmation_file_id = Column(String(36), nullable=True)
    documents = relationship(
        "LeadDocument", back_populates="lead", cascade="all, delete-orphan"
    )

    # Timestamps
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_lead_email_ref", "email", "reference_number"),
        Index("idx_lead_status_created", "status", "created_at"),
        Index("idx_lead_utm", "utm_source", "utm_campaign"),
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    @property
    def age(self) -> int:
        return calculate_age(self.date_of_birth)

    @property
    def age_band(self) -> str:
        return derive_age_band(self.age)

    @classmethod
    def generate_reference_number(cls) -> str:
        """Generate unique reference number format: FV-YYYYMMDD-XXXX."""
        import random, string

        date_str = datetime.now().strftime("%Y%m%d")
        suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        return f"FV-{date_str}-{suffix}"


class IntakeSession(Base):
    """
    Temporary session for holding uploaded documents before final lead submission.
    Ensures zero orphan sensitive files without lifecycle ownership.
    TTL defaults to 24 hours.
    """

    __tablename__ = "intake_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    token = Column(String(64), unique=True, nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    expires_at = Column(DateTime, nullable=False)
    is_consumed = Column(Boolean, default=False, nullable=False)
    verified_email = Column(String(255), nullable=True)
    otp_code_hash = Column(String(128), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    otp_attempts = Column(Integer, default=0, nullable=False)

    documents = relationship(
        "LeadDocument", back_populates="session", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<IntakeSession {self.token[:8]}... (consumed={self.is_consumed})>"


class LeadDocument(Base):
    """
    Document attached to a lead inquiry or an active intake session.
    Keeps audit trail of passport and study proof documents without requiring full Application conversion.
    """

    __tablename__ = "lead_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    lead_id = Column(
        String(36),
        ForeignKey("lead_inquiries.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    intake_session_id = Column(
        String(36),
        ForeignKey("intake_sessions.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    document_type = Column(
        String(50), nullable=False
    )  # passport_bio_page, study_confirmation, student_id, isic, residence_permit
    file_id = Column(String(36), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    status = Column(
        String(30), default="ATTACHED", nullable=False
    )  # ATTACHED, VERIFIED, REJECTED
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    lead = relationship("LeadInquiry", back_populates="documents")
    session = relationship("IntakeSession", back_populates="documents")

    def __repr__(self) -> str:
        return f"<LeadDocument {self.document_type}: {self.original_filename}>"
