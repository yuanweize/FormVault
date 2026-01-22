"""
Unit tests for email export API endpoints.

Tests the email export functionality including endpoint validation,
error handling, and integration with email service.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.main import app
from app.models.application import Application
from app.models.email_export import EmailExport
from app.schemas.email_export import EmailExportRequestSchema


class TestEmailExportAPI:
    """Test cases for email export API endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)
    
    @pytest.fixture
    def mock_db_session(self):
        """Create mock database session."""
        return Mock(spec=Session)
    
    @pytest.fixture
    def sample_application_data(self):
        """Create sample application data."""
        return {
            "id": str(uuid.uuid4()),
            "reference_number": "FV-20241217-TEST",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "phone": "+1234567890",
            "insurance_type": "health",
            "status": "submitted",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "files": []
        }
    
    @pytest.fixture
    def sample_application(self, sample_application_data):
        """Create sample application instance."""
        app = Mock(spec=Application)
        for key, value in sample_application_data.items():
            setattr(app, key, value)
        app.full_name = "John Doe"
        app.full_address = "123 Main St, Anytown, CA 12345"
        return app
    
    def test_email_export_request_schema_validation(self):
        """Test email export request schema validation."""
        # Valid request
        valid_data = {
            "recipient_email": "insurance@company.com",
            "insurance_company": "Test Insurance Co",
            "additional_notes": "Please process urgently"
        }
        
        schema = EmailExportRequestSchema(**valid_data)
        assert schema.recipient_email == "insurance@company.com"
        assert schema.insurance_company == "Test Insurance Co"
        assert schema.additional_notes == "Please process urgently"
    
    def test_email_export_request_schema_invalid_email(self):
        """Test email export request schema with invalid email."""
        invalid_data = {
            "recipient_email": "invalid-email",
            "insurance_company": "Test Insurance Co"
        }
        
        with pytest.raises(ValueError):
            EmailExportRequestSchema(**invalid_data)
    
    def test_email_export_request_schema_optional_fields(self):
        """Test email export request schema with optional fields."""
        minimal_data = {
            "recipient_email": "insurance@company.com"
        }
        
        schema = EmailExportRequestSchema(**minimal_data)
        assert schema.recipient_email == "insurance@company.com"
        assert schema.insurance_company is None
        assert schema.additional_notes is None
    
    def test_email_export_request_schema_empty_strings(self):
        """Test email export request schema handles empty strings."""
        data_with_empty_strings = {
            "recipient_email": "insurance@company.com",
            "insurance_company": "   ",  # Whitespace only
            "additional_notes": ""  # Empty string
        }
        
        schema = EmailExportRequestSchema(**data_with_empty_strings)
        assert schema.insurance_company is None
        assert schema.additional_notes is None
    
    @patch('app.api.v1.endpoints.applications.get_db')
    @patch('app.api.v1.endpoints.applications.email_service')
    def test_export_application_success(
        self, 
        mock_email_service, 
        mock_get_db, 
        client, 
        mock_db_session, 
        sample_application
    ):
        """Test successful application export."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_db_session.query.return_value.filter.return_value.first.return_value = sample_application
        mock_email_service.send_application_export = AsyncMock(return_value=True)
        
        # Mock email export creation
        mock_export = Mock(spec=EmailExport)
        mock_export.id = str(uuid.uuid4())
        mock_export.application_id = sample_application.id
        mock_export.recipient_email = "insurance@company.com"
        mock_export.insurance_company = "Test Insurance Co"
        mock_export.status = "sent"
        mock_export.sent_at = datetime.utcnow()
        mock_export.created_at = datetime.utcnow()
        mock_export.is_sent = True
        mock_export.mark_as_sent = Mock()
        
        # Request data
        request_data = {
            "recipient_email": "insurance@company.com",
            "insurance_company": "Test Insurance Co",
            "additional_notes": "Please process urgently"
        }
        
        # Make request
        response = client.post(
            f"/api/v1/applications/{sample_application.id}/export",
            json=request_data
        )
        
        # Verify response
        assert response.status_code == 201
        response_data = response.json()
        assert "export_id" in response_data
        assert response_data["application_id"] == sample_application.id
        assert response_data["recipient_email"] == "insurance@company.com"
        assert response_data["status"] in ["sent", "pending"]
    
    @patch('app.api.v1.endpoints.applications.get_db')
    def test_export_application_not_found(self, mock_get_db, client, mock_db_session):
        """Test export fails when application not found."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_db_session.query.return_value.filter.return_value.first.return_value = None
        
        request_data = {
            "recipient_email": "insurance@company.com"
        }
        
        # Make request
        response = client.post(
            "/api/v1/applications/nonexistent-id/export",
            json=request_data
        )
        
        # Verify response
        assert response.status_code == 404
        response_data = response.json()
        assert "APPLICATION_NOT_FOUND" in response_data.get("error", {}).get("code", "")
    
    @patch('app.api.v1.endpoints.applications.get_db')
    def test_export_application_invalid_status(
        self, 
        mock_get_db, 
        client, 
        mock_db_session, 
        sample_application
    ):
        """Test export fails when application has invalid status."""
        # Setup mocks
        sample_application.status = "processed"  # Invalid status for export
        mock_get_db.return_value = mock_db_session
        mock_db_session.query.return_value.filter.return_value.first.return_value = sample_application
        
        request_data = {
            "recipient_email": "insurance@company.com"
        }
        
        # Make request
        response = client.post(
            f"/api/v1/applications/{sample_application.id}/export",
            json=request_data
        )
        
        # Verify response
        assert response.status_code == 422
        response_data = response.json()
        assert "cannot be exported" in response_data.get("error", {}).get("message", "")
    
    def test_export_application_invalid_email(self, client):
        """Test export fails with invalid email address."""
        request_data = {
            "recipient_email": "invalid-email-format"
        }
        
        # Make request
        response = client.post(
            "/api/v1/applications/test-id/export",
            json=request_data
        )
        
        # Verify response
        assert response.status_code == 422
    
    def test_export_application_missing_email(self, client):
        """Test export fails when recipient email is missing."""
        request_data = {
            "insurance_company": "Test Insurance Co"
        }
        
        # Make request
        response = client.post(
            "/api/v1/applications/test-id/export",
            json=request_data
        )
        
        # Verify response
        assert response.status_code == 422
    
    @patch('app.api.v1.endpoints.applications.get_db')
    @patch('app.api.v1.endpoints.applications.email_service')
    def test_export_application_email_service_failure(
        self, 
        mock_email_service, 
        mock_get_db, 
        client, 
        mock_db_session, 
        sample_application
    ):
        """Test export handles email service failures."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_db_session.query.return_value.filter.return_value.first.return_value = sample_application
        
        # Mock email service failure
        from app.core.exceptions import EmailServiceException
        mock_email_service.send_application_export = AsyncMock(
            side_effect=EmailServiceException("SMTP connection failed")
        )
        
        # Mock email export creation
        mock_export = Mock(spec=EmailExport)
        mock_export.id = str(uuid.uuid4())
        mock_export.mark_for_retry = Mock()
        mock_export.mark_as_failed = Mock()
        
        request_data = {
            "recipient_email": "insurance@company.com"
        }
        
        # Make request
        response = client.post(
            f"/api/v1/applications/{sample_application.id}/export",
            json=request_data
        )
        
        # Should still return 201 but with retry status
        assert response.status_code == 201
        response_data = response.json()
        assert "export_id" in response_data
    
    @patch('app.api.v1.endpoints.applications.get_db')
    def test_get_export_history_success(
        self, 
        mock_get_db, 
        client, 
        mock_db_session, 
        sample_application
    ):
        """Test successful retrieval of export history."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        
        # Mock application query
        mock_db_session.query.return_value.filter.return_value.first.return_value = sample_application
        
        # Mock export history
        mock_exports = [
            Mock(
                id=str(uuid.uuid4()),
                status="sent",
                sent_at=datetime.utcnow(),
                error_message=None,
                retry_count=0,
                created_at=datetime.utcnow(),
                is_sent=True,
                is_failed=False,
                is_pending=False,
                needs_retry=False
            ),
            Mock(
                id=str(uuid.uuid4()),
                status="failed",
                sent_at=None,
                error_message="SMTP connection failed",
                retry_count=3,
                created_at=datetime.utcnow(),
                is_sent=False,
                is_failed=True,
                is_pending=False,
                needs_retry=False
            )
        ]
        
        # Setup query chain for exports
        mock_db_session.query.return_value.filter.return_value.order_by.return_value.all.return_value = mock_exports
        
        # Make request
        response = client.get(f"/api/v1/applications/{sample_application.id}/export-history")
        
        # Verify response
        assert response.status_code == 200
        response_data = response.json()
        assert response_data["application_id"] == sample_application.id
        assert response_data["total_exports"] == 2
        assert response_data["successful_exports"] == 1
        assert response_data["failed_exports"] == 1
        assert response_data["pending_exports"] == 0
        assert len(response_data["exports"]) == 2
    
    @patch('app.api.v1.endpoints.applications.get_db')
    def test_get_export_history_application_not_found(
        self, 
        mock_get_db, 
        client, 
        mock_db_session
    ):
        """Test export history fails when application not found."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_db_session.query.return_value.filter.return_value.first.return_value = None
        
        # Make request
        response = client.get("/api/v1/applications/nonexistent-id/export-history")
        
        # Verify response
        assert response.status_code == 404
        response_data = response.json()
        assert "APPLICATION_NOT_FOUND" in response_data.get("error", {}).get("code", "")
    
    @patch('app.api.v1.endpoints.applications.get_db')
    def test_get_export_history_empty(
        self, 
        mock_get_db, 
        client, 
        mock_db_session, 
        sample_application
    ):
        """Test export history with no exports."""
        # Setup mocks
        mock_get_db.return_value = mock_db_session
        mock_db_session.query.return_value.filter.return_value.first.return_value = sample_application
        mock_db_session.query.return_value.filter.return_value.order_by.return_value.all.return_value = []
        
        # Make request
        response = client.get(f"/api/v1/applications/{sample_application.id}/export-history")
        
        # Verify response
        assert response.status_code == 200
        response_data = response.json()
        assert response_data["application_id"] == sample_application.id
        assert response_data["total_exports"] == 0
        assert response_data["successful_exports"] == 0
        assert response_data["failed_exports"] == 0
        assert response_data["pending_exports"] == 0
        assert len(response_data["exports"]) == 0


class TestEmailExportValidation:
    """Test cases for email export validation logic."""
    
    def test_valid_export_request_data(self):
        """Test validation of valid export request data."""
        valid_requests = [
            {
                "recipient_email": "test@insurance.com",
                "insurance_company": "Test Insurance",
                "additional_notes": "Urgent processing required"
            },
            {
                "recipient_email": "claims@company.co.uk"
            },
            {
                "recipient_email": "support@insurer.org",
                "insurance_company": "Global Insurance Corp"
            }
        ]
        
        for request_data in valid_requests:
            schema = EmailExportRequestSchema(**request_data)
            assert schema.recipient_email is not None
            assert "@" in schema.recipient_email
    
    def test_invalid_export_request_data(self):
        """Test validation of invalid export request data."""
        invalid_requests = [
            {"recipient_email": "not-an-email"},
            {"recipient_email": "@missing-local.com"},
            {"recipient_email": "missing-at-sign.com"},
            {"insurance_company": "Missing email field"},
            {}
        ]
        
        for request_data in invalid_requests:
            with pytest.raises((ValueError, TypeError)):
                EmailExportRequestSchema(**request_data)
    
    def test_export_request_field_limits(self):
        """Test field length limits in export request."""
        # Test insurance company length limit
        long_company_name = "A" * 300  # Exceeds 255 char limit
        
        with pytest.raises(ValueError):
            EmailExportRequestSchema(
                recipient_email="test@example.com",
                insurance_company=long_company_name
            )
        
        # Test additional notes length limit
        long_notes = "A" * 1100  # Exceeds 1000 char limit
        
        with pytest.raises(ValueError):
            EmailExportRequestSchema(
                recipient_email="test@example.com",
                additional_notes=long_notes
            )


if __name__ == "__main__":
    pytest.main([__file__])