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
    crisp_website_id: Optional[str] = None
    crisp_custom_color: Optional[str] = "blue"

    model_config = ConfigDict(from_attributes=True)


class GdprRequestSchema(BaseModel):
    request_type: str  # access, rectification, erasure, portability
    email: str
    full_name: str
    reference_number: Optional[str] = None
    details: Optional[str] = None


class GdprResponseSchema(BaseModel):
    success: bool = True
    ticket_id: str
    message: str

