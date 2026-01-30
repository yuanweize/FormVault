"""
Integration tests for complete API workflows.
Tests end-to-end scenarios combining multiple API endpoints.
"""

import pytest
import tempfile
import os
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock

from app.main import app
from app.database import get_db
from app.models.application import Application
from app.models.file import File
from app.models.email_export import EmailExport


class TestCompleteApplicationWorkflow:
    """Test complete application submission workflow."""

    def test_complete_application_submission_workflow(
        self, client: TestClient, db: Session
    ):
        """Test complete workflow from form submission to email export."""

        # Step 1: Submit personal information
        application_data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "phone": "+1234567890",
            "address_street": "123 Main St",
            "address_city": "Anytown",
            "address_state": "CA",
            "address_zip_code": "12345",
            "address_country": "USA",
            "date_of_birth": "1990-01-01",
            "insurance_type": "health",
            "preferred_language": "en",
        }

        response = client.post("/api/v1/applications", json=application_data)
        assert response.status_code == 201

        application_response = response.json()
        application_id = application_response["id"]
        assert "reference_number" in application_response

        # Step 2: Upload student ID file
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_file:
            temp_file.write(b"fake student id image content")
            temp_file.flush()

            with open(temp_file.name, "rb") as f:
                files = {"file": ("student_id.jpg", f, "image/jpeg")}
                data = {"file_type": "student_id", "application_id": application_id}

                response = client.post("/api/v1/files/upload", files=files, data=data)
                assert response.status_code == 201

                student_id_response = response.json()
                student_id_file_id = student_id_response["id"]

        os.unlink(temp_file.name)

        # Step 3: Upload passport file
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
            temp_file.write(b"fake passport pdf content")
            temp_file.flush()

            with open(temp_file.name, "rb") as f:
                files = {"file": ("passport.pdf", f, "application/pdf")}
                data = {"file_type": "passport", "application_id": application_id}

                response = client.post("/api/v1/files/upload", files=files, data=data)
                assert response.status_code == 201

                passport_response = response.json()
                passport_file_id = passport_response["id"]

        os.unlink(temp_file.name)

        # Step 4: Verify application has files associated
        response = client.get(f"/api/v1/applications/{application_id}")
        assert response.status_code == 200

        app_details = response.json()
        assert len(app_details["files"]) == 2

        # Step 5: Export application via email
        with patch(
            "app.services.email_service.EmailService.send_application_email"
        ) as mock_send:
            mock_send.return_value = True

            export_data = {
                "recipient_email": "insurance@company.com",
                "insurance_company": "Test Insurance Co",
            }

            response = client.post(
                f"/api/v1/applications/{application_id}/export", json=export_data
            )
            assert response.status_code == 201

            export_response = response.json()
            assert export_response["status"] == "sent"
            assert mock_send.called

        # Step 6: Verify audit logs were created
        response = client.get(
            f"/api/v1/admin/audit-logs?application_id={application_id}"
        )
        assert response.status_code == 200

        audit_logs = response.json()
        assert len(audit_logs) >= 4  # At least: create app, upload files, export

        # Verify database state
        application = (
            db.query(Application).filter(Application.id == application_id).first()
        )
        assert application is not None
        assert application.status == "exported"

        files = db.query(File).filter(File.application_id == application_id).all()
        assert len(files) == 2

        email_export = (
            db.query(EmailExport)
            .filter(EmailExport.application_id == application_id)
            .first()
        )
        assert email_export is not None
        assert email_export.status == "sent"

    def test_workflow_with_validation_errors(self, client: TestClient):
        """Test workflow handles validation errors gracefully."""

        # Submit invalid application data
        invalid_data = {
            "first_name": "",  # Required field empty
            "email": "invalid-email",  # Invalid email format
            "insurance_type": "invalid_type",  # Invalid enum value
        }

        response = client.post("/api/v1/applications", json=invalid_data)
        assert response.status_code == 422

        errors = response.json()["detail"]
        assert any(error["field"] == "first_name" for error in errors)
        assert any(error["field"] == "email" for error in errors)
        assert any(error["field"] == "insurance_type" for error in errors)

    def test_workflow_with_file_upload_errors(self, client: TestClient, db: Session):
        """Test workflow handles file upload errors."""

        # Create valid application first
        application_data = {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@example.com",
            "phone": "+1234567890",
            "address_street": "456 Oak Ave",
            "address_city": "Somewhere",
            "address_state": "NY",
            "address_zip_code": "67890",
            "address_country": "USA",
            "date_of_birth": "1985-05-15",
            "insurance_type": "auto",
            "preferred_language": "en",
        }

        response = client.post("/api/v1/applications", json=application_data)
        assert response.status_code == 201
        application_id = response.json()["id"]

        # Try to upload file that's too large
        large_content = b"x" * (6 * 1024 * 1024)  # 6MB file (exceeds 5MB limit)

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_file:
            temp_file.write(large_content)
            temp_file.flush()

            with open(temp_file.name, "rb") as f:
                files = {"file": ("large_file.jpg", f, "image/jpeg")}
                data = {"file_type": "student_id", "application_id": application_id}

                response = client.post("/api/v1/files/upload", files=files, data=data)
                assert response.status_code == 413  # File too large

        os.unlink(temp_file.name)

        # Try to upload invalid file type
        with tempfile.NamedTemporaryFile(suffix=".exe", delete=False) as temp_file:
            temp_file.write(b"fake executable content")
            temp_file.flush()

            with open(temp_file.name, "rb") as f:
                files = {"file": ("malware.exe", f, "application/octet-stream")}
                data = {"file_type": "passport", "application_id": application_id}

                response = client.post("/api/v1/files/upload", files=files, data=data)
                assert response.status_code == 400  # Invalid file type

        os.unlink(temp_file.name)

    def test_email_export_retry_workflow(self, client: TestClient, db: Session):
        """Test email export retry mechanism."""

        # Create application with files
        application_data = {
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "phone": "+1234567890",
            "address_street": "123 Test St",
            "address_city": "Test City",
            "address_state": "TS",
            "address_zip_code": "12345",
            "address_country": "USA",
            "date_of_birth": "1990-01-01",
            "insurance_type": "health",
            "preferred_language": "en",
        }

        response = client.post("/api/v1/applications", json=application_data)
        application_id = response.json()["id"]

        # Mock email service to fail initially, then succeed
        call_count = 0

        def mock_send_email(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count <= 2:  # Fail first 2 attempts
                raise Exception("SMTP server unavailable")
            return True  # Succeed on 3rd attempt

        with patch(
            "app.services.email_service.EmailService.send_application_email",
            side_effect=mock_send_email,
        ):
            export_data = {
                "recipient_email": "insurance@company.com",
                "insurance_company": "Test Insurance Co",
            }

            # First attempt should fail and schedule retry
            response = client.post(
                f"/api/v1/applications/{application_id}/export", json=export_data
            )
            assert response.status_code == 202  # Accepted for retry

            # Simulate retry service processing
            from app.services.email_retry_service import EmailRetryService

            retry_service = EmailRetryService(db)

            # Process retries (should succeed on 3rd attempt)
            retry_service.process_pending_exports()

            # Verify final status
            email_export = (
                db.query(EmailExport)
                .filter(EmailExport.application_id == application_id)
                .first()
            )
            assert email_export is not None
            assert email_export.status == "sent"
            assert email_export.retry_count == 2


class TestConcurrentOperations:
    """Test concurrent operations and race conditions."""

    def test_concurrent_file_uploads(self, client: TestClient, db: Session):
        """Test concurrent file uploads to same application."""

        # Create application
        application_data = {
            "first_name": "Concurrent",
            "last_name": "Test",
            "email": "concurrent@example.com",
            "phone": "+1234567890",
            "address_street": "123 Concurrent St",
            "address_city": "Test City",
            "address_state": "TS",
            "address_zip_code": "12345",
            "address_country": "USA",
            "date_of_birth": "1990-01-01",
            "insurance_type": "health",
            "preferred_language": "en",
        }

        response = client.post("/api/v1/applications", json=application_data)
        application_id = response.json()["id"]

        # Simulate concurrent uploads
        import threading
        import time

        results = []

        def upload_file(file_type, file_name):
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_file:
                temp_file.write(f"content for {file_name}".encode())
                temp_file.flush()

                with open(temp_file.name, "rb") as f:
                    files = {"file": (file_name, f, "image/jpeg")}
                    data = {"file_type": file_type, "application_id": application_id}

                    response = client.post(
                        "/api/v1/files/upload", files=files, data=data
                    )
                    results.append((file_type, response.status_code))

            os.unlink(temp_file.name)

        # Start concurrent uploads
        thread1 = threading.Thread(
            target=upload_file, args=("student_id", "student1.jpg")
        )
        thread2 = threading.Thread(
            target=upload_file, args=("passport", "passport1.jpg")
        )

        thread1.start()
        thread2.start()

        thread1.join()
        thread2.join()

        # Both uploads should succeed
        assert len(results) == 2
        assert all(status_code == 201 for _, status_code in results)

        # Verify both files are in database
        files = db.query(File).filter(File.application_id == application_id).all()
        assert len(files) == 2
        assert {f.file_type for f in files} == {"student_id", "passport"}


class TestErrorRecovery:
    """Test error recovery and rollback scenarios."""

    def test_database_rollback_on_error(self, client: TestClient, db: Session):
        """Test database rollback when operations fail."""

        with patch("app.models.application.Application") as mock_model:
            # Mock database error during save
            mock_model.side_effect = Exception("Database connection lost")

            application_data = {
                "first_name": "Rollback",
                "last_name": "Test",
                "email": "rollback@example.com",
                "phone": "+1234567890",
                "address_street": "123 Rollback St",
                "address_city": "Test City",
                "address_state": "TS",
                "address_zip_code": "12345",
                "address_country": "USA",
                "date_of_birth": "1990-01-01",
                "insurance_type": "health",
                "preferred_language": "en",
            }

            response = client.post("/api/v1/applications", json=application_data)
            assert response.status_code == 500

            # Verify no partial data was saved
            applications = (
                db.query(Application)
                .filter(Application.email == "rollback@example.com")
                .all()
            )
            assert len(applications) == 0

    def test_file_cleanup_on_upload_failure(self, client: TestClient, db: Session):
        """Test file cleanup when upload processing fails."""

        # Create application
        application_data = {
            "first_name": "Cleanup",
            "last_name": "Test",
            "email": "cleanup@example.com",
            "phone": "+1234567890",
            "address_street": "123 Cleanup St",
            "address_city": "Test City",
            "address_state": "TS",
            "address_zip_code": "12345",
            "address_country": "USA",
            "date_of_birth": "1990-01-01",
            "insurance_type": "health",
            "preferred_language": "en",
        }

        response = client.post("/api/v1/applications", json=application_data)
        application_id = response.json()["id"]

        with patch("app.services.file_storage.FileStorage.save_file") as mock_save:
            # Mock file storage failure
            mock_save.side_effect = Exception("Disk full")

            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_file:
                temp_file.write(b"test content")
                temp_file.flush()

                with open(temp_file.name, "rb") as f:
                    files = {"file": ("test.jpg", f, "image/jpeg")}
                    data = {"file_type": "student_id", "application_id": application_id}

                    response = client.post(
                        "/api/v1/files/upload", files=files, data=data
                    )
                    assert response.status_code == 500

            os.unlink(temp_file.name)

            # Verify no file record was created in database
            db_files = (
                db.query(File).filter(File.application_id == application_id).all()
            )
            assert len(db_files) == 0
