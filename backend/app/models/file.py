"""
File model for storing uploaded document information.
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import VARCHAR, TIMESTAMP, TEXT

from ..database import Base


class File(Base):
    """
    Model for uploaded files (student ID and passport photos).
    """
    __tablename__ = "files"

    # Primary key
    id = Column(VARCHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign key to application
    application_id = Column(VARCHAR(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    
    # File type classification
    file_type = Column(
        Enum('student_id', 'passport', name='file_type_enum'),
        nullable=False
    )
    
    # File information
    original_filename = Column(VARCHAR(255), nullable=False)
    stored_filename = Column(VARCHAR(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(VARCHAR(100), nullable=False)
    
    # Security and integrity
    file_hash = Column(VARCHAR(64), nullable=True)  # SHA-256 hash for integrity verification
    upload_ip = Column(VARCHAR(45), nullable=True)  # IP address of uploader
    
    # Timestamp
    created_at = Column(
        TIMESTAMP,
        default=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    application = relationship("Application", back_populates="files")
    
    # Indexes
    __table_args__ = (
        Index('idx_application_id', 'application_id'),
        Index('idx_file_type', 'file_type'),
        Index('idx_created_at', 'created_at'),
    )
    
    def __repr__(self) -> str:
        return f"<File(id={self.id}, type={self.file_type}, filename={self.original_filename})>"
    
    @property
    def file_size_mb(self) -> float:
        """Return file size in megabytes."""
        return round(self.file_size / (1024 * 1024), 2)
    
    @property
    def is_image(self) -> bool:
        """Check if the file is an image."""
        return self.mime_type.startswith('image/')
    
    @property
    def is_pdf(self) -> bool:
        """Check if the file is a PDF."""
        return self.mime_type == 'application/pdf'
    
    def get_file_extension(self) -> Optional[str]:
        """Extract file extension from original filename."""
        if '.' in self.original_filename:
            return self.original_filename.rsplit('.', 1)[1].lower()
        return None