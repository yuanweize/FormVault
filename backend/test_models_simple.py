"""
Simple test runner for database models without pytest.
"""
import sys
import os
from datetime import datetime, date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

# Add app to path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from app.database import Base
from app.models import Application, File, EmailExport, AuditLog

# Test database setup
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def setup_test_db():
    """Create test database tables."""
    Base.metadata.create_all(bind=engine)
    return TestingSessionLocal()

def test_application_model():
    """Test Application model functionality."""
    print("Testing Application model...")
    
    db = setup_test_db()
    
    try:
        # Test creating application
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
        
        db.add(application)
        db.commit()
        
        # Test properties
        assert application.id is not None
        assert application.full_name == "John Doe"
        assert application.full_address == "123 Main St, Anytown, CA, 12345, USA"
        assert application.created_at is not None
        
        # Test reference number generation
        ref_number = application.generate_reference_number()
        assert ref_number.startswith("FV-")
        assert len(ref_number) == 16
        
        print("✓ Application model tests passed")
        return application
        
    except Exception as e:
        print(f"✗ Application model test failed: {e}")
        raise
    finally:
        db.close()

def test_file_model(application):
    """Test File model functionality."""
    print("Testing File model...")
    
    db = setup_test_db()
    
    try:
        # Re-add application to new session
        db.add(application)
        db.commit()
        
        # Test creating file
        file_obj = File(
            application_id=application.id,
            file_type="student_id",
            original_filename="student_id.jpg",
            stored_filename="abc123_student_id.jpg",
            file_size=1024000,
            mime_type="image/jpeg",
            file_hash="abc123hash",
            upload_ip="192.168.1.1"
        )
        
        db.add(file_obj)
        db.commit()
        
        # Test properties
        assert file_obj.id is not None
        assert file_obj.file_size_mb == 0.98  # 1024000 bytes ≈ 0.98 MB
        assert file_obj.is_image is True
        assert file_obj.is_pdf is False
        assert file_obj.get_file_extension() == "jpg"
        
        # Test relationship
        assert file_obj.application.id == application.id
        
        print("✓ File model tests passed")
        
    except Exception as e:
        print(f"✗ File model test failed: {e}")
        raise
    finally:
        db.close()

def test_email_export_model(application):
    """Test EmailExport model functionality."""
    print("Testing EmailExport model...")
    
    db = setup_test_db()
    
    try:
        # Re-add application to new session
        db.add(application)
        db.commit()
        
        # Test creating email export
        export = EmailExport(
            application_id=application.id,
            recipient_email="insurance@company.com",
            insurance_company="Test Insurance Co",
            status="pending"
        )
        
        db.add(export)
        db.commit()
        
        # Test status properties
        assert export.is_pending is True
        assert export.is_sent is False
        assert export.is_failed is False
        assert export.needs_retry is False
        
        # Test status methods
        export.mark_as_sent()
        assert export.is_sent is True
        assert export.sent_at is not None
        
        export.mark_as_failed("SMTP error")
        assert export.is_failed is True
        assert export.error_message == "SMTP error"
        
        export.mark_for_retry("Temporary failure")
        assert export.needs_retry is True
        assert export.retry_count == 1
        
        print("✓ EmailExport model tests passed")
        
    except Exception as e:
        print(f"✗ EmailExport model test failed: {e}")
        raise
    finally:
        db.close()

def test_audit_log_model(application):
    """Test AuditLog model functionality."""
    print("Testing AuditLog model...")
    
    db = setup_test_db()
    
    try:
        # Re-add application to new session
        db.add(application)
        db.commit()
        
        # Test creating audit log
        log = AuditLog.create_log(
            action="application.created",
            application_id=application.id,
            user_ip="192.168.1.1",
            user_agent="Mozilla/5.0...",
            details={"field": "value"}
        )
        
        db.add(log)
        db.commit()
        
        # Test properties
        assert log.id is not None
        assert log.action == "application.created"
        assert log.action_category == "application"
        assert log.is_application_event is True
        assert log.details == {"field": "value"}
        
        # Test security event detection
        security_log = AuditLog(action="auth.login_failed")
        assert security_log.is_security_event is True
        
        normal_log = AuditLog(action="application.updated")
        assert normal_log.is_security_event is False
        
        print("✓ AuditLog model tests passed")
        
    except Exception as e:
        print(f"✗ AuditLog model test failed: {e}")
        raise
    finally:
        db.close()

def main():
    """Run all model tests."""
    print("Running database model tests...\n")
    
    try:
        # Test models
        application = test_application_model()
        test_file_model(application)
        test_email_export_model(application)
        test_audit_log_model(application)
        
        print("\n✓ All model tests passed successfully!")
        
    except Exception as e:
        print(f"\n✗ Tests failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())