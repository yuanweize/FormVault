"""
Tests for configurable document intake policy, temporary intake sessions,
and atomic document attachment to lead inquiries.
"""

import pytest
import io
from fastapi.testclient import TestClient
from app.models.system import SystemConfig
from app.models.lead import IntakeSession, LeadDocument, LeadInquiry


def get_or_create_config(db):
    cfg = db.query(SystemConfig).first()
    if not cfg:
        cfg = SystemConfig(
            id=1,
            business_scope_mode="LEAD_ONLY",
            document_intake_policy="DISABLED",
        )
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


def test_document_intake_disabled_by_default(client: TestClient, db):
    """When document_intake_policy is DISABLED, public upload is strictly forbidden with 403."""
    config = get_or_create_config(db)
    config.document_intake_policy = "DISABLED"
    db.commit()

    # Create session
    resp = client.post("/api/v1/applications/intake-sessions")
    assert resp.status_code == 200
    token = resp.json()["token"]

    # Try uploading a document
    fake_file = io.BytesIO(b"%PDF-1.4 fake pdf content")
    files = {"file": ("passport.pdf", fake_file, "application/pdf")}
    data = {"document_type": "passport_bio_page"}

    upload_resp = client.post(
        f"/api/v1/applications/intake-sessions/{token}/upload",
        files=files,
        data=data,
    )
    assert upload_resp.status_code == 403
    assert upload_resp.json()["detail"]["code"] == "DOCUMENTS_DISABLED"


def test_document_intake_initial_required_enforces_upload(client: TestClient, db):
    """When document_intake_policy is INITIAL_REQUIRED, submitting a lead without required documents fails with 400."""
    config = get_or_create_config(db)
    config.document_intake_policy = "INITIAL_REQUIRED"
    config.passport_required = True
    config.study_proof_required = True
    db.commit()

    payload = {
        "first_name": "Test",
        "last_name": "Applicant",
        "date_of_birth": "2000-01-01",
        "gender": "male",
        "nationality": "China",
        "email": "docs_required@example.com",
        "phone": "+420123456789",
        "preferred_contact_method": "email",
        "type_of_stay": "student",
        "requested_duration_months": 12,
        "handoff_consent": True,
    }

    resp = client.post("/api/v1/applications/inquire", json=payload)
    assert resp.status_code == 400
    assert resp.json()["detail"]["code"] == "DOCUMENTS_REQUIRED"


def test_document_intake_session_upload_and_atomic_attachment(client: TestClient, db):
    """Upload documents under temporary token, then submit lead; documents are atomically linked."""
    config = get_or_create_config(db)
    config.document_intake_policy = "INITIAL_REQUIRED"
    config.passport_required = True
    config.study_proof_required = True
    db.commit()

    # 1. Create intake session
    sess_resp = client.post("/api/v1/applications/intake-sessions")
    assert sess_resp.status_code == 200
    token = sess_resp.json()["token"]

    # 2. Upload passport photo page (JPEG with valid magic bytes)
    jpeg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 100
    passport_file = io.BytesIO(jpeg_bytes)
    p_resp = client.post(
        f"/api/v1/applications/intake-sessions/{token}/upload",
        files={"file": ("passport.jpg", passport_file, "image/jpeg")},
        data={"document_type": "passport_bio_page"},
    )
    assert p_resp.status_code == 200
    p_data = p_resp.json()
    assert p_data["document_type"] == "passport_bio_page"
    doc_id = p_data["id"]

    # 3. Upload proof of study (PDF with valid magic bytes)
    pdf_bytes = b"%PDF-1.4\n" + b"\x00" * 100
    study_file = io.BytesIO(pdf_bytes)
    s_resp = client.post(
        f"/api/v1/applications/intake-sessions/{token}/upload",
        files={"file": ("study_confirm.pdf", study_file, "application/pdf")},
        data={"document_type": "study_confirmation"},
    )
    assert s_resp.status_code == 200

    # 4. List documents in session
    list_resp = client.get(f"/api/v1/applications/intake-sessions/{token}/documents")
    assert list_resp.status_code == 200
    docs = list_resp.json()["documents"]
    assert len(docs) == 2

    # 5. Submit lead with intake_token
    payload = {
        "first_name": "Seriousness",
        "last_name": "Client",
        "date_of_birth": "2001-05-15",
        "gender": "female",
        "nationality": "CZ",
        "email": "seriousness_client@example.com",
        "phone": "+420987654321",
        "wechat_id": "client_wx",
        "preferred_contact_method": "wechat",
        "type_of_stay": "student",
        "school_or_university": "Charles University",
        "requested_duration_months": 12,
        "handoff_consent": True,
        "intake_token": token,
    }

    inq_resp = client.post("/api/v1/applications/inquire", json=payload)
    assert inq_resp.status_code == 201
    ref = inq_resp.json()["reference_number"]

    # 6. Verify DB link
    lead = db.query(LeadInquiry).filter(LeadInquiry.reference_number == ref).first()
    assert lead is not None
    assert lead.passport_file_id is not None
    assert lead.study_confirmation_file_id is not None
    assert len(lead.documents) == 2

    # 7. Verify session is consumed
    sess = db.query(IntakeSession).filter(IntakeSession.token == token).first()
    assert sess.is_consumed is True


def test_document_intake_delete(client: TestClient, db):
    """Applicant can delete a previously uploaded document from session before submission."""
    config = get_or_create_config(db)
    config.document_intake_policy = "INITIAL_REQUIRED"
    db.commit()

    sess_resp = client.post("/api/v1/applications/intake-sessions")
    token = sess_resp.json()["token"]

    jpeg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 100
    p_resp = client.post(
        f"/api/v1/applications/intake-sessions/{token}/upload",
        files={"file": ("passport.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")},
        data={"document_type": "passport_bio_page"},
    )
    doc_id = p_resp.json()["id"]

    del_resp = client.delete(
        f"/api/v1/applications/intake-sessions/{token}/documents/{doc_id}"
    )
    assert del_resp.status_code == 200

    list_resp = client.get(f"/api/v1/applications/intake-sessions/{token}/documents")
    assert len(list_resp.json()["documents"]) == 0
