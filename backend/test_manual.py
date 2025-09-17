"""
Manual test to verify the API structure works correctly.
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    # Test imports
    from app.core.config import Settings, get_settings
    from app.core.exceptions import FormVaultException, ValidationException
    from app.schemas.base import ResponseBase, InsuranceType
    from app.schemas.application import ApplicationCreateSchema, PersonalInfoSchema, AddressSchema
    from app.schemas.file import FileUploadResponseSchema
    
    print("✓ All imports successful")
    
    # Test settings
    settings = get_settings()
    print(f"✓ Settings loaded: DEBUG={settings.DEBUG}")
    
    # Test exception creation
    exc = FormVaultException("Test error", "TEST_ERROR", 400)
    print(f"✓ Exception created: {exc.message}")
    
    # Test schema validation
    address_data = {
        "street": "123 Main St",
        "city": "Anytown", 
        "state": "CA",
        "zip_code": "12345",
        "country": "USA"
    }
    
    personal_info_data = {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "address": address_data,
        "date_of_birth": "1990-01-01"
    }
    
    app_data = {
        "personal_info": personal_info_data,
        "insurance_type": "health",
        "preferred_language": "en"
    }
    
    # Test schema creation
    address = AddressSchema(**address_data)
    personal_info = PersonalInfoSchema(**personal_info_data)
    application = ApplicationCreateSchema(**app_data)
    
    print("✓ Schema validation successful")
    print(f"  - Address: {address.city}, {address.state}")
    print(f"  - Person: {personal_info.first_name} {personal_info.last_name}")
    print(f"  - Insurance: {application.insurance_type}")
    
    print("\n🎉 All manual tests passed! The API structure is working correctly.")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure FastAPI and other dependencies are installed")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()