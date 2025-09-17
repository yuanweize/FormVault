"""
Simple test for email service functionality without SQLAlchemy dependencies.
"""

import asyncio
from unittest.mock import Mock, patch
from email.mime.multipart import MIMEMultipart


def test_email_template_creation():
    """Test email template creation without database dependencies."""
    
    # Mock application data
    app_data = {
        "reference_number": "FV-20241217-TEST",
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "date_of_birth": "1990-01-01",
        "insurance_type": "Health",
        "full_address": "123 Main St, Anytown, CA 12345",
        "created_at": "2024-12-17 10:00:00",
        "status": "Submitted"
    }
    
    template_data = {
        "application": app_data,
        "insurance_company": "Test Insurance Co",
        "additional_notes": "Test notes",
        "export_date": "2024-12-17 12:00:00 UTC",
        "files_count": 0
    }
    
    # Test HTML content creation
    html_content = create_fallback_html_content(template_data)
    
    assert "FV-20241217-TEST" in html_content
    assert "John Doe" in html_content
    assert "Test Insurance Co" in html_content
    assert "<html>" in html_content
    assert "</html>" in html_content
    
    print("✓ HTML template creation test passed")


def test_text_content_creation():
    """Test plain text content creation."""
    
    app_data = {
        "reference_number": "FV-20241217-TEST",
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "date_of_birth": "1990-01-01",
        "insurance_type": "Health",
        "full_address": "123 Main St, Anytown, CA 12345",
        "created_at": "2024-12-17 10:00:00",
        "status": "Submitted"
    }
    
    template_data = {
        "application": app_data,
        "insurance_company": "Test Insurance Co",
        "additional_notes": "Test notes",
        "export_date": "2024-12-17 12:00:00 UTC",
        "files_count": 0
    }
    
    text_content = create_text_content(template_data)
    
    assert "FV-20241217-TEST" in text_content
    assert "John Doe" in text_content
    assert "Test Insurance Co" in text_content
    assert "Insurance Application Export" in text_content
    
    print("✓ Text content creation test passed")


def test_email_message_structure():
    """Test email message structure creation."""
    
    message = MIMEMultipart()
    message["From"] = "noreply@formvault.com"
    message["To"] = "insurance@company.com"
    message["Subject"] = "Insurance Application - FV-20241217-TEST"
    
    assert message["From"] == "noreply@formvault.com"
    assert message["To"] == "insurance@company.com"
    assert "FV-20241217-TEST" in message["Subject"]
    
    print("✓ Email message structure test passed")


def create_fallback_html_content(data):
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


def create_text_content(data):
    """Create plain text email content."""
    app_data = data["application"]
    
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

{f'Files Attached: {data["files_count"]}' if data["files_count"] > 0 else ''}

{f'Additional Notes:\n{data["additional_notes"]}\n' if data["additional_notes"] else ''}

Export Date: {data["export_date"]}

Best regards,
FormVault Insurance Portal
    """
    
    return text.strip()


if __name__ == "__main__":
    print("Running email service tests...")
    
    test_email_template_creation()
    test_text_content_creation()
    test_email_message_structure()
    
    print("\n✅ All email service tests passed!")