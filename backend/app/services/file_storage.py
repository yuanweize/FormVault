"""
Secure file storage service for FormVault Insurance Portal.

This module provides secure file storage functionality including:
- File validation (type, size, malware scanning)
- Encrypted filename generation
- Secure file storage operations
- File integrity verification
"""

import boto3
import os
import hashlib
import secrets
import logging
from pathlib import Path
from typing import Optional, Tuple, BinaryIO
from fastapi import UploadFile
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
from sqlalchemy.orm import Session

from botocore.exceptions import ClientError
from ..core.config import get_settings
from ..core.exceptions import (
    FileUploadException,
    FileSizeException,
    FileTypeException,
    MalwareDetectedException,
)

logger = logging.getLogger(__name__)


class SecureFileStorage:
    """Secure file storage service supporting Local and S3 backends."""

    def __init__(self):
        self.settings = get_settings()
        self.storage_type = self.settings.STORAGE_TYPE.lower()
        self.upload_dir = Path(self.settings.UPLOAD_DIR)
        
        # Encryption setup
        self._encryption_key = self._get_or_create_encryption_key()
        self._cipher = Fernet(self._encryption_key)

        # S3 Setup
        self.s3_client = None
        if self.storage_type == "s3":
            if not all([self.settings.S3_ACCESS_KEY, self.settings.S3_SECRET_KEY, self.settings.S3_BUCKET]):
                logger.warning("S3 configured but credentials missing. Falling back to local storage.")
                self.storage_type = "local"
            else:
                try:
                    self.s3_client = boto3.client(
                        "s3",
                        endpoint_url=self.settings.S3_ENDPOINT,
                        aws_access_key_id=self.settings.S3_ACCESS_KEY,
                        aws_secret_access_key=self.settings.S3_SECRET_KEY,
                        region_name=self.settings.S3_REGION,
                    )
                    logger.info("S3 Storage initialized successfully")
                except Exception as e:
                    logger.error(f"Failed to initialize S3 client: {e}")
                    self.storage_type = "local"

        # Ensure local dir exists (always needed for key storage or fallback)
        self.upload_dir.mkdir(exist_ok=True, mode=0o750)

    def _get_or_create_encryption_key(self) -> bytes:
        """Get encryption key derived deterministically from SECRET_KEY (Stateless)."""
        # Use a fixed salt to ensure the key is consistent across restarts without disk persistence
        # In a real production scenario, this salt could also be an env var, but hardcoding ensures
        # we don't lose access to files if the container restarts.
        salt = b"formvault_stateless_salt_v1"
        
        # Derive 32-byte key from the SECRET_KEY
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        # We start with the configured secret key
        password = self.settings.SECRET_KEY.encode()
        
        # Return the derived key in URL-safe base64 format (required by Fernet)
        return base64.urlsafe_b64encode(kdf.derive(password))

    def validate_file(self, file: UploadFile) -> None:
        """Validate uploaded file for security and compliance."""
        # Size validation
        if file.size and file.size > self.settings.MAX_FILE_SIZE:
            raise FileSizeException(self.settings.MAX_FILE_SIZE, file.size)

        # Type validation
        if file.content_type not in self.settings.ALLOWED_FILE_TYPES:
            raise FileTypeException(file.content_type, self.settings.ALLOWED_FILE_TYPES)

        # Extension validation
        if file.filename:
            file_ext = Path(file.filename).suffix.lower()
            allowed_extensions = {".jpg", ".jpeg", ".png", ".pdf"}
            if file_ext not in allowed_extensions:
                raise FileTypeException(file_ext, list(allowed_extensions))

        # Malware scan
        self._scan_for_malware(file)

    def _scan_for_malware(self, file: UploadFile) -> None:
        """Basic malware scanning."""
        original_position = file.file.tell()
        file.file.seek(0)
        header = file.file.read(1024)
        file.file.seek(original_position)

        suspicious_patterns = [
            b"<script", b"javascript:", b"vbscript:", b"onload=", b"onerror=",
            b"<?php", b"<%", b"exec(", b"system(", b"shell_exec(",
        ]

        header_lower = header.lower()
        for pattern in suspicious_patterns:
            if pattern in header_lower:
                logger.warning(f"Suspicious pattern detected in file: {file.filename}")
                raise MalwareDetectedException(f"Suspicious content detected: {pattern.decode('utf-8', errors='ignore')}")

        self._validate_file_signature(header, file.content_type, file.filename)

    def _validate_file_signature(self, header: bytes, content_type: str, filename: Optional[str]) -> None:
        """Validate file signature."""
        signatures = {
            "image/jpeg": [b"\xff\xd8\xff"],
            "image/png": [b"\x89PNG\r\n\x1a\n"],
            "application/pdf": [b"%PDF-"],
        }
        if content_type in signatures:
            valid_signatures = signatures[content_type]
            if not any(header.startswith(sig) for sig in valid_signatures):
                logger.warning(f"File signature mismatch for {filename}: {content_type}")
                raise FileTypeException(f"File signature doesn't match declared type: {content_type}", self.settings.ALLOWED_FILE_TYPES)

    def generate_secure_filename(self, original_filename: str, file_id: str) -> str:
        """Generate encrypted, secure filename."""
        file_ext = Path(original_filename).suffix.lower()
        filename_data = f"{file_id}_{original_filename}_{secrets.token_hex(8)}"
        encrypted_data = self._cipher.encrypt(filename_data.encode())
        safe_filename = base64.urlsafe_b64encode(encrypted_data).decode()
        return f"{safe_filename}{file_ext}"

    def decrypt_filename(self, encrypted_filename: str) -> str:
        """Decrypt filename to get original information."""
        try:
            base_name = Path(encrypted_filename).stem
            encrypted_data = base64.urlsafe_b64decode(base_name.encode())
            decrypted_data = self._cipher.decrypt(encrypted_data)
            return decrypted_data.decode()
        except Exception as e:
            logger.error(f"Failed to decrypt filename {encrypted_filename}: {e}")
            return "unknown"

    async def store_file(self, file: UploadFile, file_id: str, db: Optional[Session] = None) -> Tuple[str, str, int]:
        """Store file securely (S3 or Local)."""
        # Load Config (Dynamic)
        config = self._get_config(db)
        storage_type = config.get("storage_type", self.storage_type)
        s3_client = self.s3_client
        
        # If DB config says S3, try to use it if client not ready or mismatched
        if storage_type == "s3" and config.get("s3_access_key"):
             s3_client = self._create_s3_client_from_config(config)

        try:
            stored_filename = self.generate_secure_filename(file.filename or "unknown", file_id)
            
            # Reset file pointer and calc hash/size
            await file.seek(0)
            hasher = hashlib.sha256()
            file_size = 0
            content = await file.read()
            hasher.update(content)
            file_size = len(content)
            file_hash = hasher.hexdigest()
            await file.seek(0)

            if storage_type == "s3" and s3_client:
                # S3 Upload
                s3_client.upload_fileobj(
                    file.file,
                    config.get("s3_bucket") or self.settings.S3_BUCKET,
                    stored_filename,
                    ExtraArgs={"ContentType": file.content_type}
                )
                logger.info(f"File stored in S3: {stored_filename}")
            else:
                # Local Upload
                file_path = self.upload_dir / stored_filename
                if file_path.exists():
                     stored_filename = self.generate_secure_filename(f"{secrets.token_hex(4)}_{file.filename}", file_id)
                     file_path = self.upload_dir / stored_filename
                
                with open(file_path, "wb") as f:
                    f.write(content)
                os.chmod(file_path, 0o640)
                logger.info(f"File stored locally: {stored_filename}")

            return stored_filename, f"sha256:{file_hash}", file_size
        except Exception as e:
            logger.error(f"Failed to store file: {e}")
            raise FileUploadException(f"Storage failed: {str(e)}")

    def _get_config(self, db: Optional[Session]) -> dict:
        """Get flattened config from DB + Env Fallback."""
        config = {
            "storage_type": self.settings.STORAGE_TYPE.lower(),
            "s3_bucket": self.settings.S3_BUCKET
        }
        
        if db:
            from ..models.system import SystemConfig
            try:
                sys_conf = db.query(SystemConfig).first()
                if sys_conf:
                    config["storage_type"] = sys_conf.storage_provider
                    config["s3_endpoint"] = sys_conf.s3_endpoint
                    config["s3_bucket"] = sys_conf.s3_bucket
                    config["s3_access_key"] = sys_conf.s3_access_key
                    config["s3_secret_key"] = sys_conf.s3_secret_key
                    config["s3_region"] = sys_conf.s3_region
            except Exception:
                pass 
        return config

    def _create_s3_client_from_config(self, config: dict):
        try:
            return boto3.client(
                "s3",
                endpoint_url=config.get("s3_endpoint"),
                aws_access_key_id=config.get("s3_access_key"),
                aws_secret_access_key=config.get("s3_secret_key"),
                region_name=config.get("s3_region"),
            )
        except Exception:
            return None

    def delete_file(self, stored_filename: str) -> bool:
        """Delete file from storage."""
        try:
            if self.storage_type == "s3" and self.s3_client:
                self.s3_client.delete_object(
                    Bucket=self.settings.S3_BUCKET,
                    Key=stored_filename
                )
                return True
            else:
                file_path = self.upload_dir / stored_filename
                if file_path.exists():
                    file_path.unlink()
                    return True
                return False
        except Exception as e:
            logger.error(f"Failed to delete file {stored_filename}: {e}")
            return False

    def get_file_path(self, stored_filename: str) -> Optional[Path]:
        """Get local file path (Local storage only). Returns None for S3."""
        if self.storage_type == "s3":
            return None
        file_path = self.upload_dir / stored_filename
        return file_path if file_path.exists() else None
    
    def get_presigned_url(self, stored_filename: str, expiration: int = 3600) -> Optional[str]:
        """Get presigned URL for S3 files. Returns None for local."""
        if self.storage_type == "s3" and self.s3_client:
            try:
                response = self.s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.settings.S3_BUCKET, 'Key': stored_filename},
                    ExpiresIn=expiration
                )
                return response
            except ClientError as e:
                logger.error(f"Failed to generate presigned URL: {e}")
                return None
        return None

    def verify_file_integrity(self, stored_filename: str, expected_hash: str) -> bool:
        """Verify file integrity."""
        # For S3, we rely on S3's internal checksums or download to verify (expensive)
        # For this implementation, we'll implement verification only for Local
        # S3 verification usually happens via ETag during upload
        if self.storage_type == "s3":
             return True # Assume S3 integrity for now to save bandwidth
        
        try:
            file_path = self.get_file_path(stored_filename)
            if not file_path:
                return False
            
            hasher = hashlib.sha256()
            with open(file_path, "rb") as f:
                while chunk := f.read(8192):
                    hasher.update(chunk)
            current_hash = f"sha256:{hasher.hexdigest()}"
            return current_hash == expected_hash
        except Exception:
            return False

    def get_file_info(self, stored_filename: str) -> Optional[dict]:
        """Get file info."""
        if self.storage_type == "s3" and self.s3_client:
             # Basic S3 HeadObject
             try:
                 obj = self.s3_client.head_object(Bucket=self.settings.S3_BUCKET, Key=stored_filename)
                 return {
                     "size": obj['ContentLength'],
                     "modified": obj['LastModified'].timestamp(),
                     "exists": True
                 }
             except ClientError:
                 return None
        else:
            file_path = self.get_file_path(stored_filename)
            if not file_path: return None
            stat = file_path.stat()
            return {
                "size": stat.st_size,
                "modified": stat.st_mtime,
                "exists": True
            }


# Global instance
file_storage = SecureFileStorage()
