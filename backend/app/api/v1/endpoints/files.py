"""
File management endpoints for FormVault Insurance Portal.

This module provides REST API endpoints for uploading, retrieving,
and managing files (student ID and passport photos).
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Query, Request
from fastapi.responses import FileResponse
from typing import List, Optional
from sqlalchemy.orm import Session

from app.schemas.file import (
    FileUploadResponseSchema,
    FileInfoSchema,
    FileListResponseSchema,
    FileDeleteResponseSchema,
    FileValidationSchema
)
from app.schemas.base import FileType, ResponseBase
from app.core.config import get_settings, Settings
from app.core.exceptions import (
    FileUploadException,
    FileSizeException,
    FileTypeException,
    FileNotFoundException,
    ApplicationNotFoundException,
    DatabaseException
)
from app.database import get_db
from app.services.file_service import file_service

router = APIRouter()


@router.post("/upload", response_model=FileUploadResponseSchema, status_code=201)
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    file_type: FileType = Form(...),
    application_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
) -> FileUploadResponseSchema:
    """
    Upload a file (student ID or passport photo).
    
    Uploads and validates a file for an insurance application.
    Files are validated for type, size, and security before storage.
    
    - **file**: The file to upload (JPEG, PNG, or PDF)
    - **file_type**: Type of file (student_id or passport)
    - **application_id**: Optional application ID to associate with file
    """
    return await file_service.upload_file(
        db=db,
        file=file,
        file_type=file_type,
        application_id=application_id,
        request=request
    )


@router.get("/", response_model=FileListResponseSchema)
async def list_files(
    application_id: Optional[str] = Query(None, description="Filter by application ID"),
    file_type: Optional[FileType] = Query(None, description="Filter by file type"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of files to return"),
    offset: int = Query(0, ge=0, description="Number of files to skip"),
    db: Session = Depends(get_db)
) -> FileListResponseSchema:
    """
    List uploaded files with optional filtering.
    
    Retrieves a list of uploaded files with optional filters
    for application ID and file type.
    
    - **application_id**: Filter by application ID
    - **file_type**: Filter by file type (student_id or passport)
    - **limit**: Maximum number of files to return (1-1000)
    - **offset**: Number of files to skip for pagination
    """
    files = file_service.list_files(
        db=db,
        application_id=application_id,
        file_type=file_type,
        limit=limit,
        offset=offset
    )
    
    return FileListResponseSchema(
        files=files,
        message="Files retrieved successfully"
    )


@router.get("/{file_id}", response_model=FileInfoSchema)
async def get_file_info(file_id: str, db: Session = Depends(get_db)) -> FileInfoSchema:
    """
    Get information about a specific file.
    
    Returns metadata about a specific file including size,
    type, and upload timestamp.
    
    - **file_id**: Unique file identifier
    """
    return file_service.get_file(db=db, file_id=file_id)


@router.get("/{file_id}/download")
async def download_file(file_id: str, db: Session = Depends(get_db)):
    """
    Download a specific file.
    
    Returns the actual file content for download.
    Includes appropriate headers for file download.
    
    - **file_id**: Unique file identifier
    """
    # Get file info from database
    file_info = file_service.get_file(db=db, file_id=file_id)
    
    # Get file path from storage
    file_path = file_service.get_file_path(db=db, file_id=file_id)
    if not file_path:
        raise FileNotFoundException(file_id)
    
    # Return file response with appropriate headers
    return FileResponse(
        path=file_path,
        filename=file_info.original_filename,
        media_type=file_info.mime_type,
        headers={
            "Content-Disposition": f"attachment; filename=\"{file_info.original_filename}\"",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    )


@router.delete("/{file_id}", response_model=FileDeleteResponseSchema)
async def delete_file(
    file_id: str,
    request: Request,
    db: Session = Depends(get_db)
) -> FileDeleteResponseSchema:
    """
    Delete a specific file.
    
    Permanently deletes a file from storage.
    Files associated with submitted applications cannot be deleted.
    
    - **file_id**: Unique file identifier
    """
    success = file_service.delete_file(db=db, file_id=file_id, request=request)
    
    if success:
        return FileDeleteResponseSchema(
            file_id=file_id,
            message="File deleted successfully"
        )
    else:
        raise FileUploadException("Failed to delete file")


@router.get("/validation/rules", response_model=FileValidationSchema)
async def get_validation_rules(
    settings: Settings = Depends(get_settings)
) -> FileValidationSchema:
    """
    Get file validation rules.
    
    Returns the current file validation rules including
    maximum file size and allowed file types.
    """
    return FileValidationSchema(
        max_size=settings.MAX_FILE_SIZE,
        allowed_types=settings.ALLOWED_FILE_TYPES
    )


@router.post("/{file_id}/verify")
async def verify_file_integrity(file_id: str, db: Session = Depends(get_db)):
    """
    Verify file integrity using stored hash.
    
    Verifies that the file has not been corrupted by
    comparing current hash with stored hash.
    
    - **file_id**: Unique file identifier
    """
    is_valid = file_service.verify_file_integrity(db=db, file_id=file_id)
    
    return {
        "file_id": file_id,
        "integrity_valid": is_valid,
        "message": "File integrity verified" if is_valid else "File integrity check failed"
    }