"""
Simple test to verify core functionality without external dependencies.
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_core_modules():
    """Test that core modules can be imported and work correctly."""
    
    print("Testing core modules...")
    
    # Test configuration
    try:
        from app.core.config import Settings
        settings = Settings()
        print(f"✓ Settings class works: MAX_FILE_SIZE={settings.MAX_FILE_SIZE}")
    except Exception as e:
        print(f"❌ Settings error: {e}")
        return False
    
    # Test exceptions
    try:
        from app.core.exceptions import FormVaultException, ValidationException
        exc = FormVaultException("Test", "TEST", 400)
        print(f"✓ Exceptions work: {exc.error_code}")
    except Exception as e:
        print(f"❌ Exceptions error: {e}")
        return False
    
    # Test base schemas
    try:
        from app.schemas.base import InsuranceType, ApplicationStatus, FileType
        print(f"✓ Enums work: {InsuranceType.HEALTH}, {ApplicationStatus.DRAFT}, {FileType.STUDENT_ID}")
    except Exception as e:
        print(f"❌ Base schemas error: {e}")
        return False
    
    return True

def test_schema_structure():
    """Test schema structure without Pydantic validation."""
    
    print("\nTesting schema structure...")
    
    try:
        # Import schema classes
        from app.schemas.application import AddressSchema, PersonalInfoSchema, ApplicationCreateSchema
        from app.schemas.file import FileUploadResponseSchema
        from app.schemas.base import ResponseBase
        
        print("✓ All schema classes imported successfully")
        
        # Check that classes have expected attributes
        address_fields = AddressSchema.__annotations__.keys()
        expected_address_fields = {'street', 'city', 'state', 'zip_code', 'country'}
        if expected_address_fields.issubset(address_fields):
            print("✓ AddressSchema has correct fields")
        else:
            print(f"❌ AddressSchema missing fields: {expected_address_fields - address_fields}")
            return False
        
        personal_fields = PersonalInfoSchema.__annotations__.keys()
        expected_personal_fields = {'first_name', 'last_name', 'email', 'address', 'date_of_birth'}
        if expected_personal_fields.issubset(personal_fields):
            print("✓ PersonalInfoSchema has correct fields")
        else:
            print(f"❌ PersonalInfoSchema missing fields: {expected_personal_fields - personal_fields}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Schema structure error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_structure():
    """Test API router structure."""
    
    print("\nTesting API structure...")
    
    try:
        # Test that router modules exist and can be imported
        from app.api.v1.router import api_router
        from app.api.v1.endpoints import health, applications, files
        
        print("✓ API router and endpoints imported successfully")
        
        # Check that routers have routes
        if hasattr(api_router, 'routes'):
            print(f"✓ API router has {len(api_router.routes)} routes")
        else:
            print("❌ API router has no routes attribute")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ API structure error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🧪 Running simple tests for FormVault API structure...\n")
    
    success = True
    success &= test_core_modules()
    success &= test_schema_structure()
    success &= test_api_structure()
    
    if success:
        print("\n🎉 All simple tests passed! Core API structure is working.")
    else:
        print("\n❌ Some tests failed. Check the errors above.")
        sys.exit(1)