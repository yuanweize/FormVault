"""
Database and Storage Maintenance Script: Re-encrypt legacy unencrypted files with AES-256-GCM.

Scans all uploaded files in database and storage provider.
Detects legacy unencrypted or unauthenticated payloads, encrypts them
using AES-256-GCM authenticated cipher with per-file salt and nonce, and updates records.
"""

import sys
import os
import hashlib

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.database import SessionLocal
from app.models.file import File
from app.services.file_storage import get_file_storage, MAGIC_HEADER
import structlog

logger = structlog.get_logger(__name__)


def reencrypt_legacy_files():
    db = SessionLocal()
    storage = get_file_storage()

    try:
        files = db.query(File).all()
        logger.info(f"Scanning {len(files)} files for AES-256-GCM compliance...")
        
        upgraded_count = 0
        already_encrypted_count = 0
        failed_count = 0

        for file_record in files:
            stored_name = file_record.stored_filename
            try:
                # Read raw stored bytes from local or S3
                if storage.storage_type == "s3" and storage.s3_client:
                    response = storage.s3_client.get_object(
                        Bucket=storage.settings.S3_BUCKET,
                        Key=stored_name
                    )
                    raw_data = response["Body"].read()
                else:
                    file_path = storage.upload_dir / stored_name
                    if not file_path.exists():
                        logger.warning(f"File not found on disk: {stored_name}")
                        failed_count += 1
                        continue
                    with open(file_path, "rb") as f:
                        raw_data = f.read()

                if raw_data.startswith(MAGIC_HEADER):
                    already_encrypted_count += 1
                    continue

                # Legacy raw file detected - encrypt with AES-256-GCM
                encrypted_payload = storage.encrypt_content(raw_data)

                # Write back to storage
                if storage.storage_type == "s3" and storage.s3_client:
                    storage.s3_client.put_object(
                        Bucket=storage.settings.S3_BUCKET,
                        Key=stored_name,
                        Body=encrypted_payload,
                        ContentType=file_record.mime_type or "application/octet-stream",
                    )
                else:
                    file_path = storage.upload_dir / stored_name
                    with open(file_path, "wb") as f:
                        f.write(encrypted_payload)

                # Update sha256 of decrypted content
                file_record.file_hash = hashlib.sha256(raw_data).hexdigest()
                file_record.file_size = len(raw_data)
                upgraded_count += 1
                logger.info(f"Successfully upgraded file {file_record.id} ({file_record.original_filename}) to AES-256-GCM")

            except Exception as e:
                logger.error(f"Error processing file {file_record.id}: {e}")
                failed_count += 1

        db.commit()
        print(f"\n==========================================")
        print(f"File Encryption Scan & Upgrade Complete")
        print(f"Total files checked: {len(files)}")
        print(f"Already AES-256-GCM: {already_encrypted_count}")
        print(f"Upgraded to AES-256-GCM: {upgraded_count}")
        print(f"Errors / Missing files: {failed_count}")
        print(f"==========================================\n")

    finally:
        db.close()


if __name__ == "__main__":
    reencrypt_legacy_files()
