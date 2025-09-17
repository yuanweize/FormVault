"""
Simple test script to validate monitoring and logging functionality.
"""
import sys
import os
import time
from datetime import datetime

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_performance_monitor():
    """Test performance monitoring functionality."""
    print("Testing Performance Monitor...")
    
    try:
        from app.utils.performance_monitor import PerformanceMonitor
        
        # Create monitor instance
        monitor = PerformanceMonitor()
        
        # Test basic functionality
        assert monitor.enabled is True
        assert monitor.slow_query_threshold == 1.0
        
        # Test recording queries
        monitor.record_query("SELECT * FROM applications WHERE id = ?", 0.5)
        monitor.record_query("SELECT * FROM applications WHERE id = ?", 0.3)
        
        # Test stats
        stats = monitor.get_stats()
        assert stats["total_queries"] == 2
        assert len(monitor.query_stats) == 1  # Should be normalized to same query
        
        # Test slow query detection
        monitor.set_slow_query_threshold(0.1)
        monitor.record_query("SELECT * FROM slow_table", 0.5)  # Should be marked as slow
        
        print("✓ Performance Monitor tests passed")
        return True
        
    except Exception as e:
        print(f"✗ Performance Monitor test failed: {e}")
        return False


def test_error_tracker():
    """Test error tracking functionality."""
    print("Testing Error Tracker...")
    
    try:
        from app.services.error_tracking import ErrorTracker
        
        # Create tracker instance
        tracker = ErrorTracker()
        
        # Test basic functionality
        assert tracker.error_counts == {}
        assert tracker.alert_thresholds["critical"] == 1
        
        # Test error key generation
        error1 = ValueError("Invalid value: 123")
        error2 = ValueError("Invalid value: 456")
        
        key1 = tracker._get_error_key(error1)
        key2 = tracker._get_error_key(error2)
        
        # Similar errors should have same key
        assert key1 == key2
        assert "ValueError" in key1
        
        # Test severity priority
        assert tracker._severity_priority("warning") == 1
        assert tracker._severity_priority("error") == 2
        assert tracker._severity_priority("critical") == 3
        
        print("✓ Error Tracker tests passed")
        return True
        
    except Exception as e:
        print(f"✗ Error Tracker test failed: {e}")
        return False


def test_audit_middleware():
    """Test audit middleware functionality."""
    print("Testing Audit Middleware...")
    
    try:
        from app.middleware.audit import AuditMiddleware
        
        # Create middleware instance
        middleware = AuditMiddleware(None)
        
        # Test client IP extraction
        from unittest.mock import Mock
        
        # Test with forwarded headers
        request = Mock()
        request.headers = {"x-forwarded-for": "192.168.1.1, 10.0.0.1"}
        request.client = None
        
        ip = middleware._get_client_ip(request)
        assert ip == "192.168.1.1"
        
        # Test action determination
        action = middleware._determine_action("POST", "/api/v1/applications")
        assert action == "application.create"
        
        # Test sensitive data detection
        sensitive_body = '{"password": "secret123", "name": "John"}'
        assert middleware._contains_sensitive_data(sensitive_body) is True
        
        normal_body = '{"name": "John", "email": "john@example.com"}'
        assert middleware._contains_sensitive_data(normal_body) is False
        
        print("✓ Audit Middleware tests passed")
        return True
        
    except Exception as e:
        print(f"✗ Audit Middleware test failed: {e}")
        return False


def main():
    """Run all tests."""
    print("Running Monitoring and Logging System Tests")
    print("=" * 50)
    
    tests = [
        test_performance_monitor,
        test_error_tracker,
        test_audit_middleware,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("✓ All monitoring and logging tests passed!")
        return 0
    else:
        print("✗ Some tests failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())