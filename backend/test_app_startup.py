"""
Test that the FastAPI application can start successfully.
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_app_startup():
    """Test that the FastAPI app can be created and started."""
    try:
        from app.main import app
        from fastapi.testclient import TestClient
        
        print("✓ FastAPI app imported successfully")
        
        # Create test client
        client = TestClient(app)
        print("✓ Test client created successfully")
        
        # Test basic health endpoint
        response = client.get("/health")
        assert response.status_code == 200
        print("✓ Health endpoint working")
        
        # Test API v1 health endpoint
        response = client.get("/api/v1/health/")
        assert response.status_code == 200
        print("✓ API v1 health endpoint working")
        
        # Test applications endpoint structure
        response = client.get("/api/v1/applications/")
        assert response.status_code == 200
        print("✓ Applications endpoint accessible")
        
        # Test files validation endpoint
        response = client.get("/api/v1/files/validation/rules")
        assert response.status_code == 200
        data = response.json()
        assert "max_size" in data
        assert "allowed_types" in data
        print("✓ Files validation endpoint working")
        
        # Test OpenAPI schema
        response = client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert "info" in schema
        assert schema["info"]["title"] == "FormVault Insurance Portal API"
        print("✓ OpenAPI schema generated successfully")
        
        print("\n🎉 All startup tests passed! The FastAPI application is working correctly.")
        return True
        
    except Exception as e:
        print(f"❌ Startup test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Testing FastAPI application startup...\n")
    
    success = test_app_startup()
    
    if not success:
        sys.exit(1)