"""
Seed and synchronization service for insurance workflow configuration,
demonstration companies, plans, evidence records, and legal document versions.

Ensures proper separation between production data and sample workflow data:
- Environment variable DEMO_DATA=false completely disables demo carrier/plan seeding.
- Initializes verifiable evidence records, product versions, and system configuration.
"""

import os
import json
import hashlib
from datetime import datetime, timezone
from sqlalchemy.orm import Session
import structlog

from ..models.partner import InsuranceCompany, InsurancePlan, AgencyBanner
from ..models.system import SystemConfig
from ..models.compliance import (
    EvidenceRecord,
    ProductVersion,
    PriceBook,
    PriceRate,
    FormRecipe,
    LegalDocumentVersion,
)

logger = structlog.get_logger(__name__)


def seed_demo_defaults(db: Session) -> None:
    """
    Initialize system configuration and baseline evidence.
    If DEMO_DATA is enabled (default), synchronizes demonstration insurance products.
    """
    # 1. Initialize Singleton SystemConfig if not present
    config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    if not config:
        config = SystemConfig(
            id=1,
            site_title="FormVault Insurance | Czech Health & Travel Insurance",
            site_description="Digital application portal for Czech health insurance in authorized cooperation with České pojištění a.s.",
            site_icon_url="/favicon.svg",
            support_email="insurance@hktse.eu.org",
            broker_legal_disclosure="HKTSE s.r.o. (IČO: 10858032) technical platform in authorized cooperation with České pojištění a.s. (ČNB registered intermediary).",
            business_scope_mode="LEAD_ONLY",
            workflow_scope_status="LEAD_ONLY_CONFIRMED",
            non_lead_modes_enabled=False,
            operator_legal_name="HKTSE s.r.o.",
            operator_ico="10858032",
            operator_role="tipar",
            operator_website_url="https://hktse.eu.org",
            partner_name="České pojištění a.s.",
            partner_ico="24729007",
            partner_role="makler",
            partner_cnb_id="24729007",
            partner_website_url="https://ceskepojisteni.cz",
            relationship_status="VERIFIED",
            relationship_valid_from=datetime(2026, 3, 2, tzinfo=timezone.utc),
            public_wording_approved=False,
            dpa_status="VERIFIED",
            dpa_valid_from=datetime(2026, 3, 2, tzinfo=timezone.utc),
        )
        db.add(config)
        db.flush()
    else:
        # Ensure URLs and roles are populated if empty
        if not config.operator_website_url:
            config.operator_website_url = "https://hktse.eu.org"
        if not config.partner_website_url:
            config.partner_website_url = "https://ceskepojisteni.cz"
        if not config.partner_ico:
            config.partner_ico = "24729007"
        if not config.partner_role:
            config.partner_role = "makler"
        if not config.operator_role:
            config.operator_role = "tipar"

    # 2. Seed Baseline Legal Document Versions if absent
    terms_doc = (
        db.query(LegalDocumentVersion)
        .filter(
            LegalDocumentVersion.doc_type == "terms",
            LegalDocumentVersion.version == "1.0.0",
        )
        .first()
    )
    if not terms_doc:
        terms_content = """# FormVault Terms of Service
**Effective Date: March 2, 2026**
**Platform Operator:** HKTSE s.r.o. (IČO: 10858032)
**Brokerage Partner:** České pojištění a.s. (IČO: 24729007)

1. **Role Delineation**: FormVault is a technical workflow software operated by HKTSE s.r.o. acting as a lead introducer (tipař) in authorized cooperation with licensed broker České pojištění a.s. (makléř).
2. **Non-Commercial License**: Source code is available under PolyForm Noncommercial 1.0.0. Commercial operators must acquire a separate commercial license.
3. **Assisted Ingestion**: Application details are processed strictly per user consent and handed off to authorized intermediaries."""
        terms_hash = hashlib.sha256(terms_content.encode("utf-8")).hexdigest()
        terms_doc = LegalDocumentVersion(
            document_type="terms",
            doc_type="terms",
            version="1.0.0",
            title="FormVault Platform Terms of Service",
            content_markdown=terms_content,
            sha256=terms_hash,
            content_sha256=terms_hash,
            status="ACTIVE",
            valid_from=datetime(2026, 3, 2, tzinfo=timezone.utc),
            effective_from=datetime(2026, 3, 2, tzinfo=timezone.utc),
        )
        db.add(terms_doc)

    privacy_doc = (
        db.query(LegalDocumentVersion)
        .filter(
            LegalDocumentVersion.doc_type == "privacy",
            LegalDocumentVersion.version == "1.0.0",
        )
        .first()
    )
    if not privacy_doc:
        privacy_content = """# FormVault Privacy Policy & GDPR Notice
**Effective Date: March 2, 2026**
**Technical Processor:** HKTSE s.r.o. (IČO: 10858032)
**Insurance Controller:** České pojištění a.s. (IČO: 24729007)

1. **Controller & Processor**: České pojištění a.s. acts as Data Controller for insurance application dossiers. HKTSE s.r.o. acts as Data Processor under a bilateral Data Processing Agreement (DPA).
2. **Encryption**: Stored application payloads are encrypted using application-layer AES-256-GCM with distinct IVs.
3. **Data Subject Rights**: Under GDPR Articles 15-22, you may request access, rectification, or erasure by emailing privacy@hktse.eu.org."""
        privacy_hash = hashlib.sha256(privacy_content.encode("utf-8")).hexdigest()
        privacy_doc = LegalDocumentVersion(
            document_type="privacy",
            doc_type="privacy",
            version="1.0.0",
            title="FormVault Privacy Policy & Data Processing Notice",
            content_markdown=privacy_content,
            sha256=privacy_hash,
            content_sha256=privacy_hash,
            status="ACTIVE",
            valid_from=datetime(2026, 3, 2, tzinfo=timezone.utc),
            effective_from=datetime(2026, 3, 2, tzinfo=timezone.utc),
        )
        db.add(privacy_doc)

    # Seed baseline Lead Intake Recipe (Configurable schema for one-shot intake)
    lead_recipe = (
        db.query(FormRecipe).filter(FormRecipe.recipe_version == "LEAD_INTAKE").first()
    )
    if not lead_recipe:
        recipe_data = {
            "profile": "LEAD_INTAKE",
            "title": "International Student Lead Intake",
            "version": "1.0.0",
            "steps": [
                {
                    "step": 1,
                    "id": "about_you",
                    "title": "About You",
                    "fields": [
                        {
                            "id": "first_name",
                            "type": "text",
                            "required": True,
                            "label": "First Name",
                        },
                        {
                            "id": "last_name",
                            "type": "text",
                            "required": True,
                            "label": "Last Name",
                        },
                        {
                            "id": "date_of_birth",
                            "type": "date",
                            "required": True,
                            "label": "Date of Birth",
                            "help_text": "Used for partner age evaluation and eligibility",
                        },
                        {
                            "id": "gender",
                            "type": "select",
                            "required": False,
                            "label": "Gender",
                            "options": ["male", "female", "other", "prefer_not_to_say"],
                        },
                        {
                            "id": "nationality",
                            "type": "text",
                            "required": True,
                            "label": "Nationality",
                        },
                    ],
                },
                {
                    "step": 2,
                    "id": "situation",
                    "title": "Stay & Needs",
                    "fields": [
                        {
                            "id": "student_status",
                            "type": "boolean",
                            "required": True,
                            "label": "Are you a student?",
                        },
                        {
                            "id": "school_or_university",
                            "type": "text",
                            "required": False,
                            "label": "School / University",
                            "conditional": {
                                "depends_on": "student_status",
                                "value": True,
                            },
                        },
                        {
                            "id": "type_of_stay",
                            "type": "select",
                            "required": True,
                            "label": "Type of Stay",
                            "options": ["student", "employee", "family", "other"],
                        },
                        {
                            "id": "requested_start_date",
                            "type": "date",
                            "required": True,
                            "label": "Requested Start Date",
                        },
                        {
                            "id": "requested_duration_months",
                            "type": "number",
                            "required": True,
                            "label": "Duration (Months)",
                            "options": [3, 6, 12, 24, "custom"],
                        },
                        {
                            "id": "current_location",
                            "type": "text",
                            "required": False,
                            "label": "Czech City / Location",
                        },
                        {
                            "id": "special_notes",
                            "type": "textarea",
                            "required": False,
                            "label": "Special Notes",
                        },
                    ],
                },
                {
                    "step": 3,
                    "id": "contact",
                    "title": "Contact",
                    "fields": [
                        {
                            "id": "email",
                            "type": "email",
                            "required": True,
                            "label": "Email",
                        },
                        {
                            "id": "phone",
                            "type": "tel",
                            "required": False,
                            "label": "Phone",
                        },
                        {
                            "id": "wechat_id",
                            "type": "text",
                            "required": False,
                            "label": "WeChat ID",
                            "conditional": {
                                "depends_on": "preferred_contact_method",
                                "value": "wechat",
                            },
                        },
                        {
                            "id": "preferred_contact_method",
                            "type": "select",
                            "required": False,
                            "label": "Preferred Contact Method",
                            "options": ["email", "phone", "wechat"],
                        },
                        {
                            "id": "preferred_language",
                            "type": "select",
                            "required": True,
                            "label": "Preferred Language",
                            "options": ["zh", "en", "cs"],
                        },
                    ],
                },
                {
                    "step": 4,
                    "id": "review",
                    "title": "Review & Consent",
                    "fields": [
                        {
                            "id": "consent_forward_intermediary",
                            "type": "checkbox",
                            "required": True,
                            "label": "Consent to Intermediary Handoff",
                        },
                    ],
                },
            ],
        }
        lead_recipe = FormRecipe(
            name="Lead Intake Profile Recipe",
            version="1.0.0",
            recipe_version="LEAD_INTAKE",
            status="VERIFIED",
            schema_json=json.dumps(recipe_data),
            schema_definition="One-shot lead intake configurable field recipe",
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add(lead_recipe)

    # 3. Check DEMO_DATA environment variable (DEFAULT FALSE FOR PRODUCTION SAFETY)
    demo_enabled = os.environ.get("DEMO_DATA", "false").lower() in (
        "true",
        "1",
        "yes",
    )
    if not demo_enabled:
        db.commit()
        logger.info(
            "DEMO_DATA is disabled; skipped seeding demonstration partners and plans."
        )
        return

    # 4. Seed Baseline Evidence Record
    contract_evidence = (
        db.query(EvidenceRecord)
        .filter(
            EvidenceRecord.title == "Smlouva o obchodní spolupráci - Tipařská činnost"
        )
        .first()
    )
    if not contract_evidence:
        contract_evidence = EvidenceRecord(
            evidence_type="contract",
            title="Smlouva o obchodní spolupráci - Tipařská činnost",
            source_entity="České pojištění a.s.",
            source_date=datetime(2026, 3, 2, tzinfo=timezone.utc),
            valid_from=datetime(2026, 3, 2, tzinfo=timezone.utc),
            sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            verification_status="VERIFIED",
            verified_at=datetime(2026, 3, 2, tzinfo=timezone.utc),
            verified_by="Compliance Officer",
            notes="Authorized cooperation for tipařská činnost (lead introduction).",
        )
        db.add(contract_evidence)
        db.flush()

    # 5. When demo data is explicitly enabled, use generic demonstration entities
    demo_a = (
        db.query(InsuranceCompany).filter(InsuranceCompany.code == "EXAMPLE_A").first()
    )
    if not demo_a:
        demo_a = InsuranceCompany(
            name="Example Insurance A",
            code="EXAMPLE_A",
            rating="Sample Underwriting Partner A",
            website="https://example.com/a",
            description="Demonstration insurance carrier for test and workflow evaluation.",
            is_active=True,
            display_order=1,
        )
        db.add(demo_a)

    demo_b = (
        db.query(InsuranceCompany).filter(InsuranceCompany.code == "EXAMPLE_B").first()
    )
    if not demo_b:
        demo_b = InsuranceCompany(
            name="Example Insurance B",
            code="EXAMPLE_B",
            rating="Sample Underwriting Partner B",
            website="https://example.com/b",
            description="Demonstration insurance carrier for test and workflow evaluation.",
            is_active=True,
            display_order=2,
        )
        db.add(demo_b)

    db.flush()

    # 6. Synchronize generic demo plans
    plan_count = db.query(InsurancePlan).filter(InsurancePlan.is_active == True).count()
    if plan_count == 0 or plan_count < 2:
        plans = [
            InsurancePlan(
                company_id=demo_a.id,
                name="Example Comprehensive Health Plan",
                category="Comprehensive Health",
                price_amount=10000.0,
                currency="CZK",
                billing_period="year",
                coverage_summary="Demonstration coverage package for platform testing.",
                badge="Example Plan",
                target_audience="General Audience",
                features="Sample feature A\nSample feature B\nStandard emergency care",
                is_featured=True,
                is_active=True,
                display_order=1,
            ),
            InsurancePlan(
                company_id=demo_b.id,
                name="Example Basic Health Plan",
                category="Basic Emergency",
                price_amount=8000.0,
                currency="CZK",
                billing_period="year",
                coverage_summary="Demonstration basic coverage package for platform testing.",
                badge="Example Basic",
                target_audience="General Audience",
                features="Emergency dental & prescription drugs covered\nBasic assistance",
                is_featured=True,
                is_active=True,
                display_order=2,
            ),
        ]
        db.add_all(plans)
        db.flush()

    # 7. Agency Announcement Banner if none
    if db.query(AgencyBanner).count() == 0:
        banner = AgencyBanner(
            title="Czech Foreigners Residence Act (326/1999 Coll.) Compliant Insurance",
            subtitle="All insurance certificates issued through authorized intermediaries meet the latest OAMP Czech Ministry requirements for Long-Term Visa and Residence Permit applications.",
            tag="Regulatory Notice",
            link_url="#application-form",
            button_text="Inquire Now",
            is_active=True,
            display_order=1,
        )
        db.add(banner)

    # 8. Seed Sample ProductVersion and PriceBook for Demo Insurer A
    demo_pv = (
        db.query(ProductVersion)
        .filter(ProductVersion.product_code == "DEMO-PLUS-01")
        .first()
    )
    if not demo_pv:
        demo_pv = ProductVersion(
            company_id=demo_a.id,
            product_name="Sample Comprehensive Foreigners Health Plan",
            product_code="DEMO-PLUS-01",
            version="2026-03-02",
            valid_from=datetime(2026, 3, 2, tzinfo=timezone.utc),
            status="VERIFIED",
            evidence_id=contract_evidence.id if contract_evidence else None,
            currency="CZK",
            coverage_summary="10,000,000 CZK comprehensive foreigners health insurance per Act No. 326/1999 Coll.",
        )
        db.add(demo_pv)
        db.flush()

        pb = PriceBook(
            product_version_id=demo_pv.id,
            book_code="DEMO-PLUS-2026",
            version="2026-03-02",
            effective_from=datetime(2026, 3, 2, tzinfo=timezone.utc),
            status="VERIFIED",
            evidence_id=contract_evidence.id if contract_evidence else None,
            source_document_name="Demo Price Schedule",
        )
        db.add(pb)
        db.flush()

        rates = [
            PriceRate(
                price_book_id=pb.id,
                plan_variant="Student 15-30",
                duration_months=12,
                age_min=15,
                age_max=30,
                target_group="student",
                amount_czk=10000.0,
            ),
            PriceRate(
                price_book_id=pb.id,
                plan_variant="Student 15-30",
                duration_months=24,
                age_min=15,
                age_max=30,
                target_group="student",
                amount_czk=20000.0,
            ),
        ]
        db.add_all(rates)

    db.commit()
    logger.info(
        "Compliance defaults and demonstration templates synchronized successfully."
    )


# Backward compatibility alias
def seed_czech_broker_defaults(db: Session) -> None:
    seed_demo_defaults(db)
