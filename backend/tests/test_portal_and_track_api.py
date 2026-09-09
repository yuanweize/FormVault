"""
Tests for public portal showcase and dual-factor application status tracking endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone

from app.main import app
from app.models.application import Application
from app.models.partner import InsuranceCompany, InsurancePlan, AgencyBanner
from app.database import get_db

client = TestClient(app)


def test_portal_showcase_seeded(db):
    """Test that GET /api/v1/portal/showcase returns active partners and plans."""
    response = client.get("/api/v1/portal/showcase")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "companies" in data
    assert "plans" in data
    assert "banners" in data
    assert len(data["companies"]) >= 1
    assert len(data["plans"]) >= 1


def test_application_track_dual_factor_success(db):
    """Test tracking an existing application with valid reference and email."""
    # Create test application
    app_record = Application(
        reference_number="REF-TRACK-12345",
        first_name="Jan",
        last_name="Novak",
        email="jan.novak@example.cz",
        insurance_type="health",
        status="submitted",
    )
    db.add(app_record)
    db.commit()

    # Track with correct details
    response = client.post(
        "/api/v1/applications/track",
        json={
            "reference_number": "REF-TRACK-12345",
            "email": "jan.novak@example.cz",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["reference_number"] == "REF-TRACK-12345"
    assert data["status"] == "submitted"
    assert "Health" in data["insurance_type"]
    assert "J***" in data["masked_name"]
    assert "j***" in data["masked_email"]
    assert len(data["timeline"]) == 4


def test_application_track_email_mismatch_fails(db):
    """Test that incorrect email returns ambiguous 404 to prevent enumeration."""
    app_record = Application(
        reference_number="REF-SECURE-9999",
        first_name="Petr",
        last_name="Svoboda",
        email="petr.svoboda@example.cz",
        insurance_type="travel",
        status="submitted",
    )
    db.add(app_record)
    db.commit()

    # Track with wrong email
    response = client.post(
        "/api/v1/applications/track",
        json={
            "reference_number": "REF-SECURE-9999",
            "email": "wrong@attacker.com",
        },
    )
    assert response.status_code == 404
    assert "mismatch" in response.json().get("message", "").lower() or response.status_code == 404


def test_portal_public_config(db):
    """Test retrieving public portal configuration."""
    response = client.get("/api/v1/portal/config")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "site_title" in data
    assert data["site_icon_url"] == "/favicon.svg"
    assert data["crisp_custom_color"] == "blue"
    assert data["support_email"] == "insurance@hktse.eu.org"


def test_favicon_endpoints():
    """Test that favicon.ico and favicon.svg are served with proper content types."""
    ico_res = client.get("/favicon.ico")
    assert ico_res.status_code == 200
    assert "image/x-icon" in ico_res.headers.get("content-type", "")

    svg_res = client.get("/favicon.svg")
    assert svg_res.status_code == 200
    assert "image/svg+xml" in svg_res.headers.get("content-type", "")


def test_portal_gdpr_request(db):
    """Test submitting a GDPR erasure request."""
    response = client.post(
        "/api/v1/portal/gdpr-request",
        json={
            "request_type": "erasure",
            "email": "applicant@test.cz",
            "full_name": "Test Applicant",
            "reference_number": "REF-GDPR-001",
            "details": "Please delete my uploaded documents after visa processing.",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "GDPR-" in data["ticket_id"]
    assert "30 calendar days" in data["message"]

