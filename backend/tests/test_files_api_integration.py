"""
Integration tests for file upload API endpoints.
"""

import pytest
import tempfile
import os
from io import BytesIO
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import get_db, Base
from app.models.application import Application
from app.models.file import File


class TestFilesAPIIntegration:
    """Integration tests for files API endpoints."""
    
    @pytest.fixture(scope="function")
    def test_db(self):
        """Create test database."""
        # Use in-memory SQLite for testing
        engine = create_engine("sqlite:///:memory:", echo=False)
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        def override_get_db():
            try:
                db = TestingSessionLocal()
                yield db
            finally:
                db.close()
        
        app.dependency_overrides[get_db] = override_get_db
        
        yield TestingSessionLocal()
        
        # Clean up
        app.dependency_overrides.clear()
    
    @pytest.fixture
    def client(self, test_db):
        """Create test client."""
        return TestClient(app)
    
    @pytest.fixture
    def temp_upload_dir(self):
        """Create temporary upload directory."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Mock the upload directory setting
            with pytest.MonkeyPatch().context() as m:
                m.setenv("UPLOAD_DIR", temp_dir)
                yield temp_dir
    
    @pytest.fixture
    def test_application(self, test_db):
        """Create test application in database."""
        application = Application(
            reference_number="TEST123",
            first_name="John",
            last_name="Doe",
            email="john.doe@example.com",
            phone="1234567890",
            date_of_birth="1990-01-01",
            nationality="US",
            passport_number="P123456789",
            student_id="STU123456",
            university_name="Test University",
            course_name="Computer Science",
            course_duration=4,
            course_start_date="2024-09-01",
            course_end_date="2028-06-30",
            tuition_fee=50000.00,
            living_expenses=20000.00,
            sponsor_name="Parent",
            sponsor_relationship="Father",
            sponsor_income=100000.00,
            status="draft"
        )
        
        test_db.add(application)
        test_db.commit()
        test_db.refresh(application)
        
        return application
    
    @pytest.fixture
    def valid_jpeg_data(self):
        """Create valid JPEG file data."""
        # JPEG file signature + minimal data
        return b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00' + b'\x00' * 1000
    
    @pytest.fixture
    def valid_png_data(self):
        """Create valid PNG file data."""
        # PNG file signature + minimal data
        return b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde' + b'\x00' * 1000
    
    @pytest.fixture
    def valid_pdf_data(self):
        """Create valid PDF file data."""
        # PDF file signature + minimal data
        return b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n' + b'\x00' * 1000
    
    def test_upload_file_valid_jpeg(self, client, test_application, valid_jpeg_data, temp_upload_dir):
        """Test uploading a valid JPEG file."""
        files = {
            "file": ("test.jpg", BytesIO(valid_jpeg_data), "image/jpeg")
        }
        data = {
            "file_type": "student_id",
            "application_id": test_application.id
        }
        
        response = client.post("/api/v1/files/upload", files=files, data=data)
        
        assert response.status_code == 201
        result = response.json()
        
        assert result["success"] is True
        assert result["file_type"] == "student_id"
        assert result["original_filename"] == "test.jpg"
        assert result["mime_type"] == "image/jpeg"
        assert result["file_size"] > 0
        assert "file_hash" in result
        assert "id" in result
    
    def test_upload_file_valid_png(self, client, test_application, valid_png_data, temp_upload_dir):
        """Test uploading a valid PNG file."""
        files = {
            "file": ("test.png", BytesIO(valid_png_data), "image/png")
        }
        data = {
            "file_type": "passport",
            "application_id": test_application.id
        }
        
        response = client.post("/api/v1/files/upload", files=files, data=data)
        
        assert response.status_code == 201
        result = response.json()
        
        assert result["success"] is True
        assert result["file_type"] == "passport"
        assert result["original_filename"] == "test.png"
        assert result["mime_type"] == "image/png"
    
    def test_upload_file_valid_pdf(self, client, test_application, valid_pdf_data, temp_upload_dir):
        """Test uploading a valid PDF file."""
        files = {
            "file": ("test.pdf", BytesIO(valid_pdf_data), "application/pdf")
        }
        data = {
            "file_type": "student_id",
            "application_id": test_application.id
        }
        
        response = client.post("/api/v1/files/upload", files=files, data=data)
        
        assert response.status_code == 201
        result = response.json()
        
        assert result["success"] is True
        assert result["file_type"] == "student_id"
        assert result["original_filename"] == "test.pdf"
        assert result["mime_type"] == "application/pdf"
    
    def test_upload_file_without_application_id(self, client, valid_jpeg_data, temp_upload_dir):
        """Test uploading a file without application ID."""
        files = {
            "file": ("test.jpg", BytesIO(valid_jpeg_data), "image/jpeg")
        }
        data = {
            "file_type": "student_id"
        }
        
        response = client.post("/api/v1/files/upload", files=files, data=data)
        
        assert response.status_code == 201
        result = response.json()
        
        assert result["success"] is True
        assert result["file_type"] == "student_id"
    
    def test_upload_file_invalid_application_id(self, client, valid_jpeg_data, temp_upload_dir):
        """Test uploading a file with invalid application ID."""
        files = {
            "file": ("test.jpg", BytesIO(valid_jpeg_data), "image/jpeg")
        }
        data = {
            "file_type": "student_id",
            "application_id": "nonexistent-id"
        }
        
        response = client.post("/api/v1/files/upload", files=files, data=data)
        
        assert response.status_code == 404
        result = response.json()
        
        assert result["success"] is False
        assert "not found" in result["message"].lower()
    
    def test_upload_file_oversized(self, client, temp_upload_dir):
        """Test uploading an oversized file."""
        # Create file larger than 5MB
        large_data = b'\xff\xd8\xff\xe0\x00\x10JFIF' + b'\x00' * (6 * 1024 * 1024)
        
        files = {
            "file": ("large.jpg", BytesIO(large_data), "image/jpeg")
        }
        data = {
            "file_type": "student_id"
        }
        
        response = client.post("/api/v1/files/upload", files=files, data=data)
        
        assert response.status_code == 400
        result = response.json()
        
        assert result["success"] is False
        assert "exceeds maximum allowed size" in result["message"]
    
    def test_upload_file_invalid_type(self, client, temp_upload_dir):
        """Test uploading a file with invalid type."""
        files = {
            "file": ("test.txt", BytesIO(b"text content"), "text/plain")
        }
        data = {
            "file_type": "student_id"
        }
        
        response = client.post("/api/v1/files/upload", files=files, data=data)
        
        assert response.status_code == 400
        result = response.json()
        
        assert result["success"] is False
        assert "not allowed" in result["message"]
    
    def test_upload_file_malicious_content(self, client, temp_upload_dir):
        """Test uploading a file with malicious content."""
        # JPEG with script tag
        malicious_data = b'\xff\xd8\xff\xe0\x00\x10JFIF<script>alert("xss")</script>'
        
        files = {
            "file": ("malicious.jpg", BytesIO(malicious_data), "image/jpeg")
        }
        data = {
            "file_type": "student_id"
        }
        
        response = client.post("/api/v1/files/upload", files=files, data=data)
        
        assert response.status_code == 400
        result = response.json()
        
        assert result["success"] is False
        assert "malware" in result["message"].lower() or "suspicious" in result["message"].lower()
    
    def test_upload_file_signature_mismatch(self, client, temp_upload_dir):
        """Test uploading a file with mismatched signature."""
        # PNG data with JPEG content type
        png_data = b'\x89PNG\r\n\x1a\n' + b'\x00' * 1000
        
        files = {
            "file": ("fake.jpg", BytesIO(png_data), "image/jpeg")
        }
        data = {
            "file_type": "student_id"
        }
        
        response = client.post("/api/v1/files/upload", files=files, data=data)
        
        assert response.status_code == 400
        result = response.json()
        
        assert result["success"] is False
        assert "signature" in result["message"].lower() or "type" in result["message"].lower()
    
    def test_get_file_info_success(self, client, test_db, test_application, valid_jpeg_data, temp_upload_dir):
        """Test getting file information."""
        # First upload a file
        files = {
            "file": ("test.jpg", BytesIO(valid_jpeg_data), "image/jpeg")
        }
        data = {
            "file_type": "student_id",
            "application_id": test_application.id
        }
        
        upload_response = client.post("/api/v1/files/upload", files=files, data=data)
        assert upload_response.status_code == 201
        file_id = upload_response.json()["id"]
        
        # Get file info
        response = client.get(f"/api/v1/files/{file_id}")
        
        assert response.status_code == 200
        result = response.json()
        
        assert result["id"] == file_id
        assert result["file_type"] == "student_id"
        assert result["original_filename"] == "test.jpg"
        assert result["mime_type"] == "image/jpeg"
        assert "created_at" in result
    
    def test_get_file_info_not_found(self, client):
        """Test getting info for non-existent file."""
        response = client.get("/api/v1/files/nonexistent-id")
        
        assert response.status_code == 404
        result = response.json()
        
        assert result["success"] is False
        assert "not found" in result["message"].lower()
    
    def test_list_files_empty(self, client):
        """Test listing files when none exist."""
        response = client.get("/api/v1/files/")
        
        assert response.status_code == 200
        result = response.json()
        
        assert result["success"] is True
        assert result["files"] == []
    
    def test_list_files_with_data(self, client, test_db, test_application, valid_jpeg_data, temp_upload_dir):
        """Test listing files with uploaded data."""
        # Upload a file
        files = {
            "file": ("test.jpg", BytesIO(valid_jpeg_data), "image/jpeg")
        }
        data = {
            "file_type": "student_id",
            "application_id": test_application.id
        }
        
        upload_response = client.post("/api/v1/files/upload", files=files, data=data)
        assert upload_response.status_code == 201
        
        # List files
        response = client.get("/api/v1/files/")
        
        assert response.status_code == 200
        result = response.json()
        
        assert result["success"] is True
        assert len(result["files"]) == 1
        assert result["files"][0]["file_type"] == "student_id"
        assert result["files"][0]["original_filename"] == "test.jpg"
    
    def test_list_files_with_filters(self, client, test_db, test_application, valid_jpeg_data, temp_upload_dir):
        """Test listing files with filters."""
        # Upload files of different types
        files1 = {
            "file": ("student.jpg", BytesIO(valid_jpeg_data), "image/jpeg")
        }
        data1 = {
            "file_type": "student_id",
            "application_id": test_application.id
        }
        
        files2 = {
            "file": ("passport.jpg", BytesIO(valid_jpeg_data), "image/jpeg")
        }
        data2 = {
            "file_type": "passport",
            "application_id": test_application.id
        }
        
        client.post("/api/v1/files/upload", files=files1, data=data1)
        client.post("/api/v1/files/upload", files=files2, data=data2)
        
        # Filter by file type
        response = client.get(f"/api/v1/files/?file_type=student_id")
        
        assert response.status_code == 200
        result = response.json()
        
        assert result["success"] is True
        assert len(result["files"]) == 1
        assert result["files"][0]["file_type"] == "student_id"
        
        # Filter by application ID
        response = client.get(f"/api/v1/files/?application_id={test_application.id}")
        
        assert response.status_code == 200
        result = response.json()
        
        assert result["success"] is True
        assert len(result["files"]) == 2
    
    def test_delete_file_success(self, client, test_db, test_application, valid_jpeg_data, temp_upload_dir):
        """Test successful file deletion."""
        # Upload a file
        files = {
            "file": ("test.jpg", BytesIO(valid_jpeg_data), "image/jpeg")
        }
        data = {
            "file_type": "student_id",
            "application_id": test_application.id
        }
        
        upload_response = client.post("/api/v1/files/upload", files=files, data=data)
        assert upload_response.status_code == 201
        file_id = upload_response.json()["id"]
        
        # Delete the file
        response = client.delete(f"/api/v1/files/{file_id}")
        
        assert response.status_code == 200
        result = response.json()
        
        assert result["success"] is True
        assert result["file_id"] == file_id
        assert "deleted successfully" in result["message"]
        
        # Verify file is gone
        get_response = client.get(f"/api/v1/files/{file_id}")
        assert get_response.status_code == 404
    
    def test_delete_file_not_found(self, client):
        """Test deletion of non-existent file."""
        response = client.delete("/api/v1/files/nonexistent-id")
        
        assert response.status_code == 404
        result = response.json()
        
        assert result["success"] is False
        assert "not found" in result["message"].lower()
    
    def test_verify_file_integrity_success(self, client, test_db, test_application, valid_jpeg_data, temp_upload_dir):
        """Test successful file integrity verification."""
        # Upload a file
        files = {
            "file": ("test.jpg", BytesIO(valid_jpeg_data), "image/jpeg")
        }
        data = {
            "file_type": "student_id",
            "application_id": test_application.id
        }
        
        upload_response = client.post("/api/v1/files/upload", files=files, data=data)
        assert upload_response.status_code == 201
        file_id = upload_response.json()["id"]
        
        # Verify integrity
        response = client.post(f"/api/v1/files/{file_id}/verify")
        
        assert response.status_code == 200
        result = response.json()
        
        assert result["file_id"] == file_id
        assert result["integrity_valid"] is True
        assert "verified" in result["message"]
    
    def test_verify_file_integrity_not_found(self, client):
        """Test integrity verification for non-existent file."""
        response = client.post("/api/v1/files/nonexistent-id/verify")
        
        assert response.status_code == 404
    
    def test_get_validation_rules(self, client):
        """Test getting file validation rules."""
        response = client.get("/api/v1/files/validation/rules")
        
        assert response.status_code == 200
        result = response.json()
        
        assert "max_size" in result
        assert "allowed_types" in result
        assert result["max_size"] > 0
        assert len(result["allowed_types"]) > 0
        assert "image/jpeg" in result["allowed_types"]
        assert "image/png" in result["allowed_types"]
        assert "application/pdf" in result["allowed_types"]