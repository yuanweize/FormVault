"""
Seed and synchronization service for Czech insurance partner companies and plans.

Accurately represents real broker partnerships under České pojištění a.s. network:
- PVZP (Pojišťovna VZP, a.s.)
- Slavia pojišťovna a.s.
- SV pojišťovna, a.s. (formerly ERGO pojišťovna)
"""

from sqlalchemy.orm import Session
from ..models.partner import InsuranceCompany, InsurancePlan, AgencyBanner
import structlog

logger = structlog.get_logger(__name__)


def seed_czech_broker_defaults(db: Session) -> None:
    """
    Initialize or synchronize authentic Czech insurance partner companies and plans.
    Strictly factual: PVZP, Slavia, and SV pojišťovna (formerly ERGO) under brokerage cooperation.
    """
    # 1. Ensure PVZP, Slavia, and SV exist
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

    # Safely deactivate un-contracted mock companies if they exist from early development
    unpartnered = db.query(InsuranceCompany).filter(InsuranceCompany.code.in_(["MAXIMA", "UNIQA"])).all()
    for comp in unpartnered:
        comp.is_active = False

    db.flush()

    # 2. Synchronize authentic plans from official price lists (Komplexní pojištění cizinců)
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

    # 3. Agency Announcement Banner if none
    if db.query(AgencyBanner).count() == 0:
        banner = AgencyBanner(
            title="Czech Foreigners Residence Act (326/1999 Coll.) Compliant Insurance",
            subtitle="All insurance certificates issued through our agency meet the latest OAMP Czech Ministry requirements for Long-Term Visa and Residence Permit applications.",
            tag="Regulatory Notice",
            link_url="#application-form",
            button_text="Apply Now",
            is_active=True,
            display_order=1,
        )
        db.add(banner)

    db.commit()
    logger.info("Authentic Czech insurance partner showcase templates synchronized successfully.")

