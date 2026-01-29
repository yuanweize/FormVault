"""
Unit tests for secure file storage functionality.
"""

import pytest
import tempfile
import os
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock
from io import BytesIO

from fastapi import UploadFile

from app.services.file_storage import SecureFileStorage
from app.core.exceptions import (
    FileSizeException,
    FileTypeException,
    MalwareDetectedException,
    FileUploadException,
)


class TestSecureFileStorage:
    """Test cases for SecureFileStorage class."""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for testing."""
        with tempfile.TemporaryDirectory() as temp_dir:
            yield temp_dir

    @pytest.fixture
    def storage(self, temp_dir):
        """Create SecureFileStorage instance with temporary directory."""
        with patch("app.services.file_storage.get_settings") as mock_settings:
            mock_settings.return_value.UPLOAD_DIR = temp_dir
            mock_settings.return_value.MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
            mock_settings.return_value.ALLOWED_FILE_TYPES = [
                "image/jpeg",
                "image/png",
                "application/pdf",
            ]
            mock_settings.return_value.SECRET_KEY = "test-secret-key"

            storage = SecureFileStorage()
            yield storage

    @pytest.fixture
    def valid_jpeg_file(self):
        """Create a valid JPEG file for testing."""
        # JPEG file signature
        jpeg_header = b"\xff\xd8\xff\xe0\x00\x10JFIF"
        jpeg_data = jpeg_header + b"\x00" * 1000  # 1KB of data

        file_obj = BytesIO(jpeg_data)
        upload_file = Mock(spec=UploadFile)
        upload_file.filename = "test.jpg"
        upload_file.file = file_obj
        upload_file.content_type = "image/jpeg"
        upload_file.size = len(jpeg_data)
        upload_file.read = AsyncMock(return_value=jpeg_data)
        upload_file.seek = AsyncMock()
        return upload_file

    @pytest.fixture
    def valid_png_file(self):
        """Create a valid PNG file for testing."""
        # PNG file signature
        png_header = b"\x89PNG\r\n\x1a\n"
        png_data = png_header + b"\x00" * 1000  # 1KB of data

        file_obj = BytesIO(png_data)
        upload_file = Mock(spec=UploadFile)
        upload_file.filename = "test.png"
        upload_file.file = file_obj
        upload_file.content_type = "image/png"
        upload_file.size = len(png_data)
        upload_file.read = AsyncMock(return_value=png_data)
        upload_file.seek = AsyncMock()
        return upload_file

    @pytest.fixture
    def valid_pdf_file(self):
        """Create a valid PDF file for testing."""
        # PDF file signature
        pdf_header = b"%PDF-1.4"
        pdf_data = pdf_header + b"\x00" * 1000  # 1KB of data

        file_obj = BytesIO(pdf_data)
        upload_file = Mock(spec=UploadFile)
        upload_file.filename = "test.pdf"
        upload_file.file = file_obj
        upload_file.content_type = "application/pdf"
        upload_file.size = len(pdf_data)
        upload_file.read = AsyncMock(return_value=pdf_data)
        upload_file.seek = AsyncMock()
        return upload_file

    @pytest.fixture
    def oversized_file(self):
        """Create an oversized file for testing."""
        large_data = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * (
            6 * 1024 * 1024
        )  # 6MB

        file_obj = BytesIO(large_data)
        upload_file = Mock(spec=UploadFile)
        upload_file.filename = "large.jpg"
        upload_file.file = file_obj
        upload_file.content_type = "image/jpeg"
        upload_file.size = len(large_data)
        upload_file.read = AsyncMock(return_value=large_data)
        upload_file.seek = AsyncMock()
        return upload_file

    @pytest.fixture
    def invalid_type_file(self):
        """Create a file with invalid type for testing."""
        data = b"invalid file content"

        file_obj = BytesIO(data)
        upload_file = Mock(spec=UploadFile)
        upload_file.filename = "test.txt"
        upload_file.file = file_obj
        upload_file.content_type = "text/plain"
        upload_file.size = len(data)
        upload_file.read = AsyncMock(return_value=data)
        upload_file.seek = AsyncMock()
        return upload_file

    @pytest.fixture
    def malicious_file(self):
        """Create a file with malicious content for testing."""
        # File with script tag (suspicious)
        malicious_data = b'\xff\xd8\xff\xe0\x00\x10JFIF<script>alert("xss")</script>'

        file_obj = BytesIO(malicious_data)
        upload_file = Mock(spec=UploadFile)
        upload_file.filename = "malicious.jpg"
        upload_file.file = file_obj
        upload_file.content_type = "image/jpeg"
        upload_file.size = len(malicious_data)
        upload_file.read = AsyncMock(return_value=malicious_data)
        upload_file.seek = AsyncMock()
        return upload_file

    def test_validate_file_valid_jpeg(self, storage, valid_jpeg_file):
        """Test validation of valid JPEG file."""
        # Should not raise any exception
        storage.validate_file(valid_jpeg_file)

    def test_validate_file_valid_png(self, storage, valid_png_file):
        """Test validation of valid PNG file."""
        # Should not raise any exception
        storage.validate_file(valid_png_file)

    def test_validate_file_valid_pdf(self, storage, valid_pdf_file):
        """Test validation of valid PDF file."""
        # Should not raise any exception
        storage.validate_file(valid_pdf_file)

    def test_validate_file_oversized(self, storage, oversized_file):
        """Test validation of oversized file."""
        with pytest.raises(FileSizeException) as exc_info:
            storage.validate_file(oversized_file)

        assert "exceeds maximum allowed size" in str(exc_info.value)
        assert exc_info.value.details["max_size"] == 5 * 1024 * 1024
        assert exc_info.value.details["actual_size"] > 5 * 1024 * 1024

    def test_validate_file_invalid_type(self, storage, invalid_type_file):
        """Test validation of file with invalid type."""
        with pytest.raises(FileTypeException) as exc_info:
            storage.validate_file(invalid_type_file)

        assert "is not allowed" in str(exc_info.value)
        assert exc_info.value.details["file_type"] == "text/plain"

    def test_validate_file_malicious_content(self, storage, malicious_file):
        """Test detection of malicious content."""
        with pytest.raises(MalwareDetectedException) as exc_info:
            storage.validate_file(malicious_file)

        assert "Suspicious content detected" in str(exc_info.value)

    def test_validate_file_signature_mismatch(self, storage):
        """Test validation of file with mismatched signature."""
        # PNG data with JPEG content type
        png_data = b"\x89PNG\r\n\x1a\n" + b"\x00" * 1000

        file_obj = BytesIO(png_data)
        upload_file = Mock(spec=UploadFile)
        upload_file.filename = "fake.jpg"
        upload_file.file = file_obj
        upload_file.content_type = "image/jpeg"  # Wrong content type
        upload_file.size = len(png_data)
        upload_file.read = AsyncMock(return_value=png_data)
        upload_file.seek = AsyncMock()

        with pytest.raises(FileTypeException) as exc_info:
            storage.validate_file(upload_file)

        assert "signature doesn't match" in str(exc_info.value)

    def test_generate_secure_filename(self, storage):
        """Test secure filename generation."""
        original_filename = "test_document.jpg"
        file_id = "test-file-id"

        secure_filename = storage.generate_secure_filename(original_filename, file_id)

        # Should have .jpg extension
        assert secure_filename.endswith(".jpg")
        # Should not contain original filename directly
        assert "test_document" not in secure_filename
        # Should be different each time
        secure_filename2 = storage.generate_secure_filename(original_filename, file_id)
        assert secure_filename != secure_filename2

    def test_decrypt_filename(self, storage):
        """Test filename decryption."""
        original_filename = "test_document.jpg"
        file_id = "test-file-id"

        secure_filename = storage.generate_secure_filename(original_filename, file_id)
        decrypted_data = storage.decrypt_filename(secure_filename)

        # Should contain original components
        assert file_id in decrypted_data
        assert original_filename in decrypted_data

    @pytest.mark.asyncio
    async def test_store_file_success(self, storage, valid_jpeg_file):
        """Test successful file storage."""
        file_id = "test-file-id"

        stored_filename, file_hash, file_size = await storage.store_file(
            valid_jpeg_file, file_id
        )

        # Check return values
        assert stored_filename.endswith(".jpg")
        assert file_hash.startswith("sha256:")
        assert file_size > 0

        # Check file exists on disk
        file_path = storage.upload_dir / stored_filename
        assert file_path.exists()

        # Check file permissions
        stat = file_path.stat()
        permissions = oct(stat.st_mode)[-3:]
        assert permissions == "640"  # rw-r-----

    @pytest.mark.asyncio
    async def test_store_file_duplicate_handling(self, storage, valid_jpeg_file):
        """Test handling of duplicate filenames."""
        file_id = "test-file-id"

        # Store first file
        stored_filename1, _, _ = await storage.store_file(valid_jpeg_file, file_id)

        # Reset file for second upload
        valid_jpeg_file.file.seek(0)

        # Store second file with same ID (should get different filename)
        stored_filename2, _, _ = await storage.store_file(valid_jpeg_file, file_id)

        assert stored_filename1 != stored_filename2

        # Both files should exist
        assert (storage.upload_dir / stored_filename1).exists()
        assert (storage.upload_dir / stored_filename2).exists()

    def test_delete_file_success(self, storage, temp_dir):
        """Test successful file deletion."""
        # Create a test file
        test_file = Path(temp_dir) / "test_file.jpg"
        test_file.write_bytes(b"test content")

        # Delete the file
        result = storage.delete_file("test_file.jpg")

        assert result is True
        assert not test_file.exists()

    def test_delete_file_not_found(self, storage):
        """Test deletion of non-existent file."""
        result = storage.delete_file("nonexistent.jpg")

        assert result is False

    def test_get_file_path_exists(self, storage, temp_dir):
        """Test getting path of existing file."""
        # Create a test file
        test_file = Path(temp_dir) / "test_file.jpg"
        test_file.write_bytes(b"test content")

        file_path = storage.get_file_path("test_file.jpg")

        assert file_path is not None
        assert file_path.exists()
        assert file_path.name == "test_file.jpg"

    def test_get_file_path_not_exists(self, storage):
        """Test getting path of non-existent file."""
        file_path = storage.get_file_path("nonexistent.jpg")

        assert file_path is None

    def test_verify_file_integrity_valid(self, storage, temp_dir):
        """Test file integrity verification with valid hash."""
        # Create a test file with known content
        test_content = b"test content for integrity check"
        test_file = Path(temp_dir) / "test_file.jpg"
        test_file.write_bytes(test_content)

        # Calculate expected hash
        import hashlib

        expected_hash = f"sha256:{hashlib.sha256(test_content).hexdigest()}"

        result = storage.verify_file_integrity("test_file.jpg", expected_hash)

        assert result is True

    def test_verify_file_integrity_invalid(self, storage, temp_dir):
        """Test file integrity verification with invalid hash."""
        # Create a test file
        test_file = Path(temp_dir) / "test_file.jpg"
        test_file.write_bytes(b"test content")

        # Use wrong hash
        wrong_hash = "sha256:wronghash123"

        result = storage.verify_file_integrity("test_file.jpg", wrong_hash)

        assert result is False

    def test_verify_file_integrity_missing_file(self, storage):
        """Test file integrity verification with missing file."""
        result = storage.verify_file_integrity("nonexistent.jpg", "sha256:anyhash")

        assert result is False

    def test_get_file_info_exists(self, storage, temp_dir):
        """Test getting file info for existing file."""
        # Create a test file
        test_file = Path(temp_dir) / "test_file.jpg"
        test_file.write_bytes(b"test content")

        file_info = storage.get_file_info("test_file.jpg")

        assert file_info is not None
        assert file_info["size"] == len(b"test content")
        assert file_info["exists"] is True
        assert "modified" in file_info
        assert "permissions" in file_info

    def test_get_file_info_not_exists(self, storage):
        """Test getting file info for non-existent file."""
        file_info = storage.get_file_info("nonexistent.jpg")

        assert file_info is None

    def test_encryption_key_persistence(self, temp_dir):
        """Test that encryption key is persisted and reused."""
        with patch("app.services.file_storage.get_settings") as mock_settings:
            mock_settings.return_value.UPLOAD_DIR = temp_dir
            mock_settings.return_value.SECRET_KEY = "test-secret-key"

            # Create first storage instance
            storage1 = SecureFileStorage()
            key1 = storage1._encryption_key

            # Create second storage instance (should reuse key)
            storage2 = SecureFileStorage()
            key2 = storage2._encryption_key

            assert key1 == key2

            # Key file should exist
            key_file = Path(temp_dir) / ".encryption_key"
            assert key_file.exists()

            # Check file permissions (skip on Windows as chmod doesn't work the same way)
            import platform

            if platform.system() != "Windows":
                stat = key_file.stat()
                permissions = oct(stat.st_mode)[-3:]
                assert permissions == "600"  # rw-------
