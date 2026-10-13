"""
Comprehensive test suite for One-Shot Lead Intake, DOB & Age Derivation,
Lossless Promotion to Application, Partner Handoff, and Marketing Attribution.

Test cases specified:
1. test_lead_accepts_exact_date_of_birth
2. test_age_is_derived_from_dob
3. test_age_band_is_derived_not_user_selected
4. test_lead_single_submission_contains_all_required_request_fields
5. test_lead_conversion_preserves_existing_fields
6. test_lead_does_not_require_reentry_of_identity_data
7. test_lead_only_rejects_insurance_company_selection
8. test_lead_only_rejects_insurance_plan_selection
9. test_lead_only_showcase_hides_specific_insurers
10. test_handoff_success_changes_status
11. test_handoff_failure_does_not_fake_forwarded_status
12. test_utm_attribution_is_recorded
13. test_wechat_contact_is_supported
14. test_partner_recipient_is_configurable
15. test_no_real_insurer_fallback_exists
"""

import pytest
from datetime import date, datetime, timezone
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.lead import LeadInquiry, calculate_age, derive_age_band
from app.models.application import Application
from app.models.system import SystemConfig
from app.schemas.application import LeadInquiryCreateSchema
from app.services.lead_service import (
    create_lead_inquiry,
    convert_lead_to_application,
    LeadHandoffService,
)
from app.services.seed_service import seed_demo_defaults


@pytest.fixture
def client():
    return TestClient(app)


