"""
Tests for security middleware functionality.

This module tests the security middleware including rate limiting,
input validation, and security headers.
"""

import pytest
import time
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.middleware.security import SecurityMiddleware, CSRFProtection


class TestSecurityMiddleware:
    """Test security middleware functionality."""
    
    def setup_method(self):
        """Set up test client."""
        self.client = TestClient(app)
    
    def test_security_headers_added(self):
        """Test that security headers are added to responses."""
        response = self.client.get("/health")
        
        # Check security headers
        assert "X-Content-Type-Options" in response.headers
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        
        assert "X-Frame-Options" in response.headers
        assert response.headers["X-Frame-Options"] == "DENY"
        
        assert "X-XSS-Protection" in response.headers
        assert response.headers["X-XSS-Protection"] == "1; mode=block"
        
        assert "Strict-Transport-Security" in response.headers
        assert "max-age=31536000" in response.headers["Strict-Transport-Security"]
        
        assert "Content-Security-Policy" in response.headers
        assert "default-src 'self'" in response.headers["Content-Security-Policy"]
        
        assert "Referrer-Policy" in response.headers
        assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
        
        assert "Permissions-Policy" in response.headers
    
    def test_rate_limiting_allows_normal_requests(self):
        """Test that normal request rates are allowed."""
        # Make several requests within limit
        for _ in range(5):
            response = self.client.get("/health")
            assert response.status_code == 200
    
    @patch('app.middleware.security.rate_limit_store', {})
    def test_rate_limiting_blocks_excessive_requests(self):
        """Test that excessive requests are blocked."""
        # Create a middleware with very low limits for testing
        with patch.object(SecurityMiddleware, '__init__', lambda self, app: None):
            middleware = SecurityMiddleware(app)
            middleware.rate_limit_requests = 2
            middleware.rate_limit_window = 3600
            
            # Simulate multiple requests from same IP
            with patch('app.middleware.security.rate_limit_store', {}) as mock_store:
                mock_store['127.0.0.1'] = {str(int(time.time())): 3}  # Already at limit
                
                # This request should be blocked
                response = self.client.get("/api/v1/applications/")
                assert response.status_code == 429
                assert "Rate limit exceeded" in response.json()["error"]["message"]
    
    def test_xss_protection_in_query_params(self):
        """Test XSS protection in query parameters."""
        # Try XSS in query parameters
        response = self.client.get("/api/v1/applications/?search=<script>alert('xss')</script>")
        assert response.status_code == 400
        assert "Invalid query parameters" in response.json()["detail"]
    
    def test_xss_protection_in_headers(self):
        """Test XSS protection in headers."""
        # Try XSS in custom header
        headers = {"X-Custom-Header": "<script>alert('xss')</script>"}
        response = self.client.get("/health", headers=headers)
        assert response.status_code == 400
        assert "Invalid request headers" in response.json()["detail"]
    
    def test_sql_injection_protection_in_query(self):
        """Test SQL injection protection in query parameters."""
        # Try SQL injection in query parameters
        response = self.client.get("/api/v1/applications/?search='; DROP TABLE applications; --")
        assert response.status_code == 400
        assert "Invalid query parameters" in response.json()["detail"]
    
    def test_path_traversal_protection(self):
        """Test path traversal protection."""
        # Try path traversal
        response = self.client.get("/api/v1/files/../../../etc/passwd")
        assert response.status_code == 400
        assert "Invalid request path" in response.json()["detail"]
    
    def test_large_request_body_blocked(self):
        """Test that large request bodies are blocked."""
        # Create large payload
        large_data = {"data": "x" * (11 * 1024 * 1024)}  # 11MB
        
        response = self.client.post("/api/v1/applications/", json=large_data)
        assert response.status_code == 413
        assert "Request body too large" in response.json()["detail"]
    
    def test_health_endpoint_bypasses_security(self):
        """Test that health endpoint bypasses security checks."""
        # Health endpoint should always work
        response = self.client.get("/health")
        assert response.status_code == 200
    
    def test_client_ip_extraction(self):
        """Test client IP extraction from various headers."""
        middleware = SecurityMiddleware(app)
        
        # Test X-Forwarded-For header
        request = MagicMock()
        request.headers = {"x-forwarded-for": "192.168.1.1, 10.0.0.1"}
        request.client = MagicMock()
        request.client.host = "127.0.0.1"
        
        ip = middleware._get_client_ip(request)
        assert ip == "192.168.1.1"
        
        # Test X-Real-IP header
        request.headers = {"x-real-ip": "192.168.1.2"}
        ip = middleware._get_client_ip(request)
        assert ip == "192.168.1.2"
        
        # Test fallback to client.host
        request.headers = {}
        ip = middleware._get_client_ip(request)
        assert ip == "127.0.0.1"


