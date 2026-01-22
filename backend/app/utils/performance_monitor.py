"""
Performance monitoring utilities for database queries and system operations.
"""
import time
import functools
from typing import Dict, Any, Optional, Callable
from contextlib import contextmanager
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
import structlog

from ..models.audit_log import AuditLog

logger = structlog.get_logger(__name__)


class PerformanceMonitor:
    """
    Performance monitoring class for tracking database queries and operations.
    """
    
    def __init__(self):
        self.query_stats = {}
        self.slow_query_threshold = 1.0  # 1 second
        self.enabled = True
    
    def enable(self):
        """Enable performance monitoring."""
        self.enabled = True
        logger.info("Performance monitoring enabled")
    
    def disable(self):
        """Disable performance monitoring."""
        self.enabled = False
        logger.info("Performance monitoring disabled")
    
    def set_slow_query_threshold(self, threshold: float):
        """Set the threshold for slow query detection."""
        self.slow_query_threshold = threshold
        logger.info("Slow query threshold set", threshold=threshold)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get current performance statistics."""
        return {
            "query_stats": self.query_stats.copy(),
            "slow_query_threshold": self.slow_query_threshold,
            "enabled": self.enabled,
            "total_queries": sum(stats["count"] for stats in self.query_stats.values()),
            "average_query_time": self._calculate_average_query_time(),
        }
    
    def _calculate_average_query_time(self) -> float:
        """Calculate average query execution time."""
        if not self.query_stats:
            return 0.0
        
        total_time = sum(stats["total_time"] for stats in self.query_stats.values())
        total_count = sum(stats["count"] for stats in self.query_stats.values())
        
        return total_time / total_count if total_count > 0 else 0.0
    
    def record_query(self, query: str, duration: float, params: Optional[Dict] = None):
        """Record a database query execution."""
        if not self.enabled:
            return
        
        # Normalize query for statistics (remove specific values)
        normalized_query = self._normalize_query(query)
        
        # Update statistics
        if normalized_query not in self.query_stats:
            self.query_stats[normalized_query] = {
                "count": 0,
                "total_time": 0.0,
                "min_time": float('inf'),
                "max_time": 0.0,
                "slow_queries": 0,
            }
        
        stats = self.query_stats[normalized_query]
        stats["count"] += 1
        stats["total_time"] += duration
        stats["min_time"] = min(stats["min_time"], duration)
        stats["max_time"] = max(stats["max_time"], duration)
        
        # Check for slow queries
        if duration > self.slow_query_threshold:
            stats["slow_queries"] += 1
            logger.warning(
                "Slow query detected",
                query=normalized_query[:200],  # Truncate for logging
                duration=duration,
                threshold=self.slow_query_threshold,
                params=params
            )
    
    def _normalize_query(self, query: str) -> str:
        """Normalize SQL query for statistics grouping."""
        import re
        
        # Remove extra whitespace
        normalized = re.sub(r'\s+', ' ', query.strip())
        
        # Replace parameter placeholders with generic markers
        normalized = re.sub(r'%\([^)]+\)s', '?', normalized)  # Named parameters
        normalized = re.sub(r'\?', '?', normalized)  # Positional parameters
        normalized = re.sub(r"'[^']*'", "'?'", normalized)  # String literals
        normalized = re.sub(r'\b\d+\b', '?', normalized)  # Numbers
        
        return normalized
    
    @contextmanager
    def monitor_operation(self, operation_name: str):
        """Context manager for monitoring arbitrary operations."""
        if not self.enabled:
            yield
            return
        
        start_time = time.time()
        try:
            yield
        finally:
            duration = time.time() - start_time
            logger.info(
                "Operation completed",
                operation=operation_name,
                duration=duration
            )
            
            # Log slow operations
            if duration > self.slow_query_threshold:
                logger.warning(
                    "Slow operation detected",
                    operation=operation_name,
                    duration=duration,
                    threshold=self.slow_query_threshold
                )


# Global performance monitor instance
performance_monitor = PerformanceMonitor()


def monitor_performance(operation_name: str):
    """Decorator for monitoring function performance."""
    def decorator(func: Callable):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            with performance_monitor.monitor_operation(operation_name):
                return await func(*args, **kwargs)
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            with performance_monitor.monitor_operation(operation_name):
                return func(*args, **kwargs)
        
        # Return appropriate wrapper based on function type
        if hasattr(func, '__code__') and func.__code__.co_flags & 0x80:  # CO_COROUTINE
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


# SQLAlchemy event listeners for database query monitoring
@event.listens_for(Engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Record query start time."""
    context._query_start_time = time.time()


@event.listens_for(Engine, "after_cursor_execute")
def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Record query completion and performance metrics."""
    if hasattr(context, '_query_start_time'):
        duration = time.time() - context._query_start_time
        performance_monitor.record_query(
            query=statement,
            duration=duration,
            params=parameters if not executemany else None
        )


def log_performance_audit(
    db: Session,
    operation: str,
    duration: float,
    details: Optional[Dict[str, Any]] = None
):
    """Log performance metrics to audit log."""
    try:
        audit_details = {
            "performance": {
                "operation": operation,
                "duration": duration,
                "timestamp": time.time(),
            }
        }
        
        if details:
            audit_details["performance"].update(details)
        
        audit_log = AuditLog.create_log(
            action="performance.monitor",
            details=audit_details
        )
        
        db.add(audit_log)
        db.commit()
        
    except Exception as e:
        logger.error("Failed to log performance audit", error=str(e))
        db.rollback()


def get_performance_stats() -> Dict[str, Any]:
    """Get current performance statistics."""
    return performance_monitor.get_stats()


def reset_performance_stats():
    """Reset performance statistics."""
    performance_monitor.query_stats.clear()
    logger.info("Performance statistics reset")