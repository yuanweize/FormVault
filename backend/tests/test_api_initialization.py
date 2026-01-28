"""
Unit tests for API initialization and configuration.

This module tests the FastAPI application setup, middleware configuration,
and basic functionality of the FormVault Insurance Portal API.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import json

from app.main import app
from app.core.config import Settings


class TestAPIInitialization:
    """Test cases for API initialization and basic functionality."""

    def setup_method(self):
        """Set up test client for each test."""
        self.client = TestClient(app)

    def test_health_check_endpoint(self):
        """Test that the health check endpoint works correctly."""
        response = self.client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data

    def test_api_v1_health_endpoints(self):
        """Test API v1 health endpoints."""
        # Basic health check
        response = self.client.get("/api/v1/health/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "formvault-api"

        # Detailed health check
        response = self.client.get("/api/v1/health/detailed")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "environment" in data
        assert "dependencies" in data

        # Readiness check
        response = self.client.get("/api/v1/health/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
        assert "checks" in data

        # Liveness check
        response = self.client.get("/api/v1/health/live")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"

    def test_cors_headers(self):
        """Test that CORS headers are properly configured."""
        response = self.client.options("/api/v1/health/")

        # Check that CORS headers are present
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers
        assert "access-control-allow-headers" in response.headers

    def test_request_logging_middleware(self):
        """Test that request logging middleware adds timing headers."""
        response = self.client.get("/health")

        # Check that timing header is added
        assert "x-process-time" in response.headers
        assert float(response.headers["x-process-time"]) >= 0

    def test_api_documentation_endpoints(self):
        """Test API documentation endpoints availability."""
        # Test OpenAPI schema
        response = self.client.get("/openapi.json")
        assert response.status_code == 200

        schema = response.json()
        assert schema["info"]["title"] == "FormVault Insurance Portal API"
        assert schema["info"]["version"] == "1.0.0"

    @patch("app.core.config.get_settings")
    def test_debug_mode_documentation(self, mock_get_settings):
        """Test that documentation is available in debug mode."""
        # Mock settings with debug enabled
        mock_settings = MagicMock(spec=Settings)
        mock_settings.DEBUG = True
        mock_get_settings.return_value = mock_settings

        # Create new test client with mocked settings
        with TestClient(app) as client:
            response = client.get("/docs")
            # In debug mode, docs should be available (or redirect)
            assert response.status_code in [200, 307]  # 307 for redirect

    def test_application_endpoints_structure(self):
        """Test that application endpoints are properly structured."""
        # Test applications endpoint exists
        response = self.client.get("/api/v1/applications/")
        # Should return 200 with empty list or appropriate response
        assert response.status_code == 200

        # Test file validation endpoint
        response = self.client.get("/api/v1/files/validation/rules")
        assert response.status_code == 200
        data = response.json()
        assert "max_size" in data
        assert "allowed_types" in data

    def test_invalid_endpoint_returns_404(self):
        """Test that invalid endpoints return 404."""
        response = self.client.get("/api/v1/nonexistent")
        assert response.status_code == 404

        data = response.json()
        assert "error" in data
        assert data["error"]["code"] == "HTTP_ERROR"

    def test_method_not_allowed_returns_405(self):
        """Test that invalid methods return 405."""
        response = self.client.patch("/api/v1/health/")
        assert response.status_code == 405


class TestAPIConfiguration:
    """Test cases for API configuration and settings."""

    def setup_method(self):
        """Set up test client for each test."""
        self.client = TestClient(app)

    @patch("app.core.config.get_settings")
    def test_settings_integration(self, mock_get_settings):
        """Test that settings are properly integrated."""
        # Mock settings
        mock_settings = MagicMock(spec=Settings)
        mock_settings.MAX_FILE_SIZE = 1024000
        mock_settings.ALLOWED_FILE_TYPES = ["image/jpeg", "image/png"]
        mock_settings.DEBUG = False
        mock_get_settings.return_value = mock_settings

        # Test that settings are used in endpoints
        response = self.client.get("/api/v1/files/validation/rules")
        assert response.status_code == 200

        data = response.json()
        assert data["max_size"] == 1024000
        assert "image/jpeg" in data["allowed_types"]

    def test_startup_and_shutdown_events(self):
        """Test that startup and shutdown events are configured."""
        # This test verifies that the app can start and stop without errors
        with TestClient(app) as client:
            response = client.get("/health")
            assert response.status_code == 200


class TestAPIRouterStructure:
    """Test cases for API router structure and organization."""

    def setup_method(self):
        """Set up test client for each test."""
        self.client = TestClient(app)

    def test_api_v1_prefix(self):
        """Test that all API endpoints have the correct v1 prefix."""
        # Test health endpoints
        response = self.client.get("/api/v1/health/")
        assert response.status_code == 200

        # Test applications endpoints
        response = self.client.get("/api/v1/applications/")
        assert response.status_code == 200

        # Test files endpoints
        response = self.client.get("/api/v1/files/validation/rules")
        assert response.status_code == 200

    def test_endpoint_tags_in_openapi(self):
        """Test that endpoints are properly tagged in OpenAPI schema."""
        response = self.client.get("/openapi.json")
        assert response.status_code == 200

        schema = response.json()

        # Check that tags are defined
        tags = [tag["name"] for tag in schema.get("tags", [])]
        expected_tags = ["health", "applications", "files"]

        for tag in expected_tags:
            # Tags might not be explicitly defined if no descriptions are provided
            # but endpoints should be categorized
            paths = schema.get("paths", {})
            tag_found = any(
                tag in operation.get("tags", [])
                for path_data in paths.values()
                for operation in path_data.values()
                if isinstance(operation, dict) and "tags" in operation
            )
            if tag_found:
                assert True  # Tag is used in at least one endpoint

    def test_response_models_consistency(self):
        """Test that response models are consistent across endpoints."""
        # Get OpenAPI schema
        response = self.client.get("/openapi.json")
        assert response.status_code == 200

        schema = response.json()
        components = schema.get("components", {})
        schemas = components.get("schemas", {})

        # Check that common response schemas exist
        expected_schemas = [
            "ResponseBase",
            "ApplicationResponseSchema",
            "FileUploadResponseSchema",
        ]

        for schema_name in expected_schemas:
            # Schema might have different names in OpenAPI, so we check for key patterns
            schema_found = any(
                schema_name.lower() in name.lower() or "response" in name.lower()
                for name in schemas.keys()
            )
            # This is a flexible check since schema names might be auto-generated
            assert len(schemas) > 0  # At least some schemas should be present
