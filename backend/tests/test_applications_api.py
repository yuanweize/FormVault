"""
Integration tests for application API endpoints.

This module tests the application creation, validation, and audit logging
functionality of the FormVault Insurance Portal API.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date, datetime
from unittest.mock import patch, MagicMock
import json

from app.main import app
from app.database import Base, get_db
from app.models.application import Application
from app.models.file import File
from app.models.audit_log import AuditLog

# Test database setup
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def db_session():
    """Create a test database session."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def sample_application_data():
    """Sample application data for testing."""
    return {
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
    }


@pytest.fixture
def sample_file(db_session):
    """Create a sample file for testing."""
    file_obj = File(
        id="test-file-id-123",
        file_type="student_id",
        original_filename="student_id.jpg",
        stored_filename="stored_student_id.jpg",
        file_size=1024000,
        mime_type="image/jpeg",
        file_hash="abc123hash",
        upload_ip="192.168.1.1",
    )
    db_session.add(file_obj)
    db_session.commit()
    db_session.refresh(file_obj)
    return file_obj


class TestApplicationCreation:
    """Test cases for application creation endpoint."""

    def test_create_application_success(
        self, client, db_session, sample_application_data
    ):
        """Test successful application creation."""
        response = client.post("/api/v1/applications/", json=sample_application_data)

        assert response.status_code == 201
        data = response.json()

        # Verify response structure
        assert "id" in data
        assert "reference_number" in data
        assert data["personal_info"]["first_name"] == "John"
        assert data["personal_info"]["last_name"] == "Doe"
        assert data["personal_info"]["email"] == "john.doe@example.com"
        assert data["insurance_type"] == "health"
        assert data["status"] == "draft"
        assert data["message"] == "Application created successfully"
        assert "created_at" in data
        assert "updated_at" in data

        # Verify reference number format
        assert data["reference_number"].startswith("FV-")
        assert len(data["reference_number"]) == 16

        # Verify database record was created
        application = (
            db_session.query(Application).filter(Application.id == data["id"]).first()
        )
        assert application is not None
        assert application.first_name == "John"
        assert application.last_name == "Doe"
        assert application.email == "john.doe@example.com"
        assert application.status == "draft"

        # Verify audit log was created
        audit_log = (
            db_session.query(AuditLog)
            .filter(
                AuditLog.application_id == data["id"],
                AuditLog.action == "application.created",
            )
            .first()
        )
        assert audit_log is not None
        assert audit_log.details["reference_number"] == data["reference_number"]
        assert audit_log.details["insurance_type"] == "health"
        assert audit_log.details["email"] == "john.doe@example.com"

    def test_create_application_with_files(
        self, client, db_session, sample_application_data, sample_file
    ):
        """Test application creation with file attachments."""
        # Add file reference to application data
        sample_application_data["student_id_file_id"] = sample_file.id

        response = client.post("/api/v1/applications/", json=sample_application_data)

        assert response.status_code == 201
        data = response.json()

        # Verify file is included in response
        assert len(data["files"]) == 1
        assert data["files"][0]["id"] == sample_file.id
        assert data["files"][0]["file_type"] == "student_id"
        assert data["files"][0]["original_filename"] == "student_id.jpg"

        # Verify file is linked to application in database
        db_session.refresh(sample_file)
        assert sample_file.application_id == data["id"]

        # Verify audit log includes file count
        audit_log = (
            db_session.query(AuditLog)
            .filter(
                AuditLog.application_id == data["id"],
                AuditLog.action == "application.created",
            )
            .first()
        )
        assert audit_log.details["files_attached"] == 1

    def test_create_application_invalid_file_reference(
        self, client, db_session, sample_application_data
    ):
        """Test application creation with invalid file reference."""
        # Add invalid file reference
        sample_application_data["student_id_file_id"] = "invalid-file-id"

        response = client.post("/api/v1/applications/", json=sample_application_data)

        assert response.status_code == 422
        data = response.json()
        assert "error" in data
        assert "Invalid student ID file reference" in data["error"]["message"]

        # Verify no application was created
        applications = db_session.query(Application).all()
        assert len(applications) == 0

    def test_create_application_validation_errors(self, client, db_session):
        """Test application creation with validation errors."""
        invalid_data = {
            "personal_info": {
                "first_name": "",  # Empty name
                "last_name": "Doe",
                "email": "invalid-email",  # Invalid email
                "address": {
                    "street": "123 Main St",
                    "city": "Anytown",
                    "state": "CA",
                    "zip_code": "12345",
                    "country": "USA",
                },
                "date_of_birth": "2010-01-01",  # Too young
            },
            "insurance_type": "invalid_type",  # Invalid insurance type
            "preferred_language": "en",
        }

        response = client.post("/api/v1/applications/", json=invalid_data)

        assert response.status_code == 422
        data = response.json()
        assert "error" in data
        assert "details" in data["error"]

        # Verify no application was created
        applications = db_session.query(Application).all()
        assert len(applications) == 0

    def test_create_application_missing_required_fields(self, client, db_session):
        """Test application creation with missing required fields."""
        incomplete_data = {
            "personal_info": {
                "first_name": "John",
                # Missing last_name, email, address, date_of_birth
            },
            "insurance_type": "health",
        }

        response = client.post("/api/v1/applications/", json=incomplete_data)

        assert response.status_code == 422
        data = response.json()
        assert "error" in data

        # Verify no application was created
        applications = db_session.query(Application).all()
        assert len(applications) == 0

    def test_create_application_duplicate_email_handling(
        self, client, db_session, sample_application_data
    ):
        """Test handling of duplicate email addresses."""
        # Create first application
        response1 = client.post("/api/v1/applications/", json=sample_application_data)
        assert response1.status_code == 201

        # Try to create second application with same email
        response2 = client.post("/api/v1/applications/", json=sample_application_data)

        # Should still succeed as email uniqueness is not enforced at application level
        # (same person can have multiple applications)
        assert response2.status_code == 201

        # Verify both applications exist
        applications = db_session.query(Application).all()
        assert len(applications) == 2

    @patch("app.utils.db_helpers.create_audit_log")
    def test_create_application_audit_log_failure(
        self, mock_audit_log, client, db_session, sample_application_data
    ):
                """Test application creation when audit logging fails."""
        # Mock audit log creation to return None (failure)
        mock_audit_log.return_value = None

        response = client.post("/api/v1/applications/", json=sample_application_data)

        # Application should still be created even if audit logging fails
        assert response.status_code == 201
        data = response.json()

        # Verify application was created
        application = (
            db_session.query(Application).filter(Application.id == data["id"]).first()
        )
        assert application is not None

    def test_create_application_request_headers_logging(
        self, client, db_session, sample_application_data
    ):
        """Test that request headers are properly logged in audit trail."""
        headers = {"User-Agent": "TestClient/1.0", "X-Forwarded-For": "192.168.1.100"}

        response = client.post(
            "/api/v1/applications/", json=sample_application_data, headers=headers
        )

        assert response.status_code == 201
        data = response.json()

        # Verify audit log captures user agent
        audit_log = (
            db_session.query(AuditLog)
            .filter(
                AuditLog.application_id == data["id"],
                AuditLog.action == "application.created",
            )
            .first()
        )
        assert audit_log is not None
        assert audit_log.user_agent == "TestClient/1.0"

    def test_create_application_phone_validation(
        self, client, db_session, sample_application_data
    ):
        """Test phone number validation."""
        # Test valid phone numbers
        valid_phones = ["+1234567890", "123-456-7890", "(123) 456-7890", None]

        for phone in valid_phones:
            sample_application_data["personal_info"]["phone"] = phone
            sample_application_data["personal_info"][
                "email"
            ] = f"test{phone or 'none'}@example.com"

            response = client.post(
                "/api/v1/applications/", json=sample_application_data
            )
            assert response.status_code == 201

        # Test invalid phone numbers
        invalid_phones = ["123", "abc", "123-abc-7890"]

        for phone in invalid_phones:
            sample_application_data["personal_info"]["phone"] = phone
            sample_application_data["personal_info"][
                "email"
            ] = f"invalid{phone}@example.com"

            response = client.post(
                "/api/v1/applications/", json=sample_application_data
            )
            assert response.status_code == 422

    def test_create_application_age_validation(
        self, client, db_session, sample_application_data
    ):
        """Test age validation for date of birth."""
        # Test valid age (18+)
        sample_application_data["personal_info"]["date_of_birth"] = "2000-01-01"
        response = client.post("/api/v1/applications/", json=sample_application_data)
        assert response.status_code == 201

        # Test invalid age (under 18)
        sample_application_data["personal_info"]["date_of_birth"] = "2010-01-01"
        sample_application_data["personal_info"]["email"] = "underage@example.com"
        response = client.post("/api/v1/applications/", json=sample_application_data)
        assert response.status_code == 422

        # Test invalid age (too old)
        sample_application_data["personal_info"]["date_of_birth"] = "1900-01-01"
        sample_application_data["personal_info"]["email"] = "tooold@example.com"
        response = client.post("/api/v1/applications/", json=sample_application_data)
        assert response.status_code == 422


