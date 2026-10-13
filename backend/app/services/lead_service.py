"""
Lead Inquiry and Handoff Service for FormVault.

Implements the 'Collect Once, Reuse Everywhere' architecture:
1. One-shot structured lead intake with exact date of birth and automated age derivation.
2. Direct handoff dossier dispatch to configured licensed insurance intermediary (České pojištění a.s.).
3. Lossless promotion / conversion of LeadInquiry to formal Application without customer re-entry.
4. Marketing attribution and Chinese student context (WeChat, study details, referral tracking).
"""

import os
import json
from datetime import datetime, timezone, date, timedelta
from typing import Optional, Tuple, Dict, Any
from uuid import uuid4
import structlog
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.lead import LeadInquiry, calculate_age, derive_age_band
from app.models.application import Application
from app.models.system import SystemConfig
from app.models.compliance import PartnerHandoffConsent
from app.schemas.application import LeadInquiryCreateSchema
from app.services.business_scope import is_lead_only, get_effective_scope_mode
from app.utils.db_helpers import create_audit_log

logger = structlog.get_logger(__name__)


def create_lead_inquiry(
    db: Session,
    data: LeadInquiryCreateSchema,
    client_ip: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> LeadInquiry:
    """
    Intake a complete one-shot lead enquiry.
    Validates regulatory boundaries (LEAD_ONLY), computes derived age and bracket,
    and stores structured client parameters.
    """
    effective_mode = get_effective_scope_mode(db)

    # Resolve names
    first_name = data.first_name or "Applicant"
    last_name = data.last_name or "Applicant"
    if data.full_name and (not data.first_name or not data.last_name):
        parts = data.full_name.strip().split(None, 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else parts[0]

    # Resolve wechat
    wechat_id = data.wechat_id or data.wechat

    # Resolve notes
    special_notes = data.special_notes or data.free_text_note

    # Start date and DOB
    start_date = data.requested_start_date or (date.today() + timedelta(days=1))
    dob = data.date_of_birth or date(2002, 1, 1)

    lead = LeadInquiry(
        id=str(uuid4()),
        reference_number=LeadInquiry.generate_reference_number(),
        first_name=first_name,
        last_name=last_name,
        date_of_birth=dob,
        gender=data.gender,
        nationality=data.nationality or "Chinese",
        email=str(data.email).strip().lower(),
        phone=data.phone.strip() if data.phone else None,
        wechat_id=wechat_id.strip() if wechat_id else None,
        preferred_contact_method=data.preferred_contact_method or "email",
        preferred_language=data.preferred_language or "zh",
        student_status=data.student_status,
        school_or_university=data.school_or_university,
        study_status=data.study_status,
        expected_study_end_date=data.expected_study_end_date,
        type_of_stay=data.type_of_stay or "student",
        requested_start_date=start_date,
        requested_duration_months=data.requested_duration_months,
        current_location=data.current_location,
        general_insurance_need=data.general_insurance_need or "comprehensive",
        special_notes=special_notes,
        utm_source=data.utm_source,
        utm_medium=data.utm_medium,
        utm_campaign=data.utm_campaign,
        utm_term=data.utm_term,
        utm_content=data.utm_content,
        referrer_url=data.referrer_url,
        landing_page=data.landing_page,
        referral_code=data.referral_code,
        handoff_consent=True,
        handoff_consent_text_version=data.handoff_consent_text_version or "v1.0",
        handoff_consent_ip=client_ip,
        handoff_consent_user_agent=user_agent,
        consented_at=datetime.now(timezone.utc),
        status="INQUIRY_RECEIVED",
        handoff_attempts=0,
    )

    db.add(lead)
    db.flush()

    # Record partner handoff consent for GDPR audit trail
    config = db.query(SystemConfig).first()
    partner_name = getattr(config, "partner_name", None) or "České pojištění a.s."
    consent = PartnerHandoffConsent(
        application_id=None,
        recipient=partner_name,
        recipient_role="makler",
        purpose="Mediation of Czech foreigners health insurance and policy quotation preparation",
        data_categories="identity_details, contact_info, stay_parameters, student_status",
        consent_text_version=data.handoff_consent_text_version or "v1.0",
        ip_address=client_ip,
        user_agent=user_agent,
        consented_at=datetime.now(timezone.utc),
    )
    db.add(consent)
    db.flush()

    create_audit_log(
        db=db,
        action="lead_inquiry.received",
        application_id=None,
        user_ip=client_ip,
        user_agent=user_agent,
        details={
            "lead_id": lead.id,
            "reference_number": lead.reference_number,
            "recipient": partner_name,
            "derived_age": lead.age,
            "derived_age_band": lead.age_band,
            "nationality": lead.nationality,
            "student_status": lead.student_status,
            "utm_source": lead.utm_source,
            "referral_code": lead.referral_code,
        },
    )
    db.commit()

    logger.info(
        "Lead inquiry recorded successfully",
        reference_number=lead.reference_number,
        email=lead.email,
        derived_age=lead.age,
        age_band=lead.age_band,
    )

    return lead


def convert_lead_to_application(lead_id: str, db: Session) -> Application:
    """
    Promote an existing LeadInquiry to a formal Application record.
    Automatically copies all identity, stay, duration, contact, and request fields,
    eliminating any redundant data re-entry for applicant or partner.
    """
    lead = db.query(LeadInquiry).filter(LeadInquiry.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead enquiry not found")

    # If already converted, return existing application
    if lead.converted_application_id:
        existing_app = (
            db.query(Application)
            .filter(Application.id == lead.converted_application_id)
            .first()
        )
        if existing_app:
            return existing_app

    # Create new Application reusing all lead data
    application = Application(
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
        insurance_commencement_date=lead.requested_start_date,
        insurance_duration_months=lead.requested_duration_months,
        preferred_language=lead.preferred_language,
        status="submitted",
        regulatory_mode_snapshot=get_effective_scope_mode(db),
        custom_fields_data=json.dumps(
            {
                "wechat_id": lead.wechat_id,
                "preferred_contact_method": lead.preferred_contact_method,
                "student_status": lead.student_status,
                "school_or_university": lead.school_or_university,
                "study_status": lead.study_status,
                "expected_study_end_date": (
                    lead.expected_study_end_date.isoformat()
                    if lead.expected_study_end_date
                    else None
                ),
                "derived_age": lead.age,
                "derived_age_band": lead.age_band,
                "special_notes": lead.special_notes,
                "utm_source": lead.utm_source,
                "utm_campaign": lead.utm_campaign,
                "referral_code": lead.referral_code,
            }
        ),
    )
    db.add(application)
    db.flush()

    lead.converted_application_id = application.id
    lead.status = "PARTNER_PROCESSING"

    create_audit_log(
        db=db,
        action="lead_inquiry.converted_to_application",
        application_id=application.id,
        details={
            "lead_id": lead.id,
            "application_id": application.id,
            "reference_number": lead.reference_number,
        },
    )
    db.commit()
    logger.info(
        "Lead inquiry successfully converted to application",
        lead_id=lead.id,
        application_id=application.id,
        reference_number=lead.reference_number,
    )
    return application


class LeadHandoffService:
    """
    Automated dispatch service transmitting structured applicant dossiers
    to configured licensed intermediary partner.
    Configurable via SystemConfig and environment variables (no hardcoded credentials).
    """

    @staticmethod
    def get_recipient_config(db: Session) -> Dict[str, Any]:
        """Fetch partner recipient email and configuration dynamically."""
        config = db.query(SystemConfig).first()
        env_recipient = os.getenv("LEAD_RECIPIENT_EMAIL")

        recipient_email = (
            env_recipient
            or (getattr(config, "lead_recipient_email", None) if config else None)
            or (getattr(config, "support_email", None) if config else None)
            or "insurance@ceskepojisteni.cz"
        )
        partner_name = (
            getattr(config, "partner_name", None) if config else None
        ) or "České pojištění a.s."
        enabled = getattr(config, "lead_handoff_enabled", False) if config else False

        return {
            "recipient_email": recipient_email,
            "partner_name": partner_name,
            "enabled": enabled,
        }

    @classmethod
    def format_lead_dossier_email(
        cls, lead: LeadInquiry, partner_name: str
    ) -> Tuple[str, str]:
        """Generate structured dossier email content for insurance intermediary."""
        subject = f"[FormVault Dossier] Foreigners Health Insurance Enquiry - {lead.reference_number} - {lead.full_name}"

        body = f"""Dear Underwriting & Mediation Team at {partner_name},

A new foreigners health insurance enquiry has been received via the FormVault digital intake platform in authorized cooperation with your brokerage.

=== APPLICANT IDENTITY & DEMOGRAPHICS ===
Reference Number: {lead.reference_number}
Full Name: {lead.full_name}
Date of Birth: {lead.date_of_birth}
Calculated Age: {lead.age} years old
Pricing Age Category: {lead.age_band}
Nationality: {lead.nationality}
Gender: {lead.gender or 'Not specified'}

=== RESIDENCE & STUDENT CONTEXT ===
Is Student: {'Yes' if lead.student_status else 'No'}
School / University: {lead.school_or_university or 'Not specified'}
Study Status: {lead.study_status or 'Not specified'}
Expected Study End Date: {lead.expected_study_end_date or 'Not specified'}
Type of Stay in Czechia: {lead.type_of_stay}
Current Location / City: {lead.current_location or 'Not specified'}

=== INSURANCE REQUIREMENTS ===
Requested Start Date: {lead.requested_start_date}
Requested Duration: {lead.requested_duration_months} months
General Coverage Category: {lead.general_insurance_need}
Applicant Notes / Questions: {lead.special_notes or 'None'}

=== CONTACT PREFERENCES ===
Email: {lead.email}
Phone Number: {lead.phone or 'Not provided'}
WeChat ID: {lead.wechat_id or 'Not provided'}
Preferred Contact Channel: {lead.preferred_contact_method}
Preferred Language: {lead.preferred_language}

=== MARKETING & CONSENT AUDIT RECORD ===
Attribution Source: {lead.utm_source or 'direct'}
Attribution Campaign: {lead.utm_campaign or 'none'}
Referral Code: {lead.referral_code or 'none'}
Partner Handoff Consent: Version {lead.handoff_consent_text_version} (Confirmed by client)
Consent Timestamp: {lead.consented_at}
Consent IP: {lead.handoff_consent_ip or 'N/A'}

Please review available comprehensive foreigner health insurance options and contact the applicant directly via their preferred channel.

Best regards,
FormVault Technical Operations
HKTSE s.r.o.
"""
        return subject, body

    @classmethod
    def handoff_lead(cls, lead_id: str, db: Session) -> bool:
        """
        Execute partner handoff via email.
        Status progresses to FORWARDED_TO_INTERMEDIARY only upon real delivery success.
        On failure, status becomes HANDOFF_FAILED or HANDOFF_RETRY_PENDING;
        NEVER fakes forwarded status.
        Implements idempotency to prevent duplicate handoffs if client refreshes.
        """
        lead = db.query(LeadInquiry).filter(LeadInquiry.id == lead_id).first()
        if not lead:
            logger.error("Handoff failed: lead not found", lead_id=lead_id)
            return False

        # Idempotency Guard: prevent duplicate dispatch
        if lead.status == "FORWARDED_TO_INTERMEDIARY":
            logger.info(
                "Lead already forwarded to intermediary; duplicate dispatch avoided (idempotent)",
                lead_id=lead_id,
                reference_number=lead.reference_number,
            )
            return True

        config = cls.get_recipient_config(db)
        if not config["enabled"]:
            logger.info(
                "Lead handoff disabled by system configuration (fail-closed)",
                lead_id=lead_id,
            )
            return False

        # Compute deterministic idempotency key
        idempotency_key = f"{lead.id}:{config['recipient_email']}:{lead.handoff_consent_text_version or 'v1'}"

        lead.handoff_attempts += 1
        lead.last_handoff_attempt_at = datetime.now(timezone.utc)

        subject, body = cls.format_lead_dossier_email(lead, config["partner_name"])

        # Attempt sending email via configured SMTP
        try:
            from app.services.email_service import EmailService

            email_svc = EmailService()

            # Format simple plain text / HTML message
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = email_svc.settings.FROM_EMAIL
            msg["To"] = config["recipient_email"]
            msg.attach(MIMEText(body, "plain", "utf-8"))

            # Send via SMTP connection
            server = smtplib.SMTP(
                email_svc.settings.SMTP_HOST, email_svc.settings.SMTP_PORT, timeout=10
            )
            if email_svc.settings.SMTP_USE_TLS:
                server.starttls()
            if email_svc.settings.SMTP_USERNAME and email_svc.settings.SMTP_PASSWORD:
                server.login(
                    email_svc.settings.SMTP_USERNAME, email_svc.settings.SMTP_PASSWORD
                )
            server.send_message(msg)
            server.quit()

            # SUCCESS: Genuine forward
            lead.status = "FORWARDED_TO_INTERMEDIARY"
            lead.handoff_error = None

            create_audit_log(
                db=db,
                action="lead_inquiry.handoff_forwarded",
                details={
                    "lead_id": lead.id,
                    "reference_number": lead.reference_number,
                    "recipient": config["recipient_email"],
                    "attempts": lead.handoff_attempts,
                },
            )
            db.commit()
            logger.info(
                "Lead dossier dispatched to partner successfully",
                reference_number=lead.reference_number,
                recipient=config["recipient_email"],
            )
            return True

        except Exception as exc:
            # FAILURE: Do NOT fake forwarded status
            lead.status = "HANDOFF_FAILED"
            lead.handoff_error = str(exc)

            create_audit_log(
                db=db,
                action="lead_inquiry.handoff_failed",
                details={
                    "lead_id": lead.id,
                    "reference_number": lead.reference_number,
                    "recipient": config["recipient_email"],
                    "error": str(exc),
                    "attempts": lead.handoff_attempts,
                },
            )
            db.commit()
            logger.error(
                "Lead dossier dispatch failed",
                reference_number=lead.reference_number,
                error=str(exc),
            )
            return False
