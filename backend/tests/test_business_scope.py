"""
Regression test suite for LEAD_ONLY regulatory mode enforcement and Fail-Closed Business Scope Gate.

Verifies:
1. test_lead_only_showcase_hides_insurers_and_plans: /api/v1/portal/showcase returns empty companies/plans in LEAD_ONLY
2. test_lead_only_rejects_specific_product_selection: POST /api/v1/applications/ rejects insurer/plan IDs
3. test_lead_only_rejects_passport_upload: POST /api/v1/files/ rejects passport file uploads
4. test_lead_only_accepts_basic_inquiry: POST /api/v1/applications/inquire successfully ingests basic lead & consent
5. test_lead_only_rejects_inquiry_without_consent: POST /api/v1/applications/inquire rejects without explicit handoff consent
6. test_fail_closed_prevents_unauthorized_scope_switch: Non-lead modes remain gated when non_lead_modes_enabled=False
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from io import BytesIO

from app.main import app
from app.models.system import SystemConfig
from app.models.application import Application
from app.models.compliance import PartnerHandoffConsent
from app.services.business_scope import (
    get_effective_scope_mode,
    get_public_capabilities,
)
from app.services.seed_service import seed_demo_defaults


@pytest.fixture
def client():
    return TestClient(app)


def test_lead_only_showcase_hides_insurers_and_plans(client: TestClient, db: Session):
    """Under LEAD_ONLY mode, GET /portal/showcase MUST return empty companies and plans."""
    seed_demo_defaults(db)
    config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    config.business_scope_mode = "LEAD_ONLY"
    config.non_lead_modes_enabled = False
    db.commit()

    resp = client.get("/api/v1/portal/showcase")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["companies"] == [], "Under LEAD_ONLY, companies showcase must be empty"
    assert data["plans"] == [], "Under LEAD_ONLY, plans showcase must be empty"


def test_lead_only_rejects_specific_product_selection(client: TestClient, db: Session):
    """Under LEAD_ONLY mode, POST /applications/ with plan/carrier selection must fail-close with 400."""
    seed_demo_defaults(db)
    config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    config.business_scope_mode = "LEAD_ONLY"
    config.non_lead_modes_enabled = False
    db.commit()

    payload = {
        "personal_info": {
            "first_name": "Test",
            "last_name": "Applicant",
            "email": "test@example.com",
            "phone": "+420123456789",
            "address": {
                "street": "Vinohradska 10",
                "city": "Prague",
                "state": "Prague",
                "zip_code": "12000",
                "country": "Czech Republic",
            },
            "date_of_birth": "2000-01-01",
        },
        "insurance_type": "health",
        "insurance_company_id": 1,
        "insurance_plan_id": 1,
    }

    resp = client.post("/api/v1/applications/", json=payload)
    assert resp.status_code == 400
    assert "LEAD_ONLY mode" in resp.json()["detail"]


def test_lead_only_rejects_passport_upload(client: TestClient, db: Session):
    """Under LEAD_ONLY mode, POST /files/ upload for passport must fail-close with 400."""
    seed_demo_defaults(db)
    config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    config.business_scope_mode = "LEAD_ONLY"
    config.non_lead_modes_enabled = False
    db.commit()

    # Attempt to upload a passport file
    fake_file = BytesIO(b"%PDF-1.4 simulated passport document bytes")
    files = {"file": ("passport.pdf", fake_file, "application/pdf")}
    data = {"file_type": "passport"}

    resp = client.post("/api/v1/files/upload", files=files, data=data)
    assert resp.status_code in (400, 403)
    assert "LEAD_ONLY mode" in resp.json()["detail"]


def test_lead_only_accepts_basic_inquiry(client: TestClient, db: Session):
    """POST /applications/inquire accepts basic student enquiry and records explicit consent."""
    seed_demo_defaults(db)
    config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    config.business_scope_mode = "LEAD_ONLY"
    config.non_lead_modes_enabled = False
    db.commit()

    payload = {
        "full_name": "Wei Zhang",
        "email": "zhang.wei@example.com",
        "phone": "+420 777 888 999",
        "wechat": "zhangwei_cz",
        "preferred_language": "zh",
        "student_status": True,
        "age_band": "15-30",
        "type_of_stay": "student",
        "requested_start_date": "2026-11-01",
        "requested_duration_months": 12,
        "general_insurance_need": "Comprehensive Health",
        "free_text_note": "Need insurance certificate for Czech long-term student visa extension.",
        "handoff_consent": True,
        "handoff_consent_text_version": "v1.0",
    }

    resp = client.post("/api/v1/applications/inquire", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["success"] is True
    assert "reference_number" in data
    assert data["status"] == "INQUIRY_RECEIVED"
    assert "České pojištění a.s." in data["recipient"]

    # Verify database persistence
    ref_num = data["reference_number"]
    app_record = (
        db.query(Application).filter(Application.reference_number == ref_num).first()
    )
    assert app_record is not None
    assert app_record.first_name == "Wei"
    assert app_record.last_name == "Zhang"
    assert app_record.email == "zhang.wei@example.com"
    assert app_record.status == "submitted"
    assert app_record.regulatory_mode_snapshot == "LEAD_ONLY"

    # Verify consent record
    assert app_record.handoff_consent_id is not None
    consent = (
        db.query(PartnerHandoffConsent)
        .filter(PartnerHandoffConsent.id == app_record.handoff_consent_id)
        .first()
    )
    assert consent is not None
    assert consent.recipient == "České pojištění a.s."
    assert consent.recipient_role == "makler"


def test_lead_only_rejects_inquiry_without_consent(client: TestClient, db: Session):
    """POST /applications/inquire fails with 422 if handoff consent is False."""
    payload = {
        "full_name": "Test Student",
        "email": "student@example.com",
        "phone": "+420 111 222 333",
        "student_status": True,
        "age_band": "15-30",
        "type_of_stay": "student",
        "requested_duration_months": 12,
        "general_insurance_need": "Comprehensive Health",
        "handoff_consent": False,
    }

    resp = client.post("/api/v1/applications/inquire", json=payload)
    assert resp.status_code == 422


def test_fail_closed_prevents_unauthorized_scope_switch(db: Session):
    """Verify that get_effective_scope_mode fail-closes to LEAD_ONLY if non_lead_modes_enabled is False."""
    seed_demo_defaults(db)
    config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    config.business_scope_mode = "ASSISTED_APPLICATION"
    config.non_lead_modes_enabled = False  # hard guard
    db.commit()

    effective = get_effective_scope_mode(db)
    assert (
        effective == "LEAD_ONLY"
    ), "Must fail-close to LEAD_ONLY when non_lead_modes_enabled is False"

    caps = get_public_capabilities(db)
    assert caps.scope_mode == "LEAD_ONLY"
    assert caps.show_specific_insurers is False
    assert caps.allow_product_selection is False
    assert caps.allow_sensitive_document_upload is False
