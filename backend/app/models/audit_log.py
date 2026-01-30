"""
Audit log model for tracking system activities and user actions.
"""

from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index, Text, JSON
from sqlalchemy.orm import relationship

from ..database import Base


class AuditLog(Base):
    """
    Model for audit logging of system activities and user actions.
    """

    __tablename__ = "audit_logs"

    # Primary key (using Integer for SQLite compatibility with autoincrement)
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Foreign key to application (optional, some logs may not be application-specific)
    application_id = Column(
        String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=True
    )

    # Action information
    action = Column(String(100), nullable=False)

    # User/request information
    user_ip = Column(String(45), nullable=True)  # Supports both IPv4 and IPv6
    user_agent = Column(Text, nullable=True)

    # Additional details stored as JSON
    details = Column(JSON, nullable=True)

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="audit_logs")

    # Indexes
    __table_args__ = (
        Index("idx_audit_logs_application_id", "application_id"),
        Index("idx_audit_logs_action", "action"),
        Index("idx_audit_logs_created_at", "created_at"),
        Index("idx_audit_logs_user_ip", "user_ip"),
    )

    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, action={self.action}, created_at={self.created_at})>"

    @classmethod
    def create_log(
        cls,
        action: str,
        application_id: Optional[str] = None,
        user_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> "AuditLog":
        """
        Factory method to create an audit log entry.

        Args:
            action: The action being logged
            application_id: Optional application ID
            user_ip: Optional user IP address
            user_agent: Optional user agent string
            details: Optional additional details as dictionary

        Returns:
            AuditLog instance
        """
        return cls(
            action=action,
            application_id=application_id,
            user_ip=user_ip,
            user_agent=user_agent,
            details=details,
        )

    @property
    def action_category(self) -> str:
        """
        Extract action category from action string.
        Expected format: "category.specific_action"
        """
        if "." in self.action:
            return self.action.split(".")[0]
        return "general"

    @property
    def is_security_event(self) -> bool:
        """Check if this is a security-related event."""
        security_actions = [
            "auth.login_failed",
            "auth.invalid_token",
            "file.malware_detected",
            "form.validation_failed",
            "api.rate_limit_exceeded",
        ]
        return self.action in security_actions

    @property
    def is_application_event(self) -> bool:
        """Check if this event is related to an application."""
        return self.application_id is not None
