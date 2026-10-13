"""
Application management endpoints for FormVault Insurance Portal.

This module provides REST API endpoints for creating, updating,
retrieving, and submitting insurance applications.
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request, Response, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from typing import List, Optional
from uuid import uuid4
import structlog

from app.database import get_db
import app.models.application as app_module
from app.models.application import Application
from app.models.file import File
from app.models.email_export import EmailExport
from app.models.compliance import PartnerHandoffConsent
from app.models.system import SystemConfig
from app.services.business_scope import (
    get_public_capabilities,
    get_effective_scope_mode,
)
from app.utils.db_helpers import create_audit_log, handle_integrity_error
from app.services.email_service import email_service
from datetime import datetime, timezone
import json
from app.schemas.application import (
    ApplicationCreateSchema,
    ApplicationUpdateSchema,
    ApplicationResponseSchema,
    ApplicationListResponseSchema,
    ApplicationSubmitSchema,
    ApplicationSubmitResponseSchema,
    ApplicationTrackRequestSchema,
    ApplicationTrackResponseSchema,
    ApplicationTimelineStepSchema,
    FileInfoSchema,
    PersonalInfoSchema,
    AddressSchema,
    LeadInquiryCreateSchema,
    LeadInquiryResponseSchema,
)
from app.schemas.email_export import (
    EmailExportRequestSchema,
    EmailExportResponseSchema,
    EmailExportHistorySchema,
    EmailExportStatusSchema,
)
from app.schemas.base import PaginationParams, ResponseBase
from app.core.exceptions import (
    ApplicationNotFoundException,
    ValidationException,
    DatabaseException,
    EmailServiceException,
    FormVaultException,
)

logger = structlog.get_logger(__name__)
router = APIRouter()


def _mask_name(first_name: Optional[str], last_name: Optional[str]) -> str:
    """Safely mask personal name for public queries."""
    f = (first_name or "").strip()
    l = (last_name or "").strip()

    def mask_part(p: str) -> str:
        if not p:
            return ""
        if len(p) <= 2:
            return p[0] + "*"
        return p[0] + "***" + p[-1]

    return f"{mask_part(f)} {mask_part(l)}".strip()


def _mask_email(email: Optional[str]) -> str:
    """Safely mask email address for public queries."""
    if not email or "@" not in email:
        return "***"
    user, domain = email.strip().split("@", 1)
    if len(user) <= 2:
        masked_user = user[0] + "*"
    else:
        masked_user = user[0] + "***" + user[-1]
    return f"{masked_user}@{domain}"


@router.post("/track", response_model=ApplicationTrackResponseSchema)
async def track_application_status(
    track_data: ApplicationTrackRequestSchema,
    db: Session = Depends(get_db),
) -> ApplicationTrackResponseSchema:
    """
    Public dual-factor status tracking for applicants.
    Requires both valid reference number and matching applicant email.
    Returns masked details and a stage progression timeline.
    """
    ref = track_data.reference_number.strip()
    email = track_data.email.strip().lower()

    # 1. Check LeadInquiry table first (for one-shot lead entries)
    from app.models.lead import LeadInquiry

    lead = db.query(LeadInquiry).filter(LeadInquiry.reference_number == ref).first()
    if lead and (lead.email or "").strip().lower() == email:
        lead_status = lead.status
        timeline = [
            ApplicationTimelineStepSchema(
                key="draft",
                label="Enquiry Received",
                description="Your enquiry details have been securely received by FormVault.",
                completed=True,
                current=(lead_status == "INQUIRY_RECEIVED"),
                timestamp=lead.created_at,
            ),
            ApplicationTimelineStepSchema(
                key="submitted",
                label="Forwarded to Intermediary",
                description="Enquiry securely forwarded to České pojištění a.s. for licensed intermediary review.",
                completed=(
                    lead_status
                    in [
                        "FORWARDED_TO_INTERMEDIARY",
                        "AWAITING_INTERMEDIARY_RESPONSE",
                        "PARTNER_PROCESSING",
                        "CONTACTED",
                        "CLOSED",
                    ]
                ),
                current=(lead_status == "FORWARDED_TO_INTERMEDIARY"),
                timestamp=(
                    lead.last_handoff_attempt_at
                    if lead_status
                    in [
                        "FORWARDED_TO_INTERMEDIARY",
                        "AWAITING_INTERMEDIARY_RESPONSE",
                        "PARTNER_PROCESSING",
                        "CONTACTED",
                        "CLOSED",
                    ]
                    else None
                ),
            ),
            ApplicationTimelineStepSchema(
                key="exported",
                label="Awaiting Intermediary Response",
                description="Licensed insurance intermediary is preparing available insurance options.",
                completed=(
                    lead_status
                    in [
                        "AWAITING_INTERMEDIARY_RESPONSE",
                        "PARTNER_PROCESSING",
                        "CONTACTED",
                        "CLOSED",
                    ]
                ),
                current=(
                    lead_status
                    in ["AWAITING_INTERMEDIARY_RESPONSE", "PARTNER_PROCESSING"]
                ),
                timestamp=(
                    lead.updated_at
                    if lead_status
                    in [
                        "AWAITING_INTERMEDIARY_RESPONSE",
                        "PARTNER_PROCESSING",
                        "CONTACTED",
                        "CLOSED",
                    ]
                    else None
                ),
            ),
            ApplicationTimelineStepSchema(
                key="processed",
                label="Contacted & Options Provided",
                description="Intermediary specialist has contacted applicant with tailored insurance offers.",
                completed=(lead_status in ["CONTACTED", "CLOSED"]),
                current=(lead_status == "CONTACTED"),
                timestamp=(
                    lead.updated_at if lead_status in ["CONTACTED", "CLOSED"] else None
                ),
            ),
        ]

        status_labels = {
            "INQUIRY_RECEIVED": "Enquiry Received",
            "FORWARDED_TO_INTERMEDIARY": "Forwarded to Intermediary",
            "HANDOFF_FAILED": "Dispatch Retry Scheduled",
            "HANDOFF_RETRY_PENDING": "Dispatch Retry Scheduled",
            "AWAITING_INTERMEDIARY_RESPONSE": "Awaiting Intermediary Response",
            "PARTNER_PROCESSING": "Underwriting In Progress",
            "CONTACTED": "Contacted & Options Provided",
            "CLOSED": "Enquiry Completed",
        }

        return ApplicationTrackResponseSchema(
            success=True,
            reference_number=lead.reference_number,
            status=lead.status,
            status_label=status_labels.get(lead.status, lead.status),
            insurance_type="Health",
            masked_name=_mask_name(lead.first_name, lead.last_name),
            masked_email=_mask_email(lead.email),
            created_at=lead.created_at,
            submitted_at=lead.last_handoff_attempt_at or lead.created_at,
            updated_at=lead.updated_at,
            timeline=timeline,
            message="Lead enquiry status verified successfully",
        )

    # 2. Check Application table
    application = (
        db.query(Application).filter(Application.reference_number == ref).first()
    )

    if not application or (application.email or "").strip().lower() != email:
        raise HTTPException(
            status_code=404,
            detail="Application not found or verification credentials mismatch",
        )

    status_order = {"draft": 1, "submitted": 2, "exported": 3, "processed": 4}
    curr_idx = status_order.get(application.status, 2)

    timeline = [
        ApplicationTimelineStepSchema(
            key="draft",
            label="Enquiry Received",
            description="Your enquiry details have been securely received by FormVault.",
            completed=curr_idx >= 1,
            current=curr_idx == 1,
            timestamp=application.created_at,
        ),
        ApplicationTimelineStepSchema(
            key="submitted",
            label="Forwarded to Intermediary",
            description="Enquiry securely forwarded to České pojištění a.s. for licensed intermediary review.",
            completed=curr_idx >= 2,
            current=curr_idx == 2,
            timestamp=application.updated_at if curr_idx >= 2 else None,
        ),
        ApplicationTimelineStepSchema(
            key="exported",
            label="Awaiting Intermediary Response",
            description="Licensed insurance intermediary is preparing available insurance options.",
            completed=curr_idx >= 3,
            current=curr_idx == 3,
            timestamp=application.updated_at if curr_idx >= 3 else None,
        ),
        ApplicationTimelineStepSchema(
            key="processed",
            label="Contacted & Options Provided",
            description="Intermediary specialist has contacted applicant with tailored insurance offers.",
            completed=curr_idx >= 4,
            current=curr_idx == 4,
            timestamp=application.updated_at if curr_idx >= 4 else None,
        ),
    ]

    status_labels = {
        "draft": "Enquiry Received",
        "submitted": "Forwarded to Intermediary",
        "exported": "Awaiting Intermediary Response",
        "processed": "Contacted & Options Provided",
    }

    return ApplicationTrackResponseSchema(
        success=True,
        reference_number=application.reference_number,
        status=application.status,
        status_label=status_labels.get(
            application.status, application.status.capitalize()
        ),
        insurance_type=(application.insurance_type or "health").capitalize(),
        masked_name=_mask_name(application.first_name, application.last_name),
        masked_email=_mask_email(application.email),
        created_at=application.created_at,
        submitted_at=application.updated_at if application.status != "draft" else None,
        updated_at=application.updated_at,
        timeline=timeline,
        message="Application status verified successfully",
    )


@router.post("/", response_model=ApplicationResponseSchema, status_code=201)
async def create_application(
    application_data: ApplicationCreateSchema,
    request: Request,
    db: Session = Depends(get_db),
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
    caps = get_public_capabilities(db)
    effective_mode = get_effective_scope_mode(db)

    # In LEAD_ONLY mode, fail-close against product/insurer selection and passport submission
    if not caps.allow_product_selection and (
        application_data.insurance_company_id or application_data.insurance_plan_id
    ):
        raise HTTPException(
            status_code=400,
            detail="Specific product and insurer selection is disabled in LEAD_ONLY mode.",
        )

    if not caps.allow_sensitive_document_upload and (
        application_data.passport_file_id or application_data.passport_number
    ):
        raise HTTPException(
            status_code=400,
            detail="Passport upload is disabled in LEAD_ONLY mode.",
        )

    try:
        # Create new application instance
        application = app_module.Application(
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
            insurance_company_id=application_data.insurance_company_id,
            insurance_plan_id=application_data.insurance_plan_id,
            gender=application_data.gender,
            nationality=application_data.nationality,
            place_of_birth=application_data.place_of_birth,
            passport_number=application_data.passport_number,
            passport_expiry_date=application_data.passport_expiry_date,
            passport_issued_by=application_data.passport_issued_by,
            insurance_commencement_date=application_data.insurance_commencement_date,
            insurance_duration_months=application_data.insurance_duration_months or 12,
            type_of_stay=application_data.type_of_stay or "student",
            study_confirmation_file_id=application_data.study_confirmation_file_id,
            custom_fields_data=application_data.custom_fields_data,
            regulatory_mode_snapshot=effective_mode,
            status="draft",
        )

        # Generate unique reference number
        application.reference_number = application.generate_reference_number()

        # Add to database
        db.add(application)
        db.flush()  # Get the ID without committing

        # Validate file references if provided
        files = []
        if application_data.student_id_file_id:
            student_id_file = (
                db.query(File)
                .filter(
                    File.id == application_data.student_id_file_id,
                    File.file_type == "student_id",
                )
                .first()
            )
            if not student_id_file:
                raise ValidationException(
                    "Invalid student ID file reference", field="student_id_file_id"
                )
            student_id_file.application_id = application.id
            files.append(student_id_file)

        if application_data.passport_file_id:
            passport_file = (
                db.query(File)
                .filter(
                    File.id == application_data.passport_file_id,
                    File.file_type == "passport",
                )
                .first()
            )
            if not passport_file:
                raise ValidationException(
                    "Invalid passport file reference", field="passport_file_id"
                )
            passport_file.application_id = application.id
            files.append(passport_file)

        if application_data.study_confirmation_file_id:
            study_file = (
                db.query(File)
                .filter(File.id == application_data.study_confirmation_file_id)
                .first()
            )
            if study_file:
                study_file.application_id = application.id
                files.append(study_file)

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
                "files_attached": len(files),
                "insurance_company_id": application.insurance_company_id,
            },
        )

        # Commit transaction
        db.commit()

        logger.info(
            "Application created successfully",
            application_id=application.id,
            reference_number=application.reference_number,
            email=application.email,
        )

        # Convert files to response format
        file_responses = [
            FileInfoSchema(
                id=file.id,
                file_type=file.file_type,
                original_filename=file.original_filename,
                file_size=file.file_size,
                mime_type=file.mime_type,
                created_at=file.created_at,
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
            insurance_company_id=application.insurance_company_id,
            insurance_plan_id=application.insurance_plan_id,
            gender=application.gender,
            nationality=application.nationality,
            place_of_birth=application.place_of_birth,
            passport_number=application.passport_number,
            passport_expiry_date=application.passport_expiry_date,
            passport_issued_by=application.passport_issued_by,
            insurance_commencement_date=application.insurance_commencement_date,
            insurance_duration_months=application.insurance_duration_months,
            type_of_stay=application.type_of_stay,
            files=file_responses,
            created_at=application.created_at,
            updated_at=application.updated_at,
            message="Application created successfully",
        )

    except (ValidationException, FormVaultException, HTTPException):
        db.rollback()
        raise
    except IntegrityError as e:
        db.rollback()
        error_msg = handle_integrity_error(e)
        logger.error(
            "Database integrity error during application creation",
            error=str(e),
            user_friendly_message=error_msg,
        )
        raise ValidationException(error_msg)

    except SQLAlchemyError as e:
        db.rollback()
        logger.error("Database error during application creation", error=str(e))
        raise DatabaseException(
            "Failed to create application due to database error",
            operation="create_application",
        )

    except Exception as e:
        db.rollback()
        logger.error(
            "Unexpected error during application creation", error=str(e), exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while creating the application",
        )


@router.post("/inquire", response_model=LeadInquiryResponseSchema, status_code=201)
@router.post("/leads", response_model=LeadInquiryResponseSchema, status_code=201)
async def create_lead_inquiry(
    inquiry_data: LeadInquiryCreateSchema,
    request: Request,
    db: Session = Depends(get_db),
) -> LeadInquiryResponseSchema:
    """
    Intake complete one-shot student/expatriate insurance requirements and contact details under LEAD_ONLY mode.
    'Collect Once, Reuse Everywhere': gathers complete client identity, stay parameters, and insurance requirements.
    Secures explicit handoff consent and queues for České pojištění a.s. licensed intermediary handling.
    """
    effective_mode = get_effective_scope_mode(db)
    user_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    from app.services.lead_service import create_lead_inquiry as service_create_lead

    try:
        # Create full structured LeadInquiry
        lead = service_create_lead(
            db=db,
            data=inquiry_data,
            client_ip=user_ip,
            user_agent=user_agent,
        )

        # Maintain Application projection record for backward compatibility & direct tracking
        custom_data = {
            "lead_id": lead.id,
            "wechat": lead.wechat_id,
            "wechat_id": lead.wechat_id,
            "preferred_contact_method": lead.preferred_contact_method,
            "student_status": lead.student_status,
            "school_or_university": lead.school_or_university,
            "derived_age": lead.age,
            "derived_age_band": lead.age_band,
            "general_insurance_need": lead.general_insurance_need,
            "special_notes": lead.special_notes,
            "utm_source": lead.utm_source,
            "utm_campaign": lead.utm_campaign,
            "referral_code": lead.referral_code,
        }

        application = app_module.Application(
            id=str(uuid4()),
            reference_number=lead.reference_number,
            first_name=lead.first_name,
            last_name=lead.last_name,
            email=lead.email,
            phone=lead.phone,
            date_of_birth=lead.date_of_birth,
            gender=lead.gender,
            nationality=lead.nationality,
            address_city=lead.current_location,
            type_of_stay=lead.type_of_stay,
            insurance_type="health",
            insurance_duration_months=lead.requested_duration_months,
            insurance_commencement_date=lead.requested_start_date,
            custom_fields_data=json.dumps(custom_data),
            status="submitted",
            regulatory_mode_snapshot=effective_mode,
        )
        db.add(application)
        db.flush()

        # Link consent
        consent = (
            db.query(PartnerHandoffConsent)
            .filter(PartnerHandoffConsent.ip_address == user_ip)
            .order_by(PartnerHandoffConsent.consented_at.desc())
            .first()
        )
        if consent:
            application.handoff_consent_id = consent.id
        lead.converted_application_id = application.id
        db.commit()

        config = db.query(SystemConfig).first()
        recipient_name = getattr(config, "partner_name", None) or "České pojištění a.s."

        return LeadInquiryResponseSchema(
            success=True,
            reference_number=lead.reference_number,
            status=lead.status,
            status_label="Enquiry Received",
            recipient=recipient_name,
            derived_age=lead.age,
            derived_age_band=lead.age_band,
            message=f"Your enquiry has been received. We will forward it to {recipient_name} for insurance handling and the next steps.",
        )
    except Exception as e:
        db.rollback()
        logger.error("Failed to process lead inquiry", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to register insurance enquiry. Please try again later.",
        )


@router.post("/leads/{lead_id}/convert", response_model=ApplicationResponseSchema)
async def convert_lead_to_application_endpoint(
    lead_id: str,
    db: Session = Depends(get_db),
) -> ApplicationResponseSchema:
    """
    Administrative promotion of LeadInquiry into formal Application.
    Transfers all applicant identity and stay data losslessly.
    """
    from app.services.lead_service import convert_lead_to_application

    app_record = convert_lead_to_application(lead_id=lead_id, db=db)
    return ApplicationResponseSchema.model_validate(app_record)


@router.post("/leads/{lead_id}/handoff")
async def handoff_lead_endpoint(
    lead_id: str,
    db: Session = Depends(get_db),
):
    """
    Trigger partner handoff dossier dispatch for a specific lead.
    """
    from app.services.lead_service import LeadHandoffService

    success = LeadHandoffService.handoff_lead(lead_id=lead_id, db=db)
    return {"success": success, "lead_id": lead_id}


@router.get("/", response_model=ApplicationListResponseSchema)
async def list_applications(
    pagination: PaginationParams = Depends(),
    status: Optional[str] = Query(None, description="Filter by application status"),
    insurance_type: Optional[str] = Query(None, description="Filter by insurance type"),
    db: Session = Depends(get_db),
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
    query = db.query(Application)

    # Apply filters
    if status:
        query = query.filter(Application.status == status)
    if insurance_type:
        query = query.filter(Application.insurance_type == insurance_type)

    # Get total count before pagination
    total = query.count()

    # Apply pagination
    applications = (
        query.offset((pagination.page - 1) * pagination.size)
        .limit(pagination.size)
        .all()
    )

    # Convert to response format
    results = []
    for app in applications:
        # Convert files to FileInfoSchema
        file_responses = [
            FileInfoSchema(
                id=file.id,
                file_type=file.file_type,
                original_filename=file.original_filename,
                file_size=file.file_size,
                mime_type=file.mime_type,
                created_at=file.created_at,
            )
            for file in app.files
        ]

        results.append(
            ApplicationResponseSchema(
                id=app.id,
                reference_number=app.reference_number,
                personal_info=PersonalInfoSchema(
                    first_name=app.first_name,
                    last_name=app.last_name,
                    email=app.email,
                    phone=app.phone,
                    address=AddressSchema(
                        street=app.address_street,
                        city=app.address_city,
                        state=app.address_state,
                        zip_code=app.address_zip_code,
                        country=app.address_country,
                    ),
                    date_of_birth=app.date_of_birth,
                ),
                insurance_type=app.insurance_type,
                preferred_language=app.preferred_language,
                status=app.status,
                files=file_responses,
                created_at=app.created_at,
                updated_at=app.updated_at,
            )
        )

    return ApplicationListResponseSchema(
        success=True,
        applications=results,
        message="Applications retrieved successfully",
    )


@router.get("/{application_id}", response_model=ApplicationResponseSchema)
async def get_application(
    application_id: str, db: Session = Depends(get_db)
) -> ApplicationResponseSchema:
    """
    Retrieve a specific insurance application.

    Returns detailed information about a specific application
    including personal information, files, and current status.

    - **application_id**: Unique application identifier
    """
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise ApplicationNotFoundException(application_id)

    file_responses = [
        FileInfoSchema(
            id=file.id,
            file_type=file.file_type,
            original_filename=file.original_filename,
            file_size=file.file_size,
            mime_type=file.mime_type,
            created_at=file.created_at,
        )
        for file in application.files
    ]

    return ApplicationResponseSchema(
        id=application.id,
        reference_number=application.reference_number,
        personal_info=PersonalInfoSchema(
            first_name=application.first_name,
            last_name=application.last_name,
            email=application.email,
            phone=application.phone,
            address=AddressSchema(
                street=application.address_street,
                city=application.address_city,
                state=application.address_state,
                zip_code=application.address_zip_code,
                country=application.address_country,
            ),
            date_of_birth=application.date_of_birth,
        ),
        insurance_type=application.insurance_type,
        preferred_language=application.preferred_language,
        status=application.status,
        insurance_company_id=application.insurance_company_id,
        insurance_plan_id=application.insurance_plan_id,
        gender=application.gender,
        nationality=application.nationality,
        place_of_birth=application.place_of_birth,
        passport_number=application.passport_number,
        passport_expiry_date=application.passport_expiry_date,
        passport_issued_by=application.passport_issued_by,
        insurance_commencement_date=application.insurance_commencement_date,
        insurance_duration_months=application.insurance_duration_months,
        type_of_stay=application.type_of_stay,
        files=file_responses,
        created_at=application.created_at,
        updated_at=application.updated_at,
        message="Application retrieved successfully",
    )


@router.put("/{application_id}", response_model=ApplicationResponseSchema)
async def update_application(
    application_id: str,
    application_data: ApplicationUpdateSchema,
    db: Session = Depends(get_db),
) -> ApplicationResponseSchema:
    """
    Update an existing insurance application.

    Updates the specified application with new information.
    Only applications in 'draft' status can be updated.

    - **application_id**: Unique application identifier
    - **application_data**: Updated application information
    """
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise ApplicationNotFoundException(application_id)

    if application.status != "draft":
        raise ValidationException(
            f"Application with status '{application.status}' cannot be updated. Only 'draft' applications can be updated.",
            field="status",
        )

    # Update fields if provided
    if application_data.personal_info:
        application.first_name = application_data.personal_info.first_name
        application.last_name = application_data.personal_info.last_name
        application.email = application_data.personal_info.email
        application.phone = application_data.personal_info.phone
        application.address_street = application_data.personal_info.address.street
        application.address_city = application_data.personal_info.address.city
        application.address_state = application_data.personal_info.address.state
        application.address_zip_code = application_data.personal_info.address.zip_code
        application.address_country = application_data.personal_info.address.country
        application.date_of_birth = application_data.personal_info.date_of_birth

    if application_data.insurance_type:
        application.insurance_type = application_data.insurance_type

    if application_data.preferred_language:
        application.preferred_language = application_data.preferred_language

    # Update file associations if provided
    if application_data.student_id_file_id:
        student_id_file = (
            db.query(File)
            .filter(
                File.id == application_data.student_id_file_id,
                File.file_type == "student_id",
            )
            .first()
        )
        if not student_id_file:
            raise ValidationException(
                "Invalid student ID file reference", field="student_id_file_id"
            )
        student_id_file.application_id = application.id

    if application_data.passport_file_id:
        passport_file = (
            db.query(File)
            .filter(
                File.id == application_data.passport_file_id,
                File.file_type == "passport",
            )
            .first()
        )
        if not passport_file:
            raise ValidationException(
                "Invalid passport file reference", field="passport_file_id"
            )
        passport_file.application_id = application.id

    db.commit()
    db.refresh(application)

    file_responses = [
        FileInfoSchema(
            id=file.id,
            file_type=file.file_type,
            original_filename=file.original_filename,
            file_size=file.file_size,
            mime_type=file.mime_type,
            created_at=file.created_at,
        )
        for file in application.files
    ]

    return ApplicationResponseSchema(
        id=application.id,
        reference_number=application.reference_number,
        personal_info=PersonalInfoSchema(
            first_name=application.first_name,
            last_name=application.last_name,
            email=application.email,
            phone=application.phone,
            address=AddressSchema(
                street=application.address_street,
                city=application.address_city,
                state=application.address_state,
                zip_code=application.address_zip_code,
                country=application.address_country,
            ),
            date_of_birth=application.date_of_birth,
        ),
        insurance_type=application.insurance_type,
        preferred_language=application.preferred_language,
        status=application.status,
        files=file_responses,
        created_at=application.created_at,
        updated_at=application.updated_at,
        message="Application updated successfully",
    )


@router.post("/{application_id}/submit", response_model=ApplicationSubmitResponseSchema)
async def submit_application(
    application_id: str,
    submit_data: ApplicationSubmitSchema,
    request: Request,
    db: Session = Depends(get_db),
) -> ApplicationSubmitResponseSchema:
    """
    Submit an insurance application for processing.

    Submits the application for processing and triggers email
    export to the insurance company. Application must be complete
    with all required files uploaded.

    - **application_id**: Unique application identifier
    - **confirm_submission**: Confirmation of submission intent
    """
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise ApplicationNotFoundException(application_id)

    if application.status != "draft":
        raise ValidationException(
            f"Application with status '{application.status}' has already been submitted or processed.",
            field="status",
        )

    # Check if necessary files are attached
    has_student_id = any(f.file_type == "student_id" for f in application.files)
    has_passport = any(f.file_type == "passport" for f in application.files)

    if not has_student_id or not has_passport:
        raise ValidationException(
            "Application incomplete: Student ID and Passport are required for submission",
            field="files",
        )

    # Update status
    application.status = "submitted"

    # Create audit log
    user_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    create_audit_log(
        db=db,
        action="application.submitted",
        application_id=application.id,
        user_ip=user_ip,
        user_agent=user_agent,
        details={
            "reference_number": application.reference_number,
            "submitted_at": datetime.utcnow().isoformat(),
        },
    )

    db.commit()
    db.refresh(application)

    # Dispatch customer confirmation email with tracking reference
    try:
        await email_service.send_customer_submission_confirmation(application)
    except Exception as em_err:
        logger.warning(
            "Customer confirmation email dispatch skipped or deferred",
            error=str(em_err),
            reference=application.reference_number,
        )

    return ApplicationSubmitResponseSchema(
        success=True,
        application_id=application.id,
        reference_number=application.reference_number,
        status=application.status,
        submitted_at=datetime.utcnow(),
        message="Application submitted successfully",
    )


@router.delete("/{application_id}", response_model=ResponseBase)
async def delete_application(
    application_id: str, db: Session = Depends(get_db)
) -> ResponseBase:
    """
    Delete an insurance application.

    Permanently deletes an application and all associated files.
    Only applications in 'draft' status can be deleted.

    - **application_id**: Unique application identifier
    """
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise ApplicationNotFoundException(application_id)

    if application.status != "draft":
        raise ValidationException(
            f"Only 'draft' applications can be deleted. Current status: '{application.status}'",
            field="status",
        )

    # Delete associated files from storage (simplified here, should call file_service)
    # The DB files will be deleted by cascade

    db.delete(application)
    db.commit()

    return ResponseBase(
        success=True,
        message=f"Application {application_id} and all associated data deleted successfully",
    )


@router.post(
    "/{application_id}/export",
    response_model=EmailExportResponseSchema,
    status_code=201,
)
async def export_application(
    application_id: str,
    export_request: EmailExportRequestSchema,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
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
        application = (
            db.query(Application).filter(Application.id == application_id).first()
        )

        if not application:
            raise ApplicationNotFoundException(application_id)

        # Validate application status
        if application.status not in ["submitted", "draft"]:
            raise ValidationException(
                f"Application with status '{application.status}' cannot be exported",
                field="status",
            )

        # Create email export record
        email_export = EmailExport(
            id=str(uuid4()),
            application_id=application.id,
            recipient_email=export_request.recipient_email,
            insurance_company=export_request.insurance_company,
            status="pending",
        )

        db.add(email_export)
        db.flush()  # Get the ID without committing

        try:
            # Send email
            success = await email_service.send_application_export(
                application=application,
                recipient_email=export_request.recipient_email,
                insurance_company=export_request.insurance_company,
                additional_notes=export_request.additional_notes,
            )

            if success:
                # Mark as sent
                email_export.mark_as_sent()

                # Update application status if first successful export
                if application.status in ["submitted", "draft"]:
                    application.status = "exported"

                logger.info(
                    "Application exported successfully",
                    application_id=application.id,
                    export_id=email_export.id,
                    recipient=export_request.recipient_email,
                )
            else:
                # Mark for retry
                email_export.mark_for_retry("Email sending failed")

        except (EmailServiceException, Exception) as e:
            # Mark as failed or for retry based on error type
            err_str = str(e).lower()
            if "smtp" in err_str or "connection" in err_str or "unavailable" in err_str:
                email_export.mark_for_retry(str(e))
            else:
                email_export.mark_as_failed(str(e))

            logger.error(
                "Email service error during export",
                application_id=application.id,
                export_id=email_export.id,
                error=str(e),
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
                "files_count": (
                    len(application.files)
                    if isinstance(
                        getattr(application, "files", None), (list, tuple, set)
                    )
                    else 0
                ),
            },
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
            created_at=email_export.created_at or datetime.now(timezone.utc),
            message=f"Email export {'completed successfully' if email_export.is_sent else 'initiated and will be retried if failed'}",
        )

    except (
        ApplicationNotFoundException,
        ValidationException,
        HTTPException,
        DatabaseException,
    ):
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(
            "Database error during email export",
            application_id=application_id,
            error=str(e),
        )
        raise DatabaseException(
            "Failed to create email export due to database error",
            operation="export_application",
        )
    except Exception as e:
        db.rollback()
        logger.error(
            "Unexpected error during email export",
            application_id=application_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while exporting the application",
        )


@router.get("/{application_id}/export-history", response_model=EmailExportHistorySchema)
async def get_export_history(
    application_id: str, db: Session = Depends(get_db)
) -> EmailExportHistorySchema:
    """
    Get email export history for an application.

    Returns the history of email exports for the specified application
    including timestamps, recipients, and status.

    - **application_id**: Unique application identifier
    """
    try:
        # Verify application exists
        application = (
            db.query(Application).filter(Application.id == application_id).first()
        )

        if not application:
            raise ApplicationNotFoundException(application_id)

        # Get all email exports for this application
        exports = (
            db.query(EmailExport)
            .filter(EmailExport.application_id == application_id)
            .order_by(EmailExport.created_at.desc())
            .all()
        )

        # Convert to response format
        export_statuses = [
            EmailExportStatusSchema(
                export_id=export.id,
                status=export.status,
                sent_at=export.sent_at,
                error_message=export.error_message,
                retry_count=export.retry_count,
                created_at=export.created_at,
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
            message="Export history retrieved successfully",
        )

    except (
        ApplicationNotFoundException,
        ValidationException,
        HTTPException,
        DatabaseException,
    ):
        raise
    except SQLAlchemyError as e:
        logger.error(
            "Database error retrieving export history",
            application_id=application_id,
            error=str(e),
        )
        raise DatabaseException(
            "Failed to retrieve export history due to database error",
            operation="get_export_history",
        )
    except Exception as e:
        logger.error(
            "Unexpected error retrieving export history",
            application_id=application_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while retrieving export history",
        )
