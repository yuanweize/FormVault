"""
Application model for storing insurance application data.
"""
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, String, Date, DateTime, Enum, Index
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
    reference_number = Column(VARCHAR(20), unique=True, nullable=False, index=True)
    
    # Personal information
    first_name = Column(VARCHAR(100), nullable=False)
    last_name = Column(VARCHAR(100), nullable=False)
    email = Column(VARCHAR(255), nullable=False, index=True)
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
        Enum('health', 'auto', 'life', 'travel', name='insurance_type_enum'),
        nullable=False
    )
    preferred_language = Column(VARCHAR(5), default='en', nullable=False)
    
    # Application status
    status = Column(
        Enum('draft', 'submitted', 'exported', 'processed', name='application_status_enum'),
        default='draft',
        nullable=False
    )
    
    # Timestamps
    created_at = Column(
        TIMESTAMP,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )
    updated_at = Column(
        TIMESTAMP,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    files = relationship("File", back_populates="application", cascade="all, delete-orphan")
    email_exports = relationship("EmailExport", back_populates="application", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="application", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_reference_number', 'reference_number'),
        Index('idx_email', 'email'),
        Index('idx_created_at', 'created_at'),
        Index('idx_status', 'status'),
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
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        return f"FV-{date_str}-{random_suffix}"