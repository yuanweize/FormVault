"""
Pydantic schemas for file upload and management operations.

This module contains all schemas for file upload, validation,
and responses in the FormVault Insurance Portal.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

from .base import ResponseBase, TimestampMixin, FileType


class FileUploadResponseSchema(ResponseBase, TimestampMixin):
    """Schema for file upload response."""
    id: str = Field(..., description="File ID")
    file_type: FileType = Field(..., description="Type of file")
    original_filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type")
    file_hash: str = Field(..., description="File hash for integrity verification")
    
    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "timestamp": "2023-01-01T00:00:00Z",
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "file_type": "student_id",
                "original_filename": "student_id.jpg",
                "file_size": 1024000,
                "mime_type": "image/jpeg",
                "file_hash": "sha256:abc123...",
                "created_at": "2023-01-01T00:00:00Z",
                "updated_at": "2023-01-01T00:00:00Z"
            }
        }


class FileInfoSchema(BaseModel):
    """Schema for file information."""
    id: str = Field(..., description="File ID")
    file_type: FileType = Field(..., description="Type of file")
    original_filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type")
    created_at: datetime = Field(..., description="Upload timestamp")


class FileListResponseSchema(ResponseBase):
    """Schema for file list response."""
    files: List[FileInfoSchema] = Field(..., description="List of files")


class FileDeleteResponseSchema(ResponseBase):
    """Schema for file deletion response."""
    file_id: str = Field(..., description="Deleted file ID")
    
    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "message": "File deleted successfully",
                "timestamp": "2023-01-01T00:00:00Z",
                "file_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }


class FileValidationSchema(BaseModel):
    """Schema for file validation parameters."""
    max_size: int = Field(..., description="Maximum file size in bytes")
    allowed_types: List[str] = Field(..., description="List of allowed MIME types")
    
    class Config:
        schema_extra = {
            "example": {
                "max_size": 5242880,
                "allowed_types": ["image/jpeg", "image/png", "application/pdf"]
            }
        }