"""
Email service for sending application data to insurance companies.

This module provides email functionality with SMTP configuration,
template rendering, and retry mechanisms for failed deliveries.
"""

import asyncio
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict, Any
import structlog
from jinja2 import Environment, FileSystemLoader, Template
import os
from pathlib import Path

from app.core.config import get_settings
from app.core.exceptions import EmailServiceException
from app.models.application import Application
from app.models.file import File
from app.models.email_export import EmailExport

logger = structlog.get_logger(__name__)


class EmailService:
    """
    Service for sending emails with application data to insurance companies.

    Provides functionality for:
    - SMTP configuration and connection management
    - Email template rendering with application data
    - File attachment handling
    - Retry mechanism with exponential backoff
    """

    def __init__(self):
        """Initialize email service with configuration."""
        self.settings = get_settings()
        self.template_env = self._setup_template_environment()

    def _setup_template_environment(self) -> Environment:
        """Set up Jinja2 template environment for email templates."""
        template_dir = Path(__file__).parent.parent / "templates" / "email"
        template_dir.mkdir(parents=True, exist_ok=True)

        return Environment(loader=FileSystemLoader(str(template_dir)), autoescape=True)

    async def send_application_export(
        self,
        application: Application,
        recipient_email: str,
        insurance_company: Optional[str] = None,
        additional_notes: Optional[str] = None,
    ) -> bool:
        """
        Send application data via email to insurance company.

        Args:
            application: Application instance with data to export
            recipient_email: Email address of insurance company
            insurance_company: Name of insurance company
            additional_notes: Optional additional notes to include

        Returns:
            bool: True if email sent successfully, False otherwise

        Raises:
            EmailServiceException: If email configuration is invalid or sending fails
        """
        try:
            logger.info(
                "Starting email export",
                application_id=application.id,
                recipient=recipient_email,
                insurance_company=insurance_company,
            )

            # Create email message
            message = await self._create_email_message(
                application=application,
                recipient_email=recipient_email,
                insurance_company=insurance_company,
                additional_notes=additional_notes,
            )

            # Attach files if available
            await self._attach_application_files(message, application)

            # Send email via SMTP
            await self._send_email_smtp(message, recipient_email)

            logger.info(
                "Email export sent successfully",
                application_id=application.id,
                recipient=recipient_email,
            )

            return True

        except Exception as e:
            logger.error(
                "Failed to send email export",
                application_id=application.id,
                recipient=recipient_email,
                error=str(e),
                exc_info=True,
            )
            raise EmailServiceException(
                f"Failed to send email export: {str(e)}",
                operation="send_application_export",
            )

    async def _create_email_message(
        self,
        application: Application,
        recipient_email: str,
        insurance_company: Optional[str] = None,
        additional_notes: Optional[str] = None,
    ) -> MIMEMultipart:
        """Create email message with application data."""

        # Create multipart message
        message = MIMEMultipart()

        # Set email headers
        message["From"] = self.settings.FROM_EMAIL
        message["To"] = recipient_email
        message["Subject"] = f"Insurance Application - {application.reference_number}"

        # Prepare template data
        template_data = {
            "application": {
                "reference_number": application.reference_number,
                "full_name": application.full_name,
                "email": application.email,
                "phone": application.phone,
                "date_of_birth": (
                    application.date_of_birth.strftime("%Y-%m-%d")
                    if application.date_of_birth
                    else None
                ),
                "insurance_type": application.insurance_type.title(),
                "full_address": application.full_address,
                "created_at": application.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "status": application.status.title(),
            },
            "insurance_company": insurance_company or "Insurance Company",
            "additional_notes": additional_notes,
            "export_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "files_count": len(application.files) if application.files else 0,
        }

        # Render email template
        try:
            template = self.template_env.get_template("application_export.html")
            html_content = template.render(**template_data)
        except Exception as e:
            logger.warning("Failed to load HTML template, using fallback", error=str(e))
            html_content = self._create_fallback_html_content(template_data)

        # Create plain text version
        text_content = self._create_text_content(template_data)

        # Attach both HTML and text versions
        message.attach(MIMEText(text_content, "plain"))
        message.attach(MIMEText(html_content, "html"))

        return message

    def _create_fallback_html_content(self, data: Dict[str, Any]) -> str:
        """Create fallback HTML content when template is not available."""
        app_data = data["application"]

        html = f"""
        <html>
        <body>
            <h2>Insurance Application Export</h2>
            <p>Dear {data["insurance_company"]},</p>
            
            <p>Please find below the insurance application details:</p>
            
            <table border="1" cellpadding="5" cellspacing="0">
                <tr><td><strong>Reference Number:</strong></td><td>{app_data["reference_number"]}</td></tr>
                <tr><td><strong>Applicant Name:</strong></td><td>{app_data["full_name"]}</td></tr>
                <tr><td><strong>Email:</strong></td><td>{app_data["email"]}</td></tr>
                <tr><td><strong>Phone:</strong></td><td>{app_data["phone"] or "Not provided"}</td></tr>
                <tr><td><strong>Date of Birth:</strong></td><td>{app_data["date_of_birth"] or "Not provided"}</td></tr>
                <tr><td><strong>Insurance Type:</strong></td><td>{app_data["insurance_type"]}</td></tr>
                <tr><td><strong>Address:</strong></td><td>{app_data["full_address"] or "Not provided"}</td></tr>
                <tr><td><strong>Application Date:</strong></td><td>{app_data["created_at"]}</td></tr>
                <tr><td><strong>Status:</strong></td><td>{app_data["status"]}</td></tr>
            </table>
            
            {f'<p><strong>Files Attached:</strong> {data["files_count"]}</p>' if data["files_count"] > 0 else ''}
            
            {f'<p><strong>Additional Notes:</strong><br>{data["additional_notes"]}</p>' if data["additional_notes"] else ''}
            
            <p>Export Date: {data["export_date"]}</p>
            
            <p>Best regards,<br>FormVault Insurance Portal</p>
        </body>
        </html>
        """

        return html

    def _create_text_content(self, data: Dict[str, Any]) -> str:
        """Create plain text email content."""
        app_data = data["application"]

        # Prepare additional notes section with proper line breaks
        notes_section = ""
        if data.get("additional_notes"):
            notes_section = f"\nAdditional Notes:\n{data['additional_notes']}\n"

        files_section = ""
        if data.get("files_count", 0) > 0:
            files_section = f"\nFiles Attached: {data['files_count']}\n"

        text = f"""
Insurance Application Export

Dear {data["insurance_company"]},

Please find below the insurance application details:

Reference Number: {app_data["reference_number"]}
Applicant Name: {app_data["full_name"]}
Email: {app_data["email"]}
Phone: {app_data["phone"] or "Not provided"}
Date of Birth: {app_data["date_of_birth"] or "Not provided"}
Insurance Type: {app_data["insurance_type"]}
Address: {app_data["full_address"] or "Not provided"}
Application Date: {app_data["created_at"]}
Status: {app_data["status"]}
{files_section}{notes_section}
Export Date: {data["export_date"]}

Best regards,
FormVault Insurance Portal
        """

        return text.strip()

    async def _attach_application_files(
        self, message: MIMEMultipart, application: Application
    ) -> None:
        """Attach application files to email message."""
        if not application.files:
            return

        for file_record in application.files:
            try:
                file_path = Path(self.settings.UPLOAD_DIR) / file_record.stored_filename

                if not file_path.exists():
                    logger.warning(
                        "File not found for attachment",
                        file_id=file_record.id,
                        file_path=str(file_path),
                    )
                    continue

                # Read file content
                with open(file_path, "rb") as f:
                    file_content = f.read()

                # Create attachment
                attachment = MIMEBase("application", "octet-stream")
                attachment.set_payload(file_content)
                encoders.encode_base64(attachment)

                # Set filename
                filename = f"{file_record.file_type}_{file_record.original_filename}"
                attachment.add_header(
                    "Content-Disposition", f"attachment; filename= {filename}"
                )

                message.attach(attachment)

                logger.debug(
                    "File attached to email",
                    file_id=file_record.id,
                    filename=filename,
                    size=file_record.file_size,
                )

            except Exception as e:
                logger.error(
                    "Failed to attach file to email",
                    file_id=file_record.id,
                    error=str(e),
                )
                # Continue with other files even if one fails
                continue

    async def _send_email_smtp(
        self, message: MIMEMultipart, recipient_email: str
    ) -> None:
        """Send email via SMTP server."""

        # Validate SMTP configuration
        if not self.settings.SMTP_HOST:
            raise EmailServiceException(
                "SMTP host not configured", operation="send_email_smtp"
            )

        try:
            # Create SMTP connection
            if self.settings.SMTP_USE_TLS:
                server = smtplib.SMTP(self.settings.SMTP_HOST, self.settings.SMTP_PORT)
                server.starttls()
            else:
                server = smtplib.SMTP(self.settings.SMTP_HOST, self.settings.SMTP_PORT)

            # Authenticate if credentials provided
            if self.settings.SMTP_USERNAME and self.settings.SMTP_PASSWORD:
                server.login(self.settings.SMTP_USERNAME, self.settings.SMTP_PASSWORD)

            # Send email
            text = message.as_string()
            server.sendmail(self.settings.FROM_EMAIL, recipient_email, text)
            server.quit()

            logger.debug(
                "Email sent via SMTP",
                recipient=recipient_email,
                smtp_host=self.settings.SMTP_HOST,
            )

        except smtplib.SMTPException as e:
            raise EmailServiceException(
                f"SMTP error: {str(e)}", operation="send_email_smtp"
            )
        except Exception as e:
            raise EmailServiceException(
                f"Failed to send email: {str(e)}", operation="send_email_smtp"
            )

    async def retry_failed_export(
        self, email_export: EmailExport, max_retries: int = 3, base_delay: int = 60
    ) -> bool:
        """
        Retry failed email export with exponential backoff.

        Args:
            email_export: EmailExport instance to retry
            max_retries: Maximum number of retry attempts
            base_delay: Base delay in seconds for exponential backoff

        Returns:
            bool: True if retry was successful, False otherwise
        """

        if email_export.retry_count >= max_retries:
            logger.warning(
                "Maximum retries reached for email export",
                export_id=email_export.id,
                retry_count=email_export.retry_count,
            )
            return False

        # Calculate delay with exponential backoff
        delay = base_delay * (2**email_export.retry_count)

        logger.info(
            "Retrying email export",
            export_id=email_export.id,
            retry_count=email_export.retry_count + 1,
            delay_seconds=delay,
        )

        # Wait before retry
        await asyncio.sleep(delay)

        try:
            # Attempt to send email again
            success = await self.send_application_export(
                application=email_export.application,
                recipient_email=email_export.recipient_email,
                insurance_company=email_export.insurance_company,
            )

            return success

        except Exception as e:
            logger.error(
                "Retry attempt failed",
                export_id=email_export.id,
                retry_count=email_export.retry_count + 1,
                error=str(e),
            )
            return False


# Global email service instance
email_service = EmailService()
