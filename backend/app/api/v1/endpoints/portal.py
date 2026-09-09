"""
Public portal showcase and configuration endpoints for customer-facing frontend.

Provides dynamic listings of insurance partner companies, curated insurance plans,
agency announcement banners, site branding/support configuration, and GDPR rights intake.
"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime, timezone

from app.database import get_db
from app.models.partner import InsuranceCompany, InsurancePlan, AgencyBanner
from app.models.system import SystemConfig
from app.services.seed_service import seed_czech_broker_defaults
from app.utils.db_helpers import create_audit_log
from app.schemas.portal import (
    PortalShowcaseResponseSchema,
    InsuranceCompanyShowcaseSchema,
    InsurancePlanShowcaseSchema,
    AgencyBannerShowcaseSchema,
    PortalPublicConfigSchema,
    GdprRequestSchema,
    GdprResponseSchema,
)

router = APIRouter()


@router.get("/config", response_model=PortalPublicConfigSchema)
def get_portal_public_config(db: Session = Depends(get_db)) -> PortalPublicConfigSchema:
    """
    Retrieve public site configuration (site title, support email, Crisp chat ID).
    Used by frontend to dynamically render branding and initialize customer care.
    """
    config = db.query(SystemConfig).first()
    if not config:
        config = SystemConfig(
            site_title="FormVault Insurance | Official Broker in Czechia",
            site_description="Licensed insurance brokerage for international students and expatriates in the Czech Republic.",
            site_icon_url="/favicon.svg",
            support_email="insurance@hktse.eu.org",
            crisp_website_id=None,
            crisp_custom_color="blue",
        )
        try:
            db.add(config)
            db.commit()
            db.refresh(config)
        except Exception:
            db.rollback()

    return PortalPublicConfigSchema(
        success=True,
        site_title=config.site_title or "FormVault Insurance | Official Broker in Czechia",
        site_description=config.site_description,
        site_icon_url=config.site_icon_url or "/favicon.svg",
        support_email=config.support_email or "insurance@hktse.eu.org",
        crisp_website_id=config.crisp_website_id,
        crisp_custom_color=config.crisp_custom_color or "blue",
    )


@router.get("/showcase", response_model=PortalShowcaseResponseSchema)
def get_portal_showcase(db: Session = Depends(get_db)) -> PortalShowcaseResponseSchema:
    """
    Retrieve broker showcase data for the portal homepage.
    Includes active promotional banners, verified partner insurance companies,
    and featured insurance packages.
    """
    # Seed default templates if completely empty
    company_count = db.query(InsuranceCompany).count()
    if company_count == 0:
        try:
            seed_czech_broker_defaults(db)
        except Exception:
            db.rollback()

    # Query active banners
    banners = (
        db.query(AgencyBanner)
        .filter(AgencyBanner.is_active == True)
        .order_by(AgencyBanner.display_order.asc(), AgencyBanner.id.asc())
        .all()
    )
    banner_items = [
        AgencyBannerShowcaseSchema(
            id=b.id,
            title=b.title,
            subtitle=b.subtitle,
            tag=b.tag,
            link_url=b.link_url,
            button_text=b.button_text,
            display_order=b.display_order,
        )
        for b in banners
    ]

    # Query active insurance companies
    companies = (
        db.query(InsuranceCompany)
        .filter(InsuranceCompany.is_active == True)
        .order_by(InsuranceCompany.display_order.asc(), InsuranceCompany.id.asc())
        .all()
    )
    company_items = [
        InsuranceCompanyShowcaseSchema(
            id=c.id,
            name=c.name,
            code=c.code,
            logo_url=c.logo_url,
            rating=c.rating,
            website=c.website,
            description=c.description,
            display_order=c.display_order,
        )
        for c in companies
    ]

    # Query active insurance plans
    plans = (
        db.query(InsurancePlan)
        .filter(InsurancePlan.is_active == True)
        .order_by(InsurancePlan.display_order.asc(), InsurancePlan.id.asc())
        .all()
    )
    plan_items = []
    for p in plans:
        company_name = p.company.name if p.company else "Direct Partner"
        company_code = p.company.code if p.company else "DIRECT"
        plan_items.append(
            InsurancePlanShowcaseSchema(
                id=p.id,
                company_id=p.company_id,
                company_name=company_name,
                company_code=company_code,
                name=p.name,
                category=p.category,
                price_amount=p.price_amount,
                currency=p.currency,
                billing_period=p.billing_period,
                coverage_summary=p.coverage_summary,
                badge=p.badge,
                target_audience=p.target_audience,
                features=p.features,
                is_featured=p.is_featured,
                display_order=p.display_order,
            )
        )

    return PortalShowcaseResponseSchema(
        success=True,
        banners=banner_items,
        companies=company_items,
        plans=plan_items,
    )


@router.post("/gdpr-request", response_model=GdprResponseSchema)
def submit_gdpr_request(
    request_data: GdprRequestSchema,
    request: Request,
    db: Session = Depends(get_db),
) -> GdprResponseSchema:
    """
    Intake customer GDPR Data Subject Access, Rectification, or Erasure requests.
    Logs an immutable audit entry and generates a compliance tracking ticket.
    """
    ticket_id = f"GDPR-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    user_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    create_audit_log(
        db=db,
        action="gdpr.request_submitted",
        user_ip=user_ip,
        user_agent=user_agent,
        details={
            "ticket_id": ticket_id,
            "request_type": request_data.request_type,
            "applicant_email": request_data.email,
            "applicant_name": request_data.full_name,
            "reference_number": request_data.reference_number,
            "details": request_data.details,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    db.commit()

    return GdprResponseSchema(
        success=True,
        ticket_id=ticket_id,
        message=f"Your GDPR {request_data.request_type} request has been officially recorded under reference {ticket_id}. Under EU GDPR Article 12, our Data Protection Officer will review and respond within 30 calendar days.",
    )
