"""
Tests for semantic tracking codes and anti-abuse gates (honeypot, rapid rate limiting).
"""

import pytest
from fastapi.testclient import TestClient
from app.models.system import SystemConfig
from app.models.lead import LeadInquiry


def get_or_create_config(db):
    cfg = db.query(SystemConfig).first()
    if not cfg:
        cfg = SystemConfig(id=1, business_scope_mode="LEAD_ONLY")
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


def test_tracking_returns_semantic_codes(client: TestClient, db):
    """Tracking endpoint returns semantic status codes and timeline step codes."""
    get_or_create_config(db)

    # 1. Submit lead
    payload = {
        "first_name": "Semantic",
        "last_name": "Tracker",
        "date_of_birth": "1998-12-10",
        "gender": "male",
        "nationality": "CN",
        "email": "semantic_track@example.com",
        "phone": "+420111222333",
        "preferred_contact_method": "email",
        "type_of_stay": "student",
        "requested_duration_months": 12,
        "handoff_consent": True,
    }
    resp = client.post("/api/v1/applications/inquire", json=payload)
    assert resp.status_code == 201
    ref = resp.json()["reference_number"]

    # 2. Track status
    track_resp = client.post(
        "/api/v1/applications/track",
        json={"reference_number": ref, "email": "semantic_track@example.com"},
    )
    assert track_resp.status_code == 200
    t_data = track_resp.json()

    assert t_data["status"] == "INQUIRY_RECEIVED"
    assert t_data["status_code"] == "INQUIRY_RECEIVED"
    assert t_data["insurance_type_code"] == "HEALTH"
    assert len(t_data["timeline"]) == 4

    # Verify timeline codes
    step_codes = [s["code"] for s in t_data["timeline"]]
    assert step_codes == [
        "INQUIRY_RECEIVED",
        "FORWARDED_TO_INTERMEDIARY",
        "PARTNER_PROCESSING",
        "CONTACTED",
    ]


def test_honeypot_discards_silently(client: TestClient, db):
    """If bot fills the honeypot field hp_field, request returns success without storing lead."""
    get_or_create_config(db)

    payload = {
        "first_name": "Bot",
        "last_name": "Spammer",
        "date_of_birth": "1990-01-01",
        "email": "bot_spam@example.com",
        "phone": "+420999999999",
        "preferred_contact_method": "phone",
        "type_of_stay": "other",
        "requested_duration_months": 6,
        "handoff_consent": True,
        "hp_field": "http://spam-link.ru",
    }
    resp = client.post("/api/v1/applications/inquire", json=payload)
    assert resp.status_code == 201
    assert "FV-20261013-SPAM" in resp.json()["reference_number"]

    # Verify lead was not saved to database
    lead = db.query(LeadInquiry).filter(LeadInquiry.email == "bot_spam@example.com").first()
    assert lead is None


def test_rapid_resubmission_rate_limited(client: TestClient, db):
    """Submitting twice with identical email within 20s triggers 429 RATE_LIMITED."""
    get_or_create_config(db)

    payload = {
        "first_name": "Rapid",
        "last_name": "Submitter",
        "date_of_birth": "2002-03-03",
        "email": "rapid_sub@example.com",
        "phone": "+420777888999",
        "preferred_contact_method": "email",
        "type_of_stay": "student",
        "requested_duration_months": 12,
        "handoff_consent": True,
    }
    r1 = client.post("/api/v1/applications/inquire", json=payload)
    assert r1.status_code == 201

    r2 = client.post("/api/v1/applications/inquire", json=payload)
    assert r2.status_code == 429
    assert r2.json()["detail"]["code"] == "RATE_LIMITED"
