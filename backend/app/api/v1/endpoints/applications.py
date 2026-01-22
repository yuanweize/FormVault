"""
Application management endpoints for FormVault Insurance Portal.

This module provides REST API endpoints for creating, updating,
retrieving, and submitting insurance applications.
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from typing import List, Optional
from uuid import uuid4
import structlog

from app.database import get_db
from app.models.application import Application
from app.models.file import File
from app.models.email_export import EmailExport
from app.utils.database import create_audit_log, handle_integrity_error
from app.services.email_service import email_service
from app.schemas.application import (
    ApplicationCreateSchema,
    ApplicationUpdateSchema,
    ApplicationResponseSchema,
    ApplicationListResponseSchema,
    ApplicationSubmitSchema,
    ApplicationSubmitResponseSchema,
    FileInfoSchema
)
from app.schemas.email_export import (
    EmailExportRequestSchema,
    EmailExportResponseSchema,
    EmailExportHistorySchema,
    EmailExportStatusSchema
)
from app.schemas.base import PaginationParams, ResponseBase
from app.core.exceptions import (
    ApplicationNotFoundException, 
    ValidationException,
    DatabaseException,
    EmailServiceException
)

logger = structlog.get_logger(__name__)
router = APIRouter()


@router.post("/", response_model=ApplicationResponseSchema, status_code=201)
async def create_application(
    application_data: ApplicationCreateSchema,
    request: Request,
    db: Session = Depends(get_db)
) -> ApplicationResponseSchema:
    """
    Create a new insurance application.
    
    Creates a new application with the provided personal information
    and insurance type. Returns the created application with a unique
    reference number.
    
    - **personal_info**: Complete personal information including address
    - **insurance_type**: Type of insurance (health, auto, life, travel)
    - **preferred_language**: Language preference for communications
    - **student_id_file_id**: Optional student ID file reference
    - **passport_file_id**: Optional passport file reference
    """
    try:
        # Create new application instance
        application = Application(
            id=str(uuid4()),
            first_name=application_data.personal_info.first_name,
            last_name=application_data.personal_info.last_name,
            email=application_data.personal_info.email,
            phone=application_data.personal_info.phone,
            address_street=application_data.personal_info.address.street,
            address_city=application_data.personal_info.address.city,
            address_state=application_data.personal_info.address.state,
            address_zip_code=application_data.personal_info.address.zip_code,
            address_country=application_data.personal_info.address.country,
            date_of_birth=application_data.personal_info.date_of_birth,
            insurance_type=application_data.insurance_type,
            preferred_language=application_data.preferred_language,
            status="draft"
        )
        
        # Generate unique reference number
        application.reference_number = application.generate_reference_number()
        
        # Add to database
        db.add(application)
        db.flush()  # Get the ID without committing
        
        # Validate file references if provided
        files = []
        if application_data.student_id_file_id:
            student_id_file = db.query(File).filter(
                File.id == application_data.student_id_file_id,
                File.file_type == "student_id"
            ).first()
            if not student_id_file:
                raise ValidationException(
                    "Invalid student ID file reference",
                    field="student_id_file_id"
                )
            student_id_file.application_id = application.id
            files.append(student_id_file)
        
        if application_data.passport_file_id:
            passport_file = db.query(File).filter(
                File.id == application_data.passport_file_id,
                File.file_type == "passport"
            ).first()
            if not passport_file:
                raise ValidationException(
                    "Invalid passport file reference",
                    field="passport_file_id"
                )
            passport_file.application_id = application.id
            files.append(passport_file)
        
        # Create audit log
        user_ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        create_audit_log(
            db=db,
            action="application.created",
            application_id=application.id,
            user_ip=user_ip,
            user_agent=user_agent,
            details={
                "reference_number": application.reference_number,
                "insurance_type": application.insurance_type,
                "email": application.email,
                "files_attached": len(files)
            }
        )
        
        # Commit transaction
        db.commit()
        
        logger.info(
            "Application created successfully",
            application_id=application.id,
            reference_number=application.reference_number,
            email=application.email
        )
        
        # Convert files to response format
        file_responses = [
            FileInfoSchema(
                id=file.id,
                file_type=file.file_type,
                original_filename=file.original_filename,
                file_size=file.file_size,
                mime_type=file.mime_type,
                created_at=file.created_at
            )
            for file in files
        ]
        
        return ApplicationResponseSchema(
            id=application.id,
            reference_number=application.reference_number,
            personal_info=application_data.personal_info,
            insurance_type=application.insurance_type,
            preferred_language=application.preferred_language,
            status=application.status,
            files=file_responses,
            created_at=application.created_at,
            updated_at=application.updated_at,
            message="Application created successfully"
        )
        
    except IntegrityError as e:
        db.rollback()
        error_msg = handle_integrity_error(e)
        logger.error(
            "Database integrity error during application creation",
            error=str(e),
            user_friendly_message=error_msg
        )
        raise ValidationException(error_msg)
        
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(
            "Database error during application creation",
            error=str(e)
        )
        raise DatabaseException(
            "Failed to create application due to database error",
            operation="create_application"
        )
        
    except Exception as e:
        db.rollback()
        logger.error(
            "Unexpected error during application creation",
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while creating the application"
        )


@router.get("/", response_model=ApplicationListResponseSchema)
async def list_applications(
    pagination: PaginationParams = Depends(),
    status: Optional[str] = Query(None, description="Filter by application status"),
    insurance_type: Optional[str] = Query(None, description="Filter by insurance type")
) -> ApplicationListResponseSchema:
    """
    List insurance applications with optional filtering.
    
    Retrieves a paginated list of applications with optional filters
    for status and insurance type.
    
    - **page**: Page number (1-based)
    - **size**: Number of items per page (max 100)
    - **status**: Filter by application status
    - **insurance_type**: Filter by insurance type
    """
    # TODO: Implement actual application listing logic
    # This is a placeholder implementation
    
    return ApplicationListResponseSchema(
        applications=[],
        message="Applications retrieved successfully"
    )


@router.get("/{application_id}", response_model=ApplicationResponseSchema)
async def get_application(application_id: str) -> ApplicationResponseSchema:
    """
    Retrieve a specific insurance application.
    
    Returns detailed information about a specific application
    including personal information, files, and current status.
    
    - **application_id**: Unique application identifier
    """
    # TODO: Implement actual application retrieval logic
    # This is a placeholder implementation
    
    # Simulate application not found
    if application_id == "not-found":
        raise ApplicationNotFoundException(application_id)
    
    # Placeholder response
    raise HTTPException(status_code=501, detail="Not implemented")


@router.put("/{application_id}", response_model=ApplicationResponseSchema)
async def update_application(
    application_id: str,
    application_data: ApplicationUpdateSchema
) -> ApplicationResponseSchema:
    """
    Update an existing insurance application.
    
    Updates the specified application with new information.
    Only applications in 'draft' status can be updated.
    
    - **application_id**: Unique application identifier
    - **application_data**: Updated application information
    """
    # TODO: Implement actual application update logic
    # This is a placeholder implementation
    
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post("/{application_id}/submit", response_model=ApplicationSubmitResponseSchema)
async def submit_application(
    application_id: str,
    submit_data: ApplicationSubmitSchema
) -> ApplicationSubmitResponseSchema:
    """
    Submit an insurance application for processing.
    
    Submits the application for processing and triggers email
    export to the insurance company. Application must be complete
    with all required files uploaded.
    
    - **application_id**: Unique application identifier
    - **confirm_submission**: Confirmation of submission intent
    """
    # TODO: Implement actual application submission logic
    # This is a placeholder implementation
    
    raise HTTPException(status_code=501, detail="Not implemented")


@router.delete("/{application_id}", response_model=ResponseBase)
async def delete_application(application_id: str) -> ResponseBase:
    """
    Delete an insurance application.
    
    Permanently deletes an application and all associated files.
    Only applications in 'draft' status can be deleted.
    
    - **application_id**: Unique application identifier
    """
    # TODO: Implement actual application deletion logic
    # This is a placeholder implementation
    
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post("/{application_id}/export", response_model=EmailExportResponseSchema, status_code=201)
async def export_application(
    application_id: str,
    export_request: EmailExportRequestSchema,
    request: Request,
    db: Session = Depends(get_db)
) -> EmailExportResponseSchema:
    """
    Export application data via email to insurance company.
    
    Sends the complete application data including personal information
    and attached documents to the specified insurance company email address.
    
    - **application_id**: Unique application identifier
    - **recipient_email**: Email address of insurance company
    - **insurance_company**: Name of insurance company (optional)
    - **additional_notes**: Additional notes to include (optional)
    """
    try:
        # Retrieve application with files
        application = db.query(Application).filter(
            Application.id == application_id
        ).first()
        
        if not application:
            raise ApplicationNotFoundException(application_id)
        
        # Validate application status
        if application.status not in ["submitted", "draft"]:
            raise ValidationException(
                f"Application with status '{application.status}' cannot be exported",
                field="status"
            )
        
        # Create email export record
        email_export = EmailExport(
            id=str(uuid4()),
            application_id=application.id,
            recipient_email=export_request.recipient_email,
            insurance_company=export_request.insurance_company,
            status="pending"
        )
        
        db.add(email_export)
        db.flush()  # Get the ID without committing
        
        try:
            # Send email
            success = await email_service.send_application_export(
                application=application,
                recipient_email=export_request.recipient_email,
                insurance_company=export_request.insurance_company,
                additional_notes=export_request.additional_notes
            )
            
            if success:
                # Mark as sent
                email_export.mark_as_sent()
                
                # Update application status if first successful export
                if application.status == "submitted":
                    application.status = "exported"
                
                logger.info(
                    "Application exported successfully",
                    application_id=application.id,
                    export_id=email_export.id,
                    recipient=export_request.recipient_email
                )
            else:
                # Mark for retry
                email_export.mark_for_retry("Email sending failed")
                
        except EmailServiceException as e:
            # Mark as failed or for retry based on error type
            if "SMTP" in str(e) or "connection" in str(e).lower():
                email_export.mark_for_retry(str(e))
            else:
                email_export.mark_as_failed(str(e))
            
            logger.error(
                "Email service error during export",
                application_id=application.id,
                export_id=email_export.id,
                error=str(e)
            )
        
        # Create audit log
        user_ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        create_audit_log(
            db=db,
            action="application.exported",
            application_id=application.id,
            user_ip=user_ip,
            user_agent=user_agent,
            details={
                "export_id": email_export.id,
                "recipient_email": export_request.recipient_email,
                "insurance_company": export_request.insurance_company,
                "status": email_export.status,
                "files_count": len(application.files) if application.files else 0
            }
        )
        
        # Commit transaction
        db.commit()
        
        return EmailExportResponseSchema(
            export_id=email_export.id,
            application_id=application.id,
            recipient_email=email_export.recipient_email,
            insurance_company=email_export.insurance_company,
            status=email_export.status,
            sent_at=email_export.sent_at,
            created_at=email_export.created_at,
            message=f"Email export {'completed successfully' if email_export.is_sent else 'initiated and will be retried if failed'}"
        )
        
    except ApplicationNotFoundException:
        raise
    except ValidationException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(
            "Database error during email export",
            application_id=application_id,
            error=str(e)
        )
        raise DatabaseException(
            "Failed to create email export due to database error",
            operation="export_application"
        )
    except Exception as e:
        db.rollback()
        logger.error(
            "Unexpected error during email export",
            application_id=application_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while exporting the application"
        )


@router.get("/{application_id}/export-history", response_model=EmailExportHistorySchema)
async def get_export_history(
    application_id: str,
    db: Session = Depends(get_db)
) -> EmailExportHistorySchema:
    """
    Get email export history for an application.
    
    Returns the history of email exports for the specified application
    including timestamps, recipients, and status.
    
    - **application_id**: Unique application identifier
    """
    try:
        # Verify application exists
        application = db.query(Application).filter(
            Application.id == application_id
        ).first()
        
        if not application:
            raise ApplicationNotFoundException(application_id)
        
        # Get all email exports for this application
        exports = db.query(EmailExport).filter(
            EmailExport.application_id == application_id
        ).order_by(EmailExport.created_at.desc()).all()
        
        # Convert to response format
        export_statuses = [
            EmailExportStatusSchema(
                export_id=export.id,
                status=export.status,
                sent_at=export.sent_at,
                error_message=export.error_message,
                retry_count=export.retry_count,
                created_at=export.created_at
            )
            for export in exports
        ]
        
        # Calculate statistics
        total_exports = len(exports)
        successful_exports = len([e for e in exports if e.is_sent])
        failed_exports = len([e for e in exports if e.is_failed])
        pending_exports = len([e for e in exports if e.is_pending or e.needs_retry])
        
        return EmailExportHistorySchema(
            application_id=application_id,
            exports=export_statuses,
            total_exports=total_exports,
            successful_exports=successful_exports,
            failed_exports=failed_exports,
            pending_exports=pending_exports,
            message="Export history retrieved successfully"
        )
        
    except ApplicationNotFoundException:
        raise
    except SQLAlchemyError as e:
        logger.error(
            "Database error retrieving export history",
            application_id=application_id,
            error=str(e)
        )
        raise DatabaseException(
            "Failed to retrieve export history due to database error",
            operation="get_export_history"
        )
    except Exception as e:
        logger.error(
            "Unexpected error retrieving export history",
            application_id=application_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while retrieving export history"
        )