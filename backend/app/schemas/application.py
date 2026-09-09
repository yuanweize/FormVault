"""
Pydantic schemas for application-related operations.

This module contains all schemas for application creation, updates,
and responses in the FormVault Insurance Portal.
"""

from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict
from typing import Optional, List
from datetime import date, datetime
import re

from .base import (
    ResponseBase,
    TimestampMixin,
    InsuranceType,
    ApplicationStatus,
    FileType,
)


class AddressSchema(BaseModel):
    """Schema for address information."""

    street: str = Field(..., min_length=1, max_length=255, description="Street address")
    city: str = Field(..., min_length=1, max_length=100, description="City name")
    state: str = Field(
        ..., min_length=1, max_length=100, description="State or province"
    )
    zip_code: str = Field(
        ..., min_length=1, max_length=20, description="ZIP or postal code"
    )
    country: str = Field(..., min_length=1, max_length=100, description="Country name")

    @field_validator("zip_code")
    @classmethod
    def validate_zip_code(cls, v):
        """Validate ZIP code format."""
        # Basic validation - can be extended for specific country formats
        if not re.match(r"^[A-Za-z0-9\s\-]{3,20}$", v):
            raise ValueError("Invalid ZIP code format")
        return v.strip()


class PersonalInfoSchema(BaseModel):
    """Schema for personal information."""

    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")
    email: EmailStr = Field(..., description="Email address")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")
    address: AddressSchema = Field(..., description="Address information")
    date_of_birth: date = Field(..., description="Date of birth")

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_names(cls, v):
        """Validate name fields."""
        if not re.match(r"^[A-Za-z0-9\s\-\'\.]+$", v):
            raise ValueError("Name contains invalid characters")
        return v.strip()

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        """Validate phone number format."""
        if v is None:
            return v
        # Remove spaces and common separators
        cleaned = re.sub(r"[\s\-\(\)\.]+", "", v)
        if not re.match(r"^\+?[0-9]{7,15}$", cleaned):
            raise ValueError("Invalid phone number format")
        return v.strip()

    @field_validator("date_of_birth")
    @classmethod
    def validate_age(cls, v):
        """Validate that the person is at least 18 years old."""
        today = date.today()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 18:
            raise ValueError("Applicant must be at least 18 years old")
        if age > 120:
            raise ValueError("Invalid date of birth")
        return v


class ApplicationCreateSchema(BaseModel):
    """Schema for creating a new application."""

    personal_info: PersonalInfoSchema = Field(..., description="Personal information")
    insurance_type: InsuranceType = Field(..., description="Type of insurance")
    preferred_language: str = Field(
        "en", max_length=5, description="Preferred language code"
    )
    student_id_file_id: Optional[str] = Field(None, description="Student ID file ID")
    passport_file_id: Optional[str] = Field(None, description="Passport file ID")
    study_confirmation_file_id: Optional[str] = Field(
        None, description="Study confirmation file ID"
    )

    # Underwriting partner & duration
    insurance_company_id: Optional[int] = Field(
        None, description="Selected insurance company partner ID"
    )
    insurance_plan_id: Optional[int] = Field(
        None, description="Selected insurance plan ID"
    )
    gender: Optional[str] = Field(
        None, max_length=10, description="Gender (Male/Female)"
    )
    nationality: Optional[str] = Field(
        None, max_length=50, description="Nationality / Citizenship"
    )
    place_of_birth: Optional[str] = Field(
        None, max_length=100, description="Place of birth (City, Country)"
    )
    passport_number: Optional[str] = Field(
        None, max_length=50, description="Passport number"
    )
    passport_expiry_date: Optional[date] = Field(
        None, description="Passport expiration date"
    )
    passport_issued_by: Optional[str] = Field(
        None, max_length=50, description="Country/Authority that issued passport"
    )
    insurance_commencement_date: Optional[date] = Field(
        None, description="Requested insurance start date"
    )
    insurance_duration_months: Optional[int] = Field(
        12, description="Insurance duration in months (e.g. 12, 24, 36)"
    )
    type_of_stay: Optional[str] = Field(
        "student",
        max_length=50,
        description="Type of stay in Czechia (student, employee)",
    )
    custom_fields_data: Optional[str] = Field(
        None, description="Configurable recipe dynamic fields JSON"
    )

    @field_validator("preferred_language")
    @classmethod
    def validate_language(cls, v):
        """Validate language code format."""
        if not re.match(r"^[a-z]{2}(-[A-Z]{2})?$", v):
            raise ValueError("Invalid language code format")
        return v


