"""
Unit tests for file service functionality.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from io import BytesIO
from datetime import datetime

from fastapi import UploadFile, Request
from sqlalchemy.orm import Session

from app.services.file_service import FileService
from app.models.file import File
from app.models.application import Application
from app.schemas.base import FileType
from app.schemas.file import FileUploadResponseSchema, FileInfoSchema
from app.core.exceptions import (
    FileNotFoundException,
    ApplicationNotFoundException,
    DatabaseException,
    FileUploadException
)


class TestFileService:
    """Test cases for FileService class."""
    
    @pytest.fixture
    def mock_db(self):
        """Create mock database session."""
        return Mock(spec=Session)
    
    @pytest.fixture
    def mock_request(self):
        """Create mock request object."""
        request = Mock(spec=Request)
        request.client.host = "127.0.0.1"
        request.headers = {"user-agent": "test-agent"}
        return request
    
    @pytest.fixture
    def file_service(self):
        """Create FileService instance with mocked storage."""
        with patch('app.services.file_service.file_storage') as mock_storage:
            service = FileService()
            service.storage = mock_storage
            return service, mock_storage
    
    @pytest.fixture
    def valid_upload_file(self):
        """Create a valid upload file for testing."""
        jpeg_data = b'\xff\xd8\xff\xe0\x00\x10JFIF' + b'\x00' * 1000
        file_obj = BytesIO(jpeg_data)
        
        upload_file = UploadFile(
            filename="test.jpg",
            file=file_obj,
            content_type="image/jpeg",
            size=len(jpeg_data)
        )
        return upload_file
    
    @pytest.fixture
    def mock_application(self):
        """Create mock application object."""
        app = Mock(spec=Application)
        app.id = "test-app-id"
        app.reference_number = "REF123"
        return app
    
    @pytest.fixture
    def mock_file_record(self):
        """Create mock file database record."""
        file_record = Mock(spec=File)
        file_record.id = "test-file-id"
        file_record.application_id = "test-app-id"
        file_record.file_type = "student_id"
        file_record.original_filename = "test.jpg"
        file_record.stored_filename = "encrypted_filename.jpg"
        file_record.file_size = 1000
        file_record.mime_type = "image/jpeg"
        file_record.file_hash = "abcdef123456"
        file_record.created_at = datetime.now()
        return file_record
    
    @pytest.mark.asyncio
    async def test_upload_file_success(self, mock_db, mock_request, valid_upload_file, mock_application):
        """Test successful file upload."""
        service, mock_storage = self.file_service()
        
        # Setup mocks
        mock_db.query.return_value.filter.return_value.first.return_value = mock_application
        mock_storage.validate_file.return_value = None
        mock_storage.store_file.return_value = ("encrypted_filename.jpg", "sha256:hash123", 1000)
        
        # Execute upload
        result = await service.upload_file(
            db=mock_db,
            file=valid_upload_file,
            file_type=FileType.student_id,
            application_id="test-app-id",
            request=mock_request
        )
        
        # Verify result
        assert isinstance(result, FileUploadResponseSchema)
        assert result.file_type == FileType.student_id
        assert result.original_filename == "test.jpg"
        assert result.file_size == 1000
        assert result.file_hash == "sha256:hash123"
        assert result.message == "File uploaded successfully"
        
        # Verify database operations
        mock_db.add.assert_called_once()
        mock_db.flush.assert_called_once()
        mock_db.commit.assert_called_once()
        
        # Verify storage operations
        mock_storage.validate_file.assert_called_once_with(valid_upload_file)
        mock_storage.store_file.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_upload_file_without_application_id(self, mock_db, mock_request, valid_upload_file):
        """Test file upload without application ID."""
        service, mock_storage = self.file_service()
        
        # Setup mocks
        mock_storage.validate_file.return_value = None
        mock_storage.store_file.return_value = ("encrypted_filename.jpg", "sha256:hash123", 1000)
        
        # Execute upload
        result = await service.upload_file(
            db=mock_db,
            file=valid_upload_file,
            file_type=FileType.passport,
            application_id=None,
            request=mock_request
        )
        
        # Verify result
        assert isinstance(result, FileUploadResponseSchema)
        assert result.file_type == FileType.passport
        
        # Should not query for application
        mock_db.query.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_upload_file_application_not_found(self, mock_db, mock_request, valid_upload_file):
        """Test file upload with non-existent application ID."""
        service, mock_storage = self.file_service()
        
        # Setup mocks
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_storage.validate_file.return_value = None
        
        # Execute upload and expect exception
        with pytest.raises(ApplicationNotFoundException) as exc_info:
            await service.upload_file(
                db=mock_db,
                file=valid_upload_file,
                file_type=FileType.student_id,
                application_id="nonexistent-id",
                request=mock_request
            )
        
        assert exc_info.value.details["application_id"] == "nonexistent-id"
        mock_db.rollback.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_upload_file_storage_failure(self, mock_db, mock_request, valid_upload_file):
        """Test file upload with storage failure."""
        service, mock_storage = self.file_service()
        
        # Setup mocks
        mock_storage.validate_file.return_value = None
        mock_storage.store_file.side_effect = Exception("Storage failed")
        
        # Execute upload and expect exception
        with pytest.raises(FileUploadException) as exc_info:
            await service.upload_file(
                db=mock_db,
                file=valid_upload_file,
                file_type=FileType.student_id,
                application_id=None,
                request=mock_request
            )
        
        assert "File upload failed" in str(exc_info.value)
        mock_db.rollback.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_upload_file_database_failure(self, mock_db, mock_request, valid_upload_file):
        """Test file upload with database failure."""
        service, mock_storage = self.file_service()
        
        # Setup mocks
        mock_storage.validate_file.return_value = None
        mock_storage.store_file.return_value = ("encrypted_filename.jpg", "sha256:hash123", 1000)
        mock_db.flush.side_effect = Exception("Database error")
        
        # Execute upload and expect exception
        with pytest.raises(DatabaseException) as exc_info:
            await service.upload_file(
                db=mock_db,
                file=valid_upload_file,
                file_type=FileType.student_id,
                application_id=None,
                request=mock_request
            )
        
        assert "Failed to save file metadata" in str(exc_info.value)
        mock_db.rollback.assert_called_once()
        # Should clean up stored file
        mock_storage.delete_file.assert_called_once_with("encrypted_filename.jpg")
    
    def test_get_file_success(self, mock_db, mock_file_record):
        """Test successful file retrieval."""
        service, _ = self.file_service()
        
        # Setup mock
        mock_db.query.return_value.filter.return_value.first.return_value = mock_file_record
        
        # Execute
        result = service.get_file(mock_db, "test-file-id")
        
        # Verify result
        assert isinstance(result, FileInfoSchema)
        assert result.id == "test-file-id"
        assert result.file_type == FileType.student_id
        assert result.original_filename == "test.jpg"
        assert result.file_size == 1000
        assert result.mime_type == "image/jpeg"
    
    def test_get_file_not_found(self, mock_db):
        """Test file retrieval with non-existent file."""
        service, _ = self.file_service()
        
        # Setup mock
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Execute and expect exception
        with pytest.raises(FileNotFoundException) as exc_info:
            service.get_file(mock_db, "nonexistent-id")
        
        assert exc_info.value.details["file_id"] == "nonexistent-id"
    
    def test_list_files_no_filters(self, mock_db, mock_file_record):
        """Test listing files without filters."""
        service, _ = self.file_service()
        
        # Setup mock
        mock_query = Mock()
        mock_db.query.return_value = mock_query
        mock_query.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_file_record]
        
        # Execute
        result = service.list_files(mock_db)
        
        # Verify result
        assert len(result) == 1
        assert isinstance(result[0], FileInfoSchema)
        assert result[0].id == "test-file-id"
        
        # Verify query building
        mock_query.order_by.assert_called_once()
        mock_query.order_by.return_value.offset.assert_called_once_with(0)
        mock_query.order_by.return_value.offset.return_value.limit.assert_called_once_with(100)
    
    def test_list_files_with_filters(self, mock_db, mock_file_record):
        """Test listing files with filters."""
        service, _ = self.file_service()
        
        # Setup mock
        mock_query = Mock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_file_record]
        
        # Execute
        result = service.list_files(
            mock_db,
            application_id="test-app-id",
            file_type=FileType.student_id,
            limit=50,
            offset=10
        )
        
        # Verify result
        assert len(result) == 1
        
        # Verify filters were applied
        assert mock_query.filter.call_count == 2  # application_id and file_type filters
        mock_query.order_by.return_value.offset.assert_called_once_with(10)
        mock_query.order_by.return_value.offset.return_value.limit.assert_called_once_with(50)
    
    def test_delete_file_success(self, mock_db, mock_request, mock_file_record):
        """Test successful file deletion."""
        service, mock_storage = self.file_service()
        
        # Setup mocks
        mock_db.query.return_value.filter.return_value.first.return_value = mock_file_record
        mock_storage.delete_file.return_value = True
        
        # Execute
        result = service.delete_file(mock_db, "test-file-id", mock_request)
        
        # Verify result
        assert result is True
        
        # Verify operations
        mock_storage.delete_file.assert_called_once_with("encrypted_filename.jpg")
        mock_db.delete.assert_called_once_with(mock_file_record)
        mock_db.commit.assert_called_once()
    
    def test_delete_file_not_found(self, mock_db, mock_request):
        """Test deletion of non-existent file."""
        service, _ = self.file_service()
        
        # Setup mock
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Execute and expect exception
        with pytest.raises(FileNotFoundException) as exc_info:
            service.delete_file(mock_db, "nonexistent-id", mock_request)
        
        assert exc_info.value.details["file_id"] == "nonexistent-id"
    
    def test_delete_file_database_error(self, mock_db, mock_request, mock_file_record):
        """Test file deletion with database error."""
        service, mock_storage = self.file_service()
        
        # Setup mocks
        mock_db.query.return_value.filter.return_value.first.return_value = mock_file_record
        mock_storage.delete_file.return_value = True
        mock_db.delete.side_effect = Exception("Database error")
        
        # Execute and expect exception
        with pytest.raises(DatabaseException) as exc_info:
            service.delete_file(mock_db, "test-file-id", mock_request)
        
        assert "Failed to delete file" in str(exc_info.value)
        mock_db.rollback.assert_called_once()
    
    def test_verify_file_integrity_success(self, mock_db, mock_file_record):
        """Test successful file integrity verification."""
        service, mock_storage = self.file_service()
        
        # Setup mocks
        mock_db.query.return_value.filter.return_value.first.return_value = mock_file_record
        mock_storage.verify_file_integrity.return_value = True
        
        # Execute
        result = service.verify_file_integrity(mock_db, "test-file-id")
        
        # Verify result
        assert result is True
        
        # Verify storage call
        mock_storage.verify_file_integrity.assert_called_once_with(
            "encrypted_filename.jpg",
            "sha256:abcdef123456"
        )
    
    def test_verify_file_integrity_file_not_found(self, mock_db):
        """Test file integrity verification with non-existent file."""
        service, _ = self.file_service()
        
        # Setup mock
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Execute and expect exception
        with pytest.raises(FileNotFoundException):
            service.verify_file_integrity(mock_db, "nonexistent-id")
    
    def test_get_file_path_success(self, mock_db, mock_file_record):
        """Test successful file path retrieval."""
        service, mock_storage = self.file_service()
        
        # Setup mocks
        mock_db.query.return_value.filter.return_value.first.return_value = mock_file_record
        mock_storage.get_file_path.return_value = "/path/to/file.jpg"
        
        # Execute
        result = service.get_file_path(mock_db, "test-file-id")
        
        # Verify result
        assert result == "/path/to/file.jpg"
        
        # Verify storage call
        mock_storage.get_file_path.assert_called_once_with("encrypted_filename.jpg")
    
    def test_get_file_path_file_not_found(self, mock_db):
        """Test file path retrieval with non-existent file."""
        service, _ = self.file_service()
        
        # Setup mock
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        # Execute and expect exception
        with pytest.raises(FileNotFoundException):
            service.get_file_path(mock_db, "nonexistent-id")
    
    def test_get_file_path_storage_not_found(self, mock_db, mock_file_record):
        """Test file path retrieval when file not found in storage."""
        service, mock_storage = self.file_service()
        
        # Setup mocks
        mock_db.query.return_value.filter.return_value.first.return_value = mock_file_record
        mock_storage.get_file_path.return_value = None
        
        # Execute
        result = service.get_file_path(mock_db, "test-file-id")
        
        # Verify result
        assert result is None
    
    def test_get_client_ip_forwarded_for(self, mock_request):
        """Test client IP extraction from X-Forwarded-For header."""
        service, _ = self.file_service()
        
        # Setup mock
        mock_request.headers = {"x-forwarded-for": "192.168.1.1, 10.0.0.1"}
        
        # Execute
        result = service._get_client_ip(mock_request)
        
        # Verify result (should take first IP)
        assert result == "192.168.1.1"
    
    def test_get_client_ip_real_ip(self, mock_request):
        """Test client IP extraction from X-Real-IP header."""
        service, _ = self.file_service()
        
        # Setup mock
        mock_request.headers = {"x-real-ip": "192.168.1.1"}
        
        # Execute
        result = service._get_client_ip(mock_request)
        
        # Verify result
        assert result == "192.168.1.1"
    
    def test_get_client_ip_direct(self, mock_request):
        """Test client IP extraction from direct client."""
        service, _ = self.file_service()
        
        # Setup mock (no forwarded headers)
        mock_request.headers = {}
        mock_request.client.host = "127.0.0.1"
        
        # Execute
        result = service._get_client_ip(mock_request)
        
        # Verify result
        assert result == "127.0.0.1"
    
    def test_get_client_ip_no_client(self, mock_request):
        """Test client IP extraction when no client info available."""
        service, _ = self.file_service()
        
        # Setup mock
        mock_request.headers = {}
        mock_request.client = None
        
        # Execute
        result = service._get_client_ip(mock_request)
        
        # Verify result
        assert result is None