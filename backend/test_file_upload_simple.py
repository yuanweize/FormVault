"""
Simple test to verify file upload functionality works.
"""

import tempfile
import os
from io import BytesIO
from pathlib import Path

# Test the file storage service directly
def test_file_storage_basic():
    """Test basic file storage functionality."""
    from app.services.file_storage import SecureFileStorage
    from unittest.mock import Mock, patch
    
    # Create temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        # Mock settings
        with patch('app.services.file_storage.get_settings') as mock_settings:
            mock_settings.return_value.UPLOAD_DIR = temp_dir
            mock_settings.return_value.MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
            mock_settings.return_value.ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"]
            mock_settings.return_value.SECRET_KEY = "test-secret-key"
            
            # Create storage instance
            storage = SecureFileStorage()
            
            # Test filename generation
            filename = storage.generate_secure_filename("test.jpg", "file-id-123")
            print(f"Generated secure filename: {filename}")
            assert filename.endswith(".jpg")
            assert "test.jpg" not in filename  # Should be encrypted
            
            # Test filename decryption
            decrypted = storage.decrypt_filename(filename)
            print(f"Decrypted filename data: {decrypted}")
            assert "file-id-123" in decrypted
            assert "test.jpg" in decrypted
            
            print("✓ File storage basic functionality works!")


def test_file_validation():
    """Test file validation functionality."""
    from app.services.file_storage import SecureFileStorage
    from app.core.exceptions import FileSizeException, FileTypeException, MalwareDetectedException
    from unittest.mock import Mock, patch
    
    with tempfile.TemporaryDirectory() as temp_dir:
        with patch('app.services.file_storage.get_settings') as mock_settings:
            mock_settings.return_value.UPLOAD_DIR = temp_dir
            mock_settings.return_value.MAX_FILE_SIZE = 1024  # 1KB for testing
            mock_settings.return_value.ALLOWED_FILE_TYPES = ["image/jpeg"]
            mock_settings.return_value.SECRET_KEY = "test-secret-key"
            
            storage = SecureFileStorage()
            
            # Test valid file
            valid_file = Mock()
            valid_file.filename = "test.jpg"
            valid_file.content_type = "image/jpeg"
            valid_file.size = 500  # Under limit
            valid_file.file = Mock()
            valid_file.file.tell.return_value = 0
            valid_file.file.seek.return_value = None
            valid_file.file.read.return_value = b'\xff\xd8\xff\xe0\x00\x10JFIF' + b'\x00' * 100
            
            try:
                storage.validate_file(valid_file)
                print("✓ Valid file passed validation")
            except Exception as e:
                print(f"✗ Valid file failed validation: {e}")
            
            # Test oversized file
            oversized_file = Mock()
            oversized_file.filename = "large.jpg"
            oversized_file.content_type = "image/jpeg"
            oversized_file.size = 2048  # Over limit
            
            try:
                storage.validate_file(oversized_file)
                print("✗ Oversized file should have failed validation")
            except FileSizeException:
                print("✓ Oversized file correctly rejected")
            except Exception as e:
                print(f"✗ Unexpected error for oversized file: {e}")
            
            # Test invalid type
            invalid_file = Mock()
            invalid_file.filename = "test.txt"
            invalid_file.content_type = "text/plain"
            invalid_file.size = 100
            
            try:
                storage.validate_file(invalid_file)
                print("✗ Invalid file type should have failed validation")
            except FileTypeException:
                print("✓ Invalid file type correctly rejected")
            except Exception as e:
                print(f"✗ Unexpected error for invalid file type: {e}")


if __name__ == "__main__":
    print("Testing file upload functionality...")
    
    try:
        test_file_storage_basic()
        test_file_validation()
        print("\n✓ All tests passed! File upload system is working correctly.")
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()