class ApplicationUpdateSchema(BaseModel):
    """Schema for updating an existing application."""

    personal_info: Optional[PersonalInfoSchema] = Field(
        None, description="Personal information"
    )
    insurance_type: Optional[InsuranceType] = Field(
        None, description="Type of insurance"
    )
    preferred_language: Optional[str] = Field(
        None, max_length=5, description="Preferred language code"
    )
    student_id_file_id: Optional[str] = Field(None, description="Student ID file ID")
    passport_file_id: Optional[str] = Field(None, description="Passport file ID")
    study_confirmation_file_id: Optional[str] = Field(
        None, description="Study confirmation file ID"
    )
    insurance_company_id: Optional[int] = Field(
        None, description="Assigned insurance company ID"
    )
    insurance_plan_id: Optional[int] = Field(None, description="Assigned plan ID")
    gender: Optional[str] = Field(None, max_length=10)
    nationality: Optional[str] = Field(None, max_length=50)
    place_of_birth: Optional[str] = Field(None, max_length=100)
    passport_number: Optional[str] = Field(None, max_length=50)
    passport_expiry_date: Optional[date] = Field(None)
    passport_issued_by: Optional[str] = Field(None, max_length=50)
    insurance_commencement_date: Optional[date] = Field(None)
    insurance_duration_months: Optional[int] = Field(None)
    type_of_stay: Optional[str] = Field(None, max_length=50)
    custom_fields_data: Optional[str] = Field(None)

    @field_validator("preferred_language")
    @classmethod
    def validate_language(cls, v):
        """Validate language code format."""
        if v is not None and not re.match(r"^[a-z]{2}(-[A-Z]{2})?$", v):
            raise ValueError("Invalid language code format")
        return v


class FileInfoSchema(BaseModel):
    """Schema for file information in responses."""

    id: str = Field(..., description="File ID")
    file_type: FileType = Field(..., description="Type of file")
    original_filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type")
    created_at: datetime = Field(..., description="Upload timestamp")


class ApplicationResponseSchema(ResponseBase, TimestampMixin):
    """Schema for application response."""

    id: str = Field(..., description="Application ID")
    reference_number: str = Field(..., description="Application reference number")
    personal_info: PersonalInfoSchema = Field(..., description="Personal information")
    insurance_type: InsuranceType = Field(..., description="Type of insurance")
    preferred_language: str = Field(..., description="Preferred language code")
    status: ApplicationStatus = Field(..., description="Application status")
    insurance_company_id: Optional[int] = None
    insurance_plan_id: Optional[int] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    place_of_birth: Optional[str] = None
    passport_number: Optional[str] = None
    passport_expiry_date: Optional[date] = None
    passport_issued_by: Optional[str] = None
    insurance_commencement_date: Optional[date] = None
    insurance_duration_months: Optional[int] = 12
    type_of_stay: Optional[str] = "student"
    files: List[FileInfoSchema] = Field(
        default_factory=list, description="Uploaded files"
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "success": True,
                "timestamp": "2023-01-01T00:00:00Z",
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "reference_number": "APP-2023-001234",
                "personal_info": {
                    "first_name": "John",
                    "last_name": "Doe",
                    "email": "john.doe@example.com",
                    "phone": "+1234567890",
                    "address": {
                        "street": "123 Main St",
                        "city": "Anytown",
                        "state": "CA",
                        "zip_code": "12345",
                        "country": "USA",
                    },
                    "date_of_birth": "1990-01-01",
                },
                "insurance_type": "health",
                "preferred_language": "en",
                "status": "draft",
                "files": [],
                "created_at": "2023-01-01T00:00:00Z",
                "updated_at": "2023-01-01T00:00:00Z",
            }
        },
    )


class ApplicationListResponseSchema(ResponseBase):
    """Schema for application list response."""

    applications: List[ApplicationResponseSchema] = Field(
        ..., description="List of applications"
    )


class ApplicationSubmitSchema(BaseModel):
    """Schema for submitting an application."""

    confirm_submission: bool = Field(
        ..., description="Confirmation of submission intent"
    )

    @field_validator("confirm_submission")
    @classmethod
    def validate_confirmation(cls, v):
        """Ensure submission is confirmed."""
        if not v:
            raise ValueError("Submission must be confirmed")
        return v


class ApplicationSubmitResponseSchema(ResponseBase):
    """Schema for application submission response."""

    application_id: str = Field(..., description="Application ID")
    reference_number: str = Field(..., description="Application reference number")
    status: ApplicationStatus = Field(..., description="New application status")
    submitted_at: datetime = Field(..., description="Submission timestamp")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "success": True,
                "message": "Application submitted successfully",
                "timestamp": "2023-01-01T00:00:00Z",
                "application_id": "550e8400-e29b-41d4-a716-446655440000",
                "reference_number": "APP-2023-001234",
                "status": "submitted",
                "submitted_at": "2023-01-01T00:00:00Z",
            }
        },
    )


class ApplicationTrackRequestSchema(BaseModel):
    """Schema for public tracking request with dual-factor verification."""

    reference_number: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="Application reference number issued upon submission",
    )
    email: str = Field(
        ...,
        description="Applicant email address registered with the application",
    )


class ApplicationTimelineStepSchema(BaseModel):
    """Step in the application review and policy issuance pipeline."""

    key: str
    label: str
    description: str
    completed: bool
    current: bool
    timestamp: Optional[datetime] = None


class ApplicationTrackResponseSchema(ResponseBase):
    """Safe, masked status tracking response for customers."""

    reference_number: str
    status: str
    status_label: str
    insurance_type: str
    masked_name: str
    masked_email: str
    created_at: datetime
    submitted_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    timeline: List[ApplicationTimelineStepSchema]
