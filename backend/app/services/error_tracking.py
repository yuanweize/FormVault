"""
Error tracking and notification service for monitoring system health.
"""
import traceback
import smtplib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from sqlalchemy.orm import Session
import structlog

from ..models.audit_log import AuditLog
from ..core.config import get_settings
from ..database import get_db

logger = structlog.get_logger(__name__)
settings = get_settings()


class ErrorTracker:
    """
    Error tracking service for monitoring and alerting on system errors.
    """
    
    def __init__(self):
        self.error_counts = {}
        self.alert_thresholds = {
            "critical": 1,      # Alert immediately for critical errors
            "error": 5,         # Alert after 5 errors in window
            "warning": 10,      # Alert after 10 warnings in window
        }
        self.alert_window = 300  # 5 minutes
        self.last_alerts = {}
        self.notification_cooldown = 1800  # 30 minutes between same error alerts
    
    def track_error(
        self,
        error: Exception,
        severity: str = "error",
        context: Optional[Dict[str, Any]] = None,
        application_id: Optional[str] = None,
        user_ip: Optional[str] = None
    ):
        """
        Track an error occurrence and trigger alerts if necessary.
        
        Args:
            error: The exception that occurred
            severity: Error severity level (critical, error, warning)
            context: Additional context information
            application_id: Related application ID if applicable
            user_ip: User IP address if applicable
        """
        try:
            error_key = self._get_error_key(error)
            current_time = datetime.utcnow()
            
            # Initialize error tracking for this error type
            if error_key not in self.error_counts:
                self.error_counts[error_key] = {
                    "count": 0,
                    "first_seen": current_time,
                    "last_seen": current_time,
                    "severity": severity,
                    "recent_occurrences": []
                }
            
            # Update error statistics
            error_info = self.error_counts[error_key]
            error_info["count"] += 1
            error_info["last_seen"] = current_time
            error_info["severity"] = max(error_info["severity"], severity, key=self._severity_priority)
            
            # Track recent occurrences for rate limiting
            error_info["recent_occurrences"].append(current_time)
            
            # Clean old occurrences outside the alert window
            cutoff_time = current_time - timedelta(seconds=self.alert_window)
            error_info["recent_occurrences"] = [
                occurrence for occurrence in error_info["recent_occurrences"]
                if occurrence > cutoff_time
            ]
            
            # Log error to audit system
            self._log_error_audit(
                error=error,
                severity=severity,
                context=context,
                application_id=application_id,
                user_ip=user_ip
            )
            
            # Check if alert should be triggered
            recent_count = len(error_info["recent_occurrences"])
            threshold = self.alert_thresholds.get(severity, 5)
            
            if recent_count >= threshold:
                self._trigger_alert(error_key, error_info, error, context)
            
            logger.info(
                "Error tracked",
                error_type=type(error).__name__,
                error_key=error_key,
                severity=severity,
                count=error_info["count"],
                recent_count=recent_count
            )
            
        except Exception as tracking_error:
            logger.error(
                "Failed to track error",
                tracking_error=str(tracking_error),
                original_error=str(error)
            )
    
    def _get_error_key(self, error: Exception) -> str:
        """Generate a unique key for error grouping."""
        error_type = type(error).__name__
        error_message = str(error)
        
        # Create a normalized error key for grouping similar errors
        # Remove specific values that might make errors appear unique
        import re
        normalized_message = re.sub(r'\d+', 'N', error_message)  # Replace numbers
        normalized_message = re.sub(r"'[^']*'", "'X'", normalized_message)  # Replace quoted strings
        
        return f"{error_type}:{normalized_message[:100]}"
    
    def _severity_priority(self, severity: str) -> int:
        """Get numeric priority for severity levels."""
        priorities = {"warning": 1, "error": 2, "critical": 3}
        return priorities.get(severity, 1)
    
    def _log_error_audit(
        self,
        error: Exception,
        severity: str,
        context: Optional[Dict[str, Any]],
        application_id: Optional[str],
        user_ip: Optional[str]
    ):
        """Log error to audit system."""
        try:
            db: Session = next(get_db())
            
            error_details = {
                "error": {
                    "type": type(error).__name__,
                    "message": str(error),
                    "severity": severity,
                    "traceback": traceback.format_exc(),
                },
                "context": context or {},
                "timestamp": datetime.utcnow().isoformat(),
            }
            
            audit_log = AuditLog.create_log(
                action=f"error.{severity}",
                application_id=application_id,
                user_ip=user_ip,
                details=error_details
            )
            
            db.add(audit_log)
            db.commit()
            db.close()
            
        except Exception as audit_error:
            logger.error("Failed to log error audit", error=str(audit_error))
    
    def _trigger_alert(
        self,
        error_key: str,
        error_info: Dict[str, Any],
        error: Exception,
        context: Optional[Dict[str, Any]]
    ):
        """Trigger alert for error threshold breach."""
        current_time = datetime.utcnow()
        
        # Check cooldown period
        last_alert = self.last_alerts.get(error_key)
        if (last_alert and 
            current_time - last_alert < timedelta(seconds=self.notification_cooldown)):
            return
        
        self.last_alerts[error_key] = current_time
        
        # Send notification
        self._send_error_notification(error_key, error_info, error, context)
        
        logger.warning(
            "Error alert triggered",
            error_key=error_key,
            count=error_info["count"],
            severity=error_info["severity"]
        )
    
    def _send_error_notification(
        self,
        error_key: str,
        error_info: Dict[str, Any],
        error: Exception,
        context: Optional[Dict[str, Any]]
    ):
        """Send error notification email."""
        try:
            if not all([settings.SMTP_HOST, settings.FROM_EMAIL]):
                logger.warning("Email settings not configured, skipping notification")
                return
            
            # Prepare email content
            subject = f"FormVault Error Alert: {error_info['severity'].upper()}"
            
            body = f"""
Error Alert - FormVault Insurance Portal

Error Details:
- Type: {type(error).__name__}
- Message: {str(error)}
- Severity: {error_info['severity']}
- Count: {error_info['count']} occurrences
- First Seen: {error_info['first_seen']}
- Last Seen: {error_info['last_seen']}
- Recent Occurrences: {len(error_info['recent_occurrences'])} in last {self.alert_window} seconds

Context:
{context or 'No additional context'}

Traceback:
{traceback.format_exc()}

Please investigate this issue promptly.

FormVault Monitoring System
            """
            
            # Send email (simplified version - in production, use proper email service)
            self._send_email(
                to_email="admin@formvault.com",  # Configure in settings
                subject=subject,
                body=body
            )
            
        except Exception as e:
            logger.error("Failed to send error notification", error=str(e))
    
    def _send_email(self, to_email: str, subject: str, body: str):
        """Send email notification."""
        try:
            msg = MimeMultipart()
            msg['From'] = settings.FROM_EMAIL
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MimeText(body, 'plain'))
            
            # Connect to SMTP server and send email
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_USE_TLS:
                    server.starttls()
                
                if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                
                server.send_message(msg)
            
            logger.info("Error notification sent", to_email=to_email, subject=subject)
            
        except Exception as e:
            logger.error("Failed to send email notification", error=str(e))
    
    def get_error_summary(self) -> Dict[str, Any]:
        """Get summary of tracked errors."""
        current_time = datetime.utcnow()
        
        summary = {
            "total_error_types": len(self.error_counts),
            "total_errors": sum(info["count"] for info in self.error_counts.values()),
            "errors_by_severity": {},
            "recent_errors": [],
            "top_errors": []
        }
        
        # Group by severity
        for error_key, info in self.error_counts.items():
            severity = info["severity"]
            if severity not in summary["errors_by_severity"]:
                summary["errors_by_severity"][severity] = 0
            summary["errors_by_severity"][severity] += info["count"]
        
        # Recent errors (last hour)
        one_hour_ago = current_time - timedelta(hours=1)
        for error_key, info in self.error_counts.items():
            if info["last_seen"] > one_hour_ago:
                summary["recent_errors"].append({
                    "error_key": error_key,
                    "count": info["count"],
                    "severity": info["severity"],
                    "last_seen": info["last_seen"].isoformat()
                })
        
        # Top errors by count
        summary["top_errors"] = sorted(
            [
                {
                    "error_key": error_key,
                    "count": info["count"],
                    "severity": info["severity"]
                }
                for error_key, info in self.error_counts.items()
            ],
            key=lambda x: x["count"],
            reverse=True
        )[:10]
        
        return summary
    
    def clear_old_errors(self, days: int = 7):
        """Clear error tracking data older than specified days."""
        cutoff_time = datetime.utcnow() - timedelta(days=days)
        
        old_errors = [
            error_key for error_key, info in self.error_counts.items()
            if info["last_seen"] < cutoff_time
        ]
        
        for error_key in old_errors:
            del self.error_counts[error_key]
        
        logger.info("Cleared old error data", count=len(old_errors), days=days)


# Global error tracker instance
error_tracker = ErrorTracker()


def track_error(
    error: Exception,
    severity: str = "error",
    context: Optional[Dict[str, Any]] = None,
    application_id: Optional[str] = None,
    user_ip: Optional[str] = None
):
    """Convenience function to track errors."""
    error_tracker.track_error(
        error=error,
        severity=severity,
        context=context,
        application_id=application_id,
        user_ip=user_ip
    )


def get_error_summary() -> Dict[str, Any]:
    """Get error tracking summary."""
    return error_tracker.get_error_summary()