"""
SQL security utilities for FormVault Insurance Portal.

This module provides utilities to prevent SQL injection attacks
and ensure secure database operations.
"""

import re
from typing import Any, Dict, List, Optional, Union
import structlog

# Import SQLAlchemy components only when needed to avoid version conflicts
try:
    from sqlalchemy import text
    from sqlalchemy.orm import Session

    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False

logger = structlog.get_logger(__name__)

# SQL injection patterns to detect
SQL_INJECTION_PATTERNS = [
    # Basic SQL keywords
    r"\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b",
    # Union-based injection
    r"\bUNION\s+(ALL\s+)?SELECT\b",
    # Boolean-based injection
    r"\b(OR|AND)\s+\d+\s*[=<>!]+\s*\d+",
    r'\b(OR|AND)\s+[\'"]?\w+[\'"]?\s*[=<>!]+\s*[\'"]?\w+[\'"]?',
    # Comment-based injection
    r"(--|#|/\*|\*/)",
    # Time-based injection
    r"\b(SLEEP|WAITFOR|DELAY)\s*\(",
    # Error-based injection
    r"\b(CAST|CONVERT|EXTRACTVALUE|UPDATEXML)\s*\(",
    # Stacked queries
    r";\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)",
    # Function-based injection
    r"\b(CHAR|ASCII|SUBSTRING|CONCAT|LENGTH|DATABASE|VERSION|USER)\s*\(",
    # System functions
    r"\b(xp_cmdshell|sp_executesql|openrowset|opendatasource)\b",
    # Information schema
    r"\binformation_schema\b",
    # MySQL specific
    r"\b(load_file|into\s+outfile|into\s+dumpfile)\b",
    # PostgreSQL specific
    r"\b(pg_sleep|pg_read_file|copy\s+.*\s+from)\b",
]

# Compiled patterns for better performance
COMPILED_PATTERNS = [
    re.compile(pattern, re.IGNORECASE) for pattern in SQL_INJECTION_PATTERNS
]


class SQLSecurityError(Exception):
    """Exception raised when SQL injection attempt is detected."""

    pass


