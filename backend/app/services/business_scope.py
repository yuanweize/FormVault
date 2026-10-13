"""
Business Scope & Public Capability Gating Service.

Strictly enforces partner contractual boundaries between:
- HKTSE s.r.o. (tipař / lead generator / introducer)
- České pojištění a.s. (makléř / licensed insurance intermediary)

In LEAD_ONLY mode, public clients cannot view specific insurer offers,
compare products, view insurer pricing, select products, or upload
sensitive identity/health dossiers. Regulated insurance distribution
and policy conclusion remain exclusively with České pojištění a.s.
"""

from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
import structlog

from ..core.config import get_settings

logger = structlog.get_logger(__name__)


class PublicCapabilities(BaseModel):
    """
    Public customer capabilities strictly gated by regulatory scope mode.
    """

    scope_mode: str
    show_specific_insurers: bool
    show_specific_products: bool
    show_prices: bool
    allow_product_selection: bool
    allow_sensitive_document_upload: bool
    allow_health_questionnaire: bool
    allow_full_application: bool
    allow_basic_lead_intake: bool


def get_effective_scope_mode(db: Optional[Session] = None) -> str:
    """
    Resolve active regulatory scope mode with fail-closed security.
    If non_lead_modes_enabled is False, system unconditionally enforces LEAD_ONLY.
    """
    settings = get_settings()
    configured_mode = "LEAD_ONLY"

    if db is not None:
        try:
            from ..models.system import SystemConfig

            cfg = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
            if cfg and cfg.business_scope_mode:
                configured_mode = cfg.business_scope_mode
        except Exception as e:
            logger.warning(
                "Failed to query SystemConfig for business_scope_mode; falling back to LEAD_ONLY",
                error=str(e),
            )
            configured_mode = "LEAD_ONLY"

    # Fail-closed gate: Non-lead modes require explicit non_lead_modes_enabled flag
    non_lead_enabled = getattr(settings, "NON_LEAD_MODES_ENABLED", False)
    if configured_mode != "LEAD_ONLY" and not non_lead_enabled:
        logger.warning(
            "Regulatory gate active: non-lead mode blocked because non_lead_modes_enabled is False. Forcing LEAD_ONLY.",
            attempted_mode=configured_mode,
        )
        return "LEAD_ONLY"

    return configured_mode


def get_public_capabilities(db: Optional[Session] = None) -> PublicCapabilities:
    """
    Return capability matrix for public clients based on effective scope mode.
    """
    scope = get_effective_scope_mode(db)

    if scope == "LEAD_ONLY":
        return PublicCapabilities(
            scope_mode="LEAD_ONLY",
            show_specific_insurers=False,
            show_specific_products=False,
            show_prices=False,
            allow_product_selection=False,
            allow_sensitive_document_upload=False,
            allow_health_questionnaire=False,
            allow_full_application=False,
            allow_basic_lead_intake=True,
        )
    elif scope == "ASSISTED_APPLICATION":
        return PublicCapabilities(
            scope_mode="ASSISTED_APPLICATION",
            show_specific_insurers=True,
            show_specific_products=True,
            show_prices=True,
            allow_product_selection=True,
            allow_sensitive_document_upload=True,
            allow_health_questionnaire=True,
            allow_full_application=True,
            allow_basic_lead_intake=True,
        )
    else:  # REGULATED_DISTRIBUTION
        return PublicCapabilities(
            scope_mode=scope,
            show_specific_insurers=True,
            show_specific_products=True,
            show_prices=True,
            allow_product_selection=True,
            allow_sensitive_document_upload=True,
            allow_health_questionnaire=True,
            allow_full_application=True,
            allow_basic_lead_intake=True,
        )


def is_lead_only(db: Optional[Session] = None) -> bool:
    """
    Check if current operation is restricted to LEAD_ONLY mode.
    """
    return get_effective_scope_mode(db) == "LEAD_ONLY"
