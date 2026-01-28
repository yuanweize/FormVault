"""
Database utility functions for FormVault.
"""

import logging
from typing import Optional, Dict, Any
from contextlib import contextmanager
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import text

from ..database import SessionLocal, engine
from ..models import AuditLog

logger = logging.getLogger(__name__)


@contextmanager
def get_db_session():
    """
    Context manager for database sessions with automatic cleanup.

    Usage:
        with get_db_session() as db:
            # Use db session
            pass
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        db.close()


def check_database_connection() -> bool:
    """
    Check if database connection is working.

    Returns:
        bool: True if connection is successful, False otherwise
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except SQLAlchemyError as e:
        logger.error(f"Database connection failed: {e}")
        return False


def get_database_info() -> Dict[str, Any]:
    """
    Get database connection information and statistics.

    Returns:
        Dict containing database info
    """
    try:
        with engine.connect() as connection:
            # Get database version
            result = connection.execute(text("SELECT VERSION()"))
            version = result.scalar()

            # Get connection pool info
            pool = engine.pool

            return {
                "database_version": version,
                "pool_size": pool.size(),
                "checked_in_connections": pool.checkedin(),
                "checked_out_connections": pool.checkedout(),
                "overflow_connections": pool.overflow(),
                "invalid_connections": pool.invalid(),
            }
    except SQLAlchemyError as e:
        logger.error(f"Failed to get database info: {e}")
        return {"error": str(e)}


def create_audit_log(
    db: Session,
    action: str,
    application_id: Optional[str] = None,
    user_ip: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> Optional[AuditLog]:
    """
    Create an audit log entry.

    Args:
        db: Database session
        action: Action being logged
        application_id: Optional application ID
        user_ip: Optional user IP address
        user_agent: Optional user agent string
        details: Optional additional details

    Returns:
        AuditLog instance if successful, None if failed
    """
    try:
        audit_log = AuditLog.create_log(
            action=action,
            application_id=application_id,
            user_ip=user_ip,
            user_agent=user_agent,
            details=details,
        )

        db.add(audit_log)
        db.flush()  # Get the ID without committing

        logger.info(f"Audit log created: {action} (ID: {audit_log.id})")
        return audit_log

    except SQLAlchemyError as e:
        logger.error(f"Failed to create audit log: {e}")
        return None


def safe_delete(db: Session, model_instance) -> bool:
    """
    Safely delete a model instance with error handling.

    Args:
        db: Database session
        model_instance: Model instance to delete

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        db.delete(model_instance)
        db.flush()
        return True
    except SQLAlchemyError as e:
        logger.error(f"Failed to delete {type(model_instance).__name__}: {e}")
        db.rollback()
        return False


def safe_update(db: Session, model_instance, **kwargs) -> bool:
    """
    Safely update a model instance with error handling.

    Args:
        db: Database session
        model_instance: Model instance to update
        **kwargs: Fields to update

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        for key, value in kwargs.items():
            if hasattr(model_instance, key):
                setattr(model_instance, key, value)
            else:
                logger.warning(
                    f"Attribute {key} not found on {type(model_instance).__name__}"
                )

        db.flush()
        return True
    except SQLAlchemyError as e:
        logger.error(f"Failed to update {type(model_instance).__name__}: {e}")
        db.rollback()
        return False


def handle_integrity_error(error: IntegrityError) -> str:
    """
    Convert SQLAlchemy IntegrityError to user-friendly message.

    Args:
        error: IntegrityError instance

    Returns:
        str: User-friendly error message
    """
    error_msg = str(error.orig).lower()

    if "duplicate entry" in error_msg:
        if "reference_number" in error_msg:
            return "Reference number already exists"
        elif "email" in error_msg:
            return "Email address already exists"
        else:
            return "Duplicate entry detected"
    elif "foreign key constraint" in error_msg:
        return "Referenced record does not exist"
    elif "cannot be null" in error_msg:
        return "Required field is missing"
    else:
        return "Database constraint violation"


def execute_raw_sql(query: str, params: Optional[Dict] = None) -> Any:
    """
    Execute raw SQL query safely.

    Args:
        query: SQL query string
        params: Optional query parameters

    Returns:
        Query result
    """
    try:
        with engine.connect() as connection:
            result = connection.execute(text(query), params or {})
            return result.fetchall()
    except SQLAlchemyError as e:
        logger.error(f"Raw SQL execution failed: {e}")
        raise


def get_table_row_count(table_name: str) -> int:
    """
    Get row count for a specific table.

    Args:
        table_name: Name of the table

    Returns:
        int: Number of rows in the table
    """
    try:
        query = f"SELECT COUNT(*) FROM {table_name}"
        result = execute_raw_sql(query)
        return result[0][0] if result else 0
    except Exception as e:
        logger.error(f"Failed to get row count for {table_name}: {e}")
        return 0


def cleanup_old_audit_logs(days: int = 90) -> int:
    """
    Clean up audit logs older than specified days.

    Args:
        days: Number of days to keep logs

    Returns:
        int: Number of deleted records
    """
    try:
        with get_db_session() as db:
            query = text(
                """
                DELETE FROM audit_logs 
                WHERE created_at < DATE_SUB(NOW(), INTERVAL :days DAY)
            """
            )
            result = db.execute(query, {"days": days})
            deleted_count = result.rowcount

            logger.info(f"Cleaned up {deleted_count} old audit log entries")
            return deleted_count

    except SQLAlchemyError as e:
        logger.error(f"Failed to cleanup audit logs: {e}")
        return 0
