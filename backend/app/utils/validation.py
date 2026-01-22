"""
Input validation utilities for FormVault Insurance Portal.

This module provides comprehensive input validation and sanitization
functions to prevent various security vulnerabilities.
"""

import re
import html
import unicodedata
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, date
import structlog

# Optional imports for enhanced validation
try:
    from email_validator import validate_email, EmailNotValidError
    EMAIL_VALIDATOR_AVAILABLE = True
except ImportError:
    EMAIL_VALIDATOR_AVAILABLE = False

try:
    import phonenumbers
    from phonenumbers import NumberParseException
    PHONENUMBERS_AVAILABLE = True
except ImportError:
    PHONENUMBERS_AVAILABLE = False

logger = structlog.get_logger(__name__)

# Validation patterns
PATTERNS = {
    'name': re.compile(r'^[a-zA-Z\s\-\'\.]{1,100}$'),
    'reference_number': re.compile(r'^FV-\d{4}-[A-Z0-9]{8}$'),
    'phone': re.compile(r'^\+?[\d\s\-\(\)]{7,20}$'),
    'zip_code': re.compile(r'^[\d\-\s]{3,10}$'),
    'insurance_type': re.compile(r'^(health|auto|life|travel)$'),
    'language': re.compile(r'^(en|es|zh)$'),
    'status': re.compile(r'^(draft|submitted|exported|completed|cancelled)$'),
    'file_type': re.compile(r'^(student_id|passport)$'),
    'uuid': re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
}

# Dangerous patterns to reject
DANGEROUS_PATTERNS = [
    re.compile(r'<script[^>]*>.*?</script>', re.IGNORECASE | re.DOTALL),
    re.compile(r'javascript:', re.IGNORECASE),
    re.compile(r'vbscript:', re.IGNORECASE),
    re.compile(r'on\w+\s*=', re.IGNORECASE),
    re.compile(r'<iframe[^>]*>.*?</iframe>', re.IGNORECASE | re.DOTALL),
    re.compile(r'<object[^>]*>.*?</object>', re.IGNORECASE | re.DOTALL),
    re.compile(r'<embed[^>]*>.*?</embed>', re.IGNORECASE | re.DOTALL),
    re.compile(r'expression\s*\(', re.IGNORECASE),
    re.compile(r'@import', re.IGNORECASE),
    re.compile(r'data:text/html', re.IGNORECASE),
]

# SQL injection patterns
SQL_PATTERNS = [
    re.compile(r'\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b', re.IGNORECASE),
    re.compile(r'\b(OR|AND)\s+\d+\s*=\s*\d+', re.IGNORECASE),
    re.compile(r'(--|#|/\*|\*/)', re.IGNORECASE),
    re.compile(r'\bUNION\s+(ALL\s+)?SELECT\b', re.IGNORECASE),
    re.compile(r'\bINSERT\s+INTO\b', re.IGNORECASE),
    re.compile(r'\bDROP\s+TABLE\b', re.IGNORECASE),
    re.compile(r'\bEXEC\s*\(', re.IGNORECASE),
    re.compile(r'\bxp_cmdshell\b', re.IGNORECASE),
]


class ValidationError(Exception):
    """Custom validation error."""
    
    def __init__(self, message: str, field: Optional[str] = None, code: Optional[str] = None):
        self.message = message
        self.field = field
        self.code = code or "VALIDATION_ERROR"
        super().__init__(self.message)


