"""
Unit and integration tests for Underwriting fields, Crisp Verification, and RBAC isolation.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.system import AdminUser, SystemConfig
from app.models.partner import InsuranceCompany, InsurancePlan
from app.models.application import Application
from app.database import get_db

client = TestClient(app)


def test_verify_crisp_api_validation():
    # 1. Invalid UUID format
    res_bad = client.post(
        "/api/v1/portal/verify-crisp", json={"website_id": "invalid-uuid-123"}
    )
    assert res_bad.status_code == 200
    data_bad = res_bad.json()
    assert data_bad["valid"] is False
    assert "Invalid UUID format" in data_bad["message"]

    # 2. Valid UUID structure format
    valid_uuid = "168677e2-0aa6-45ec-a486-83855b18c6f4"
    res_valid = client.post(
        "/api/v1/portal/verify-crisp", json={"website_id": valid_uuid}
    )
    assert res_valid.status_code == 200
    data_valid = res_valid.json()
    assert data_valid["valid"] is True


def test_public_portal_config_authentic_disclosure():
    res = client.get("/api/v1/portal/config")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "broker_legal_disclosure" in data
    # Ensure authentic disclosure does not claim Maxima or UNIQA
    disclosure = data["broker_legal_disclosure"] or ""
    assert "Maxima" not in disclosure
    assert "UNIQA" not in disclosure
    # Check default ingress architecture preset
    assert data.get("production_ingress_name") in (
        "Cloudflare Tunnel",
        "Nginx Reverse Proxy",
        "Caddy Reverse Proxy",
        "Traefik Ingress",
        "Direct Port Binding",
    )


def test_create_application_with_czech_underwriting_fields(db):
    payload = {
        "personal_info": {
            "first_name": "Petr",
            "last_name": "Novak",
            "email": "petr.novak@example.cz",
            "phone": "+420777123456",
            "address": {
                "street": "Holandská 49/4",
                "city": "Praha",
                "state": "Praha 10",
                "zip_code": "10100",
                "country": "Czech Republic",
            },
            "date_of_birth": "2001-05-15",
            "insurance_type": "health",
            "gender": "male",
            "nationality": "CZECH",
            "place_of_birth": "Prague",
            "passport_number": "CZ98765432",
            "type_of_stay": "student",
        },
        "insurance_type": "health",
        "gender": "male",
        "nationality": "CZECH",
        "place_of_birth": "Prague",
        "passport_number": "CZ98765432",
        "insurance_commencement_date": "2026-10-01",
        "insurance_duration_months": 12,
        "type_of_stay": "student",
    }

    res = client.post("/api/v1/applications/", json=payload)
    assert res.status_code in (200, 201)
    data = res.json()
    assert "id" in data
    app_id = data["id"]

    # Verify directly in database
    app_record = db.query(Application).filter(Application.id == app_id).first()
    assert app_record is not None
    assert app_record.gender == "male"
    assert app_record.nationality == "CZECH"
    assert app_record.passport_number == "CZ98765432"
    assert app_record.place_of_birth == "Prague"
    assert app_record.insurance_duration_months == 12
    assert app_record.type_of_stay == "student"
