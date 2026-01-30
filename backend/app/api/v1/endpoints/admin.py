"""
Admin dashboard endpoints for monitoring and statistics.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
import structlog

from ....database import get_db
from ....models.application import Application
from ....models.file import File
from ....models.email_export import EmailExport
from ....models.audit_log import AuditLog
from ....utils.performance_monitor import get_performance_stats, reset_performance_stats
from ....services.error_tracking import get_error_summary
from ....schemas.base import ResponseBase

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get("/dashboard", response_model=Dict[str, Any])
async def get_dashboard_stats(
    days: int = Query(
        7, ge=1, le=90, description="Number of days to include in statistics"
    ),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get comprehensive dashboard statistics for admin monitoring.

    Args:
        days: Number of days to include in statistics (1-90)
        db: Database session

    Returns:
        Dictionary containing various statistics and metrics
    """
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        # Application statistics
        app_stats = await _get_application_stats(db, start_date, end_date)

        # File upload statistics
        file_stats = await _get_file_stats(db, start_date, end_date)

        # Email export statistics
        email_stats = await _get_email_stats(db, start_date, end_date)

        # System activity statistics
        activity_stats = await _get_activity_stats(db, start_date, end_date)

        # Performance statistics
        performance_stats = get_performance_stats()

        # Error tracking statistics
        error_stats = get_error_summary()

        # System health metrics
        health_stats = await _get_health_stats(db)

        dashboard_data = {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": days,
            },
            "applications": app_stats,
            "files": file_stats,
            "emails": email_stats,
            "activity": activity_stats,
            "performance": performance_stats,
            "errors": error_stats,
            "health": health_stats,
            "generated_at": datetime.utcnow().isoformat(),
        }

        logger.info("Dashboard statistics generated", period_days=days)
        return dashboard_data

    except Exception as e:
        logger.error("Failed to generate dashboard statistics", error=str(e))
        raise HTTPException(
            status_code=500, detail="Failed to generate dashboard statistics"
        )


