"""
Seed service to populate initial sample broker data for Czech Republic operations.

Can be edited or replaced via Admin Panel at any time. Keeps the codebase open-source
and universally adaptable while providing ready-to-use Czech default templates.
"""

from sqlalchemy.orm import Session
from ..models.partner import InsuranceCompany, InsurancePlan, AgencyBanner
import structlog

logger = structlog.get_logger(__name__)


def seed_czech_broker_defaults(db: Session) -> None:
    """
    Initialize default Czech insurance partner data if the database is currently empty.
    Provides realistic templates for foreign students, expatriates, and travelers in Czechia.
    """
    company_count = db.query(InsuranceCompany).count()
    if company_count > 0:
        return

    logger.info("Initializing default Czech insurance partner showcase templates...")

    # 1. Partner Insurance Companies in Czech Republic
    pvzp = InsuranceCompany(
        name="PVZP (Pojišťovna VZP)",
        code="PVZP",
        rating="Official Partner / Leading Provider",
        website="https://www.pvzp.cz",
        description="Pojišťovna VZP, a.s. is one of the largest foreign health insurance providers in the Czech Republic, fully recognized by the Czech Ministry of Interior (OAMP).",
        is_active=True,
        display_order=1,
    )
    slavia = InsuranceCompany(
        name="Slavia Pojišťovna",
        code="SLAVIA",
        rating="Accredited Partner / High Coverage",
        website="https://www.slavia-pojistovna.cz",
        description="Slavia Insurance offers comprehensive health insurance for foreign nationals with high limits and fast claim settlements across Czechia.",
        is_active=True,
        display_order=2,
    )
    maxima = InsuranceCompany(
        name="Maxima Pojišťovna",
        code="MAXIMA",
        rating="Accredited Partner / Flexible Plans",
        website="https://www.maxima-pojistovna.cz",
        description="Maxima specializes in student and foreign worker medical insurance plans compliant with Act No. 326/1999 Coll.",
        is_active=True,
        display_order=3,
    )
    uniqa = InsuranceCompany(
        name="UNIQA Pojišťovna",
        code="UNIQA",
        rating="International Group / AAA Rated",
        website="https://www.uniqa.cz",
        description="European financial group providing comprehensive health and liability coverage across Central Europe.",
        is_active=True,
        display_order=4,
    )

    db.add_all([pvzp, slavia, maxima, uniqa])
    db.flush()

    # 2. Curated Sample Insurance Plans (CZK)
    plans = [
        InsurancePlan(
            company_id=pvzp.id,
            name="Foreigner Comprehensive Health (KZPC Standard)",
            category="Comprehensive Health",
            price_amount=14500.0,
            currency="CZK",
            billing_period="year",
            coverage_summary="Comprehensive medical coverage up to 10,000,000 CZK (EUR 400,000) for visa & residency permits.",
            badge="Most Popular",
            target_audience="Foreign Students & Long-Term Visa Holders",
            features="Czech Ministry of the Interior (OAMP) compliant\nDirect billing with major hospitals\n24/7 multilingual medical assistance\nRepatriation and dental emergencies covered",
            is_featured=True,
            is_active=True,
            display_order=1,
        ),
        InsurancePlan(
            company_id=slavia.id,
            name="Student Expat Comprehensive Medical",
            category="Student Special",
            price_amount=11800.0,
            currency="CZK",
            billing_period="year",
            coverage_summary="Tailored for university students in Prague, Brno, and across Czechia with full outpatient coverage.",
            badge="Best Student Rate",
            target_audience="University Students (Under 26)",
            features="Compliant with Act No. 326/1999 Coll.\nPreventive care & vaccinations included\nFast digital claim reimbursement\nAccident & civil liability rider available",
            is_featured=True,
            is_active=True,
            display_order=2,
        ),
        InsurancePlan(
            company_id=maxima.id,
            name="Working Expat & Family Shield",
            category="Comprehensive Health",
            price_amount=16200.0,
            currency="CZK",
            billing_period="year",
            coverage_summary="Full medical security for employees, business license holders (Živnostenský list), and family reunification.",
            badge="Full Protection",
            target_audience="Professionals & Families",
            features="High limit maternity & hospitalization\nEmergency dental coverage up to 15,000 CZK\nWorldwide travel extension included in EU/Schengen\nNo medical questionnaire for standard tiers",
            is_featured=True,
            is_active=True,
            display_order=3,
        ),
        InsurancePlan(
            company_id=uniqa.id,
            name="Schengen Tourist & Short-Term Visa",
            category="Travel & Short Stay",
            price_amount=850.0,
            currency="CZK",
            billing_period="month",
            coverage_summary="Standard Schengen travel insurance compliant with Regulation (EC) No 810/2009 (min €30,000).",
            badge="Quick Approval",
            target_audience="Short-term Visitors & Schengen Visas",
            features="Instant insurance certificate download\nEmergency medical treatment across Schengen Area\nMedical transport & repatriation included\nZero deductible on emergency claims",
            is_featured=False,
            is_active=True,
            display_order=4,
        ),
    ]

    db.add_all(plans)

    # 3. Agency Announcement Banner
    banners = [
        AgencyBanner(
            title="Czech Foreigners Residence Act (326/1999 Coll.) Compliant Insurance",
            subtitle="All insurance certificates issued through our agency meet the latest OAMP Czech Ministry requirements for Long-Term Visa and Residence Permit applications.",
            tag="Regulatory Notice",
            link_url="#application-form",
            button_text="Apply Now",
            is_active=True,
            display_order=1,
        )
    ]
    db.add_all(banners)
    db.commit()
    logger.info("Czech insurance partner showcase templates loaded successfully.")
