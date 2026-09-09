"""
Pydantic schemas for the customer-facing insurance portal showcase.
"""

from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class InsuranceCompanyShowcaseSchema(BaseModel):
    id: int
    name: str
    code: str
    logo_url: Optional[str] = None
    rating: str
    website: Optional[str] = None
    description: Optional[str] = None
    display_order: int

    model_config = ConfigDict(from_attributes=True)


class InsurancePlanShowcaseSchema(BaseModel):
    id: int
    company_id: int
    company_name: str
    company_code: str
    name: str
    category: str
    price_amount: float
    currency: str
    billing_period: str
    coverage_summary: str
    badge: Optional[str] = None
    target_audience: Optional[str] = None
    features: Optional[str] = None
    is_featured: bool
    display_order: int

    model_config = ConfigDict(from_attributes=True)


class AgencyBannerShowcaseSchema(BaseModel):
    id: int
    title: str
    subtitle: Optional[str] = None
    tag: str
    link_url: Optional[str] = None
    button_text: str
    display_order: int

    model_config = ConfigDict(from_attributes=True)


class PortalShowcaseResponseSchema(BaseModel):
    success: bool = True
    banners: List[AgencyBannerShowcaseSchema]
    companies: List[InsuranceCompanyShowcaseSchema]
    plans: List[InsurancePlanShowcaseSchema]


class PortalPublicConfigSchema(BaseModel):
    success: bool = True
    site_title: str
    site_description: Optional[str] = None
    site_icon_url: str = "/favicon.svg"
    support_email: str
    broker_legal_disclosure: Optional[str] = "HKTSE s.r.o. (IČO: 10858032) technical platform in authorized cooperation with České pojištění a.s. (ČNB registered intermediary)."
    production_ingress_name: Optional[str] = "Cloudflare Tunnel"
    primary_domain: Optional[str] = "insure.hktse.eu.org"
    secondary_domain: Optional[str] = "pojisteni.hktse.eu.org"
    crisp_website_id: Optional[str] = None
    crisp_custom_color: Optional[str] = "blue"
    form_profile_config: Optional[str] = None
    features_config: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CrispVerifyRequestSchema(BaseModel):
    website_id: str


class CrispVerifyResponseSchema(BaseModel):
    valid: bool
    message: str
    website_name: Optional[str] = None
    domain: Optional[str] = None
    online: Optional[bool] = None
    operators_count: Optional[int] = 0


class GDPRRequestSchema(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    email: str
    request_type: str  # access, rectification, erasure, portability
    reference_number: Optional[str] = None
    details: Optional[str] = None


class GDPRResponseSchema(BaseModel):
    success: bool = True
    ticket_id: str
    message: str


# Case-insensitive aliases
GdprRequestSchema = GDPRRequestSchema
GdprResponseSchema = GDPRResponseSchema
