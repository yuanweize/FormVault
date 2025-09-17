"""
Tests for performance monitoring utilities.
"""
import pytest
import time
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from app.utils.performance_monitor import (
    PerformanceMonitor,
    performance_monitor,
    monitor_performance,
    get_performance_stats,
    reset_performance_stats,
    log_performance_audit
)


class TestPerformanceMonitor:
    """Test cases for performance monitoring."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.monitor = PerformanceMonitor()
        self.monitor.query_stats.clear()  # Clear any existing stats
    
    def test_performance_monitor_initialization(self):
        """Test performance monitor initialization."""
        monitor = PerformanceMonitor()
        
        assert monitor.query_stats == {}
        assert monitor.slow_query_threshold == 1.0
        assert monitor.enabled is True
    
    def test_enable_disable_monitoring(self):
        """Test enabling and disabling monitoring."""
        monitor = PerformanceMonitor()
        
        # Test disable
        monitor.disable()
        assert monitor.enabled is False
        
        # Test enable
        monitor.enable()
        assert monitor.enabled is True
    
    def test_set_slow_query_threshold(self):
        """Test setting slow query threshold."""
        monitor = PerformanceMonitor()
        
        monitor.set_slow_query_threshold(2.0)
        assert monitor.slow_query_threshold == 2.0
    
    def test_record_query_when_enabled(self):
        """Test recording query when monitoring is enabled."""
        monitor = PerformanceMonitor()
        monitor.enable()
        
        query = "SELECT * FROM applications WHERE id = ?"
        duration = 0.5
        
        monitor.record_query(query, duration)
        
        # Check that query was recorded
        assert len(monitor.query_stats) == 1
        
        # Get the normalized query key
        normalized_query = list(monitor.query_stats.keys())[0]
        stats = monitor.query_stats[normalized_query]
        
        assert stats["count"] == 1
        assert stats["total_time"] == duration
        assert stats["min_time"] == duration
        assert stats["max_time"] == duration
        assert stats["slow_queries"] == 0
    
    def test_record_query_when_disabled(self):
        """Test that queries are not recorded when monitoring is disabled."""
        monitor = PerformanceMonitor()
        monitor.disable()
        
        query = "SELECT * FROM applications WHERE id = ?"
        duration = 0.5
        
        monitor.record_query(query, duration)
        
        # Check that no query was recorded
        assert len(monitor.query_stats) == 0
    
    def test_record_slow_query(self):
        """Test recording of slow queries."""
        monitor = PerformanceMonitor()
        monitor.set_slow_query_threshold(0.5)
        
        query = "SELECT * FROM applications WHERE id = ?"
        duration = 1.0  # Exceeds threshold
        
        with patch('app.utils.performance_monitor.logger') as mock_logger:
            monitor.record_query(query, duration)
            
            # Check that slow query was logged
            mock_logger.warning.assert_called_once()
            
            # Check stats
            normalized_query = list(monitor.query_stats.keys())[0]
            stats = monitor.query_stats[normalized_query]
            assert stats["slow_queries"] == 1
    
    def test_normalize_query(self):
        """Test SQL query normalization."""
        monitor = PerformanceMonitor()
        
        # Test parameter normalization
        query1 = "SELECT * FROM users WHERE id = %(user_id)s AND name = 'John'"
        normalized1 = monitor._normalize_query(query1)
        assert "%(user_id)s" not in normalized1
        assert "'John'" not in normalized1
        assert "?" in normalized1
        
        # Test number normalization
        query2 = "SELECT * FROM applications WHERE created_at > 1234567890"
        normalized2 = monitor._normalize_query(query2)
        assert "1234567890" not in normalized2
        assert "?" in normalized2
    
    def test_get_stats(self):
        """Test getting performance statistics."""
        monitor = PerformanceMonitor()
        
        # Record some queries
        monitor.record_query("SELECT * FROM users", 0.1)
        monitor.record_query("SELECT * FROM users", 0.2)
        monitor.record_query("INSERT INTO applications", 0.3)
        
        stats = monitor.get_stats()
        
        assert "query_stats" in stats
        assert "slow_query_threshold" in stats
        assert "enabled" in stats
        assert "total_queries" in stats
        assert "average_query_time" in stats
        
        assert stats["total_queries"] == 3
        assert stats["average_query_time"] == 0.2  # (0.1 + 0.2 + 0.3) / 3
    
    def test_calculate_average_query_time_empty_stats(self):
        """Test average query time calculation with empty stats."""
        monitor = PerformanceMonitor()
        
        avg_time = monitor._calculate_average_query_time()
        assert avg_time == 0.0
    
    def test_monitor_operation_context_manager(self):
        """Test the monitor_operation context manager."""
        monitor = PerformanceMonitor()
        
        with patch('app.utils.performance_monitor.logger') as mock_logger:
            with monitor.monitor_operation("test_operation"):
                time.sleep(0.01)  # Small delay to measure
            
            # Check that operation was logged
            mock_logger.info.assert_called()
            call_args = mock_logger.info.call_args[1]
            assert call_args["operation"] == "test_operation"
            assert "duration" in call_args
    
    def test_monitor_operation_disabled(self):
        """Test monitor_operation when monitoring is disabled."""
        monitor = PerformanceMonitor()
        monitor.disable()
        
        with patch('app.utils.performance_monitor.logger') as mock_logger:
            with monitor.monitor_operation("test_operation"):
                pass
            
            # Check that nothing was logged
            mock_logger.info.assert_not_called()
    
    def test_monitor_performance_decorator_sync(self):
        """Test the monitor_performance decorator with sync function."""
        @monitor_performance("test_function")
        def test_function():
            return "result"
        
        with patch.object(performance_monitor, 'monitor_operation') as mock_monitor:
            result = test_function()
            
            assert result == "result"
            mock_monitor.assert_called_once_with("test_function")
    
    def test_monitor_performance_decorator_async(self):
        """Test the monitor_performance decorator with async function."""
        @monitor_performance("test_async_function")
        async def test_async_function():
            return "async_result"
        
        import asyncio
        
        with patch.object(performance_monitor, 'monitor_operation') as mock_monitor:
            result = asyncio.run(test_async_function())
            
            assert result == "async_result"
            mock_monitor.assert_called_once_with("test_async_function")
    
    @patch('app.utils.performance_monitor.get_db')
    def test_log_performance_audit(self, mock_get_db):
        """Test logging performance audit to database."""
        # Mock database session
        mock_db = Mock(spec=Session)
        
        operation = "file_upload"
        duration = 1.5
        details = {"file_size": 1024}
        
        log_performance_audit(mock_db, operation, duration, details)
        
        # Verify audit log was created
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        
        # Check the audit log details
        audit_log_call = mock_db.add.call_args[0][0]
        assert audit_log_call.action == "performance.monitor"
        assert audit_log_call.details["performance"]["operation"] == operation
        assert audit_log_call.details["performance"]["duration"] == duration
        assert audit_log_call.details["performance"]["file_size"] == 1024
    
    @patch('app.utils.performance_monitor.get_db')
    def test_log_performance_audit_database_error(self, mock_get_db):
        """Test handling database error in performance audit logging."""
        # Mock database session that raises error
        mock_db = Mock(spec=Session)
        mock_db.add.side_effect = Exception("Database error")
        
        with patch('app.utils.performance_monitor.logger') as mock_logger:
            log_performance_audit(mock_db, "test_operation", 1.0)
            
            # Verify error was logged and rollback was called
            mock_logger.error.assert_called_once()
            mock_db.rollback.assert_called_once()
    
    def test_get_performance_stats_global(self):
        """Test getting global performance statistics."""
        # Clear existing stats
        performance_monitor.query_stats.clear()
        
        # Record a query
        performance_monitor.record_query("SELECT 1", 0.1)
        
        stats = get_performance_stats()
        
        assert "query_stats" in stats
        assert stats["total_queries"] == 1
    
    def test_reset_performance_stats_global(self):
        """Test resetting global performance statistics."""
        # Record a query
        performance_monitor.record_query("SELECT 1", 0.1)
        assert len(performance_monitor.query_stats) == 1
        
        # Reset stats
        reset_performance_stats()
        
        # Verify stats were cleared
        assert len(performance_monitor.query_stats) == 0
    
    def test_query_aggregation(self):
        """Test that similar queries are properly aggregated."""
        monitor = PerformanceMonitor()
        
        # Record similar queries with different parameters
        monitor.record_query("SELECT * FROM users WHERE id = 1", 0.1)
        monitor.record_query("SELECT * FROM users WHERE id = 2", 0.2)
        monitor.record_query("SELECT * FROM users WHERE id = 'abc'", 0.15)
        
        # Should be aggregated into one normalized query
        assert len(monitor.query_stats) == 1
        
        normalized_query = list(monitor.query_stats.keys())[0]
        stats = monitor.query_stats[normalized_query]
        
        assert stats["count"] == 3
        assert stats["total_time"] == 0.45
        assert stats["min_time"] == 0.1
        assert stats["max_time"] == 0.2