class TestApplicationCreationErrorHandling:
    """Test cases for error handling in application creation."""

    @patch("app.models.application.Application")
    def test_database_error_handling(
        self, mock_application, client, sample_application_data
    ):
        """Test handling of database errors during application creation."""
        # Mock database error
        mock_application.side_effect = Exception("Database connection failed")

        response = client.post("/api/v1/applications/", json=sample_application_data)

        assert response.status_code == 500
        data = response.json()
        assert "error" in data
        assert "An unexpected error occurred" in data["error"]["message"]

    def test_malformed_json_request(self, client):
        """Test handling of malformed JSON requests."""
        response = client.post(
            "/api/v1/applications/",
            data="invalid json",
            headers={"Content-Type": "application/json"},
        )

        assert response.status_code == 422

    def test_empty_request_body(self, client):
        """Test handling of empty request body."""
        response = client.post("/api/v1/applications/", json={})

        assert response.status_code == 422
        data = response.json()
        assert "error" in data


class TestApplicationCreationPerformance:
    """Test cases for performance aspects of application creation."""

    def test_create_multiple_applications_concurrently(self, client, db_session):
        """Test creating multiple applications to verify no race conditions."""
        import concurrent.futures
        import threading

        def create_application(index):
            data = {
                "personal_info": {
                    "first_name": f"User{index}",
                    "last_name": "Test",
                    "email": f"user{index}@example.com",
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
            }
            return client.post("/api/v1/applications/", json=data)

        # Create 5 applications concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(create_application, i) for i in range(5)]
            responses = [
                future.result() for future in concurrent.futures.as_completed(futures)
            ]

        # Verify all applications were created successfully
        success_count = sum(1 for response in responses if response.status_code == 201)
        assert success_count == 5

        # Verify all applications are in database
        applications = db_session.query(Application).all()
        assert len(applications) == 5

        # Verify all reference numbers are unique
        ref_numbers = [app.reference_number for app in applications]
        assert len(set(ref_numbers)) == 5

