"""
Custom SQLAdmin application subclass for FormVault Insurance Brokerage.

Provides custom dashboard metrics, Crisp Live Chat status integration,
and enhanced administrative workflows.
"""

import os
import logging
from starlette.requests import Request
from starlette.responses import Response
from sqladmin import Admin
from sqladmin.authentication import login_required

logger = logging.getLogger("app.admin")


class FormVaultAdmin(Admin):
    """
    Enhanced Admin interface with custom dashboard metrics and rich templates.
    """

    @login_required
    async def index(self, request: Request) -> Response:
        """
        Custom admin index dashboard rendering rich KPI metrics,
        Crisp chat integration status, and Czech insurance partner summaries.
        """
        stats = {
            "applications_total": 0,
            "applications_submitted": 0,
            "applications_processed": 0,
            "applications_completed": 0,
            "files_total": 0,
            "partners_active": 0,
            "plans_active": 0,
            "banners_active": 0,
            "audit_logs_total": 0,
            "system_config": None,
        }

        try:
            with self.session_maker() as session:
                from ..models.application import Application
                from ..models.file import File
                from ..models.partner import (
                    InsuranceCompany,
                    InsurancePlan,
                    AgencyBanner,
                )
                from ..models.audit_log import AuditLog
                from ..models.system import SystemConfig

                stats["applications_total"] = session.query(Application).count()
                stats["applications_submitted"] = (
                    session.query(Application)
                    .filter(Application.status == "submitted")
                    .count()
                )
                stats["applications_processed"] = (
                    session.query(Application)
                    .filter(Application.status == "processed")
                    .count()
                )
                stats["applications_completed"] = (
                    session.query(Application)
                    .filter(Application.status == "completed")
                    .count()
                )
                stats["files_total"] = session.query(File).count()
                stats["partners_active"] = (
                    session.query(InsuranceCompany)
                    .filter(InsuranceCompany.is_active == True)  # noqa: E712
                    .count()
                )
                stats["plans_active"] = (
                    session.query(InsurancePlan)
                    .filter(InsurancePlan.is_active == True)  # noqa: E712
                    .count()
                )
                stats["banners_active"] = (
                    session.query(AgencyBanner)
                    .filter(AgencyBanner.is_active == True)  # noqa: E712
                    .count()
                )
                stats["audit_logs_total"] = session.query(AuditLog).count()
                stats["system_config"] = session.query(SystemConfig).first()
        except Exception as e:
            logger.warning(f"Could not load full admin dashboard metrics: {e}")

        context = {
            "request": request,
            "title": "Operations Dashboard",
            "subtitle": "FormVault Czech Insurance Brokerage Console",
            "stats": stats,
        }
        return await self.templates.TemplateResponse(
            request, "sqladmin/index.html", context
        )
