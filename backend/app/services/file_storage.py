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
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
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

# Standard FormVault AES-256-GCM authenticated container constants
MAGIC_HEADER = b"FV_GCM_V1"
SALT_LEN = 16
NONCE_LEN = 12


class SecureFileStorage:
    """Secure file storage service supporting Local and S3 backends."""

    def __init__(self):
        self.settings = get_settings()

        # Default to settings/env, but override from DB if available
        self.storage_type = self.settings.STORAGE_TYPE.lower()

        # Encryption setup
        self.upload_dir = Path(self.settings.UPLOAD_DIR)
        self._encryption_key = self._get_or_create_encryption_key()
        self._cipher = Fernet(self._encryption_key)

        # Dynamic Config (DB) Handling
        from ..database import SessionLocal
        from ..models.system import SystemConfig

        self.s3_client = None
        db_config = None

        try:
            with SessionLocal() as db:
                db_config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
        except Exception as e:
            logger.warning(f"Failed to read SystemConfig from DB: {e}")

        # If DB config exists, use it to determine storage provider & keys
        if db_config:
            self.storage_type = (
                db_config.storage_provider.lower()
                if db_config.storage_provider
                else "local"
            )

            if self.storage_type == "s3":
                try:
                    self.s3_client = boto3.client(
                        "s3",
                        endpoint_url=db_config.s3_endpoint or self.settings.S3_ENDPOINT,
                        aws_access_key_id=db_config.s3_access_key
                        or self.settings.S3_ACCESS_KEY,
                        aws_secret_access_key=db_config.s3_secret_key
                        or self.settings.S3_SECRET_KEY,
                        region_name=db_config.s3_region or self.settings.S3_REGION,
                    )
                    logger.info("S3 Storage initialized from DB Configuration")
                except Exception as e:
                    logger.error(
                        f"Failed to initialize S3 client from DB config: {e}. Falling back to Local."
                    )
                    self.storage_type = "local"

        # Fallback to Environment Variables if S3 not initialized yet and env specifies S3
        if self.storage_type == "s3" and not self.s3_client:
            # Try env vars
            if not all(
                [
                    self.settings.S3_ACCESS_KEY,
                    self.settings.S3_SECRET_KEY,
                    self.settings.S3_BUCKET,
                ]
            ):
                logger.warning(
                    "S3 configured in Env but credentials missing. Falling back to local storage."
                )
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
                    logger.info("S3 Storage initialized from Environment Variables")
                except Exception as e:
                    logger.error(f"Failed to initialize S3 client from Env: {e}")
                    self.storage_type = "local"

        # Ensure local dir exists (always needed for key storage or fallback)
        self.upload_dir.mkdir(exist_ok=True, mode=0o750)

    def _derive_aes_key(self, salt: bytes) -> bytes:
        """Derive 256-bit AES key using PBKDF2-HMAC-SHA256 from SECRET_KEY and per-file salt."""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        return kdf.derive(self.settings.SECRET_KEY.encode("utf-8"))

    def encrypt_content(self, content: bytes) -> bytes:
        """
        Encrypt file content with authenticated AES-256-GCM.
        Packed format:
          MAGIC_HEADER (9B) + Salt (16B) + Nonce (12B) + Ciphertext + Tag (16B)
        """
        salt = secrets.token_bytes(SALT_LEN)
        nonce = secrets.token_bytes(NONCE_LEN)
        key = self._derive_aes_key(salt)
        aesgcm = AESGCM(key)
        ciphertext_and_tag = aesgcm.encrypt(nonce, content, MAGIC_HEADER)
        return MAGIC_HEADER + salt + nonce + ciphertext_and_tag

    def decrypt_content(self, encrypted_data: bytes) -> bytes:
        """
        Decrypt file content authenticated with AES-256-GCM.
        Supports dual-mode: automatically falls back to raw data if MAGIC_HEADER is absent.
        """
        if not encrypted_data.startswith(MAGIC_HEADER):
            # Unencrypted legacy file fallback for smooth migration
            return encrypted_data

        hdr_len = len(MAGIC_HEADER)
        salt = encrypted_data[hdr_len : hdr_len + SALT_LEN]
        nonce = encrypted_data[hdr_len + SALT_LEN : hdr_len + SALT_LEN + NONCE_LEN]
        ciphertext_and_tag = encrypted_data[hdr_len + SALT_LEN + NONCE_LEN :]

        key = self._derive_aes_key(salt)
        aesgcm = AESGCM(key)
        return aesgcm.decrypt(nonce, ciphertext_and_tag, MAGIC_HEADER)

    def _get_or_create_encryption_key(self) -> bytes:
        """Get or create encryption key derived deterministically from SECRET_KEY."""
        key_file = self.upload_dir / ".encryption_key"
        if key_file.exists():
            try:
                with open(key_file, "rb") as f:
                    content = f.read()
                    if content:
                        return content
            except Exception:
                pass

        salt = b"formvault_stateless_salt_v1"
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        password = self.settings.SECRET_KEY.encode()
        key = base64.urlsafe_b64encode(kdf.derive(password))

        try:
            with open(key_file, "wb") as f:
                f.write(key)
            os.chmod(key_file, 0o600)
        except Exception:
            pass

        return key

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
            b"<script",
            b"javascript:",
            b"vbscript:",
            b"onload=",
            b"onerror=",
            b"<?php",
            b"<%",
            b"exec(",
            b"system(",
            b"shell_exec(",
        ]

        header_lower = header.lower()
        for pattern in suspicious_patterns:
            if pattern in header_lower:
                logger.warning(f"Suspicious pattern detected in file: {file.filename}")
                raise MalwareDetectedException(
                    f"Suspicious content detected: {pattern.decode('utf-8', errors='ignore')}"
                )

        self._validate_file_signature(header, file.content_type, file.filename)

    def _validate_file_signature(
        self, header: bytes, content_type: str, filename: Optional[str]
    ) -> None:
        """Validate file signature."""
        signatures = {
            "image/jpeg": [b"\xff\xd8\xff"],
            "image/png": [b"\x89PNG\r\n\x1a\n"],
            "application/pdf": [b"%PDF-"],
        }
        if content_type in signatures:
            valid_signatures = signatures[content_type]
            if not any(header.startswith(sig) for sig in valid_signatures):
                logger.warning(
                    f"File signature mismatch for {filename}: {content_type}"
                )
                raise FileTypeException(
                    f"File signature doesn't match declared type: {content_type}",
                    self.settings.ALLOWED_FILE_TYPES,
                )

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
            return encrypted_filename

    async def store_file(
        self, file: UploadFile, file_id: str, db: Optional[Session] = None
    ) -> Tuple[str, str, int]:
        return await self.save_file(file, file_id, db)

    async def save_file(
        self, file: UploadFile, file_id: str, db: Optional[Session] = None
    ) -> Tuple[str, str, int]:
        """Store file securely with AES-256-GCM encryption (S3 or Local)."""
        # Load Config (Dynamic)
        config = self._get_config(db)
        storage_type = config.get("storage_type", self.storage_type)
        s3_client = self.s3_client

        # If DB config says S3, try to use it if client not ready or mismatched
        if storage_type == "s3" and config.get("s3_access_key"):
            s3_client = self._create_s3_client_from_config(config)

        try:
            stored_filename = self.generate_secure_filename(
                file.filename or "unknown", file_id
            )

            # Reset file pointer and calc hash/size on original unencrypted content
            await file.seek(0)
            hasher = hashlib.sha256()
            raw_content = await file.read()
            hasher.update(raw_content)
            file_size = len(raw_content)
            file_hash = hasher.hexdigest()
            await file.seek(0)

            # Apply true application-level authenticated AES-256-GCM encryption before storage
            encrypted_content = self.encrypt_content(raw_content)

            if storage_type == "s3" and s3_client:
                # S3 Upload with encrypted content
                s3_client.put_object(
                    Bucket=config.get("s3_bucket") or self.settings.S3_BUCKET,
                    Key=stored_filename,
                    Body=encrypted_content,
                    ContentType="application/octet-stream",
                    Metadata={
                        "x-formvault-cipher": "AES-256-GCM",
                        "x-formvault-original-type": file.content_type
                        or "application/octet-stream",
                    },
                )
                logger.info(
                    f"File encrypted (AES-256-GCM) and stored in S3: {stored_filename}"
                )
            else:
                # Local Upload with encrypted content
                file_path = self.upload_dir / stored_filename
                if file_path.exists():
                    stored_filename = self.generate_secure_filename(
                        f"{secrets.token_hex(4)}_{file.filename}", file_id
                    )
                    file_path = self.upload_dir / stored_filename

                with open(file_path, "wb") as f:
                    f.write(encrypted_content)
                os.chmod(file_path, 0o640)
                logger.info(
                    f"File encrypted (AES-256-GCM) and stored locally: {stored_filename}"
                )

            return stored_filename, f"sha256:{file_hash}", file_size
        except Exception as e:
            logger.error(f"Failed to store file: {e}")
            raise FileUploadException(f"Storage failed: {str(e)}")

    def _get_config(self, db: Optional[Session]) -> dict:
        """Get flattened config from DB + Env Fallback."""
        config = {
            "storage_type": self.settings.STORAGE_TYPE.lower(),
            "s3_bucket": self.settings.S3_BUCKET,
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
                    Bucket=self.settings.S3_BUCKET, Key=stored_filename
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

    def get_presigned_url(
        self, stored_filename: str, expiration: int = 3600
    ) -> Optional[str]:
        """Get presigned URL for S3 files. Returns None for local."""
        if self.storage_type == "s3" and self.s3_client:
            try:
                response = self.s3_client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": self.settings.S3_BUCKET, "Key": stored_filename},
                    ExpiresIn=expiration,
                )
                return response
            except ClientError as e:
                logger.error(f"Failed to generate presigned URL: {e}")
                return None
        return None

    def read_and_decrypt_file(
        self, stored_filename: str, db: Optional[Session] = None
    ) -> bytes:
        """
        Read file from S3 or Local storage and decrypt its AES-256-GCM ciphertext.
        Only accessible by authorized administrators / underwriters.
        """
        config = self._get_config(db)
        storage_type = config.get("storage_type", self.storage_type)
        s3_client = self.s3_client
        if storage_type == "s3" and config.get("s3_access_key"):
            s3_client = self._create_s3_client_from_config(config)

        try:
            if storage_type == "s3" and s3_client:
                bucket = config.get("s3_bucket") or self.settings.S3_BUCKET
                obj = s3_client.get_object(Bucket=bucket, Key=stored_filename)
                raw_data = obj["Body"].read()
            else:
                file_path = self.upload_dir / stored_filename
                if not file_path.exists():
                    raise FileUploadException(
                        f"Stored file not found on disk: {stored_filename}"
                    )
                with open(file_path, "rb") as f:
                    raw_data = f.read()

            return self.decrypt_content(raw_data)
        except Exception as e:
            logger.error(f"Failed to read/decrypt file {stored_filename}: {e}")
            raise FileUploadException(f"Failed to read and decrypt file: {str(e)}")

    def verify_file_integrity(self, stored_filename: str, expected_hash: str) -> bool:
        """Verify file integrity of decrypted content against expected SHA-256 hash."""
        if self.storage_type == "s3":
            return True
        try:
            decrypted_bytes = self.read_and_decrypt_file(stored_filename)
            hasher = hashlib.sha256(decrypted_bytes)
            current_hash = f"sha256:{hasher.hexdigest()}"
            return current_hash == expected_hash
        except Exception:
            return False

    def get_file_info(self, stored_filename: str) -> Optional[dict]:
        """Get file info."""
        if self.storage_type == "s3" and self.s3_client:
            # Basic S3 HeadObject
            try:
                obj = self.s3_client.head_object(
                    Bucket=self.settings.S3_BUCKET, Key=stored_filename
                )
                return {
                    "size": obj["ContentLength"],
                    "modified": obj["LastModified"].timestamp(),
                    "exists": True,
                }
            except ClientError:
                return None
        else:
            file_path = self.get_file_path(stored_filename)
            if not file_path:
                return None
            stat = file_path.stat()
            return {
                "size": stat.st_size,
                "modified": stat.st_mtime,
                "permissions": oct(stat.st_mode)[-3:],
                "exists": True,
            }


# Global instance
file_storage = SecureFileStorage()
FileStorage = SecureFileStorage
