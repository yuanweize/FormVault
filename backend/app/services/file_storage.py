"""
Secure file storage service for FormVault Insurance Portal.

This module provides secure file storage functionality including:
- File validation (type, size, malware scanning)
- Encrypted filename generation
- Secure file storage operations
- File integrity verification
"""

import os
import hashlib
import secrets
import shutil
import mimetypes
from pathlib import Path
from typing import Optional, Tuple, BinaryIO
from uuid import uuid4
import logging

from fastapi import UploadFile
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

from ..core.config import get_settings
from ..core.exceptions import (
    FileUploadException,
    FileSizeException,
    FileTypeException,
    MalwareDetectedException
)

logger = logging.getLogger(__name__)


class SecureFileStorage:
    """Secure file storage service with encryption and validation."""
    
    def __init__(self):
        self.settings = get_settings()
        self.upload_dir = Path(self.settings.UPLOAD_DIR)
        self.upload_dir.mkdir(exist_ok=True, mode=0o750)
        
        # Initialize encryption key
        self._encryption_key = self._get_or_create_encryption_key()
        self._cipher = Fernet(self._encryption_key)
    
    def _get_or_create_encryption_key(self) -> bytes:
        """Get or create encryption key for filename encryption."""
        key_file = self.upload_dir / ".encryption_key"
        
        if key_file.exists():
            with open(key_file, "rb") as f:
                return f.read()
        else:
            # Generate new key
            password = self.settings.SECRET_KEY.encode()
            salt = secrets.token_bytes(16)
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(password))
            
            # Store key securely
            with open(key_file, "wb") as f:
                f.write(key)
            os.chmod(key_file, 0o600)  # Read-only for owner
            
            return key
    
    def validate_file(self, file: UploadFile) -> None:
        """
        Validate uploaded file for security and compliance.
        
        Args:
            file: FastAPI UploadFile instance
            
        Raises:
            FileSizeException: If file exceeds maximum size
            FileTypeException: If file type is not allowed
            MalwareDetectedException: If malware is detected
        """
        # Validate file size
        if file.size and file.size > self.settings.MAX_FILE_SIZE:
            raise FileSizeException(self.settings.MAX_FILE_SIZE, file.size)
        
        # Validate MIME type
        if file.content_type not in self.settings.ALLOWED_FILE_TYPES:
            raise FileTypeException(file.content_type, self.settings.ALLOWED_FILE_TYPES)
        
        # Additional validation based on file extension
        if file.filename:
            file_ext = Path(file.filename).suffix.lower()
            allowed_extensions = {'.jpg', '.jpeg', '.png', '.pdf'}
            if file_ext not in allowed_extensions:
                raise FileTypeException(file_ext, list(allowed_extensions))
        
        # Basic malware scanning (check for suspicious patterns)
        self._scan_for_malware(file)
    
    def _scan_for_malware(self, file: UploadFile) -> None:
        """
        Basic malware scanning for uploaded files.
        
        Args:
            file: FastAPI UploadFile instance
            
        Raises:
            MalwareDetectedException: If suspicious content is detected
        """
        # Read first 1KB for signature analysis
        original_position = file.file.tell()
        file.file.seek(0)
        header = file.file.read(1024)
        file.file.seek(original_position)
        
        # Check for suspicious patterns
        suspicious_patterns = [
            b'<script',
            b'javascript:',
            b'vbscript:',
            b'onload=',
            b'onerror=',
            b'<?php',
            b'<%',
            b'exec(',
            b'system(',
            b'shell_exec(',
        ]
        
        header_lower = header.lower()
        for pattern in suspicious_patterns:
            if pattern in header_lower:
                logger.warning(f"Suspicious pattern detected in file: {file.filename}")
                raise MalwareDetectedException(f"Suspicious content detected: {pattern.decode('utf-8', errors='ignore')}")
        
        # Validate file signatures for common types
        self._validate_file_signature(header, file.content_type, file.filename)
    
    def _validate_file_signature(self, header: bytes, content_type: str, filename: Optional[str]) -> None:
        """
        Validate file signature matches declared content type.
        
        Args:
            header: First bytes of the file
            content_type: Declared MIME type
            filename: Original filename
            
        Raises:
            FileTypeException: If signature doesn't match content type
        """
        # File signatures (magic numbers)
        signatures = {
            'image/jpeg': [b'\xff\xd8\xff'],
            'image/png': [b'\x89PNG\r\n\x1a\n'],
            'application/pdf': [b'%PDF-'],
        }
        
        if content_type in signatures:
            valid_signatures = signatures[content_type]
            if not any(header.startswith(sig) for sig in valid_signatures):
                logger.warning(f"File signature mismatch for {filename}: {content_type}")
                raise FileTypeException(
                    f"File signature doesn't match declared type: {content_type}",
                    self.settings.ALLOWED_FILE_TYPES
                )
    
    def generate_secure_filename(self, original_filename: str, file_id: str) -> str:
        """
        Generate encrypted, secure filename.
        
        Args:
            original_filename: Original filename
            file_id: Unique file identifier
            
        Returns:
            str: Encrypted filename
        """
        # Extract file extension
        file_ext = Path(original_filename).suffix.lower()
        
        # Create filename data to encrypt
        filename_data = f"{file_id}_{original_filename}_{secrets.token_hex(8)}"
        
        # Encrypt the filename
        encrypted_data = self._cipher.encrypt(filename_data.encode())
        
        # Create safe filename using base64 encoding
        safe_filename = base64.urlsafe_b64encode(encrypted_data).decode()
        
        # Add original extension for system compatibility
        return f"{safe_filename}{file_ext}"
    
    def decrypt_filename(self, encrypted_filename: str) -> str:
        """
        Decrypt filename to get original information.
        
        Args:
            encrypted_filename: Encrypted filename
            
        Returns:
            str: Decrypted filename data
        """
        try:
            # Remove extension and decode
            base_name = Path(encrypted_filename).stem
            encrypted_data = base64.urlsafe_b64decode(base_name.encode())
            
            # Decrypt
            decrypted_data = self._cipher.decrypt(encrypted_data)
            return decrypted_data.decode()
        except Exception as e:
            logger.error(f"Failed to decrypt filename {encrypted_filename}: {e}")
            return "unknown"
    
    async def store_file(self, file: UploadFile, file_id: str) -> Tuple[str, str, int]:
        """
        Store file securely on disk.
        
        Args:
            file: FastAPI UploadFile instance
            file_id: Unique file identifier
            
        Returns:
            Tuple of (stored_filename, file_hash, file_size)
            
        Raises:
            FileUploadException: If storage fails
        """
        try:
            # Generate secure filename
            stored_filename = self.generate_secure_filename(file.filename or "unknown", file_id)
            file_path = self.upload_dir / stored_filename
            
            # Ensure file doesn't already exist
            if file_path.exists():
                stored_filename = self.generate_secure_filename(
                    f"{secrets.token_hex(4)}_{file.filename or 'unknown'}", 
                    file_id
                )
                file_path = self.upload_dir / stored_filename
            
            # Reset file pointer
            await file.seek(0)
            
            # Calculate hash while writing file
            hasher = hashlib.sha256()
            file_size = 0
            
            with open(file_path, "wb") as f:
                while chunk := await file.read(8192):  # Read in 8KB chunks
                    hasher.update(chunk)
                    f.write(chunk)
                    file_size += len(chunk)
            
            # Set secure file permissions
            os.chmod(file_path, 0o640)  # Read-write for owner, read for group
            
            file_hash = hasher.hexdigest()
            
            logger.info(f"File stored successfully: {stored_filename} (size: {file_size}, hash: {file_hash[:16]}...)")
            
            return stored_filename, f"sha256:{file_hash}", file_size
            
        except Exception as e:
            logger.error(f"Failed to store file {file.filename}: {e}")
            # Clean up partial file if it exists
            if 'file_path' in locals() and file_path.exists():
                try:
                    file_path.unlink()
                except Exception:
                    pass
            raise FileUploadException(f"Failed to store file: {str(e)}")
    
    def delete_file(self, stored_filename: str) -> bool:
        """
        Delete file from storage.
        
        Args:
            stored_filename: Encrypted filename on disk
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            file_path = self.upload_dir / stored_filename
            if file_path.exists():
                file_path.unlink()
                logger.info(f"File deleted: {stored_filename}")
                return True
            else:
                logger.warning(f"File not found for deletion: {stored_filename}")
                return False
        except Exception as e:
            logger.error(f"Failed to delete file {stored_filename}: {e}")
            return False
    
    def get_file_path(self, stored_filename: str) -> Optional[Path]:
        """
        Get full path to stored file.
        
        Args:
            stored_filename: Encrypted filename on disk
            
        Returns:
            Path object if file exists, None otherwise
        """
        file_path = self.upload_dir / stored_filename
        return file_path if file_path.exists() else None
    
    def verify_file_integrity(self, stored_filename: str, expected_hash: str) -> bool:
        """
        Verify file integrity using stored hash.
        
        Args:
            stored_filename: Encrypted filename on disk
            expected_hash: Expected hash (format: "sha256:hash")
            
        Returns:
            bool: True if integrity check passes
        """
        try:
            file_path = self.get_file_path(stored_filename)
            if not file_path:
                return False
            
            # Calculate current hash
            hasher = hashlib.sha256()
            with open(file_path, "rb") as f:
                while chunk := f.read(8192):
                    hasher.update(chunk)
            
            current_hash = f"sha256:{hasher.hexdigest()}"
            return current_hash == expected_hash
            
        except Exception as e:
            logger.error(f"Failed to verify file integrity for {stored_filename}: {e}")
            return False
    
    def get_file_info(self, stored_filename: str) -> Optional[dict]:
        """
        Get file information from disk.
        
        Args:
            stored_filename: Encrypted filename on disk
            
        Returns:
            Dict with file info or None if file doesn't exist
        """
        try:
            file_path = self.get_file_path(stored_filename)
            if not file_path:
                return None
            
            stat = file_path.stat()
            
            return {
                "size": stat.st_size,
                "modified": stat.st_mtime,
                "permissions": oct(stat.st_mode)[-3:],
                "exists": True
            }
        except Exception as e:
            logger.error(f"Failed to get file info for {stored_filename}: {e}")
            return None


# Global instance
file_storage = SecureFileStorage()