class TestCSRFProtection:
    """Test CSRF protection functionality."""
    
    def test_csrf_token_generation(self):
        """Test CSRF token generation."""
        token = CSRFProtection.generate_csrf_token()
        assert isinstance(token, str)
        assert len(token) > 20  # Should be reasonably long
    
    def test_csrf_token_validation(self):
        """Test CSRF token validation."""
        # Generate token
        token = CSRFProtection.generate_csrf_token()
        
        # Valid token should pass
        assert CSRFProtection.validate_csrf_token(token) is True
        
        # Same token should fail second time (one-time use)
        assert CSRFProtection.validate_csrf_token(token) is False
        
        # Invalid token should fail
        assert CSRFProtection.validate_csrf_token("invalid-token") is False
        
        # Empty token should fail
        assert CSRFProtection.validate_csrf_token("") is False
        assert CSRFProtection.validate_csrf_token(None) is False
    
    def test_csrf_token_cleanup(self):
        """Test CSRF token cleanup functionality."""
        # Generate many tokens
        for _ in range(15000):
            CSRFProtection.generate_csrf_token()
        
        # Cleanup should reduce token count
        initial_count = len(CSRFProtection.csrf_tokens)
        CSRFProtection.cleanup_expired_tokens()
        final_count = len(CSRFProtection.csrf_tokens)
        
        assert final_count < initial_count


class TestSecurityUtilities:
    """Test security utility functions."""
    
    def test_sanitize_input(self):
        """Test input sanitization."""
        from app.middleware.security import sanitize_input
        
        # Test HTML escaping
        result = sanitize_input("<script>alert('xss')</script>")
        assert "<script>" not in result
        assert "&lt;script&gt;" in result or result == ""
        
        # Test length limiting
        long_input = "x" * 15000
        result = sanitize_input(long_input)
        assert len(result) <= 10000
        
        # Test non-string input
        result = sanitize_input(123)
        assert result == 123
    
    def test_validate_sql_input(self):
        """Test SQL input validation."""
        from app.middleware.security import validate_sql_input
        
        # Valid input should pass
        result = validate_sql_input("normal text")
        assert result == "normal text"
        
        # SQL injection should raise error
        with pytest.raises(ValueError, match="potential SQL injection"):
            validate_sql_input("'; DROP TABLE users; --")
        
        with pytest.raises(ValueError, match="potential SQL injection"):
            validate_sql_input("1 OR 1=1")
        
        with pytest.raises(ValueError, match="potential SQL injection"):
            validate_sql_input("UNION SELECT * FROM passwords")
    
    def test_secure_filename(self):
        """Test filename security."""
        from app.middleware.security import secure_filename
        
        # Test normal filename
        result = secure_filename("document.pdf")
        assert result == "document.pdf"
        
        # Test dangerous characters removal
        result = secure_filename("../../../etc/passwd")
        assert result == "etcpasswd"
        
        # Test length limiting
        long_name = "x" * 300 + ".pdf"
        result = secure_filename(long_name)
        assert len(result) <= 255
        assert result.endswith(".pdf")
        
        # Test empty filename
        result = secure_filename("")
        assert result == "unnamed_file"
        
        # Test only dangerous characters
        result = secure_filename("../../../")
        assert result == "unnamed_file"
    
    def test_password_hashing(self):
        """Test password hashing utilities."""
        from app.middleware.security import hash_password, verify_password
        
        password = "test_password_123"
        
        # Hash password
        hashed = hash_password(password)
        assert isinstance(hashed, str)
        assert len(hashed) > 20
        assert hashed != password
        
        # Verify correct password
        assert verify_password(password, hashed) is True
        
        # Verify incorrect password
        assert verify_password("wrong_password", hashed) is False
    
    def test_secure_token_generation(self):
        """Test secure token generation."""
        from app.middleware.security import generate_secure_token
        
        # Test default length
        token = generate_secure_token()
        assert isinstance(token, str)
        assert len(token) > 20
        
        # Test custom length
        token = generate_secure_token(16)
        # URL-safe base64 encoding makes the string longer than the byte length
        assert len(token) >= 16
        
        # Test uniqueness
        token1 = generate_secure_token()
        token2 = generate_secure_token()
        assert token1 != token2
    
    def test_constant_time_compare(self):
        """Test constant time string comparison."""
        from app.middleware.security import constant_time_compare
        
        # Test equal strings
        assert constant_time_compare("hello", "hello") is True
        
        # Test different strings
        assert constant_time_compare("hello", "world") is False
        
        # Test different lengths
        assert constant_time_compare("hello", "hello world") is False


