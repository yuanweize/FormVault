"""
Unit tests for database models.
"""
import pytest
from datetime import datetime, date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

from app.database import Base
from app.models import Application, File, EmailExport, AuditLog


# Test database setup
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    """Create a test database session."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_application(db_session):
    """Create a sample application for testing."""
    application = Application(
        reference_number="FV-20240115-TEST",
        first_name="John",
        last_name="Doe",
        email="john.doe@example.com",
        phone="+1234567890",
        address_street="123 Main St",
        address_city="Anytown",
        address_state="CA",
        address_zip_code="12345",
        address_country="USA",
        date_of_birth=date(1990, 1, 1),
        insurance_type="health",
        preferred_language="en",
        status="draft"
    )
    db_session.add(application)
    db_session.commit()
    db_session.refresh(application)
    return application


class TestApplication:
    """Test cases for Application model."""
    
    def test_create_application(self, db_session):
        """Test creating a new application."""
        application = Application(
            reference_number="FV-20240115-TEST",
            first_name="Jane",
            last_name="Smith",
            email="jane.smith@example.com",
            insurance_type="auto",
            status="draft"
        )
        
        db_session.add(application)
        db_session.commit()
        
        assert application.id is not None
        assert application.full_name == "Jane Smith"
        assert application.created_at is not None
        assert application.updated_at is not None
    
    def test_unique_reference_number(self, db_session, sample_application):
        """Test that reference numbers must be unique."""
        duplicate_application = Application(
            reference_number=sample_application.reference_number,
            first_name="Jane",
            last_name="Smith",
            email="jane.smith@example.com",
            insurance_type="auto"
        )
        
        db_session.add(duplicate_application)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_full_address_property(self, db_session):
        """Test the full_address property."""
        application = Application(
            reference_number="FV-20240115-ADDR",
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            insurance_type="health",
            address_street="123 Main St",
            address_city="Anytown",
            address_state="CA",
            address_zip_code="12345",
            address_country="USA"
        )
        
        expected_address = "123 Main St, Anytown, CA, 12345, USA"
        assert application.full_address == expected_address
    
    def test_full_address_property_partial(self, db_session):
        """Test full_address property with partial address."""
        application = Application(
            reference_number="FV-20240115-PART",
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            insurance_type="health",
            address_street="123 Main St",
            address_city="Anytown"
        )
        
        expected_address = "123 Main St, Anytown"
        assert application.full_address == expected_address
    
    def test_full_address_property_none(self, db_session):
        """Test full_address property with no address."""
        application = Application(
            reference_number="FV-20240115-NONE",
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            insurance_type="health"
        )
        
        assert application.full_address is None
    
    def test_generate_reference_number(self, db_session):
        """Test reference number generation."""
        application = Application(
            reference_number="temp",
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            insurance_type="health"
        )
        
        ref_number = application.generate_reference_number()
        assert ref_number.startswith("FV-")
        assert len(ref_number) == 16  # FV-YYYYMMDD-XXXX format


class TestFile:
    """Test cases for File model."""
    
    def test_create_file(self, db_session, sample_application):
        """Test creating a new file."""
        file_obj = File(
            application_id=sample_application.id,
            file_type="student_id",
            original_filename="student_id.jpg",
            stored_filename="abc123_student_id.jpg",
            file_size=1024000,
            mime_type="image/jpeg",
            file_hash="abc123hash",
            upload_ip="192.168.1.1"
        )
        
        db_session.add(file_obj)
        db_session.commit()
        
        assert file_obj.id is not None
        assert file_obj.application_id == sample_application.id
        assert file_obj.file_size_mb == 0.98  # 1024000 bytes = ~0.98 MB
        assert file_obj.is_image is True
        assert file_obj.is_pdf is False
    
    def test_file_properties(self, db_session, sample_application):
        """Test file property methods."""
        # Test image file
        image_file = File(
            application_id=sample_application.id,
            file_type="passport",
            original_filename="passport.png",
            stored_filename="def456_passport.png",
            file_size=2048000,
            mime_type="image/png"
        )
        
        assert image_file.is_image is True
        assert image_file.is_pdf is False
        assert image_file.get_file_extension() == "png"
        assert image_file.file_size_mb == 1.95
        
        # Test PDF file
        pdf_file = File(
            application_id=sample_application.id,
            file_type="student_id",
            original_filename="document.pdf",
            stored_filename="ghi789_document.pdf",
            file_size=512000,
            mime_type="application/pdf"
        )
        
        assert pdf_file.is_image is False
        assert pdf_file.is_pdf is True
        assert pdf_file.get_file_extension() == "pdf"
        assert pdf_file.file_size_mb == 0.49
    
    def test_file_relationship(self, db_session, sample_application):
        """Test file-application relationship."""
        file_obj = File(
            application_id=sample_application.id,
            file_type="student_id",
            original_filename="test.jpg",
            stored_filename="test_stored.jpg",
            file_size=1000,
            mime_type="image/jpeg"
        )
        
        db_session.add(file_obj)
        db_session.commit()
        
        # Test relationship from file to application
        assert file_obj.application.id == sample_application.id
        
        # Test relationship from application to files
        db_session.refresh(sample_application)
        assert len(sample_application.files) == 1
        assert sample_application.files[0].id == file_obj.id


class TestEmailExport:
    """Test cases for EmailExport model."""
    
    def test_create_email_export(self, db_session, sample_application):
        """Test creating a new email export."""
        export = EmailExport(
            application_id=sample_application.id,
            recipient_email="insurance@company.com",
            insurance_company="Test Insurance Co",
            status="pending"
        )
        
        db_session.add(export)
        db_session.commit()
        
        assert export.id is not None
        assert export.is_pending is True
        assert export.is_sent is False
        assert export.is_failed is False
        assert export.needs_retry is False
    
    def test_export_status_methods(self, db_session, sample_application):
        """Test email export status methods."""
        export = EmailExport(
            application_id=sample_application.id,
            recipient_email="test@company.com",
            status="pending"
        )
        
        db_session.add(export)
        db_session.commit()
        
        # Test mark as sent
        export.mark_as_sent()
        assert export.is_sent is True
        assert export.sent_at is not None
        assert export.error_message is None
        
        # Test mark as failed
        export.mark_as_failed("SMTP connection failed")
        assert export.is_failed is True
        assert export.error_message == "SMTP connection failed"
        assert export.sent_at is None
        
        # Test mark for retry
        export.mark_for_retry("Temporary failure")
        assert export.needs_retry is True
        assert export.retry_count == 1
        assert export.error_message == "Temporary failure"
    
    def test_max_retries(self, db_session, sample_application):
        """Test maximum retry logic."""
        export = EmailExport(
            application_id=sample_application.id,
            recipient_email="test@company.com",
            retry_count=3
        )
        
        assert export.max_retries_reached is True
        
        export.retry_count = 2
        assert export.max_retries_reached is False


class TestAuditLog:
    """Test cases for AuditLog model."""
    
    def test_create_audit_log(self, db_session, sample_application):
        """Test creating a new audit log."""
        log = AuditLog.create_log(
            action="application.created",
            application_id=sample_application.id,
            user_ip="192.168.1.1",
            user_agent="Mozilla/5.0...",
            details={"field": "value"}
        )
        
        db_session.add(log)
        db_session.commit()
        
        assert log.id is not None
        assert log.action == "application.created"
        assert log.application_id == sample_application.id
        assert log.details == {"field": "value"}
        assert log.created_at is not None
    
    def test_audit_log_properties(self, db_session):
        """Test audit log property methods."""
        # Test action category
        log = AuditLog(action="auth.login_failed", user_ip="192.168.1.1")
        assert log.action_category == "auth"
        
        log2 = AuditLog(action="simple_action", user_ip="192.168.1.1")
        assert log2.action_category == "general"
        
        # Test security event detection
        security_log = AuditLog(action="auth.login_failed")
        assert security_log.is_security_event is True
        
        normal_log = AuditLog(action="application.created")
        assert normal_log.is_security_event is False
    
    def test_audit_log_application_relationship(self, db_session, sample_application):
        """Test audit log application relationship."""
        log = AuditLog(
            action="application.updated",
            application_id=sample_application.id
        )
        
        db_session.add(log)
        db_session.commit()
        
        assert log.is_application_event is True
        assert log.application.id == sample_application.id
        
        # Test relationship from application to audit logs
        db_session.refresh(sample_application)
        assert len(sample_application.audit_logs) == 1
        assert sample_application.audit_logs[0].id == log.id