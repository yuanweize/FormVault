"""
Pydantic schemas for email export operations.

This module defines the request and response schemas for email export
functionality including validation and serialization.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

from .base import ResponseBase


class EmailExportRequestSchema(BaseModel):
    """Schema for email export request."""
    
    recipient_email: EmailStr = Field(
        ...,
        description="Email address of the insurance company recipient"
    )
    
    insurance_company: Optional[str] = Field(
        None,
        max_length=255,
        description="Name of the insurance company"
    )
    
    additional_notes: Optional[str] = Field(
        None,
        max_length=1000,
        description="Additional notes to include in the email"
    )
    
    @field_validator("insurance_company")
    @classmethod
    def validate_insurance_company(cls, v):
        """Validate insurance company name."""
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
        return v
    
    @field_validator("additional_notes")
    @classmethod
    def validate_additional_notes(cls, v):
        """Validate additional notes."""
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
        return v


class EmailExportResponseSchema(ResponseBase):
    """Schema for email export response."""
    
    export_id: str = Field(
        ...,
        description="Unique identifier for the email export"
    )
    
    application_id: str = Field(
        ...,
        description="Application ID that was exported"
    )
    
    recipient_email: str = Field(
        ...,
        description="Email address where the export was sent"
    )
    
    insurance_company: Optional[str] = Field(
        None,
        description="Name of the insurance company"
    )
    
    status: str = Field(
        ...,
        description="Current status of the email export"
    )
    
    sent_at: Optional[datetime] = Field(
        None,
        description="Timestamp when the email was successfully sent"
    )
    
    created_at: datetime = Field(
        ...,
        description="Timestamp when the export was created"
    )


class EmailExportStatusSchema(BaseModel):
    """Schema for email export status information."""
    
    export_id: str = Field(
        ...,
        description="Unique identifier for the email export"
    )
    
    status: str = Field(
        ...,
        description="Current status of the email export"
    )
    
    sent_at: Optional[datetime] = Field(
        None,
        description="Timestamp when the email was successfully sent"
    )
    
    error_message: Optional[str] = Field(
        None,
        description="Error message if the export failed"
    )
    
    retry_count: int = Field(
        0,
        description="Number of retry attempts made"
    )
    
    created_at: datetime = Field(
        ...,
        description="Timestamp when the export was created"
    )


class EmailExportHistorySchema(ResponseBase):
    """Schema for email export history response."""
    
    application_id: str = Field(
        ...,
        description="Application ID"
    )
    
    exports: list[EmailExportStatusSchema] = Field(
        default_factory=list,
        description="List of email exports for the application"
    )
    
    total_exports: int = Field(
        0,
        description="Total number of exports for this application"
    )
    
    successful_exports: int = Field(
        0,
        description="Number of successful exports"
    )
    
    failed_exports: int = Field(
        0,
        description="Number of failed exports"
    )
    
    pending_exports: int = Field(
        0,
        description="Number of pending exports"
    )


class EmailExportRetryRequestSchema(BaseModel):
    """Schema for email export retry request."""
    
    export_id: str = Field(
        ...,
        description="ID of the email export to retry"
    )
    
    force_retry: bool = Field(
        False,
        description="Force retry even if max retries reached"
    )


class EmailExportRetryResponseSchema(ResponseBase):
    """Schema for email export retry response."""
    
    export_id: str = Field(
        ...,
        description="ID of the email export that was retried"
    )
    
    retry_attempted: bool = Field(
        ...,
        description="Whether the retry was attempted"
    )
    
    new_status: str = Field(
        ...,
        description="New status after retry attempt"
    )
    
    retry_count: int = Field(
        ...,
        description="Updated retry count"
    )