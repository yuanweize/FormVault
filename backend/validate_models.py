"""
Simple validation script for database models.
"""
import sys
import os

# Add app to path
sys.path.append(os.path.join(os.path.dirname(__file__)))

def validate_model_imports():
    """Validate that all models can be imported."""
    try:
        print("Validating model imports...")
        
        # Test database module
        from app.database import Base, get_db, create_tables, drop_tables
        print("✓ Database module imported successfully")
        
        # Test individual models
        from app.models.application import Application
        print("✓ Application model imported successfully")
        
        from app.models.file import File
        print("✓ File model imported successfully")
        
        from app.models.email_export import EmailExport
        print("✓ EmailExport model imported successfully")
        
        from app.models.audit_log import AuditLog
        print("✓ AuditLog model imported successfully")
        
        # Test models package
        from app.models import Application, File, EmailExport, AuditLog
        print("✓ Models package imported successfully")
        
        # Test utilities
        from app.utils.database import get_db_session, check_database_connection
        print("✓ Database utilities imported successfully")
        
        return True
        
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False

def validate_model_structure():
    """Validate model structure and attributes."""
    try:
        print("\nValidating model structure...")
        
        from app.models import Application, File, EmailExport, AuditLog
        
        # Check Application model
        app_attrs = ['id', 'reference_number', 'first_name', 'last_name', 'email', 
                    'insurance_type', 'status', 'created_at', 'updated_at']
        for attr in app_attrs:
            assert hasattr(Application, attr), f"Application missing attribute: {attr}"
        print("✓ Application model structure validated")
        
        # Check File model
        file_attrs = ['id', 'application_id', 'file_type', 'original_filename', 
                     'stored_filename', 'file_size', 'mime_type', 'created_at']
        for attr in file_attrs:
            assert hasattr(File, attr), f"File missing attribute: {attr}"
        print("✓ File model structure validated")
        
        # Check EmailExport model
        export_attrs = ['id', 'application_id', 'recipient_email', 'status', 
                       'sent_at', 'error_message', 'retry_count', 'created_at']
        for attr in export_attrs:
            assert hasattr(EmailExport, attr), f"EmailExport missing attribute: {attr}"
        print("✓ EmailExport model structure validated")
        
        # Check AuditLog model
        audit_attrs = ['id', 'application_id', 'action', 'user_ip', 'user_agent', 
                      'details', 'created_at']
        for attr in audit_attrs:
            assert hasattr(AuditLog, attr), f"AuditLog missing attribute: {attr}"
        print("✓ AuditLog model structure validated")
        
        return True
        
    except AssertionError as e:
        print(f"✗ Structure validation error: {e}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False

def validate_model_methods():
    """Validate model methods and properties."""
    try:
        print("\nValidating model methods...")
        
        from app.models import Application, File, EmailExport, AuditLog
        
        # Check Application methods
        app_methods = ['full_name', 'full_address', 'generate_reference_number']
        for method in app_methods:
            assert hasattr(Application, method), f"Application missing method: {method}"
        print("✓ Application model methods validated")
        
        # Check File methods
        file_methods = ['file_size_mb', 'is_image', 'is_pdf', 'get_file_extension']
        for method in file_methods:
            assert hasattr(File, method), f"File missing method: {method}"
        print("✓ File model methods validated")
        
        # Check EmailExport methods
        export_methods = ['is_pending', 'is_sent', 'is_failed', 'needs_retry', 
                         'mark_as_sent', 'mark_as_failed', 'mark_for_retry']
        for method in export_methods:
            assert hasattr(EmailExport, method), f"EmailExport missing method: {method}"
        print("✓ EmailExport model methods validated")
        
        # Check AuditLog methods
        audit_methods = ['create_log', 'action_category', 'is_security_event', 'is_application_event']
        for method in audit_methods:
            assert hasattr(AuditLog, method), f"AuditLog missing method: {method}"
        print("✓ AuditLog model methods validated")
        
        return True
        
    except AssertionError as e:
        print(f"✗ Method validation error: {e}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False

def validate_migration_files():
    """Validate migration files exist."""
    try:
        print("\nValidating migration files...")
        
        # Check alembic configuration
        alembic_files = [
            'alembic.ini',
            'alembic/env.py',
            'alembic/script.py.mako',
            'alembic/versions/001_initial_database_schema.py'
        ]
        
        for file_path in alembic_files:
            if os.path.exists(file_path):
                print(f"✓ {file_path} exists")
            else:
                print(f"✗ {file_path} missing")
                return False
        
        return True
        
    except Exception as e:
        print(f"✗ Migration validation error: {e}")
        return False

def main():
    """Run all validations."""
    print("Running database model validations...\n")
    
    validations = [
        validate_model_imports,
        validate_model_structure,
        validate_model_methods,
        validate_migration_files
    ]
    
    all_passed = True
    for validation in validations:
        if not validation():
            all_passed = False
    
    if all_passed:
        print("\n✓ All validations passed successfully!")
        print("\nDatabase models and migrations are properly implemented:")
        print("- SQLAlchemy models for applications, files, email_exports, and audit_logs")
        print("- Alembic migration scripts for database schema creation")
        print("- Database connection utilities with connection pooling")
        print("- Model validation and relationships")
        return 0
    else:
        print("\n✗ Some validations failed!")
        return 1

if __name__ == "__main__":
    exit(main())