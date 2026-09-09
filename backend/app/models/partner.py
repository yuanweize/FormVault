"""
Partner and insurance broker data models for FormVault Insurance Portal.

Provides dynamic, broker-configurable models for insurance companies,
insurance packages/plans, and promotional banners.
"""

from datetime import datetime, timezone
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


class InsuranceCompany(Base):
    """
    Insurance underwriting partner company represented by the broker.
    Fully configurable via admin panel.
    """

    __tablename__ = "insurance_companies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, index=True)
    code = Column(String(50), unique=True, nullable=False)
    logo_url = Column(String(255), nullable=True)
    rating = Column(String(255), default="Authorized Partner", nullable=False)
    website = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    display_order = Column(Integer, default=0, nullable=False)

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    plans = relationship(
        "InsurancePlan", back_populates="company", cascade="all, delete-orphan"
    )

    def __str__(self):
        return f"{self.name} ({self.code})"


class InsurancePlan(Base):
    """
    Insurance products and coverage tiers provided by partner companies.
    """

    __tablename__ = "insurance_plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(
        Integer,
        ForeignKey("insurance_companies.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    price_amount = Column(Float, nullable=False, default=0.0)
    currency = Column(String(10), default="CZK", nullable=False)
    billing_period = Column(
        String(50), default="year", nullable=False
    )  # year, month, total
    coverage_summary = Column(String(255), nullable=False)
    badge = Column(String(50), nullable=True)  # "Best Value", "Required for Visa", etc.
    features = Column(Text, nullable=True)  # JSON or newline-separated bullet points
    target_audience = Column(String(150), nullable=True)
    is_featured = Column(Boolean, default=False, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    display_order = Column(Integer, default=0, nullable=False)

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    company = relationship("InsuranceCompany", back_populates="plans")

    def __str__(self):
        return f"{self.name} - {self.company.name if self.company else 'Unassigned'}"


class AgencyBanner(Base):
    """
    Promotional banners and regulatory announcements shown on the customer portal.
    """

    __tablename__ = "agency_banners"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    subtitle = Column(String(255), nullable=True)
    tag = Column(String(50), default="Notice", nullable=False)
    link_url = Column(String(255), nullable=True)
    button_text = Column(String(50), default="Explore", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    display_order = Column(Integer, default=0, nullable=False)

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __str__(self):
        return self.title
