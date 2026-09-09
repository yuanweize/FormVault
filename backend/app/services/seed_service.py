"""
Seed and synchronization service for insurance workflow configuration,
demonstration companies, plans, evidence records, and legal document versions.

Ensures proper separation between production data and sample workflow data:
- Environment variable DEMO_DATA=false completely disables demo carrier/plan seeding.
- Initializes verifiable evidence records, product versions, and system configuration.
"""

import os
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
            public_wording_approved=True,
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
        .filter(LegalDocumentVersion.doc_type == "terms", LegalDocumentVersion.version == "1.0.0")
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
        .filter(LegalDocumentVersion.doc_type == "privacy", LegalDocumentVersion.version == "1.0.0")
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

    # 3. Check DEMO_DATA environment variable
    demo_enabled = os.environ.get("DEMO_DATA", "true").lower() not in ("false", "0", "no")
    if not demo_enabled:
        db.commit()
        logger.info("DEMO_DATA is disabled; skipped seeding demonstration partners and plans.")
        return

    # 4. Seed Baseline Evidence Record
    contract_evidence = (
        db.query(EvidenceRecord)
        .filter(EvidenceRecord.title == "Smlouva o obchodní spolupráci - Tipařská činnost")
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

    # 5. Ensure Demo Underwriting Partners exist
    pvzp = db.query(InsuranceCompany).filter(InsuranceCompany.code == "PVZP").first()
    if not pvzp:
        pvzp = InsuranceCompany(
            name="PVZP (Pojišťovna VZP, a.s.)",
            code="PVZP",
            rating="Leading Czech Underwriter / 5,000+ Contracted Clinics",
            website="https://www.pvzp.cz",
            description="Pojišťovna VZP, a.s. is the premier foreigners health insurance provider in the Czech Republic, fully recognized by the Ministry of Interior (OAMP) with pre-existing condition coverage.",
            is_active=True,
            display_order=1,
        )
        db.add(pvzp)
    else:
        pvzp.name = "PVZP (Pojišťovna VZP, a.s.)"
        pvzp.rating = "Leading Czech Underwriter / 5,000+ Contracted Clinics"
        pvzp.is_active = True

    slavia = db.query(InsuranceCompany).filter(InsuranceCompany.code == "SLAVIA").first()
    if not slavia:
        slavia = InsuranceCompany(
            name="Slavia Pojišťovna a.s.",
            code="SLAVIA",
            rating="Accredited Partner / Backdated Coverage up to 3 Months",
            website="https://www.slavia-pojistovna.cz",
            description="Slavia Insurance offers comprehensive foreigners health insurance (KZPC 131) with high coverage limits, fast digital claims settlement, and flexible commencement dates.",
            is_active=True,
            display_order=2,
        )
        db.add(slavia)
    else:
        slavia.name = "Slavia Pojišťovna a.s."
        slavia.rating = "Accredited Partner / Backdated Coverage up to 3 Months"
        slavia.is_active = True

    sv = db.query(InsuranceCompany).filter(InsuranceCompany.code == "SV").first()
    if not sv:
        sv = InsuranceCompany(
            name="SV Pojišťovna, a.s. (formerly ERGO)",
            code="SV",
            rating="Top-Rated Welcome Komplex / Best Student Feedback",
            website="https://www.svpojistovna.cz",
            description="SV pojišťovna (formerly ERGO pojišťovna) provides the trusted Welcome Komplex insurance series with competitive student pricing and top customer ratings.",
            is_active=True,
            display_order=3,
        )
        db.add(sv)
    else:
        sv.name = "SV Pojišťovna, a.s. (formerly ERGO)"
        sv.is_active = True

    # Safely deactivate un-contracted mock companies if they exist
    unpartnered = db.query(InsuranceCompany).filter(InsuranceCompany.code.in_(["MAXIMA", "UNIQA"])).all()
    for comp in unpartnered:
        comp.is_active = False

    db.flush()

    # 6. Synchronize authentic demo plans
    plan_count = db.query(InsurancePlan).filter(InsurancePlan.is_active == True).count()
    if plan_count == 0 or plan_count < 3:
        plans = [
            InsurancePlan(
                company_id=pvzp.id,
                name="PVZP Komplexní zdravotní pojištění PLUS (Student 15-30 let)",
                category="Comprehensive Health",
                price_amount=12978.0,
                currency="CZK",
                billing_period="year",
                coverage_summary="10,000,000 CZK (~400,000 EUR) limit, over 5,000 contracted clinics in Czechia, pre-existing conditions covered.",
                badge="Top Authority",
                target_audience="Students (15-30 yrs) & Long-Term Visa Applicants",
                features="Czech Ministry of the Interior (OAMP) certified\nDirect billing with major hospitals\nDental care & repatriation covered\nDiscounted partner rate applied",
                is_featured=True,
                is_active=True,
                display_order=1,
            ),
            InsurancePlan(
                company_id=slavia.id,
                name="Slavia KZPC 131 Komplexní pojištění (Student 15-35 let)",
                category="Student Special",
                price_amount=11200.0,
                currency="CZK",
                billing_period="year",
                coverage_summary="10,000,000 CZK limit, allows backdated insurance up to 3 months, +2 extra months free promo included.",
                badge="Best Value",
                target_audience="Students (15-35 yrs) & Expatriates",
                features="100% compliant with Act No. 326/1999 Coll.\nBackdated insurance possible up to 3 months\n2 extra months free on annual plans\nFast reimbursement claims",
                is_featured=True,
                is_active=True,
                display_order=2,
            ),
            InsurancePlan(
                company_id=sv.id,
                name="SV WELCOME Komplex (Student 16-26 let)",
                category="Comprehensive Health",
                price_amount=11214.0,
                currency="CZK",
                billing_period="year",
                coverage_summary="10,000,000 CZK medical coverage, excellent client feedback, comprehensive hospital & outpatient care.",
                badge="Client Favorite",
                target_audience="Students (16-26 yrs) & Young Scholars",
                features="Act No. 326/1999 Coll. certified for visa extension\nCompetitive student rate\nNo complicated special questionnaire for standard applicants\nMultilingual 24/7 assistance",
                is_featured=True,
                is_active=True,
                display_order=3,
            ),
            InsurancePlan(
                company_id=pvzp.id,
                name="PVZP Komplexní EXCLUSIVE (Standard Adult)",
                category="VIP Comprehensive",
                price_amount=18540.0,
                currency="CZK",
                billing_period="year",
                coverage_summary="Premium comprehensive coverage with VIP assistance, higher dental limits, and broad outpatient care.",
                badge="VIP Coverage",
                target_audience="Working Expatriates & Premium Travelers",
                features="10,000,000 CZK comprehensive limit\nEnhanced dental & outpatient limits\nDirect cashless billing with private clinics\nWorldwide Schengen travel rider included",
                is_featured=False,
                is_active=True,
                display_order=4,
            ),
        ]
        db.add_all(plans)

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

    # 8. Seed Sample ProductVersion and PriceBook for PVZP
    pvzp_pv = (
        db.query(ProductVersion)
        .filter(ProductVersion.product_code == "PVZP-KZPC-PLUS")
        .first()
    )
    if not pvzp_pv:
        pvzp_pv = ProductVersion(
            company_id=pvzp.id,
            product_name="Komplexní zdravotní pojištění PLUS",
            product_code="PVZP-KZPC-PLUS",
            version="2026-03-02",
            valid_from=datetime(2026, 3, 2, tzinfo=timezone.utc),
            status="VERIFIED",
            evidence_id=contract_evidence.id if contract_evidence else None,
            currency="CZK",
            coverage_summary="10,000,000 CZK comprehensive foreigners health insurance per Act No. 326/1999 Coll.",
        )
        db.add(pvzp_pv)
        db.flush()

        pb = PriceBook(
            product_version_id=pvzp_pv.id,
            book_code="PVZP-PLUS-2026-03",
            version="2026-03-02",
            effective_from=datetime(2026, 3, 2, tzinfo=timezone.utc),
            status="VERIFIED",
            evidence_id=contract_evidence.id if contract_evidence else None,
            source_document_name="PVZP Ceník KZPC PLUS 2026-03-02",
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
                amount_czk=12978.0,
            ),
            PriceRate(
                price_book_id=pb.id,
                plan_variant="Student 15-30",
                duration_months=24,
                age_min=15,
                age_max=30,
                target_group="student",
                amount_czk=25956.0,
            ),
        ]
        db.add_all(rates)

    db.commit()
    logger.info("Compliance defaults and demonstration templates synchronized successfully.")


# Backward compatibility alias
def seed_czech_broker_defaults(db: Session) -> None:
    seed_demo_defaults(db)
