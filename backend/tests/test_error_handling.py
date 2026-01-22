"""
Unit tests for error handling and exception management.

This module tests custom exception handlers, validation errors,
and error response formatting in the FormVault Insurance Portal API.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import json
from datetime import datetime

from app.main import app
from app.core.exceptions import (
    FormVaultException,
    ValidationException,
    FileUploadException,
    ApplicationNotFoundException,
    EmailSendException
)


class TestCustomExceptionHandlers:
    """Test cases for custom exception handlers."""
    
    def setup_method(self):
        """Set up test client for each test."""
        self.client = TestClient(app)
    
    def test_formvault_exception_handler(self):
        """Test FormVault exception handler formatting."""
        # Create a test endpoint that raises FormVaultException
        @app.get("/test/formvault-exception")
        async def test_formvault_exception():
            raise FormVaultException(
                message="Test error message",
                error_code="TEST_ERROR",
                status_code=400
            )
        
        response = self.client.get("/test/formvault-exception")
        
        assert response.status_code == 400
        data = response.json()
        
        assert "error" in data
        error = data["error"]
        assert error["message"] == "Test error message"
        assert error["code"] == "TEST_ERROR"
        assert "timestamp" in error
        assert error["path"] == "/test/formvault-exception"
    
    def test_validation_exception_handler(self):
        """Test validation exception handling."""
        # Test with invalid JSON data to trigger validation error
        response = self.client.post(
            "/api/v1/applications/",
            json={"invalid": "data"}
        )
        
        assert response.status_code == 422
        data = response.json()
        
        assert "error" in data
        error = data["error"]
        assert error["message"] == "Validation failed"
        assert error["code"] == "VALIDATION_ERROR"
        assert "details" in error
        assert "timestamp" in error
        assert error["path"] == "/api/v1/applications/"
    
    def test_http_exception_handler(self):
        """Test HTTP exception handler."""
        # Test 404 error
        response = self.client.get("/nonexistent-endpoint")
        
        assert response.status_code == 404
        data = response.json()
        
        assert "error" in data
        error = data["error"]
        assert error["code"] == "HTTP_ERROR"
        assert "timestamp" in error
        assert error["path"] == "/nonexistent-endpoint"
    
    def test_general_exception_handler(self):
        """Test general exception handler for unexpected errors."""
        # Create a test endpoint that raises a general exception
        @app.get("/test/general-exception")
        async def test_general_exception():
            raise ValueError("Unexpected error")
        
        response = self.client.get("/test/general-exception")
        
        assert response.status_code == 500
        data = response.json()
        
        assert "error" in data
        error = data["error"]
        assert error["message"] == "Internal server error"
        assert error["code"] == "INTERNAL_ERROR"
        assert "timestamp" in error
        assert error["path"] == "/test/general-exception"


class TestSpecificExceptionTypes:
    """Test cases for specific exception types and their handling."""
    
    def setup_method(self):
        """Set up test client for each test."""
        self.client = TestClient(app)
    
    def test_validation_exception_with_field(self):
        """Test ValidationException with field information."""
        exception = ValidationException(
            message="Invalid email format",
            field="email",
            details={"provided_value": "invalid-email"}
        )
        
        assert exception.message == "Invalid email format"
        assert exception.error_code == "VALIDATION_ERROR"
        assert exception.status_code == 422
        assert exception.details["field"] == "email"
        assert exception.details["provided_value"] == "invalid-email"
    
    def test_file_upload_exception(self):
        """Test FileUploadException."""
        exception = FileUploadException(
            message="File too large",
            details={"max_size": 5242880, "actual_size": 10485760}
        )
        
        assert exception.message == "File too large"
        assert exception.error_code == "FILE_UPLOAD_ERROR"
        assert exception.status_code == 400
        assert exception.details["max_size"] == 5242880
    
    def test_application_not_found_exception(self):
        """Test ApplicationNotFoundException."""
        app_id = "550e8400-e29b-41d4-a716-446655440000"
        exception = ApplicationNotFoundException(app_id)
        
        assert f"Application with ID '{app_id}' not found" in exception.message
        assert exception.error_code == "APPLICATION_NOT_FOUND"
        assert exception.status_code == 404
        assert exception.details["application_id"] == app_id
    
    def test_email_send_exception(self):
        """Test EmailSendException."""
        exception = EmailSendException(
            message="SMTP server unavailable",
            recipient="test@example.com",
            details={"smtp_error": "Connection refused"}
        )
        
        assert exception.message == "SMTP server unavailable"
        assert exception.error_code == "EMAIL_SEND_ERROR"
        assert exception.status_code == 500
        assert exception.details["recipient"] == "test@example.com"
        assert exception.details["smtp_error"] == "Connection refused"


class TestValidationErrorHandling:
    """Test cases for Pydantic validation error handling."""
    
    def setup_method(self):
        """Set up test client for each test."""
        self.client = TestClient(app)
    
    def test_missing_required_fields(self):
        """Test validation error for missing required fields."""
        response = self.client.post(
            "/api/v1/applications/",
            json={}
        )
        
        assert response.status_code == 422
        data = response.json()
        
        assert "error" in data
        error = data["error"]
        assert error["code"] == "VALIDATION_ERROR"
        assert "details" in error
        
        # Check that validation details are included
        details = error["details"]
        assert isinstance(details, list)
        assert len(details) > 0
    
    def test_invalid_field_types(self):
        """Test validation error for invalid field types."""
        response = self.client.post(
            "/api/v1/applications/",
            json={
                "personal_info": "invalid_type",  # Should be object
                "insurance_type": "invalid_insurance_type"
            }
        )
        
        assert response.status_code == 422
        data = response.json()
        
        assert "error" in data
        error = data["error"]
        assert error["code"] == "VALIDATION_ERROR"
        assert "details" in error
    
    def test_invalid_email_format(self):
        """Test validation error for invalid email format."""
        response = self.client.post(
            "/api/v1/applications/",
            json={
                "personal_info": {
                    "first_name": "John",
                    "last_name": "Doe",
                    "email": "invalid-email",  # Invalid email format
                    "address": {
                        "street": "123 Main St",
                        "city": "Anytown",
                        "state": "CA",
                        "zip_code": "12345",
                        "country": "USA"
                    },
                    "date_of_birth": "1990-01-01"
                },
                "insurance_type": "health"
            }
        )
        
        assert response.status_code == 422
        data = response.json()
        
        assert "error" in data
        error = data["error"]
        assert error["code"] == "VALIDATION_ERROR"


class TestErrorResponseFormat:
    """Test cases for error response format consistency."""
    
    def setup_method(self):
        """Set up test client for each test."""
        self.client = TestClient(app)
    
    def test_error_response_structure(self):
        """Test that all error responses have consistent structure."""
        # Test 404 error
        response = self.client.get("/nonexistent")
        assert response.status_code == 404
        
        data = response.json()
        self._validate_error_structure(data)
        
        # Test validation error
        response = self.client.post("/api/v1/applications/", json={})
        assert response.status_code == 422
        
        data = response.json()
        self._validate_error_structure(data)
    
    def _validate_error_structure(self, data):
        """Validate that error response has the expected structure."""
        assert "error" in data
        error = data["error"]
        
        # Required fields
        assert "message" in error
        assert "code" in error
        assert "timestamp" in error
        assert "path" in error
        
        # Validate timestamp format
        timestamp = error["timestamp"]
        try:
            datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        except ValueError:
            pytest.fail(f"Invalid timestamp format: {timestamp}")
        
        # Validate that message and code are strings
        assert isinstance(error["message"], str)
        assert isinstance(error["code"], str)
        assert isinstance(error["path"], str)
    
    def test_error_logging_integration(self):
        """Test that errors are properly logged."""
        with patch('app.main.logger') as mock_logger:
            # Trigger an error
            response = self.client.get("/nonexistent")
            assert response.status_code == 404
            
            # Verify that error was logged
            mock_logger.error.assert_called()
            
            # Check log call arguments
            call_args = mock_logger.error.call_args
            assert "HTTP exception occurred" in str(call_args)


class TestRateLimitingErrorHandling:
    """Test cases for rate limiting error handling."""
    
    def setup_method(self):
        """Set up test client for each test."""
        self.client = TestClient(app)
    
    @patch('app.core.config.get_settings')
    def test_rate_limit_exception_format(self, mock_get_settings):
        """Test rate limit exception formatting."""
        # This test would require actual rate limiting implementation
        # For now, we test the exception class itself
        from app.core.exceptions import RateLimitException
        
        exception = RateLimitException(
            limit=100,
            window=3600,
            retry_after=1800
        )
        
        assert exception.status_code == 429
        assert exception.error_code == "RATE_LIMIT_EXCEEDED"
        assert "Rate limit exceeded" in exception.message
        assert exception.details["limit"] == 100
        assert exception.details["window"] == 3600
        assert exception.details["retry_after"] == 1800