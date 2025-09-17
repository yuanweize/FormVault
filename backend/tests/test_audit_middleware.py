"""
Tests for audit logging middleware.
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi import FastAPI, Request, Response
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.middleware.audit import AuditMiddleware
from app.models.audit_log import AuditLog


class TestAuditMiddleware:
    """Test cases for audit logging middleware."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.app = FastAPI()
        self.app.add_middleware(AuditMiddleware)
        
        @self.app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        @self.app.post("/api/v1/applications")
        async def create_application():
            return {"id": "test-id"}
        
        @self.app.get("/health")
        async def health_check():
            return {"status": "ok"}
        
        self.client = TestClient(self.app)
    
    @patch('app.middleware.audit.get_db')
    def test_audit_middleware_logs_api_request(self, mock_get_db):
        """Test that audit middleware logs API requests."""
        # Mock database session
        mock_db = Mock(spec=Session)
        mock_get_db.return_value = iter([mock_db])
        
        # Make request
        response = self.client.get("/test")
        
        # Verify response
        assert response.status_code == 200
        
        # Verify audit log was created
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        
        # Get the audit log that was added
        audit_log_call = mock_db.add.call_args[0][0]
        assert isinstance(audit_log_call, AuditLog)
        assert audit_log_call.action == "api.get"
    
    @patch('app.middleware.audit.get_db')
    def test_audit_middleware_skips_excluded_paths(self, mock_get_db):
        """Test that audit middleware skips excluded paths."""
        # Mock database session
        mock_db = Mock(spec=Session)
        mock_get_db.return_value = iter([mock_db])
        
        # Make request to excluded path
        response = self.client.get("/health")
        
        # Verify response
        assert response.status_code == 200
        
        # Verify no audit log was created
        mock_db.add.assert_not_called()
        mock_db.commit.assert_not_called()
    
    @patch('app.middleware.audit.get_db')
    def test_audit_middleware_extracts_application_id(self, mock_get_db):
        """Test that audit middleware extracts application ID from URL."""
        # Mock database session
        mock_db = Mock(spec=Session)
        mock_get_db.return_value = iter([mock_db])
        
        # Add endpoint with application ID
        @self.app.get("/api/v1/applications/{application_id}")
        async def get_application(application_id: str):
            return {"id": application_id}
        
        # Make request with application ID
        test_id = "12345678-1234-1234-1234-123456789012"
        response = self.client.get(f"/api/v1/applications/{test_id}")
        
        # Verify response
        assert response.status_code == 200
        
        # Verify audit log was created with application ID
        audit_log_call = mock_db.add.call_args[0][0]
        assert audit_log_call.application_id == test_id
    
    @patch('app.middleware.audit.get_db')
    def test_audit_middleware_determines_correct_action(self, mock_get_db):
        """Test that audit middleware determines correct action names."""
        # Mock database session
        mock_db = Mock(spec=Session)
        mock_get_db.return_value = iter([mock_db])
        
        # Test POST to applications
        response = self.client.post("/api/v1/applications", json={"test": "data"})
        assert response.status_code == 200
        
        # Verify correct action was logged
        audit_log_call = mock_db.add.call_args[0][0]
        assert audit_log_call.action == "application.create"
    
    @patch('app.middleware.audit.get_db')
    def test_audit_middleware_handles_request_body(self, mock_get_db):
        """Test that audit middleware properly handles request bodies."""
        # Mock database session
        mock_db = Mock(spec=Session)
        mock_get_db.return_value = iter([mock_db])
        
        # Test POST with JSON body
        test_data = {"name": "John Doe", "email": "john@example.com"}
        response = self.client.post("/api/v1/applications", json=test_data)
        
        # Verify audit log includes request details
        audit_log_call = mock_db.add.call_args[0][0]
        assert audit_log_call.details is not None
        assert "request" in audit_log_call.details
        assert "response" in audit_log_call.details
    
    @patch('app.middleware.audit.get_db')
    def test_audit_middleware_handles_database_error(self, mock_get_db):
        """Test that audit middleware handles database errors gracefully."""
        # Mock database session that raises error
        mock_db = Mock(spec=Session)
        mock_db.add.side_effect = Exception("Database error")
        mock_get_db.return_value = iter([mock_db])
        
        # Make request - should not fail even if audit logging fails
        response = self.client.get("/test")
        
        # Verify response is still successful
        assert response.status_code == 200
        
        # Verify rollback was called
        mock_db.rollback.assert_called_once()
    
    def test_get_client_ip_with_forwarded_headers(self):
        """Test client IP extraction with forwarded headers."""
        middleware = AuditMiddleware(None)
        
        # Mock request with X-Forwarded-For header
        request = Mock(spec=Request)
        request.headers = {"x-forwarded-for": "192.168.1.1, 10.0.0.1"}
        request.client = None
        
        ip = middleware._get_client_ip(request)
        assert ip == "192.168.1.1"
    
    def test_get_client_ip_with_real_ip_header(self):
        """Test client IP extraction with X-Real-IP header."""
        middleware = AuditMiddleware(None)
        
        # Mock request with X-Real-IP header
        request = Mock(spec=Request)
        request.headers = {"x-real-ip": "192.168.1.1"}
        request.client = None
        
        ip = middleware._get_client_ip(request)
        assert ip == "192.168.1.1"
    
    def test_get_client_ip_with_direct_client(self):
        """Test client IP extraction from direct client."""
        middleware = AuditMiddleware(None)
        
        # Mock request with client
        request = Mock(spec=Request)
        request.headers = {}
        request.client = Mock()
        request.client.host = "192.168.1.1"
        
        ip = middleware._get_client_ip(request)
        assert ip == "192.168.1.1"
    
    def test_contains_sensitive_data(self):
        """Test sensitive data detection."""
        middleware = AuditMiddleware(None)
        
        # Test with sensitive data
        sensitive_body = '{"password": "secret123", "name": "John"}'
        assert middleware._contains_sensitive_data(sensitive_body) is True
        
        # Test with non-sensitive data
        normal_body = '{"name": "John", "email": "john@example.com"}'
        assert middleware._contains_sensitive_data(normal_body) is False
        
        # Test with empty body
        assert middleware._contains_sensitive_data("") is False
        assert middleware._contains_sensitive_data(None) is False
    
    def test_determine_action_patterns(self):
        """Test action determination for various URL patterns."""
        middleware = AuditMiddleware(None)
        
        # Test exact matches
        assert middleware._determine_action("POST", "/api/v1/applications") == "application.create"
        assert middleware._determine_action("GET", "/api/v1/applications") == "application.list"
        
        # Test pattern matches
        assert middleware._determine_action("GET", "/api/v1/applications/123/export") == "application.export"
        assert middleware._determine_action("PUT", "/api/v1/applications/123") == "application.update"
        
        # Test default action
        assert middleware._determine_action("PATCH", "/api/v1/unknown") == "api.patch"
    
    def test_extract_application_id_from_path(self):
        """Test application ID extraction from URL paths."""
        middleware = AuditMiddleware(None)
        
        # Test valid UUID in path
        test_id = "12345678-1234-1234-1234-123456789012"
        path = f"/api/v1/applications/{test_id}"
        assert middleware._extract_application_id(path) == test_id
        
        # Test path without UUID
        assert middleware._extract_application_id("/api/v1/applications") is None
        
        # Test path with invalid UUID format
        assert middleware._extract_application_id("/api/v1/applications/invalid-id") is None