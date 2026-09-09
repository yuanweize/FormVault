"""
Test SQLAdmin SystemConfigAdmin edit and list views.
Verifies that edit/1 loads with 200 OK and renders Crisp & Branding fields without WTForms errors.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from app.models.system import SystemConfig, AdminUser
from app.core.config import get_settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
settings = get_settings()


def test_system_config_edit_view_accessible(client, db):
    """Verify that /admin/system-config/edit/1 loads with 200 OK and valid form fields."""
    # Ensure AdminUser exists to avoid redirect to /setup
    admin = db.query(AdminUser).filter_by(username=settings.ADMIN_USERNAME).first()
    if not admin:
        admin = AdminUser(
            username=settings.ADMIN_USERNAME,
            password_hash=pwd_context.hash(settings.ADMIN_PASSWORD),
        )
        db.add(admin)

    # Ensure SystemConfig row exists
    cfg = db.query(SystemConfig).filter_by(id=1).first()
    if not cfg:
        cfg = SystemConfig(
            id=1,
            site_title="FormVault Insurance",
            crisp_custom_color="blue",
            storage_provider="local",
        )
        db.add(cfg)
    db.commit()

    # Login to admin
    login_res = client.post(
        "/admin/login",
        data={"username": settings.ADMIN_USERNAME, "password": settings.ADMIN_PASSWORD},
        follow_redirects=False,
    )
    assert login_res.status_code in (200, 302, 303)

    # Access edit/1
    edit_res = client.get("/admin/system-config/edit/1")
    assert edit_res.status_code == 200
    html = edit_res.text
    assert "System Configuration" in html
    assert "Crisp Live Chat Website ID" in html
    assert "Crisp Live Chat Widget Color Theme" in html
    assert "Production Ingress Architecture" in html
    assert "Primary Production Domain" in html
    assert "Secondary / Regional Domain" in html
    assert "storage_provider" in html


def test_admin_dashboard_view_renders_kpis_and_crisp(client, db):
    """Verify that /admin/ renders the custom high-aesthetic dashboard with Crisp status, Ingress domains & KPI cards."""
    # Ensure AdminUser exists
    admin = db.query(AdminUser).filter_by(username=settings.ADMIN_USERNAME).first()
    if not admin:
        admin = AdminUser(
            username=settings.ADMIN_USERNAME,
            password_hash=pwd_context.hash(settings.ADMIN_PASSWORD),
        )
        db.add(admin)

    # Ensure SystemConfig with Crisp
    cfg = db.query(SystemConfig).filter_by(id=1).first()
    if not cfg:
        cfg = SystemConfig(
            id=1,
            site_title="FormVault Insurance",
            crisp_website_id="test-crisp-uuid-12345",
            crisp_custom_color="blue",
            storage_provider="local",
            production_ingress_name="Cloudflare Tunnel",
            primary_domain="insure.hktse.eu.org",
            secondary_domain="pojisteni.hktse.eu.org",
        )
        db.add(cfg)
    else:
        cfg.crisp_website_id = "test-crisp-uuid-12345"
        cfg.production_ingress_name = "Cloudflare Tunnel"
        cfg.primary_domain = "insure.hktse.eu.org"
        cfg.secondary_domain = "pojisteni.hktse.eu.org"
    db.commit()

    # Login to admin
    client.post(
        "/admin/login",
        data={"username": settings.ADMIN_USERNAME, "password": settings.ADMIN_PASSWORD},
        follow_redirects=False,
    )

    # Access /admin/
    dash_res = client.get("/admin/")
    assert dash_res.status_code == 200
    html = dash_res.text
    assert "Insurance Operations Console" in html
    assert "Crisp Live Chat Integration" in html
    assert "test-crisp-uuid-12345" in html
    assert "Production Ingress" in html
    assert "Cloudflare Tunnel" in html
    assert "insure.hktse.eu.org" in html
    assert "pojisteni.hktse.eu.org" in html
    assert "Total Applications" in html
    assert "Active Plans" in html
    assert "Encrypted Files" in html
    assert "Audit Trail" in html
    assert "Czech Compliance Brief" in html
