"""
File service for managing file uploads and database operations.

This module provides high-level file management functionality that combines
secure file storage with database operations.
"""

import logging
from typing import Optional, List
from uuid import uuid4
from datetime import datetime

from fastapi import UploadFile, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from ..models.file import File
from ..models.application import Application
from ..schemas.base import FileType
from ..schemas.file import FileUploadResponseSchema, FileInfoSchema
from ..core.exceptions import (
    FileUploadException,
    FileNotFoundException,
    ApplicationNotFoundException,
    DatabaseException,
)
from ..utils.db_helpers import create_audit_log
from .file_storage import file_storage

logger = logging.getLogger(__name__)


class FileService:
    """Service for managing file uploads and database operations."""

    def __init__(self):
        self.storage = file_storage

    async def upload_file(
        self,
        db: Session,
        file: UploadFile,
        file_type: FileType,
        application_id: Optional[str] = None,
        request: Optional[Request] = None,
    ) -> FileUploadResponseSchema:
        """
        Upload and store a file with database record creation.

        Args:
            db: Database session
            file: FastAPI UploadFile instance
            file_type: Type of file (student_id or passport)
            application_id: Optional application ID to associate with file
            request: Optional request object for audit logging

        Returns:
            FileUploadResponseSchema with file information

        Raises:
            FileUploadException: If upload fails
            ApplicationNotFoundException: If application_id doesn't exist
            DatabaseException: If database operation fails
        """
        try:
            # Validate the file
            self.storage.validate_file(file)

            # Verify application exists if provided
            if application_id:
                application = (
                    db.query(Application)
                    .filter(Application.id == application_id)
                    .first()
                )
                if not application:
                    raise ApplicationNotFoundException(application_id)

            # Generate unique file ID
            file_id = str(uuid4())

            # Store file securely
            stored_filename, file_hash, file_size = await self.storage.store_file(
                file, file_id
            )

            # Create database record
            db_file = File(
                id=file_id,
                application_id=application_id,
                file_type=file_type.value,
                original_filename=file.filename or "unknown",
                stored_filename=stored_filename,
                file_size=file_size,
                mime_type=file.content_type or "application/octet-stream",
                file_hash=file_hash.replace("sha256:", ""),  # Store hash without prefix
                upload_ip=self._get_client_ip(request) if request else None,
            )

            db.add(db_file)
            db.flush()  # Get the ID without committing

            # Create audit log
            if request:
                create_audit_log(
                    db=db,
                    action="file_upload",
                    application_id=application_id,
                    user_ip=self._get_client_ip(request),
                    user_agent=request.headers.get("user-agent"),
                    details={
                        "file_id": file_id,
                        "file_type": file_type.value,
                        "original_filename": file.filename,
                        "file_size": file_size,
                        "mime_type": file.content_type,
                    },
                )

            db.commit()

            logger.info(f"File uploaded successfully: {file_id} ({file.filename})")

            return FileUploadResponseSchema(
                id=file_id,
                file_type=file_type,
                original_filename=db_file.original_filename,
                file_size=file_size,
                mime_type=db_file.mime_type,
                file_hash=file_hash,
                message="File uploaded successfully",
            )

        except (FileUploadException, ApplicationNotFoundException) as e:
            # Re-raise known exceptions
            db.rollback()
            raise
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error during file upload: {e}")

            # Clean up stored file if database operation failed
            if "stored_filename" in locals():
                self.storage.delete_file(stored_filename)

            raise DatabaseException(
                f"Failed to save file metadata: {str(e)}", "file_upload"
            )
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error during file upload: {e}")

            # Clean up stored file
            if "stored_filename" in locals():
                self.storage.delete_file(stored_filename)

            raise FileUploadException(f"File upload failed: {str(e)}")

    def get_file(self, db: Session, file_id: str) -> FileInfoSchema:
        """
        Get file information by ID.

        Args:
            db: Database session
            file_id: File identifier

        Returns:
            FileInfoSchema with file information

        Raises:
            FileNotFoundException: If file doesn't exist
        """
        db_file = db.query(File).filter(File.id == file_id).first()
        if not db_file:
            raise FileNotFoundException(file_id)

        return FileInfoSchema(
            id=db_file.id,
            file_type=FileType(db_file.file_type),
            original_filename=db_file.original_filename,
            file_size=db_file.file_size,
            mime_type=db_file.mime_type,
            created_at=db_file.created_at,
        )

    def list_files(
        self,
        db: Session,
        application_id: Optional[str] = None,
        file_type: Optional[FileType] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[FileInfoSchema]:
        """
        List files with optional filtering.

        Args:
            db: Database session
            application_id: Optional application ID filter
            file_type: Optional file type filter
            limit: Maximum number of files to return
            offset: Number of files to skip

        Returns:
            List of FileInfoSchema objects
        """
        query = db.query(File)

        if application_id:
            query = query.filter(File.application_id == application_id)

        if file_type:
            query = query.filter(File.file_type == file_type.value)

        files = query.order_by(File.created_at.desc()).offset(offset).limit(limit).all()

        return [
            FileInfoSchema(
                id=file.id,
                file_type=FileType(file.file_type),
                original_filename=file.original_filename,
                file_size=file.file_size,
                mime_type=file.mime_type,
                created_at=file.created_at,
            )
            for file in files
        ]

    def delete_file(
        self, db: Session, file_id: str, request: Optional[Request] = None
    ) -> bool:
        """
        Delete a file and its database record.

        Args:
            db: Database session
            file_id: File identifier
            request: Optional request object for audit logging

        Returns:
            bool: True if successful

        Raises:
            FileNotFoundException: If file doesn't exist
            DatabaseException: If database operation fails
        """
        try:
            db_file = db.query(File).filter(File.id == file_id).first()
            if not db_file:
                raise FileNotFoundException(file_id)

            # Delete from storage
            storage_deleted = self.storage.delete_file(db_file.stored_filename)

            # Delete from database
            db.delete(db_file)

            # Create audit log
            if request:
                create_audit_log(
                    db=db,
                    action="file_delete",
                    application_id=db_file.application_id,
                    user_ip=self._get_client_ip(request),
                    user_agent=request.headers.get("user-agent"),
                    details={
                        "file_id": file_id,
                        "original_filename": db_file.original_filename,
                        "storage_deleted": storage_deleted,
                    },
                )

            db.commit()

            logger.info(f"File deleted successfully: {file_id}")
            return True

        except FileNotFoundException:
            raise
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error during file deletion: {e}")
            raise DatabaseException(f"Failed to delete file: {str(e)}", "file_delete")
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error during file deletion: {e}")
            raise FileUploadException(f"File deletion failed: {str(e)}")

    def verify_file_integrity(self, db: Session, file_id: str) -> bool:
        """
        Verify file integrity using stored hash.

        Args:
            db: Database session
            file_id: File identifier

        Returns:
            bool: True if integrity check passes

        Raises:
            FileNotFoundException: If file doesn't exist
        """
        db_file = db.query(File).filter(File.id == file_id).first()
        if not db_file:
            raise FileNotFoundException(file_id)

        expected_hash = f"sha256:{db_file.file_hash}"
        return self.storage.verify_file_integrity(
            db_file.stored_filename, expected_hash
        )

    def get_file_path(self, db: Session, file_id: str) -> Optional[str]:
        """
        Get file system path for a file.

        Args:
            db: Database session
            file_id: File identifier

        Returns:
            str: File path if exists, None otherwise

        Raises:
            FileNotFoundException: If file doesn't exist in database
        """
        db_file = db.query(File).filter(File.id == file_id).first()
        if not db_file:
            raise FileNotFoundException(file_id)

        file_path = self.storage.get_file_path(db_file.stored_filename)
        return str(file_path) if file_path else None

    def _get_client_ip(self, request: Request) -> Optional[str]:
        """
        Extract client IP address from request.

        Args:
            request: FastAPI request object

        Returns:
            str: Client IP address
        """
        # Check for forwarded headers first (for proxy/load balancer scenarios)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        # Fall back to direct client IP
        return request.client.host if request.client else None


# Global service instance
file_service = FileService()