def test_lead_accepts_exact_date_of_birth(client: TestClient, db: Session):
    """Lead endpoint accepts and stores exact date_of_birth as a real date."""
    payload = {
        "first_name": "San",
        "last_name": "Zhang",
        "date_of_birth": "2003-05-10",
        "gender": "male",
        "nationality": "Chinese",
        "email": "zhang.san@example.com",
        "phone": "+420 777 123 456",
        "wechat_id": "zhangsan_prague",
        "student_status": True,
        "school_or_university": "Czech Technical University (ČVUT)",
        "type_of_stay": "student",
        "requested_start_date": "2026-11-01",
        "requested_duration_months": 12,
        "current_location": "Prague",
        "general_insurance_need": "comprehensive",
        "handoff_consent": True,
        "handoff_consent_text_version": "v1.0",
    }

    resp = client.post("/api/v1/applications/inquire", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["success"] is True
    assert "reference_number" in data

    lead = (
        db.query(LeadInquiry)
        .filter(LeadInquiry.reference_number == data["reference_number"])
        .first()
    )
    assert lead is not None
    assert lead.date_of_birth == date(2003, 5, 10)


def test_age_is_derived_from_dob():
    """Verify calculate_age computes exact age from date_of_birth against reference date."""
    dob = date(2003, 5, 10)
    ref_before_birthday = date(2026, 5, 9)
    ref_on_birthday = date(2026, 5, 10)
    ref_after_birthday = date(2026, 10, 13)

    assert calculate_age(dob, reference_date=ref_before_birthday) == 22
    assert calculate_age(dob, reference_date=ref_on_birthday) == 23
    assert calculate_age(dob, reference_date=ref_after_birthday) == 23

    # Minor / child
    child_dob = date(2015, 8, 1)
    assert calculate_age(child_dob, reference_date=date(2026, 8, 1)) == 11


def test_age_band_is_derived_not_user_selected(client: TestClient, db: Session):
    """Age bracket is automatically derived server-side from exact DOB, not selected by user."""
    # Test derivation helper
    assert derive_age_band(16) == "0-17"
    assert derive_age_band(18) == "18-26"
    assert derive_age_band(23) == "18-26"
    assert derive_age_band(26) == "18-26"
    assert derive_age_band(30) == "27-35"
    assert derive_age_band(42) == "36-50"
    assert derive_age_band(60) == "51+"

    # Lead inquiry with DOB in 2003 yields age ~23 and bracket '18-26'
    payload = {
        "first_name": "Si",
        "last_name": "Li",
        "date_of_birth": "2003-02-15",
        "email": "li.si@example.com",
        "phone": "+420 777 222 333",
        "student_status": True,
        "type_of_stay": "student",
        "requested_start_date": "2026-10-01",
        "requested_duration_months": 12,
        "handoff_consent": True,
    }

    resp = client.post("/api/v1/applications/inquire", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["derived_age_band"] == "18-26"
    assert data["derived_age"] in (23, 24)


def test_lead_single_submission_contains_all_required_request_fields(
    client: TestClient, db: Session
):
    """A single one-shot submission collects identity, stay, duration, contact and student info."""
    payload = {
        "first_name": "Xiaoming",
        "last_name": "Wang",
        "date_of_birth": "2002-09-20",
        "gender": "male",
        "nationality": "Chinese",
        "email": "wang.xiaoming@example.com",
        "phone": "+420 776 555 444",
        "wechat_id": "wx_wangxm",
        "preferred_contact_method": "wechat",
        "preferred_language": "zh",
        "student_status": True,
        "school_or_university": "Charles University (Univerzita Karlova)",
        "study_status": "Master Degree",
        "type_of_stay": "student",
        "requested_start_date": "2026-10-01",
        "requested_duration_months": 24,
        "current_location": "Prague 1",
        "general_insurance_need": "comprehensive",
        "special_notes": "Requires confirmation letter for visa application next week.",
        "utm_source": "xiaohongshu",
        "utm_campaign": "prague_students_2026",
        "referral_code": "uni-cz-2026",
        "handoff_consent": True,
        "handoff_consent_text_version": "v1.0",
    }

    resp = client.post("/api/v1/applications/inquire", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    ref = data["reference_number"]

    lead = db.query(LeadInquiry).filter(LeadInquiry.reference_number == ref).first()
    assert lead is not None
    assert lead.first_name == "Xiaoming"
    assert lead.last_name == "Wang"
    assert lead.date_of_birth == date(2002, 9, 20)
    assert lead.email == "wang.xiaoming@example.com"
    assert lead.phone == "+420 776 555 444"
    assert lead.wechat_id == "wx_wangxm"
    assert lead.preferred_contact_method == "wechat"
    assert lead.school_or_university == "Charles University (Univerzita Karlova)"
    assert lead.requested_duration_months == 24
    assert lead.utm_source == "xiaohongshu"
    assert lead.referral_code == "uni-cz-2026"
    assert lead.status == "INQUIRY_RECEIVED"


def test_lead_conversion_preserves_existing_fields(db: Session):
    """Promoting / converting a LeadInquiry to Application preserves all entered fields."""
    lead_data = LeadInquiryCreateSchema(
        first_name="Hui",
        last_name="Chen",
        date_of_birth=date(2001, 11, 5),
        gender="female",
        nationality="Chinese",
        email="chen.hui@example.com",
        phone="+420 773 111 222",
        wechat_id="chenhui_cz",
        preferred_contact_method="wechat",
        preferred_language="zh",
        student_status=True,
        school_or_university="University of Economics and Business (VŠE)",
        type_of_stay="student",
        requested_start_date=date(2026, 12, 1),
        requested_duration_months=12,
        current_location="Prague 3",
        general_insurance_need="comprehensive",
        special_notes="Non-smoker, needs Schengen-wide coverage.",
        utm_source="wechat_group",
        referral_code="vse-club",
        handoff_consent=True,
    )
    lead = create_lead_inquiry(db=db, data=lead_data)

    app_record = convert_lead_to_application(lead_id=lead.id, db=db)
    assert app_record is not None
    assert app_record.first_name == "Hui"
    assert app_record.last_name == "Chen"
    assert app_record.date_of_birth == date(2001, 11, 5)
    assert app_record.gender == "female"
    assert app_record.nationality == "Chinese"
    assert app_record.email == "chen.hui@example.com"
    assert app_record.phone == "+420 773 111 222"
    assert app_record.insurance_duration_months == 12
    assert app_record.insurance_commencement_date == date(2026, 12, 1)
    assert app_record.reference_number == lead.reference_number

    # Verify link on lead
    db.refresh(lead)
    assert lead.converted_application_id == app_record.id
    assert lead.status == "PARTNER_PROCESSING"


def test_lead_does_not_require_reentry_of_identity_data(db: Session):
    """Customer identity data already exists on converted Application without re-asking."""
    lead_data = LeadInquiryCreateSchema(
        first_name="Ling",
        last_name="Zhao",
        date_of_birth=date(2004, 3, 14),
        nationality="Chinese",
        email="zhao.ling@example.com",
        phone="+420 775 888 999",
        student_status=True,
        type_of_stay="student",
        requested_start_date=date(2026, 11, 15),
        requested_duration_months=12,
        handoff_consent=True,
    )
    lead = create_lead_inquiry(db=db, data=lead_data)
    app_record = convert_lead_to_application(lead_id=lead.id, db=db)

    # Core identity fields must NOT be null or empty
    assert app_record.first_name == lead.first_name
    assert app_record.last_name == lead.last_name
    assert app_record.date_of_birth == lead.date_of_birth
    assert app_record.email == lead.email
    assert app_record.phone == lead.phone


def test_lead_only_rejects_insurance_company_selection(client: TestClient, db: Session):
    """Under LEAD_ONLY, public selection of specific insurer is forbidden (fail-close)."""
    seed_demo_defaults(db)
    config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    config.business_scope_mode = "LEAD_ONLY"
    config.non_lead_modes_enabled = False
    db.commit()

    payload = {
        "personal_info": {
            "first_name": "Carrier",
            "last_name": "Test",
            "email": "carrier.test@example.com",
            "date_of_birth": "2000-01-01",
            "address": {
                "street": "Main 1",
                "city": "Prague",
                "state": "Prague",
                "zip_code": "11000",
                "country": "Czech Republic",
            },
        },
        "insurance_type": "health",
        "insurance_company_id": 99,  # Attempting specific insurer selection
    }

    resp = client.post("/api/v1/applications/", json=payload)
    assert resp.status_code == 400
    assert "LEAD_ONLY mode" in resp.json()["detail"]


def test_lead_only_rejects_insurance_plan_selection(client: TestClient, db: Session):
    """Under LEAD_ONLY, public selection of specific insurance plan is forbidden (fail-close)."""
    seed_demo_defaults(db)
    config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    config.business_scope_mode = "LEAD_ONLY"
    config.non_lead_modes_enabled = False
    db.commit()

    payload = {
        "personal_info": {
            "first_name": "Plan",
            "last_name": "Test",
            "email": "plan.test@example.com",
            "date_of_birth": "2000-01-01",
            "address": {
                "street": "Main 1",
                "city": "Prague",
                "state": "Prague",
                "zip_code": "11000",
                "country": "Czech Republic",
            },
        },
        "insurance_type": "health",
        "insurance_plan_id": 88,  # Attempting specific plan selection
    }

    resp = client.post("/api/v1/applications/", json=payload)
    assert resp.status_code == 400
    assert "LEAD_ONLY mode" in resp.json()["detail"]


def test_lead_only_showcase_hides_specific_insurers(client: TestClient, db: Session):
    """Under LEAD_ONLY, public showcase hides plans and companies to avoid unauthorized claims."""
    seed_demo_defaults(db)
    config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    config.business_scope_mode = "LEAD_ONLY"
    config.non_lead_modes_enabled = False
    db.commit()

    resp = client.get("/api/v1/portal/showcase")
    assert resp.status_code == 200
    data = resp.json()
    assert data["companies"] == []
    assert data["plans"] == []


def test_handoff_success_changes_status(db: Session):
    """Successful handoff moves lead status from INQUIRY_RECEIVED to FORWARDED_TO_INTERMEDIARY."""
    lead_data = LeadInquiryCreateSchema(
        first_name="Bo",
        last_name="Wu",
        date_of_birth=date(2002, 7, 21),
        email="wu.bo@example.com",
        phone="+420 771 222 333",
        student_status=True,
        type_of_stay="student",
        requested_start_date=date(2026, 11, 1),
        requested_duration_months=12,
        handoff_consent=True,
    )
    lead = create_lead_inquiry(db=db, data=lead_data)
    assert lead.status == "INQUIRY_RECEIVED"

    # Enable handoff in config for this test
    config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    if not config:
        config = SystemConfig(id=1, site_title="FormVault")
        db.add(config)
    config.lead_handoff_enabled = True
    db.commit()

    # Mock SMTP to succeed
    with patch("smtplib.SMTP") as mock_smtp_class:
        mock_server = MagicMock()
        mock_smtp_class.return_value = mock_server

        success = LeadHandoffService.handoff_lead(lead_id=lead.id, db=db)
        assert success is True

    db.refresh(lead)
    assert lead.status == "FORWARDED_TO_INTERMEDIARY"
    assert lead.handoff_attempts == 1
    assert lead.last_handoff_attempt_at is not None
    assert lead.handoff_error is None


def test_handoff_failure_does_not_fake_forwarded_status(db: Session):
    """Failed handoff moves status to HANDOFF_FAILED, NEVER fakes FORWARDED_TO_INTERMEDIARY."""
    lead_data = LeadInquiryCreateSchema(
        first_name="Jing",
        last_name="Sun",
        date_of_birth=date(2003, 10, 10),
        email="sun.jing@example.com",
        phone="+420 772 333 444",
        student_status=True,
        type_of_stay="student",
        requested_start_date=date(2026, 11, 1),
        requested_duration_months=12,
        handoff_consent=True,
    )
    lead = create_lead_inquiry(db=db, data=lead_data)
    assert lead.status == "INQUIRY_RECEIVED"

    # Enable handoff in config for this test
    config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    if not config:
        config = SystemConfig(id=1, site_title="FormVault")
        db.add(config)
    config.lead_handoff_enabled = True
    db.commit()

    # Mock SMTP to throw network failure
    with patch("smtplib.SMTP", side_effect=Exception("SMTP Connection timed out")):
        success = LeadHandoffService.handoff_lead(lead_id=lead.id, db=db)
        assert success is False

    db.refresh(lead)
    assert lead.status == "HANDOFF_FAILED"
    assert lead.status != "FORWARDED_TO_INTERMEDIARY"
    assert "SMTP Connection timed out" in lead.handoff_error


def test_utm_attribution_is_recorded(client: TestClient, db: Session):
    """Marketing attribution parameters (UTM tags and referral code) are faithfully persisted."""
    payload = {
        "first_name": "Kai",
        "last_name": "Liu",
        "date_of_birth": "2002-12-01",
        "email": "liu.kai@example.com",
        "phone": "+420 774 444 555",
        "student_status": True,
        "type_of_stay": "student",
        "requested_start_date": "2026-11-01",
        "requested_duration_months": 12,
        "utm_source": "xiaohongshu",
        "utm_medium": "post",
        "utm_campaign": "prague_autumn_student_promo",
        "utm_term": "czech_insurance",
        "utm_content": "carousel_card_1",
        "referral_code": "redbook-group-888",
        "handoff_consent": True,
    }

    resp = client.post("/api/v1/applications/inquire", json=payload)
    assert resp.status_code == 201
    ref = resp.json()["reference_number"]

    lead = db.query(LeadInquiry).filter(LeadInquiry.reference_number == ref).first()
    assert lead is not None
    assert lead.utm_source == "xiaohongshu"
    assert lead.utm_medium == "post"
    assert lead.utm_campaign == "prague_autumn_student_promo"
    assert lead.utm_term == "czech_insurance"
    assert lead.utm_content == "carousel_card_1"
    assert lead.referral_code == "redbook-group-888"


def test_wechat_contact_is_supported(client: TestClient, db: Session):
    """WeChat ID is supported as primary or optional contact for Chinese students."""
    payload = {
        "first_name": "Dan",
        "last_name": "Feng",
        "date_of_birth": "2003-08-18",
        "email": "feng.dan@example.com",
        "wechat_id": "fengdan_prague_2026",
        "preferred_contact_method": "wechat",
        "preferred_language": "zh",
        "student_status": True,
        "type_of_stay": "student",
        "requested_start_date": "2026-11-01",
        "requested_duration_months": 12,
        "handoff_consent": True,
    }

    resp = client.post("/api/v1/applications/inquire", json=payload)
    assert resp.status_code == 201
    ref = resp.json()["reference_number"]

    lead = db.query(LeadInquiry).filter(LeadInquiry.reference_number == ref).first()
    assert lead is not None
    assert lead.wechat_id == "fengdan_prague_2026"
    assert lead.preferred_contact_method == "wechat"
    assert lead.preferred_language == "zh"


def test_partner_recipient_is_configurable(db: Session):
    """Partner recipient email is dynamically read from SystemConfig / env, never hardcoded."""
    config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    if not config:
        config = SystemConfig(id=1, site_title="FormVault")
        db.add(config)
    config.lead_recipient_email = "dynamic.partner@example.cz"
    config.partner_name = "Dynamic Broker Partner s.r.o."
    db.commit()

    recipient_info = LeadHandoffService.get_recipient_config(db)
    assert recipient_info["recipient_email"] == "dynamic.partner@example.cz"
    assert recipient_info["partner_name"] == "Dynamic Broker Partner s.r.o."


def test_no_real_insurer_fallback_exists(client: TestClient, db: Session):
    """Under LEAD_ONLY, no fallback arrays exist publicizing specific insurers or price tables."""
    seed_demo_defaults(db)
    config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    config.business_scope_mode = "LEAD_ONLY"
    config.non_lead_modes_enabled = False
    db.commit()

    resp = client.get("/api/v1/portal/showcase")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["companies"]) == 0
    assert len(data["plans"]) == 0


def test_lead_recipe_is_configurable(client: TestClient, db: Session):
    """Lead intake profile is driven by FormRecipe schema, allowing admin customization without UI rebuilds."""
    seed_demo_defaults(db)

    resp = client.get("/api/v1/portal/lead-recipe")
    assert resp.status_code == 200
    recipe = resp.json()
    assert recipe["profile"] == "LEAD_INTAKE"
    assert len(recipe["steps"]) >= 4

    step_ids = [s["id"] for s in recipe["steps"]]
    assert "about_you" in step_ids
    assert "situation" in step_ids
    assert "contact" in step_ids
    assert "review" in step_ids


def test_handoff_idempotency(db: Session):
    """Calling handoff_lead repeatedly on an already forwarded lead returns True without duplicating dispatch."""
    lead_data = LeadInquiryCreateSchema(
        first_name="Idem",
        last_name="Potent",
        date_of_birth=date(2001, 3, 15),
        email="idem.potent@example.com",
        phone="+420 773 999 000",
        student_status=True,
        type_of_stay="student",
        requested_start_date=date(2026, 11, 1),
        requested_duration_months=12,
        handoff_consent=True,
    )
    lead = create_lead_inquiry(db=db, data=lead_data)
    lead.status = "FORWARDED_TO_INTERMEDIARY"
    db.commit()

    with patch("smtplib.SMTP") as mock_smtp_class:
        success = LeadHandoffService.handoff_lead(lead_id=lead.id, db=db)
        assert success is True
        mock_smtp_class.assert_not_called()  # Did not send duplicate email


def test_handoff_failure_does_not_lose_lead(db: Session):
    """When SMTP delivery fails, the LeadInquiry remains fully intact in DB with HANDOFF_FAILED status."""
    lead_data = LeadInquiryCreateSchema(
        first_name="Safe",
        last_name="Data",
        date_of_birth=date(2002, 5, 20),
        email="safe.data@example.com",
        phone="+420 778 111 222",
        student_status=True,
        type_of_stay="student",
        requested_start_date=date(2026, 11, 1),
        requested_duration_months=12,
        handoff_consent=True,
    )
    lead = create_lead_inquiry(db=db, data=lead_data)

    config = db.query(SystemConfig).first()
    if not config:
        config = SystemConfig(id=1, site_title="FormVault")
        db.add(config)
    config.lead_handoff_enabled = True
    db.commit()

    with patch("smtplib.SMTP", side_effect=Exception("Connection refused")):
        res = LeadHandoffService.handoff_lead(lead_id=lead.id, db=db)
        assert res is False

    refetched = db.query(LeadInquiry).filter(LeadInquiry.id == lead.id).first()
    assert refetched is not None
    assert refetched.first_name == "Safe"
    assert refetched.status == "HANDOFF_FAILED"


def test_lead_only_rejects_passport_upload(client: TestClient, db: Session):
    """Under LEAD_ONLY, public identity/passport file upload is blocked (fail-closed)."""
    seed_demo_defaults(db)
    config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    config.business_scope_mode = "LEAD_ONLY"
    config.non_lead_modes_enabled = False
    db.commit()

    # Public client trying to upload a passport file
    files = {"file": ("passport.pdf", b"%PDF-1.4 dummy passport", "application/pdf")}
    data = {"file_type": "passport"}
    resp = client.post("/api/v1/files/upload", files=files, data=data)
    assert resp.status_code == 403
    assert "LEAD_ONLY mode" in resp.json()["detail"]


def test_lead_create_status_is_inquiry_received(client: TestClient, db: Session):
    """New leads are always born in INQUIRY_RECEIVED status; never claiming fake forwarded."""
    payload = {
        "first_name": "New",
        "last_name": "Lead",
        "date_of_birth": "2004-01-01",
        "email": "new.lead@example.com",
        "phone": "+420 770 000 111",
        "student_status": True,
        "type_of_stay": "student",
        "requested_start_date": "2026-11-01",
        "requested_duration_months": 12,
        "handoff_consent": True,
    }
    resp = client.post("/api/v1/applications/inquire", json=payload)
    assert resp.status_code == 201
    res_data = resp.json()
    assert res_data["status"] == "INQUIRY_RECEIVED"
    assert res_data["status_label"] == "Enquiry Received"


def test_missing_role_denied():
    """Unauthenticated or corrupted session without role is rejected (fail-closed)."""
    from app.admin.auth import get_current_admin

    class DummyRequest:
        def __init__(self, session):
            self.session = session

    req = DummyRequest({"user_id": "123", "token": "tok"})  # missing role
    admin_info = get_current_admin(req)
    assert admin_info["role"] is None
    assert admin_info["user_id"] is None


def test_admin_secret_key_not_valid_bearer(client: TestClient):
    """ADMIN_SECRET_KEY is strictly a session secret and cannot be used as an administrative Bearer token."""
    from app.core.config import get_settings

    settings = get_settings()

    headers = {"Authorization": f"Bearer {settings.ADMIN_SECRET_KEY}"}
    resp = client.get("/api/v1/files/", headers=headers)
    assert resp.status_code == 403
    assert (
        "strictly restricted to authenticated administrators" in resp.json()["detail"]
    )


@pytest.mark.asyncio
async def test_company_partner_row_isolation():
    """Company partner role is strictly isolated to its assigned company_id."""
    from app.admin.views import ApplicationAdmin

    class DummyRequest:
        def __init__(self, session):
            self.session = session

    partner_req = DummyRequest(
        {"user_id": "p1", "token": "t1", "role": "company_partner", "company_id": 42}
    )
    app_admin = ApplicationAdmin()

    # 1. list_query filters by insurance_company_id
    query = app_admin.list_query(partner_req)
    assert "insurance_company_id" in str(query)

    # 2. check_can_view_details blocks other company
    class ForeignApp:
        insurance_company_id = 99

    allowed = await app_admin.check_can_view_details(partner_req, ForeignApp())
    assert allowed is False

    # 3. check_can_view_details permits own company
    class MatchingApp:
        insurance_company_id = 42

    allowed_own = await app_admin.check_can_view_details(partner_req, MatchingApp())
    assert allowed_own is True
