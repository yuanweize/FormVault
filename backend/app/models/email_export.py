"""
Email export model for tracking email deliveries to insurance companies.
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import VARCHAR, TIMESTAMP, TEXT

from ..database import Base


class EmailExport(Base):
    """
    Model for tracking email exports of applications to insurance companies.
    """
    __tablename__ = "email_exports"

    # Primary key
    id = Column(VARCHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign key to application
    application_id = Column(VARCHAR(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    
    # Email details
    recipient_email = Column(VARCHAR(255), nullable=False)
    insurance_company = Column(VARCHAR(255), nullable=True)
    
    # Export status tracking
    status = Column(
        Enum('pending', 'sent', 'failed', 'retry', name='export_status_enum'),
        default='pending',
        nullable=False
    )
    
    # Delivery tracking
    sent_at = Column(TIMESTAMP, nullable=True)
    error_message = Column(TEXT, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    
    # Timestamp
    created_at = Column(
        TIMESTAMP,
        default=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    application = relationship("Application", back_populates="email_exports")
    
    # Indexes
    __table_args__ = (
        Index('idx_application_id', 'application_id'),
        Index('idx_status', 'status'),
        Index('idx_created_at', 'created_at'),
        Index('idx_recipient_email', 'recipient_email'),
    )
    
    def __repr__(self) -> str:
        return f"<EmailExport(id={self.id}, status={self.status}, recipient={self.recipient_email})>"
    
    @property
    def is_pending(self) -> bool:
        """Check if the export is pending."""
        return self.status == 'pending'
    
    @property
    def is_sent(self) -> bool:
        """Check if the export was successfully sent."""
        return self.status == 'sent'
    
    @property
    def is_failed(self) -> bool:
        """Check if the export failed."""
        return self.status == 'failed'
    
    @property
    def needs_retry(self) -> bool:
        """Check if the export needs to be retried."""
        return self.status == 'retry'
    
    @property
    def max_retries_reached(self) -> bool:
        """Check if maximum retry attempts have been reached."""
        MAX_RETRIES = 3
        return self.retry_count >= MAX_RETRIES
    
    def mark_as_sent(self) -> None:
        """Mark the export as successfully sent."""
        self.status = 'sent'
        self.sent_at = datetime.utcnow()
        self.error_message = None
    
    def mark_as_failed(self, error_message: str) -> None:
        """Mark the export as failed with error message."""
        self.status = 'failed'
        self.error_message = error_message
        self.sent_at = None
    
    def mark_for_retry(self, error_message: str) -> None:
        """Mark the export for retry and increment retry count."""
        self.status = 'retry'
        self.retry_count += 1
        self.error_message = error_message
        self.sent_at = None