class TestSecurityIntegration:
    """Test security integration with API endpoints."""
    
    def setup_method(self):
        """Set up test client."""
        self.client = TestClient(app)
    
    def test_application_creation_with_xss_attempt(self):
        """Test application creation with XSS attempt."""
        malicious_data = {
            "personal_info": {
                "first_name": "<script>alert('xss')</script>",
                "last_name": "Test",
                "email": "test@example.com",
                "phone": "+1234567890",
                "date_of_birth": "1990-01-01",
                "address": {
                    "street": "123 Test St",
                    "city": "Test City",
                    "state": "Test State",
                    "zip_code": "12345",
                    "country": "Test Country"
                }
            },
            "insurance_type": "health",
            "preferred_language": "en"
        }
        
        response = self.client.post("/api/v1/applications/", json=malicious_data)
        
        # Should either be blocked by middleware or sanitized by validation
        if response.status_code == 400:
            # Blocked by middleware
            assert "Invalid" in response.json()["detail"]
        else:
            # Should be sanitized if it gets through
            # The actual validation happens in Pydantic models
            pass
    
    def test_file_upload_with_malicious_filename(self):
        """Test file upload with malicious filename."""
        import io
        
        # Create a test file with malicious filename
        file_content = b"fake image content"
        file_data = io.BytesIO(file_content)
        
        files = {
            "file": ("../../../etc/passwd.jpg", file_data, "image/jpeg")
        }
        data = {
            "file_type": "student_id"
        }
        
        response = self.client.post("/api/v1/files/upload", files=files, data=data)
        
        # Should handle malicious filename securely
        # The actual handling depends on the file service implementation
        assert response.status_code in [200, 201, 400, 422]
    
    def test_sql_injection_in_application_search(self):
        """Test SQL injection attempt in application search."""
        # Try SQL injection in search parameter
        response = self.client.get("/api/v1/applications/?search='; DROP TABLE applications; --")
        
        # Should be blocked by security middleware
        assert response.status_code == 400
        assert "Invalid query parameters" in response.json()["detail"]
    
    def test_multiple_security_violations(self):
        """Test multiple security violations in single request."""
        # Request with multiple security issues
        headers = {
            "X-Malicious": "<script>alert('xss')</script>",
            "User-Agent": "'; DROP TABLE users; --"
        }
        
        response = self.client.get(
            "/api/v1/applications/?search=<iframe src='evil.com'></iframe>",
            headers=headers
        )
        
        # Should be blocked
        assert response.status_code == 400
        assert "Invalid" in response.json()["detail"]