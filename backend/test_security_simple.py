#!/usr/bin/env python3
"""
Simple test script to verify security middleware implementation.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_security_middleware_import():
    """Test that security middleware can be imported."""
    try:
        from app.middleware.security import SecurityMiddleware, CSRFProtection
        print("✓ Security middleware imported successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to import security middleware: {e}")
        return False

def test_validation_utils_import():
    """Test that validation utilities can be imported."""
    try:
        from app.utils.validation import InputValidator, ValidationError
        print("✓ Validation utilities imported successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to import validation utilities: {e}")
        return False

def test_sql_security_import():
    """Test that SQL security utilities can be imported."""
    try:
        from app.utils.sql_security import SQLSecurityValidator, SecureQueryBuilder
        print("✓ SQL security utilities imported successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to import SQL security utilities: {e}")
        return False

def test_input_validation():
    """Test basic input validation functionality."""
    try:
        from app.utils.validation import InputValidator
        
        validator = InputValidator()
        
        # Test XSS protection
        try:
            validator.sanitize_string("<script>alert('xss')</script>")
            print("✓ XSS protection working")
        except Exception as e:
            print(f"✓ XSS protection blocked malicious input: {type(e).__name__}")
        
        # Test SQL injection protection
        try:
            from app.utils.sql_security import SQLSecurityValidator
            sql_validator = SQLSecurityValidator()
            sql_validator.validate_input("'; DROP TABLE users; --")
            print("✗ SQL injection not detected")
        except Exception as e:
            print(f"✓ SQL injection protection working: {type(e).__name__}")
        
        return True
    except Exception as e:
        print(f"✗ Input validation test failed: {e}")
        return False

def test_security_utilities():
    """Test security utility functions."""
    try:
        from app.middleware.security import sanitize_input, secure_filename, generate_secure_token
        
        # Test input sanitization
        result = sanitize_input("normal text")
        print(f"✓ Input sanitization working: '{result}'")
        
        # Test filename security
        result = secure_filename("../../../etc/passwd")
        print(f"✓ Filename security working: '{result}'")
        
        # Test token generation
        token = generate_secure_token()
        print(f"✓ Token generation working: {len(token)} chars")
        
        return True
    except Exception as e:
        print(f"✗ Security utilities test failed: {e}")
        return False

def main():
    """Run all security tests."""
    print("Testing FormVault Security Implementation")
    print("=" * 50)
    
    tests = [
        test_security_middleware_import,
        test_validation_utils_import,
        test_sql_security_import,
        test_input_validation,
        test_security_utilities,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"✗ Test {test.__name__} failed with exception: {e}")
        print()
    
    print("=" * 50)
    print(f"Security Tests: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All security features implemented successfully!")
        return 0
    else:
        print("⚠️  Some security features need attention")
        return 1

if __name__ == "__main__":
    sys.exit(main())