class InputValidator:
    """Comprehensive input validator with security checks."""
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 1000) -> str:
        """Sanitize string input to prevent XSS and other attacks."""
        if not isinstance(value, str):
            raise ValidationError("Input must be a string")
        
        # Normalize unicode
        value = unicodedata.normalize('NFKC', value)
        
        # Remove null bytes and control characters
        value = ''.join(char for char in value if ord(char) >= 32 or char in '\t\n\r')
        
        # HTML escape
        value = html.escape(value, quote=True)
        
        # Check for dangerous patterns
        for pattern in DANGEROUS_PATTERNS:
            if pattern.search(value):
                raise ValidationError("Input contains potentially dangerous content")
        
        # Check for SQL injection patterns
        for pattern in SQL_PATTERNS:
            if pattern.search(value):
                raise ValidationError("Input contains potentially dangerous SQL patterns")
        
        # Trim whitespace and limit length
        value = value.strip()
        if len(value) > max_length:
            value = value[:max_length]
        
        return value
    
    @staticmethod
    def validate_name(name: str, field_name: str = "name") -> str:
        """Validate and sanitize name fields."""
        if not name:
            raise ValidationError(f"{field_name} is required", field=field_name)
        
        name = InputValidator.sanitize_string(name, max_length=100)
        
        if not PATTERNS['name'].match(name):
            raise ValidationError(
                f"{field_name} can only contain letters, spaces, hyphens, apostrophes, and periods",
                field=field_name
            )
        
        if len(name) < 1:
            raise ValidationError(f"{field_name} must be at least 1 character long", field=field_name)
        
        return name
    
    @staticmethod
    def validate_email(email: str) -> str:
        """Validate email address."""
        if not email:
            raise ValidationError("Email is required", field="email")
        
        email = InputValidator.sanitize_string(email, max_length=254)
        
        if EMAIL_VALIDATOR_AVAILABLE:
            try:
                # Use email-validator library for comprehensive validation
                from email_validator import validate_email as validate_email_lib, EmailNotValidError
                validated_email = validate_email_lib(email)
                return validated_email.email
            except EmailNotValidError as e:
                raise ValidationError(f"Invalid email address: {str(e)}", field="email")
        else:
            # Basic email validation using regex
            email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
            if not email_pattern.match(email):
                raise ValidationError("Invalid email address format", field="email")
            return email
    
    @staticmethod
    def validate_phone(phone: str) -> str:
        """Validate phone number."""
        if not phone:
            raise ValidationError("Phone number is required", field="phone")
        
        phone = InputValidator.sanitize_string(phone, max_length=20)
        
        if PHONENUMBERS_AVAILABLE:
            try:
                # Parse phone number
                parsed_number = phonenumbers.parse(phone, None)
                
                # Validate phone number
                if not phonenumbers.is_valid_number(parsed_number):
                    raise ValidationError("Invalid phone number format", field="phone")
                
                # Format phone number
                return phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164)
                
            except NumberParseException:
                # Fallback to basic pattern validation
                if not PATTERNS['phone'].match(phone):
                    raise ValidationError("Invalid phone number format", field="phone")
                return phone
        else:
            # Basic phone validation using regex
            if not PATTERNS['phone'].match(phone):
                raise ValidationError("Invalid phone number format", field="phone")
            return phone
    
    @staticmethod
    def validate_address_field(value: str, field_name: str, max_length: int = 100) -> str:
        """Validate address field."""
        if not value:
            raise ValidationError(f"{field_name} is required", field=field_name)
        
        value = InputValidator.sanitize_string(value, max_length=max_length)
        
        if len(value) < 1:
            raise ValidationError(f"{field_name} must be at least 1 character long", field=field_name)
        
        return value
    
    @staticmethod
    def validate_zip_code(zip_code: str) -> str:
        """Validate ZIP/postal code."""
        if not zip_code:
            raise ValidationError("ZIP code is required", field="zip_code")
        
        zip_code = InputValidator.sanitize_string(zip_code, max_length=10)
        
        if not PATTERNS['zip_code'].match(zip_code):
            raise ValidationError("Invalid ZIP code format", field="zip_code")
        
        return zip_code
    
    @staticmethod
    def validate_date_of_birth(date_value: Union[str, date, datetime]) -> date:
        """Validate date of birth."""
        if not date_value:
            raise ValidationError("Date of birth is required", field="date_of_birth")
        
        if isinstance(date_value, str):
            try:
                # Try to parse ISO format date
                parsed_date = datetime.fromisoformat(date_value.replace('Z', '+00:00')).date()
            except ValueError:
                try:
                    # Try other common formats
                    parsed_date = datetime.strptime(date_value, '%Y-%m-%d').date()
                except ValueError:
                    raise ValidationError("Invalid date format. Use YYYY-MM-DD", field="date_of_birth")
        elif isinstance(date_value, datetime):
            parsed_date = date_value.date()
        elif isinstance(date_value, date):
            parsed_date = date_value
        else:
            raise ValidationError("Invalid date type", field="date_of_birth")
        
        # Validate age (must be at least 16 and not more than 120 years old)
        today = date.today()
        age = today.year - parsed_date.year - ((today.month, today.day) < (parsed_date.month, parsed_date.day))
        
        if age < 16:
            raise ValidationError("Must be at least 16 years old", field="date_of_birth")
        
        if age > 120:
            raise ValidationError("Invalid date of birth", field="date_of_birth")
        
        return parsed_date
    
    @staticmethod
    def validate_insurance_type(insurance_type: str) -> str:
        """Validate insurance type."""
        if not insurance_type:
            raise ValidationError("Insurance type is required", field="insurance_type")
        
        insurance_type = InputValidator.sanitize_string(insurance_type, max_length=20)
        
        if not PATTERNS['insurance_type'].match(insurance_type):
            raise ValidationError(
                "Insurance type must be one of: health, auto, life, travel",
                field="insurance_type"
            )
        
        return insurance_type
    
    @staticmethod
    def validate_language(language: str) -> str:
        """Validate preferred language."""
        if not language:
            raise ValidationError("Preferred language is required", field="preferred_language")
        
        language = InputValidator.sanitize_string(language, max_length=5)
        
        if not PATTERNS['language'].match(language):
            raise ValidationError(
                "Language must be one of: en, es, zh",
                field="preferred_language"
            )
        
        return language
    
    @staticmethod
    def validate_uuid(uuid_str: str, field_name: str = "id") -> str:
        """Validate UUID format."""
        if not uuid_str:
            raise ValidationError(f"{field_name} is required", field=field_name)
        
        uuid_str = InputValidator.sanitize_string(uuid_str, max_length=36)
        
        if not PATTERNS['uuid'].match(uuid_str):
            raise ValidationError(f"Invalid {field_name} format", field=field_name)
        
        return uuid_str
    
    @staticmethod
    def validate_file_type(file_type: str) -> str:
        """Validate file type."""
        if not file_type:
            raise ValidationError("File type is required", field="file_type")
        
        file_type = InputValidator.sanitize_string(file_type, max_length=20)
        
        if not PATTERNS['file_type'].match(file_type):
            raise ValidationError(
                "File type must be one of: student_id, passport",
                field="file_type"
            )
        
        return file_type
    
    @staticmethod
    def validate_status(status: str) -> str:
        """Validate application status."""
        if not status:
            raise ValidationError("Status is required", field="status")
        
        status = InputValidator.sanitize_string(status, max_length=20)
        
        if not PATTERNS['status'].match(status):
            raise ValidationError(
                "Status must be one of: draft, submitted, exported, completed, cancelled",
                field="status"
            )
        
        return status
    
    @staticmethod
    def validate_pagination_params(page: int, size: int) -> tuple[int, int]:
        """Validate pagination parameters."""
        if page < 1:
            raise ValidationError("Page must be at least 1", field="page")
        
        if size < 1:
            raise ValidationError("Size must be at least 1", field="size")
        
        if size > 100:
            raise ValidationError("Size cannot exceed 100", field="size")
        
        return page, size
    
    @staticmethod
    def validate_file_size(file_size: int, max_size: int = 5 * 1024 * 1024) -> int:
        """Validate file size."""
        if file_size <= 0:
            raise ValidationError("File size must be greater than 0", field="file_size")
        
        if file_size > max_size:
            raise ValidationError(
                f"File size cannot exceed {max_size // (1024 * 1024)}MB",
                field="file_size"
            )
        
        return file_size
    
    @staticmethod
    def validate_mime_type(mime_type: str, allowed_types: List[str]) -> str:
        """Validate MIME type."""
        if not mime_type:
            raise ValidationError("MIME type is required", field="mime_type")
        
        mime_type = InputValidator.sanitize_string(mime_type, max_length=100)
        
        if mime_type not in allowed_types:
            raise ValidationError(
                f"MIME type must be one of: {', '.join(allowed_types)}",
                field="mime_type"
            )
        
        return mime_type
    
    @staticmethod
    def validate_filename(filename: str) -> str:
        """Validate and sanitize filename."""
        if not filename:
            raise ValidationError("Filename is required", field="filename")
        
        # Remove path separators and dangerous characters
        filename = re.sub(r'[^\w\s.-]', '', filename)
        filename = re.sub(r'\.{2,}', '.', filename)  # Remove multiple dots
        filename = filename.strip('. ')
        
        if not filename:
            raise ValidationError("Invalid filename", field="filename")
        
        # Limit length
        if len(filename) > 255:
            name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
            filename = name[:250] + ('.' + ext if ext else '')
        
        return filename
    
    @staticmethod
    def validate_dict_input(data: Dict[str, Any], required_fields: List[str]) -> Dict[str, Any]:
        """Validate dictionary input with required fields."""
        if not isinstance(data, dict):
            raise ValidationError("Input must be a dictionary")
        
        # Check for required fields
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            raise ValidationError(
                f"Missing required fields: {', '.join(missing_fields)}",
                field="required_fields"
            )
        
        # Sanitize string values
        sanitized_data = {}
        for key, value in data.items():
            if isinstance(value, str):
                sanitized_data[key] = InputValidator.sanitize_string(value)
            else:
                sanitized_data[key] = value
        
        return sanitized_data


# Convenience functions for common validations
def validate_personal_info(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate personal information data."""
    validator = InputValidator()
    
    validated_data = {
        'first_name': validator.validate_name(data.get('first_name', ''), 'first_name'),
        'last_name': validator.validate_name(data.get('last_name', ''), 'last_name'),
        'email': validator.validate_email(data.get('email', '')),
        'phone': validator.validate_phone(data.get('phone', '')),
        'date_of_birth': validator.validate_date_of_birth(data.get('date_of_birth')),
    }
    
    return validated_data


def validate_address_info(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate address information data."""
    validator = InputValidator()
    
    validated_data = {
        'street': validator.validate_address_field(data.get('street', ''), 'street', 200),
        'city': validator.validate_address_field(data.get('city', ''), 'city', 100),
        'state': validator.validate_address_field(data.get('state', ''), 'state', 100),
        'zip_code': validator.validate_zip_code(data.get('zip_code', '')),
        'country': validator.validate_address_field(data.get('country', ''), 'country', 100),
    }
    
    return validated_data