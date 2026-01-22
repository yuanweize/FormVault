"""
Unit tests for email service functionality.

Tests email generation, sending, template rendering, and retry mechanisms.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from datetime import datetime
import smtplib
from email.mime.multipart import MIMEMultipart

from app.services.email_service import EmailService, email_service
from app.models.application import Application
from app.models.file import File
from app.models.email_export import EmailExport
from app.core.exceptions import EmailServiceException


class TestEmailService:
    """Test cases for EmailService class."""
    
    @pytest.fixture
    def email_service_instance(self):
        """Create EmailService instance for testing."""
        return EmailService()
    
    @pytest.fixture
    def sample_application(self):
        """Create sample application for testing."""
        app = Mock(spec=Application)
        app.id = "test-app-id"
        app.reference_number = "FV-20241217-TEST"
        app.full_name = "John Doe"
        app.email = "john.doe@example.com"
        app.phone = "+1234567890"
        app.date_of_birth = datetime(1990, 1, 1).date()
        app.insurance_type = "health"
        app.full_address = "123 Main St, Anytown, CA 12345, USA"
        app.created_at = datetime(2024, 12, 17, 10, 0, 0)
        app.status = "submitted"
        app.files = []
        return app
    
    @pytest.fixture
    def sample_file(self):
        """Create sample file for testing."""
        file_obj = Mock(spec=File)
        file_obj.id = "test-file-id"
        file_obj.file_type = "passport"
        file_obj.original_filename = "passport.jpg"
        file_obj.stored_filename = "encrypted_passport.jpg"
        file_obj.file_size = 1024000
        file_obj.mime_type = "image/jpeg"
        return file_obj
    
    def test_email_service_initialization(self, email_service_instance):
        """Test EmailService initialization."""
        assert email_service_instance.settings is not None
        assert email_service_instance.template_env is not None
    
    @pytest.mark.asyncio
    async def test_create_email_message(self, email_service_instance, sample_application):
        """Test email message creation."""
        message = await email_service_instance._create_email_message(
            application=sample_application,
            recipient_email="insurance@company.com",
            insurance_company="Test Insurance Co",
            additional_notes="Test notes"
        )
        
        assert isinstance(message, MIMEMultipart)
        assert message["To"] == "insurance@company.com"
        assert "FV-20241217-TEST" in message["Subject"]
        assert message["From"] == email_service_instance.settings.FROM_EMAIL
    
    def test_create_fallback_html_content(self, email_service_instance, sample_application):
        """Test fallback HTML content creation."""
        template_data = {
            "application": {
                "reference_number": sample_application.reference_number,
                "full_name": sample_application.full_name,
                "email": sample_application.email,
                "phone": sample_application.phone,
                "date_of_birth": "1990-01-01",
                "insurance_type": "Health",
                "full_address": sample_application.full_address,
                "created_at": "2024-12-17 10:00:00",
                "status": "Submitted"
            },
            "insurance_company": "Test Insurance Co",
            "additional_notes": "Test notes",
            "export_date": "2024-12-17 12:00:00 UTC",
            "files_count": 0
        }
        
        html_content = email_service_instance._create_fallback_html_content(template_data)
        
        assert "FV-20241217-TEST" in html_content
        assert "John Doe" in html_content
        assert "Test Insurance Co" in html_content
        assert "Test notes" in html_content
        assert "<html>" in html_content
        assert "</html>" in html_content
    
    def test_create_text_content(self, email_service_instance, sample_application):
        """Test plain text content creation."""
        template_data = {
            "application": {
                "reference_number": sample_application.reference_number,
                "full_name": sample_application.full_name,
                "email": sample_application.email,
                "phone": sample_application.phone,
                "date_of_birth": "1990-01-01",
                "insurance_type": "Health",
                "full_address": sample_application.full_address,
                "created_at": "2024-12-17 10:00:00",
                "status": "Submitted"
            },
            "insurance_company": "Test Insurance Co",
            "additional_notes": "Test notes",
            "export_date": "2024-12-17 12:00:00 UTC",
            "files_count": 0
        }
        
        text_content = email_service_instance._create_text_content(template_data)
        
        assert "FV-20241217-TEST" in text_content
        assert "John Doe" in text_content
        assert "Test Insurance Co" in text_content
        assert "Test notes" in text_content
        assert "Insurance Application Export" in text_content
    
    @pytest.mark.asyncio
    @patch('app.services.email_service.Path')
    async def test_attach_application_files_no_files(self, mock_path, email_service_instance, sample_application):
        """Test file attachment when no files exist."""
        sample_application.files = []
        message = MIMEMultipart()
        
        await email_service_instance._attach_application_files(message, sample_application)
        
        # Should not raise any errors and message should remain unchanged
        assert len(message.get_payload()) == 0
    
    @pytest.mark.asyncio
    @patch('app.services.email_service.Path')
    @patch('builtins.open', create=True)
    async def test_attach_application_files_with_files(
        self, 
        mock_open, 
        mock_path, 
        email_service_instance, 
        sample_application, 
        sample_file
    ):
        """Test file attachment when files exist."""
        # Setup mocks
        sample_application.files = [sample_file]
        mock_file_path = Mock()
        mock_file_path.exists.return_value = True
        mock_path.return_value = mock_file_path
        
        mock_file_content = b"fake file content"
        mock_open.return_value.__enter__.return_value.read.return_value = mock_file_content
        
        message = MIMEMultipart()
        
        await email_service_instance._attach_application_files(message, sample_application)
        
        # Verify file was processed
        mock_open.assert_called_once()
        assert len(message.get_payload()) == 1
    
    @pytest.mark.asyncio
    @patch('app.services.email_service.smtplib.SMTP')
    async def test_send_email_smtp_success(self, mock_smtp, email_service_instance):
        """Test successful SMTP email sending."""
        # Setup mock SMTP server
        mock_server = Mock()
        mock_smtp.return_value = mock_server
        
        message = MIMEMultipart()
        message["From"] = "test@example.com"
        message["To"] = "recipient@example.com"
        message["Subject"] = "Test"
        
        await email_service_instance._send_email_smtp(message, "recipient@example.com")
        
        # Verify SMTP operations
        mock_smtp.assert_called_once()
        mock_server.starttls.assert_called_once()
        mock_server.sendmail.assert_called_once()
        mock_server.quit.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('app.services.email_service.smtplib.SMTP')
    async def test_send_email_smtp_with_auth(self, mock_smtp, email_service_instance):
        """Test SMTP email sending with authentication."""
        # Setup mock SMTP server
        mock_server = Mock()
        mock_smtp.return_value = mock_server
        
        # Mock settings with authentication
        email_service_instance.settings.SMTP_USERNAME = "testuser"
        email_service_instance.settings.SMTP_PASSWORD = "testpass"
        
        message = MIMEMultipart()
        message["From"] = "test@example.com"
        message["To"] = "recipient@example.com"
        message["Subject"] = "Test"
        
        await email_service_instance._send_email_smtp(message, "recipient@example.com")
        
        # Verify authentication was called
        mock_server.login.assert_called_once_with("testuser", "testpass")
    
    @pytest.mark.asyncio
    async def test_send_email_smtp_no_host_configured(self, email_service_instance):
        """Test SMTP sending fails when no host is configured."""
        email_service_instance.settings.SMTP_HOST = ""
        
        message = MIMEMultipart()
        
        with pytest.raises(EmailServiceException) as exc_info:
            await email_service_instance._send_email_smtp(message, "test@example.com")
        
        assert "SMTP host not configured" in str(exc_info.value)
    
    @pytest.mark.asyncio
    @patch('app.services.email_service.smtplib.SMTP')
    async def test_send_email_smtp_connection_error(self, mock_smtp, email_service_instance):
        """Test SMTP sending handles connection errors."""
        mock_smtp.side_effect = smtplib.SMTPException("Connection failed")
        
        message = MIMEMultipart()
        
        with pytest.raises(EmailServiceException) as exc_info:
            await email_service_instance._send_email_smtp(message, "test@example.com")
        
        assert "SMTP error" in str(exc_info.value)
    
    @pytest.mark.asyncio
    @patch.object(EmailService, '_create_email_message')
    @patch.object(EmailService, '_attach_application_files')
    @patch.object(EmailService, '_send_email_smtp')
    async def test_send_application_export_success(
        self, 
        mock_send_smtp, 
        mock_attach_files, 
        mock_create_message,
        email_service_instance, 
        sample_application
    ):
        """Test successful application export."""
        # Setup mocks
        mock_message = MIMEMultipart()
        mock_create_message.return_value = mock_message
        mock_attach_files.return_value = None
        mock_send_smtp.return_value = None
        
        result = await email_service_instance.send_application_export(
            application=sample_application,
            recipient_email="insurance@company.com",
            insurance_company="Test Insurance Co",
            additional_notes="Test notes"
        )
        
        assert result is True
        mock_create_message.assert_called_once()
        mock_attach_files.assert_called_once()
        mock_send_smtp.assert_called_once()
    
    @pytest.mark.asyncio
    @patch.object(EmailService, '_send_email_smtp')
    async def test_send_application_export_smtp_failure(
        self, 
        mock_send_smtp,
        email_service_instance, 
        sample_application
    ):
        """Test application export handles SMTP failures."""
        mock_send_smtp.side_effect = EmailServiceException("SMTP failed")
        
        with pytest.raises(EmailServiceException):
            await email_service_instance.send_application_export(
                application=sample_application,
                recipient_email="insurance@company.com"
            )
    
    @pytest.mark.asyncio
    async def test_retry_failed_export_max_retries_reached(self, email_service_instance):
        """Test retry fails when max retries reached."""
        mock_export = Mock(spec=EmailExport)
        mock_export.retry_count = 5  # Exceeds max retries (3)
        
        result = await email_service_instance.retry_failed_export(mock_export, max_retries=3)
        
        assert result is False
    
    @pytest.mark.asyncio
    @patch('asyncio.sleep')
    @patch.object(EmailService, 'send_application_export')
    async def test_retry_failed_export_success(
        self, 
        mock_send_export, 
        mock_sleep,
        email_service_instance
    ):
        """Test successful retry of failed export."""
        # Setup mock export
        mock_export = Mock(spec=EmailExport)
        mock_export.retry_count = 1
        mock_export.application = Mock()
        mock_export.recipient_email = "test@example.com"
        mock_export.insurance_company = "Test Co"
        
        mock_send_export.return_value = True
        
        result = await email_service_instance.retry_failed_export(mock_export)
        
        assert result is True
        mock_sleep.assert_called_once_with(120)  # 60 * 2^1
        mock_send_export.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('asyncio.sleep')
    @patch.object(EmailService, 'send_application_export')
    async def test_retry_failed_export_failure(
        self, 
        mock_send_export, 
        mock_sleep,
        email_service_instance
    ):
        """Test retry handles export failures."""
        # Setup mock export
        mock_export = Mock(spec=EmailExport)
        mock_export.retry_count = 1
        mock_export.application = Mock()
        mock_export.recipient_email = "test@example.com"
        mock_export.insurance_company = "Test Co"
        
        mock_send_export.side_effect = Exception("Send failed")
        
        result = await email_service_instance.retry_failed_export(mock_export)
        
        assert result is False


class TestEmailServiceIntegration:
    """Integration tests for email service."""
    
    def test_global_email_service_instance(self):
        """Test that global email service instance is available."""
        assert email_service is not None
        assert isinstance(email_service, EmailService)
    
    @pytest.mark.asyncio
    async def test_email_template_environment_setup(self):
        """Test that template environment is properly set up."""
        service = EmailService()
        
        # Template environment should be configured
        assert service.template_env is not None
        assert service.template_env.loader is not None
    
    def test_email_service_settings_integration(self):
        """Test that email service integrates with settings."""
        service = EmailService()
        
        # Should have access to settings
        assert service.settings is not None
        assert hasattr(service.settings, 'SMTP_HOST')
        assert hasattr(service.settings, 'FROM_EMAIL')


if __name__ == "__main__":
    pytest.main([__file__])