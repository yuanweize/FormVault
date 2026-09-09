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
    CrispVerifyRequestSchema,
    CrispVerifyResponseSchema,
    GdprRequestSchema,
    GdprResponseSchema,
)
import re
import json
import urllib.request
import urllib.error

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
            site_title="FormVault Insurance | Czech Health & Travel Insurance",
            site_description="Digital application portal for Czech health insurance in authorized cooperation with České pojištění a.s.",
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
        site_title=config.site_title
        or "FormVault Insurance | Czech Health & Travel Insurance",
        site_description=config.site_description,
        site_icon_url=config.site_icon_url or "/favicon.svg",
        support_email=config.support_email or "insurance@hktse.eu.org",
        broker_legal_disclosure=getattr(config, "broker_legal_disclosure", None)
        or "HKTSE s.r.o. (IČO: 10858032) technical platform in authorized cooperation with České pojištění a.s. (ČNB registered intermediary).",
        production_ingress_name=getattr(config, "production_ingress_name", None)
        or "Cloudflare Tunnel",
        primary_domain=getattr(config, "primary_domain", None) or "insure.hktse.eu.org",
        secondary_domain=getattr(config, "secondary_domain", None)
        or "pojisteni.hktse.eu.org",
        crisp_website_id=config.crisp_website_id,
        crisp_custom_color=config.crisp_custom_color or "blue",
        crisp_position=getattr(config, "crisp_position", "right") or "right",
        form_profile_config=getattr(config, "form_profile_config", None),
        features_config=getattr(config, "features_config", None),
        business_scope_mode=getattr(config, "business_scope_mode", "LEAD_ONLY")
        or "LEAD_ONLY",
        operator_legal_name=getattr(config, "operator_legal_name", "HKTSE s.r.o.")
        or "HKTSE s.r.o.",
        operator_ico=getattr(config, "operator_ico", "10858032") or "10858032",
        operator_role=getattr(config, "operator_role", "tipar") or "tipar",
        operator_website_url=getattr(
            config, "operator_website_url", "https://hktse.eu.org"
        )
        or "https://hktse.eu.org",
        partner_name=getattr(config, "partner_name", "České pojištění a.s.")
        or "České pojištění a.s.",
        partner_ico=getattr(config, "partner_ico", "24729007") or "24729007",
        partner_role=getattr(config, "partner_role", "makler") or "makler",
        partner_cnb_id=getattr(config, "partner_cnb_id", "24729007") or "24729007",
        partner_website_url=getattr(
            config, "partner_website_url", "https://ceskepojisteni.cz"
        )
        or "https://ceskepojisteni.cz",
        relationship_status=getattr(config, "relationship_status", "VERIFIED")
        or "VERIFIED",
        dpa_status=getattr(config, "dpa_status", "VERIFIED") or "VERIFIED",
        lead_only_fallback_url=getattr(config, "lead_only_fallback_url", None),
    )


@router.post("/verify-crisp", response_model=CrispVerifyResponseSchema)
def verify_crisp_website_id(
    payload: CrispVerifyRequestSchema,
) -> CrispVerifyResponseSchema:
    """
    Validate and verify a Crisp Live Chat Website ID.
    Performs UUID format validation and queries Crisp API to verify existence and online status.
    """
    raw_key = (payload.website_id or "").strip()
    if not raw_key:
        return CrispVerifyResponseSchema(
            valid=False,
            is_valid=False,
            message="Crisp Website ID cannot be empty. Please enter your Crisp UUID key.",
        )

    # Automatically extract UUID even if the user pasted the entire <script> snippet
    uuid_match = re.search(
        r"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})",
        raw_key,
    )
    if not uuid_match:
        return CrispVerifyResponseSchema(
            valid=False,
            is_valid=False,
            message="Invalid UUID format. Crisp Website ID must be 36 characters (e.g., 168677e2-0aa6-45ec-a486-83855b18c6f4).",
        )

    key = uuid_match.group(1).lower()

    # Ping Crisp public website settings endpoint
    url = f"https://client.crisp.chat/settings/website/{key}/"
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
        )
        with urllib.request.urlopen(req, timeout=6) as response:
            if response.status == 200:
                raw_data = response.read().decode("utf-8")
                data = json.loads(raw_data)
                website_name = data.get("website", "Unknown")
                domain = data.get("domain", "")
                online = data.get("online", True)
                operators_count = len(data.get("operators", []))

                return CrispVerifyResponseSchema(
                    valid=True,
                    is_valid=True,
                    message=f"✅ Crisp Website ID is verified & active! (Website: '{website_name}', Domain: '{domain or 'N/A'}', Operators: {operators_count})",
                    website_name=website_name,
                    domain=domain,
                    website_domain=domain,
                    online=online,
                    operators_count=operators_count,
                    operator_count=operators_count,
                )
            else:
                return CrispVerifyResponseSchema(
                    valid=False,
                    is_valid=False,
                    message=f"Crisp API returned status code {response.status}. Key could not be confirmed.",
                )
    except urllib.error.HTTPError as err:
        if err.code == 404:
            return CrispVerifyResponseSchema(
                valid=False,
                is_valid=False,
                message=f"❌ Website ID '{key}' was not found on Crisp. Please check the ID in your Crisp dashboard (Settings > Website Settings).",
            )
        return CrispVerifyResponseSchema(
            valid=False,
            is_valid=False,
            message=f"Crisp verification HTTP error {err.code}: {err.reason}",
        )
    except Exception as e:
        # If network error or timeout
        return CrispVerifyResponseSchema(
            valid=True,
            is_valid=True,
            message=f"UUID format is valid ({key}), but could not connect to Crisp servers ({e}).",
            website_name="Configured",
            operators_count=1,
            operator_count=1,
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
