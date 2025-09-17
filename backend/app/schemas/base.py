"""
Base Pydantic schemas for FormVault Insurance Portal.

This module contains base schemas and common field definitions
used across the application.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class TimestampMixin(BaseModel):
    """Mixin for models with timestamp fields."""
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")


class ResponseBase(BaseModel):
    """Base response schema with common fields."""
    success: bool = Field(True, description="Indicates if the request was successful")
    message: Optional[str] = Field(None, description="Optional response message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class ErrorResponse(BaseModel):
    """Standard error response schema."""
    error: Dict[str, Any] = Field(..., description="Error details")
    
    class Config:
        schema_extra = {
            "example": {
                "error": {
                    "message": "Validation failed",
                    "code": "VALIDATION_ERROR",
                    "timestamp": "2023-01-01T00:00:00Z",
                    "path": "/api/v1/applications",
                    "details": {}
                }
            }
        }


class InsuranceType(str, Enum):
    """Enumeration of available insurance types."""
    HEALTH = "health"
    AUTO = "auto"
    LIFE = "life"
    TRAVEL = "travel"


class ApplicationStatus(str, Enum):
    """Enumeration of application statuses."""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    EXPORTED = "exported"
    PROCESSED = "processed"


class FileType(str, Enum):
    """Enumeration of supported file types."""
    STUDENT_ID = "student_id"
    PASSPORT = "passport"


class ExportStatus(str, Enum):
    """Enumeration of email export statuses."""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    RETRY = "retry"


class PaginationParams(BaseModel):
    """Common pagination parameters."""
    page: int = Field(1, ge=1, description="Page number (1-based)")
    size: int = Field(20, ge=1, le=100, description="Number of items per page")
    
    @property
    def offset(self) -> int:
        """Calculate offset for database queries."""
        return (self.page - 1) * self.size


class PaginatedResponse(ResponseBase):
    """Base paginated response schema."""
    pagination: Dict[str, Any] = Field(..., description="Pagination metadata")
    
    @classmethod
    def create(cls, items: list, total: int, params: PaginationParams, **kwargs):
        """Create a paginated response."""
        total_pages = (total + params.size - 1) // params.size
        
        return cls(
            data=items,
            pagination={
                "page": params.page,
                "size": params.size,
                "total": total,
                "total_pages": total_pages,
                "has_next": params.page < total_pages,
                "has_prev": params.page > 1,
            },
            **kwargs
        )