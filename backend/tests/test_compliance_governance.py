"""
Tests for Regulatory Governance, Cryptographic Audit Hash Chaining,
Product & Pricing Versioning, and Business Scope Gate.
"""

import os
from datetime import datetime, timezone, timedelta
import pytest
from sqlalchemy.orm import Session

from app.models.system import SystemConfig
from app.models.audit_log import AuditLog
from app.models.compliance import (
    EvidenceRecord,
    ProductVersion,
    PriceBook,
    PriceRate,
    PartnerHandoffConsent,
    LegalDocumentVersion,
)
from app.services.seed_service import seed_demo_defaults


def test_polyform_license_and_commercial_notice_exist():
    """Verify that PolyForm Noncommercial 1.0.0 and commercial notices are properly structured."""
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    license_path = os.path.join(root_dir, "LICENSE")
    commercial_path = os.path.join(root_dir, "COMMERCIAL-LICENSE.md")
    trademarks_path = os.path.join(root_dir, "TRADEMARKS.md")
    notice_path = os.path.join(root_dir, "NOTICE")

    assert os.path.exists(license_path), "LICENSE must exist"
    assert os.path.exists(commercial_path), "COMMERCIAL-LICENSE.md must exist"
    assert os.path.exists(trademarks_path), "TRADEMARKS.md must exist"
    assert os.path.exists(notice_path), "NOTICE must exist"

    with open(license_path, "r", encoding="utf-8") as f:
        license_txt = f.read()
    assert "PolyForm Noncommercial License 1.0.0" in license_txt
    assert "for any noncommercial purpose" in license_txt
    assert (
        "Any noncommercial purpose is any purpose that is not a commercial purpose"
        in license_txt
    )

    with open(commercial_path, "r", encoding="utf-8") as f:
        commercial_txt = f.read()
    assert "Commercial Licensing & Enterprise Dual-License Notice" in commercial_txt
    assert "licensing@hktse.eu.org" in commercial_txt


def test_business_scope_mode_default_and_gate(db: Session):
    """Verify that business_scope_mode defaults to LEAD_ONLY and can be configured."""
    seed_demo_defaults(db)
    config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    assert config is not None
    assert config.business_scope_mode == "LEAD_ONLY"
    assert config.operator_role == "tipar"
    assert config.partner_role == "makler"
    assert config.relationship_status == "VERIFIED"
    assert config.operator_website_url == "https://hktse.eu.org"
    assert config.partner_website_url == "https://ceskepojisteni.cz"

    # Verify transition to ASSISTED_APPLICATION
    config.business_scope_mode = "ASSISTED_APPLICATION"
    db.commit()
    db.refresh(config)
    assert config.business_scope_mode == "ASSISTED_APPLICATION"


def test_audit_log_cryptographic_hash_chain(db: Session):
    """Verify that AuditLog entries maintain an immutable cryptographic SHA-256 hash chain."""
    from app.utils.db_helpers import create_audit_log

    log1 = create_audit_log(
        db=db,
        action="user.login",
        user_ip="127.0.0.1",
        user_agent="pytest-client",
        details={"username": "admin"},
    )
    db.commit()
    assert log1 is not None
    assert log1.sequence is not None
    assert log1.entry_hash is not None

    # Calculate expected hash
    expected_hash_1 = AuditLog.calculate_entry_hash(
        prev_hash=log1.prev_hash,
        sequence=log1.sequence,
        created_at=log1.created_at,
        action=log1.action,
        application_id=log1.application_id,
        details=log1.details,
    )
    assert log1.entry_hash == expected_hash_1

    # Second log must chain to the first
    log2 = create_audit_log(
        db=db,
        action="policy.viewed",
        user_ip="127.0.0.1",
        details={"plan_id": 1},
    )
    db.commit()
    assert log2 is not None
    assert log2.sequence == log1.sequence + 1
    assert log2.prev_hash == log1.entry_hash

    expected_hash_2 = AuditLog.calculate_entry_hash(
        prev_hash=log2.prev_hash,
        sequence=log2.sequence,
        created_at=log2.created_at,
        action=log2.action,
        application_id=log2.application_id,
        details=log2.details,
    )
    assert log2.entry_hash == expected_hash_2


def test_product_versioning_and_historical_protection(db: Session):
    """Verify that historical or unverified product versions cannot be actively valid."""
    now = datetime.now(timezone.utc)

    # Active valid version
    pv_active = ProductVersion(
        company_id=1,
        product_name="Active Test Product",
        product_code="TEST-ACT-01",
        version="2026.1",
        valid_from=now - timedelta(days=10),
        valid_until=now + timedelta(days=365),
        status="VERIFIED",
        currency="CZK",
        coverage_summary="Test coverage",
    )
    db.add(pv_active)

    # Historical product version
    pv_historical = ProductVersion(
        company_id=1,
        product_name="Historical Test Product",
        product_code="TEST-HIST-01",
        version="2024.1",
        valid_from=now - timedelta(days=700),
        valid_until=now - timedelta(days=365),
        status="HISTORICAL",
        currency="CZK",
        coverage_summary="Expired test coverage",
    )
    db.add(pv_historical)
    db.commit()

    assert pv_active.is_currently_valid() is True
    assert pv_historical.is_currently_valid() is False


def test_partner_handoff_consent(db: Session):
    """Verify recording of applicant consent for partner handoff under DPA."""
    consent = PartnerHandoffConsent(
        application_id="app-test-uuid-1234",
        recipient="České pojištění a.s.",
        recipient_role="makler",
        purpose="Insurance quotation and intermediation per Act No. 170/2018 Coll.",
        data_categories="contact, passport, stay_parameters",
        consent_text_version="v1.0.0",
        ip_address="192.168.1.100",
        user_agent="Mozilla/5.0",
        consented_at=datetime.now(timezone.utc),
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)

    assert consent.id is not None
    assert consent.recipient == "České pojištění a.s."
    assert consent.recipient_role == "makler"