@router.get("/applications/stats", response_model=Dict[str, Any])
async def get_application_statistics(
    days: int = Query(30, ge=1, le=365), db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get detailed application statistics."""
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        stats = await _get_application_stats(db, start_date, end_date)

        # Add daily breakdown
        daily_stats = await _get_daily_application_stats(db, start_date, end_date)
        stats["daily_breakdown"] = daily_stats

        return stats

    except Exception as e:
        logger.error("Failed to get application statistics", error=str(e))
        raise HTTPException(
            status_code=500, detail="Failed to get application statistics"
        )


@router.get("/performance/stats", response_model=Dict[str, Any])
async def get_performance_statistics() -> Dict[str, Any]:
    """Get system performance statistics."""
    try:
        return get_performance_stats()
    except Exception as e:
        logger.error("Failed to get performance statistics", error=str(e))
        raise HTTPException(
            status_code=500, detail="Failed to get performance statistics"
        )


@router.post("/performance/reset", response_model=ResponseBase)
async def reset_performance_statistics() -> ResponseBase:
    """Reset performance statistics."""
    try:
        reset_performance_stats()
        logger.info("Performance statistics reset by admin")
        return ResponseBase(
            success=True, message="Performance statistics reset successfully"
        )
    except Exception as e:
        logger.error("Failed to reset performance statistics", error=str(e))
        raise HTTPException(
            status_code=500, detail="Failed to reset performance statistics"
        )


@router.get("/errors/summary", response_model=Dict[str, Any])
async def get_error_tracking_summary() -> Dict[str, Any]:
    """Get error tracking summary."""
    try:
        return get_error_summary()
    except Exception as e:
        logger.error("Failed to get error summary", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get error summary")


@router.get("/audit/logs", response_model=Dict[str, Any])
async def get_audit_logs(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    action: Optional[str] = Query(None, description="Filter by action"),
    application_id: Optional[str] = Query(None, description="Filter by application ID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get audit logs with filtering and pagination.

    Args:
        limit: Maximum number of logs to return
        offset: Number of logs to skip
        action: Filter by specific action
        application_id: Filter by application ID
        start_date: Filter logs after this date
        end_date: Filter logs before this date
        db: Database session

    Returns:
        Paginated audit logs with metadata
    """
    try:
        query = db.query(AuditLog)

        # Apply filters
        if action:
            query = query.filter(AuditLog.action.like(f"%{action}%"))

        if application_id:
            query = query.filter(AuditLog.application_id == application_id)

        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)

        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)

        # Get total count
        total_count = query.count()

        # Apply pagination and ordering
        logs = (
            query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
        )

        # Format logs for response
        formatted_logs = []
        for log in logs:
            formatted_logs.append(
                {
                    "id": log.id,
                    "action": log.action,
                    "application_id": log.application_id,
                    "user_ip": log.user_ip,
                    "user_agent": log.user_agent,
                    "details": log.details,
                    "created_at": log.created_at.isoformat(),
                }
            )

        return {
            "logs": formatted_logs,
            "pagination": {
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total_count,
            },
            "filters": {
                "action": action,
                "application_id": application_id,
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None,
            },
        }

    except Exception as e:
        logger.error("Failed to get audit logs", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get audit logs")


async def _get_application_stats(
    db: Session, start_date: datetime, end_date: datetime
) -> Dict[str, Any]:
    """Get application statistics for the specified period."""

    # Total applications
    total_apps = (
        db.query(Application)
        .filter(Application.created_at.between(start_date, end_date))
        .count()
    )

    # Applications by status
    status_counts = (
        db.query(Application.status, func.count(Application.id))
        .filter(Application.created_at.between(start_date, end_date))
        .group_by(Application.status)
        .all()
    )

    # Applications by insurance type
    type_counts = (
        db.query(Application.insurance_type, func.count(Application.id))
        .filter(Application.created_at.between(start_date, end_date))
        .group_by(Application.insurance_type)
        .all()
    )

    # Applications by language
    language_counts = (
        db.query(Application.preferred_language, func.count(Application.id))
        .filter(Application.created_at.between(start_date, end_date))
        .group_by(Application.preferred_language)
        .all()
    )

    return {
        "total": total_apps,
        "by_status": {status: count for status, count in status_counts},
        "by_insurance_type": {ins_type: count for ins_type, count in type_counts},
        "by_language": {lang: count for lang, count in language_counts},
    }


async def _get_file_stats(
    db: Session, start_date: datetime, end_date: datetime
) -> Dict[str, Any]:
    """Get file upload statistics for the specified period."""

    # Total files uploaded
    total_files = (
        db.query(File).filter(File.created_at.between(start_date, end_date)).count()
    )

    # Files by type
    type_counts = (
        db.query(File.file_type, func.count(File.id))
        .filter(File.created_at.between(start_date, end_date))
        .group_by(File.file_type)
        .all()
    )

    # Total file size
    total_size = (
        db.query(func.sum(File.file_size))
        .filter(File.created_at.between(start_date, end_date))
        .scalar()
        or 0
    )

    # Average file size
    avg_size = (
        db.query(func.avg(File.file_size))
        .filter(File.created_at.between(start_date, end_date))
        .scalar()
        or 0
    )

    return {
        "total_files": total_files,
        "by_type": {file_type: count for file_type, count in type_counts},
        "total_size_bytes": int(total_size),
        "average_size_bytes": int(avg_size),
    }


async def _get_email_stats(
    db: Session, start_date: datetime, end_date: datetime
) -> Dict[str, Any]:
    """Get email export statistics for the specified period."""

    # Total email exports
    total_exports = (
        db.query(EmailExport)
        .filter(EmailExport.created_at.between(start_date, end_date))
        .count()
    )

    # Exports by status
    status_counts = (
        db.query(EmailExport.status, func.count(EmailExport.id))
        .filter(EmailExport.created_at.between(start_date, end_date))
        .group_by(EmailExport.status)
        .all()
    )

    # Success rate
    successful_exports = (
        db.query(EmailExport)
        .filter(
            and_(
                EmailExport.created_at.between(start_date, end_date),
                EmailExport.status == "sent",
            )
        )
        .count()
    )

    success_rate = (
        (successful_exports / total_exports * 100) if total_exports > 0 else 0
    )

    return {
        "total_exports": total_exports,
        "by_status": {status: count for status, count in status_counts},
        "success_rate": round(success_rate, 2),
    }


async def _get_activity_stats(
    db: Session, start_date: datetime, end_date: datetime
) -> Dict[str, Any]:
    """Get system activity statistics for the specified period."""

    # Total audit log entries
    total_activities = (
        db.query(AuditLog)
        .filter(AuditLog.created_at.between(start_date, end_date))
        .count()
    )

    # Activities by action category
    action_counts = (
        db.query(AuditLog.action, func.count(AuditLog.id))
        .filter(AuditLog.created_at.between(start_date, end_date))
        .group_by(AuditLog.action)
        .all()
    )

    # Unique IP addresses
    unique_ips = (
        db.query(func.count(func.distinct(AuditLog.user_ip)))
        .filter(
            and_(
                AuditLog.created_at.between(start_date, end_date),
                AuditLog.user_ip.isnot(None),
            )
        )
        .scalar()
        or 0
    )

    return {
        "total_activities": total_activities,
        "by_action": {action: count for action, count in action_counts},
        "unique_ip_addresses": unique_ips,
    }


async def _get_daily_application_stats(
    db: Session, start_date: datetime, end_date: datetime
) -> List[Dict[str, Any]]:
    """Get daily breakdown of application statistics."""

    daily_stats = (
        db.query(
            func.date(Application.created_at).label("date"),
            func.count(Application.id).label("count"),
        )
        .filter(Application.created_at.between(start_date, end_date))
        .group_by(func.date(Application.created_at))
        .order_by("date")
        .all()
    )

    return [
        {"date": date.isoformat(), "applications": count} for date, count in daily_stats
    ]


async def _get_health_stats(db: Session) -> Dict[str, Any]:
    """Get system health statistics."""

    try:
        # Database connectivity test
        db.execute("SELECT 1")
        db_healthy = True
        db_error = None
    except Exception as e:
        db_healthy = False
        db_error = str(e)

    # Recent error rate (last hour)
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    recent_errors = (
        db.query(AuditLog)
        .filter(
            and_(AuditLog.created_at >= one_hour_ago, AuditLog.action.like("error.%"))
        )
        .count()
    )

    return {
        "database": {"healthy": db_healthy, "error": db_error},
        "recent_errors": recent_errors,
        "uptime": "Available",  # Could be enhanced with actual uptime tracking
        "timestamp": datetime.utcnow().isoformat(),
    }
