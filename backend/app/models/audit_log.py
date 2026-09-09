"""
Audit log model for tracking system activities and user actions.
"""

from datetime import datetime, timezone
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

    # Tamper-Evident Cryptographic Hash Chain
    sequence = Column(Integer, nullable=True, index=True)
    prev_hash = Column(String(64), nullable=True)
    entry_hash = Column(String(64), nullable=True, index=True)

    # Relationships
    application = relationship("Application", back_populates="audit_logs")

    # Indexes
    __table_args__ = (
        Index("idx_audit_logs_application_id", "application_id"),
        Index("idx_audit_logs_action", "action"),
        Index("idx_audit_logs_created_at", "created_at"),
        Index("idx_audit_logs_user_ip", "user_ip"),
        Index("idx_audit_logs_sequence", "sequence"),
        Index("idx_audit_logs_entry_hash", "entry_hash"),
    )

    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, seq={self.sequence}, action={self.action}, created_at={self.created_at})>"

    @staticmethod
    def calculate_entry_hash(
        prev_hash: Optional[str],
        sequence: int,
        created_at: datetime,
        action: str,
        application_id: Optional[str],
        details: Any,
    ) -> str:
        """Compute SHA-256 hash for tamper-evident hash chaining."""
        import hashlib
        import json

        ca_str = ""
        if created_at:
            if created_at.tzinfo is None:
                ca_dt = created_at.replace(tzinfo=timezone.utc)
            else:
                ca_dt = created_at.astimezone(timezone.utc)
            ca_str = ca_dt.strftime("%Y-%m-%dT%H:%M:%S.%fZ")

        payload = {
            "prev_hash": prev_hash or "GENESIS",
            "sequence": sequence,
            "created_at": ca_str,
            "action": action,
            "application_id": application_id or "",
            "details": details or {},
        }
        dumped = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(dumped.encode("utf-8")).hexdigest()

    @classmethod
    def create_log(
        cls,
        action: str,
        application_id: Optional[str] = None,
        user_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        sequence: Optional[int] = None,
        prev_hash: Optional[str] = None,
    ) -> "AuditLog":
        """
        Factory method to create an audit log entry.
        """
        now = datetime.now(timezone.utc)
        entry_hash = None
        if sequence is not None:
            entry_hash = cls.calculate_entry_hash(
                prev_hash=prev_hash,
                sequence=sequence,
                created_at=now,
                action=action,
                application_id=application_id,
                details=details,
            )

        return cls(
            action=action,
            application_id=application_id,
            user_ip=user_ip,
            user_agent=user_agent,
            details=details,
            created_at=now,
            sequence=sequence,
            prev_hash=prev_hash,
            entry_hash=entry_hash,
        )

    @classmethod
    def create_chained_log(
        cls,
        db,
        action: str,
        application_id: Optional[str] = None,
        user_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> "AuditLog":
        """
        Create a cryptographically chained audit log linked to the latest sequence.
        """
        last_log = db.query(cls).order_by(cls.id.desc()).first()
        prev_seq = last_log.sequence if (last_log and last_log.sequence is not None) else 0
        prev_h = last_log.entry_hash if last_log else None
        seq = prev_seq + 1

        log = cls.create_log(
            action=action,
            application_id=application_id,
            user_ip=user_ip,
            user_agent=user_agent,
            details=details,
            sequence=seq,
            prev_hash=prev_h,
        )
        db.add(log)
        return log

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
