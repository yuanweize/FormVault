"""
Tests for error tracking and notification service.
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy.orm import Session

from app.services.error_tracking import (
    ErrorTracker,
    error_tracker,
    track_error,
    get_error_summary
)


class TestErrorTracker:
    """Test cases for error tracking service."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.tracker = ErrorTracker()
        self.tracker.error_counts.clear()  # Clear any existing errors
        self.tracker.last_alerts.clear()
    
    def test_error_tracker_initialization(self):
        """Test error tracker initialization."""
        tracker = ErrorTracker()
        
        assert tracker.error_counts == {}
        assert tracker.alert_thresholds["critical"] == 1
        assert tracker.alert_thresholds["error"] == 5
        assert tracker.alert_thresholds["warning"] == 10
        assert tracker.alert_window == 300
        assert tracker.notification_cooldown == 1800
    
    def test_get_error_key(self):
        """Test error key generation for grouping."""
        tracker = ErrorTracker()
        
        # Test with different error types
        error1 = ValueError("Invalid value: 123")
        error2 = ValueError("Invalid value: 456")
        error3 = TypeError("Expected string, got int")
        
        key1 = tracker._get_error_key(error1)
        key2 = tracker._get_error_key(error2)
        key3 = tracker._get_error_key(error3)
        
        # Similar errors should have same key
        assert key1 == key2
        
        # Different error types should have different keys
        assert key1 != key3
        
        # Keys should contain error type
        assert "ValueError" in key1
        assert "TypeError" in key3
    
    def test_severity_priority(self):
        """Test severity priority calculation."""
        tracker = ErrorTracker()
        
        assert tracker._severity_priority("warning") == 1
        assert tracker._severity_priority("error") == 2
        assert tracker._severity_priority("critical") == 3
        assert tracker._severity_priority("unknown") == 1  # Default
    
    @patch('app.services.error_tracking.get_db')
    def test_track_error_basic(self, mock_get_db):
        """Test basic error tracking functionality."""
        # Mock database session
        mock_db = Mock(spec=Session)
        mock_get_db.return_value = iter([mock_db])
        
        error = ValueError("Test error")
        
        self.tracker.track_error(error, severity="error")
        
        # Check that error was tracked
        assert len(self.tracker.error_counts) == 1
        
        error_key = list(self.tracker.error_counts.keys())[0]
        error_info = self.tracker.error_counts[error_key]
        
        assert error_info["count"] == 1
        assert error_info["severity"] == "error"
        assert isinstance(error_info["first_seen"], datetime)
        assert isinstance(error_info["last_seen"], datetime)
        
        # Verify audit log was created
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
    
    @patch('app.services.error_tracking.get_db')
    def test_track_error_multiple_occurrences(self, mock_get_db):
        """Test tracking multiple occurrences of the same error."""
        # Mock database session
        mock_db = Mock(spec=Session)
        mock_get_db.return_value = iter([mock_db])
        
        error = ValueError("Test error")
        
        # Track same error multiple times
        self.tracker.track_error(error, severity="error")
        self.tracker.track_error(error, severity="warning")  # Different severity
        self.tracker.track_error(error, severity="error")
        
        # Should still be one error type
        assert len(self.tracker.error_counts) == 1
        
        error_key = list(self.tracker.error_counts.keys())[0]
        error_info = self.tracker.error_counts[error_key]
        
        assert error_info["count"] == 3
        assert error_info["severity"] == "error"  # Should keep highest severity
    
    @patch('app.services.error_tracking.get_db')
    def test_track_error_with_context(self, mock_get_db):
        """Test tracking error with additional context."""
        # Mock database session
        mock_db = Mock(spec=Session)
        mock_get_db.return_value = iter([mock_db])
        
        error = ValueError("Test error")
        context = {"user_id": "123", "action": "file_upload"}
        application_id = "app-123"
        user_ip = "192.168.1.1"
        
        self.tracker.track_error(
            error=error,
            severity="error",
            context=context,
            application_id=application_id,
            user_ip=user_ip
        )
        
        # Verify audit log was created with context
        audit_log_call = mock_db.add.call_args[0][0]
        assert audit_log_call.application_id == application_id
        assert audit_log_call.user_ip == user_ip
        assert audit_log_call.details["context"] == context
    
    @patch('app.services.error_tracking.get_db')
    def test_track_error_database_failure(self, mock_get_db):
        """Test error tracking when database logging fails."""
        # Mock database session that raises error
        mock_db = Mock(spec=Session)
        mock_db.add.side_effect = Exception("Database error")
        mock_get_db.return_value = iter([mock_db])
        
        error = ValueError("Test error")
        
        with patch('app.services.error_tracking.logger') as mock_logger:
            # Should not raise exception even if audit logging fails
            self.tracker.track_error(error, severity="error")
            
            # Error should still be tracked in memory
            assert len(self.tracker.error_counts) == 1
            
            # Database error should be logged
            mock_logger.error.assert_called()
    
    @patch('app.services.error_tracking.get_db')
    def test_alert_triggering_critical(self, mock_get_db):
        """Test alert triggering for critical errors."""
        # Mock database session
        mock_db = Mock(spec=Session)
        mock_get_db.return_value = iter([mock_db])
        
        error = RuntimeError("Critical system error")
        
        with patch.object(self.tracker, '_trigger_alert') as mock_trigger:
            self.tracker.track_error(error, severity="critical")
            
            # Critical errors should trigger alert immediately
            mock_trigger.assert_called_once()
    
    @patch('app.services.error_tracking.get_db')
    def test_alert_triggering_threshold(self, mock_get_db):
        """Test alert triggering based on error count threshold."""
        # Mock database session
        mock_db = Mock(spec=Session)
        mock_get_db.return_value = iter([mock_db])
        
        error = ValueError("Test error")
        
        with patch.object(self.tracker, '_trigger_alert') as mock_trigger:
            # Track errors below threshold
            for _ in range(4):
                self.tracker.track_error(error, severity="error")
            
            # Should not trigger alert yet
            mock_trigger.assert_not_called()
            
            # Track one more error to reach threshold
            self.tracker.track_error(error, severity="error")
            
            # Should trigger alert now
            mock_trigger.assert_called_once()
    
    def test_alert_cooldown(self):
        """Test alert cooldown mechanism."""
        error = ValueError("Test error")
        error_key = self.tracker._get_error_key(error)
        
        # Set last alert time to recent
        self.tracker.last_alerts[error_key] = datetime.utcnow()
        
        error_info = {
            "count": 10,
            "severity": "error",
            "recent_occurrences": [datetime.utcnow()] * 10
        }
        
        with patch.object(self.tracker, '_send_error_notification') as mock_send:
            self.tracker._trigger_alert(error_key, error_info, error, None)
            
            # Should not send notification due to cooldown
            mock_send.assert_not_called()
    
    def test_send_error_notification_no_smtp(self):
        """Test error notification when SMTP is not configured."""
        with patch('app.services.error_tracking.settings') as mock_settings:
            mock_settings.SMTP_HOST = None
            mock_settings.FROM_EMAIL = None
            
            with patch('app.services.error_tracking.logger') as mock_logger:
                self.tracker._send_error_notification(
                    "test_key",
                    {"severity": "error", "count": 5},
                    ValueError("Test error"),
                    None
                )
                
                # Should log warning about missing config
                mock_logger.warning.assert_called_once()
    
    @patch('app.services.error_tracking.smtplib.SMTP')
    def test_send_email_success(self, mock_smtp_class):
        """Test successful email sending."""
        # Mock SMTP server
        mock_server = MagicMock()
        mock_smtp_class.return_value.__enter__.return_value = mock_server
        
        with patch('app.services.error_tracking.settings') as mock_settings:
            mock_settings.SMTP_HOST = "smtp.example.com"
            mock_settings.SMTP_PORT = 587
            mock_settings.SMTP_USE_TLS = True
            mock_settings.SMTP_USERNAME = "user"
            mock_settings.SMTP_PASSWORD = "pass"
            mock_settings.FROM_EMAIL = "from@example.com"
            
            self.tracker._send_email(
                "to@example.com",
                "Test Subject",
                "Test Body"
            )
            
            # Verify SMTP operations
            mock_server.starttls.assert_called_once()
            mock_server.login.assert_called_once_with("user", "pass")
            mock_server.send_message.assert_called_once()
    
    def test_get_error_summary(self):
        """Test getting error summary statistics."""
        # Add some test errors
        error1 = ValueError("Error 1")
        error2 = TypeError("Error 2")
        
        with patch('app.services.error_tracking.get_db'):
            self.tracker.track_error(error1, severity="error")
            self.tracker.track_error(error1, severity="error")
            self.tracker.track_error(error2, severity="critical")
        
        summary = self.tracker.get_error_summary()
        
        assert "total_error_types" in summary
        assert "total_errors" in summary
        assert "errors_by_severity" in summary
        assert "recent_errors" in summary
        assert "top_errors" in summary
        
        assert summary["total_error_types"] == 2
        assert summary["total_errors"] == 3
        assert summary["errors_by_severity"]["error"] == 2
        assert summary["errors_by_severity"]["critical"] == 1
    
    def test_clear_old_errors(self):
        """Test clearing old error data."""
        # Add old error
        old_error = ValueError("Old error")
        error_key = self.tracker._get_error_key(old_error)
        
        old_time = datetime.utcnow() - timedelta(days=10)
        self.tracker.error_counts[error_key] = {
            "count": 1,
            "first_seen": old_time,
            "last_seen": old_time,
            "severity": "error",
            "recent_occurrences": []
        }
        
        # Add recent error
        recent_error = TypeError("Recent error")
        with patch('app.services.error_tracking.get_db'):
            self.tracker.track_error(recent_error, severity="error")
        
        # Should have 2 errors
        assert len(self.tracker.error_counts) == 2
        
        # Clear old errors (7 days)
        self.tracker.clear_old_errors(days=7)
        
        # Should only have recent error
        assert len(self.tracker.error_counts) == 1
        remaining_key = list(self.tracker.error_counts.keys())[0]
        assert "TypeError" in remaining_key
    
    def test_global_functions(self):
        """Test global convenience functions."""
        error = ValueError("Test error")
        
        with patch('app.services.error_tracking.get_db'):
            # Test global track_error function
            track_error(error, severity="warning", context={"test": "data"})
            
            # Should be tracked in global error_tracker
            assert len(error_tracker.error_counts) > 0
        
        # Test global get_error_summary function
        summary = get_error_summary()
        assert isinstance(summary, dict)
        assert "total_error_types" in summary