class SQLSecurityValidator:
    """Validator for SQL injection prevention."""

    @staticmethod
    def validate_input(value: Any, field_name: str = "input") -> Any:
        """
        Validate input for SQL injection patterns.

        Args:
            value: The value to validate
            field_name: Name of the field for error reporting

        Returns:
            The validated value

        Raises:
            SQLSecurityError: If SQL injection pattern is detected
        """
        if not isinstance(value, str):
            return value

        # Check for SQL injection patterns
        for pattern in COMPILED_PATTERNS:
            if pattern.search(value):
                logger.warning(
                    "SQL injection attempt detected",
                    field=field_name,
                    value=value[:100],  # Log first 100 chars only
                    pattern=pattern.pattern,
                )
                raise SQLSecurityError(
                    f"Potentially dangerous SQL pattern detected in {field_name}"
                )

        return value

    @staticmethod
    def validate_dict(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate all string values in a dictionary for SQL injection.

        Args:
            data: Dictionary to validate

        Returns:
            The validated dictionary

        Raises:
            SQLSecurityError: If SQL injection pattern is detected
        """
        validated_data = {}

        for key, value in data.items():
            if isinstance(value, str):
                validated_data[key] = SQLSecurityValidator.validate_input(value, key)
            elif isinstance(value, dict):
                validated_data[key] = SQLSecurityValidator.validate_dict(value)
            elif isinstance(value, list):
                validated_data[key] = [
                    (
                        SQLSecurityValidator.validate_input(item, f"{key}[{i}]")
                        if isinstance(item, str)
                        else item
                    )
                    for i, item in enumerate(value)
                ]
            else:
                validated_data[key] = value

        return validated_data

    @staticmethod
    def sanitize_like_pattern(pattern: str) -> str:
        """
        Sanitize a LIKE pattern to prevent SQL injection.

        Args:
            pattern: The LIKE pattern to sanitize

        Returns:
            Sanitized pattern
        """
        # Escape special LIKE characters
        pattern = pattern.replace("\\", "\\\\")  # Escape backslashes first
        pattern = pattern.replace("%", "\\%")  # Escape percent signs
        pattern = pattern.replace("_", "\\_")  # Escape underscores

        # Validate the sanitized pattern
        SQLSecurityValidator.validate_input(pattern, "like_pattern")

        return pattern

    @staticmethod
    def validate_order_by_field(field: str, allowed_fields: List[str]) -> str:
        """
        Validate ORDER BY field to prevent SQL injection.

        Args:
            field: The field name to order by
            allowed_fields: List of allowed field names

        Returns:
            Validated field name

        Raises:
            SQLSecurityError: If field is not allowed or contains dangerous patterns
        """
        # Remove direction indicators
        clean_field = field.lower().replace(" asc", "").replace(" desc", "").strip()

        # Check if field is in allowed list
        if clean_field not in [f.lower() for f in allowed_fields]:
            raise SQLSecurityError(f"Field '{field}' is not allowed for ordering")

        # Validate for SQL injection
        SQLSecurityValidator.validate_input(field, "order_by_field")

        return field

    @staticmethod
    def validate_limit_offset(
        limit: Optional[int], offset: Optional[int]
    ) -> tuple[Optional[int], Optional[int]]:
        """
        Validate LIMIT and OFFSET values.

        Args:
            limit: The limit value
            offset: The offset value

        Returns:
            Validated limit and offset

        Raises:
            SQLSecurityError: If values are invalid
        """
        if limit is not None:
            if not isinstance(limit, int) or limit < 0:
                raise SQLSecurityError("LIMIT must be a non-negative integer")
            if limit > 10000:  # Reasonable upper bound
                raise SQLSecurityError("LIMIT value too large")

        if offset is not None:
            if not isinstance(offset, int) or offset < 0:
                raise SQLSecurityError("OFFSET must be a non-negative integer")
            if offset > 1000000:  # Reasonable upper bound
                raise SQLSecurityError("OFFSET value too large")

        return limit, offset


class SecureQueryBuilder:
    """Builder for secure SQL queries using parameterized statements."""

    def __init__(self, session):
        if not SQLALCHEMY_AVAILABLE:
            raise ImportError("SQLAlchemy is required for SecureQueryBuilder")
        self.session = session
        self.validator = SQLSecurityValidator()

    def safe_filter_by_id(self, model_class, id_value: str):
        """
        Safely filter by ID using parameterized query.

        Args:
            model_class: The SQLAlchemy model class
            id_value: The ID value to filter by

        Returns:
            Query result
        """
        # Validate ID format (assuming UUID)
        self.validator.validate_input(id_value, "id")

        return self.session.query(model_class).filter(model_class.id == id_value)

    def safe_filter_by_email(self, model_class, email: str):
        """
        Safely filter by email using parameterized query.

        Args:
            model_class: The SQLAlchemy model class
            email: The email to filter by

        Returns:
            Query result
        """
        # Validate email
        self.validator.validate_input(email, "email")

        return self.session.query(model_class).filter(model_class.email == email)

    def safe_like_search(self, model_class, field, pattern: str):
        """
        Safely perform LIKE search using parameterized query.

        Args:
            model_class: The SQLAlchemy model class
            field: The field to search in
            pattern: The search pattern

        Returns:
            Query result
        """
        # Sanitize the pattern
        safe_pattern = self.validator.sanitize_like_pattern(pattern)

        return self.session.query(model_class).filter(field.like(f"%{safe_pattern}%"))

    def safe_count_query(self, model_class, filters: Optional[Dict[str, Any]] = None):
        """
        Safely count records with optional filters.

        Args:
            model_class: The SQLAlchemy model class
            filters: Optional filters to apply

        Returns:
            Count of records
        """
        query = self.session.query(model_class)

        if filters:
            # Validate all filter values
            safe_filters = self.validator.validate_dict(filters)

            for key, value in safe_filters.items():
                if hasattr(model_class, key):
                    query = query.filter(getattr(model_class, key) == value)

        return query.count()

    def safe_paginated_query(
        self,
        model_class,
        limit: int,
        offset: int,
        order_by: Optional[str] = None,
        allowed_order_fields: Optional[List[str]] = None,
    ):
        """
        Safely perform paginated query.

        Args:
            model_class: The SQLAlchemy model class
            limit: Number of records to return
            offset: Number of records to skip
            order_by: Field to order by
            allowed_order_fields: List of allowed order fields

        Returns:
            Query result
        """
        # Validate pagination parameters
        limit, offset = self.validator.validate_limit_offset(limit, offset)

        query = self.session.query(model_class)

        # Add ordering if specified
        if order_by and allowed_order_fields:
            safe_order_field = self.validator.validate_order_by_field(
                order_by, allowed_order_fields
            )

            # Parse direction
            if " desc" in safe_order_field.lower():
                field_name = safe_order_field.lower().replace(" desc", "").strip()
                if hasattr(model_class, field_name):
                    query = query.order_by(getattr(model_class, field_name).desc())
            else:
                field_name = safe_order_field.lower().replace(" asc", "").strip()
                if hasattr(model_class, field_name):
                    query = query.order_by(getattr(model_class, field_name).asc())

        return query.limit(limit).offset(offset)

    def execute_safe_raw_query(self, query_text: str, parameters: Dict[str, Any]):
        """
        Execute a raw SQL query safely with parameters.

        Args:
            query_text: The SQL query text with parameter placeholders
            parameters: Dictionary of parameters

        Returns:
            Query result
        """
        # Validate all parameter values
        safe_parameters = self.validator.validate_dict(parameters)

        # Execute with parameters
        return self.session.execute(text(query_text), safe_parameters)


# Decorator for automatic SQL injection validation
def validate_sql_inputs(func):
    """
    Decorator to automatically validate function arguments for SQL injection.

    Usage:
        @validate_sql_inputs
        def my_function(name: str, email: str):
            # Function implementation
    """

    def wrapper(*args, **kwargs):
        validator = SQLSecurityValidator()

        # Validate positional arguments
        validated_args = []
        for i, arg in enumerate(args):
            if isinstance(arg, str):
                validated_args.append(validator.validate_input(arg, f"arg_{i}"))
            else:
                validated_args.append(arg)

        # Validate keyword arguments
        validated_kwargs = {}
        for key, value in kwargs.items():
            if isinstance(value, str):
                validated_kwargs[key] = validator.validate_input(value, key)
            elif isinstance(value, dict):
                validated_kwargs[key] = validator.validate_dict(value)
            else:
                validated_kwargs[key] = value

        return func(*validated_args, **validated_kwargs)

    return wrapper


# Context manager for secure database operations
class SecureDatabaseContext:
    """Context manager for secure database operations."""

    def __init__(self, session):
        if not SQLALCHEMY_AVAILABLE:
            raise ImportError("SQLAlchemy is required for SecureDatabaseContext")
        self.session = session
        self.query_builder = SecureQueryBuilder(session)
        self.validator = SQLSecurityValidator()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            logger.error(
                "Database operation failed",
                exception_type=exc_type.__name__,
                exception_message=str(exc_val),
                exc_info=True,
            )
        return False

    def validate_and_execute(self, operation_func, *args, **kwargs):
        """
        Validate inputs and execute database operation.

        Args:
            operation_func: The database operation function
            *args: Positional arguments
            **kwargs: Keyword arguments

        Returns:
            Operation result
        """
        try:
            # Validate all string arguments
            validated_args = []
            for arg in args:
                if isinstance(arg, str):
                    validated_args.append(self.validator.validate_input(arg))
                else:
                    validated_args.append(arg)

            validated_kwargs = self.validator.validate_dict(kwargs)

            return operation_func(*validated_args, **validated_kwargs)

        except SQLSecurityError:
            raise
        except Exception as e:
            logger.error(
                "Secure database operation failed",
                operation=operation_func.__name__,
                error=str(e),
                exc_info=True,
            )
            raise
