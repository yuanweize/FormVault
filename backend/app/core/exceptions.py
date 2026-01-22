"""
Custom exception classes for FormVault Insurance Portal.

This module defines all custom exceptions used throughout the application
with appropriate error codes and HTTP status codes.
"""

from typing import Optional, Dict, Any


class FormVaultException(Exception):
    """Base exception class for FormVault application."""
    
    def __init__(
        self,
        message: str,
        error_code: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationException(FormVaultException):
    """Exception for data validation errors."""
    
    def __init__(self, message: str, field: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=422,
            details=details or {}
        )
        if field:
            self.details["field"] = field


class FileUploadException(FormVaultException):
    """Exception for file upload related errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="FILE_UPLOAD_ERROR",
            status_code=400,
            details=details or {}
        )


class FileSizeException(FileUploadException):
    """Exception for file size limit exceeded."""
    
    def __init__(self, max_size: int, actual_size: int):
        super().__init__(
            message=f"File size {actual_size} bytes exceeds maximum allowed size of {max_size} bytes",
            details={"max_size": max_size, "actual_size": actual_size}
        )


class FileTypeException(FileUploadException):
    """Exception for unsupported file type."""
    
    def __init__(self, file_type: str, allowed_types: list):
        super().__init__(
            message=f"File type '{file_type}' is not allowed. Allowed types: {', '.join(allowed_types)}",
            details={"file_type": file_type, "allowed_types": allowed_types}
        )


class MalwareDetectedException(FileUploadException):
    """Exception for when malware is detected in uploaded file."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"Malware detected: {message}",
            details=details or {}
        )
        self.error_code = "MALWARE_DETECTED"
        self.status_code = 400


class ApplicationNotFoundException(FormVaultException):
    """Exception for when an application is not found."""
    
    def __init__(self, application_id: str):
        super().__init__(
            message=f"Application with ID '{application_id}' not found",
            error_code="APPLICATION_NOT_FOUND",
            status_code=404,
            details={"application_id": application_id}
        )


class FileNotFoundException(FormVaultException):
    """Exception for when a file is not found."""
    
    def __init__(self, file_id: str):
        super().__init__(
            message=f"File with ID '{file_id}' not found",
            error_code="FILE_NOT_FOUND",
            status_code=404,
            details={"file_id": file_id}
        )


class EmailSendException(FormVaultException):
    """Exception for email sending failures."""
    
    def __init__(self, message: str, recipient: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="EMAIL_SEND_ERROR",
            status_code=500,
            details=details or {}
        )
        if recipient:
            self.details["recipient"] = recipient


class DatabaseException(FormVaultException):
    """Exception for database operation failures."""
    
    def __init__(self, message: str, operation: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            status_code=500,
            details=details or {}
        )
        if operation:
            self.details["operation"] = operation


class RateLimitException(FormVaultException):
    """Exception for rate limit exceeded."""
    
    def __init__(self, limit: int, window: int, retry_after: Optional[int] = None):
        super().__init__(
            message=f"Rate limit exceeded: {limit} requests per {window} seconds",
            error_code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            details={
                "limit": limit,
                "window": window,
                "retry_after": retry_after
            }
        )


class EmailServiceException(FormVaultException):
    """Exception for email service related errors."""
    
    def __init__(self, message: str, operation: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="EMAIL_SERVICE_ERROR",
            status_code=500,
            details=details or {}
        )
        if operation:
            self.details["operation"] = operation


class SecurityException(FormVaultException):
    """Exception for security-related errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="SECURITY_ERROR",
            status_code=403,
            details=details or {}
        )