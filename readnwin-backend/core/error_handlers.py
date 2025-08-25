from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError
from core.response_models import error_response
import logging

logger = logging.getLogger(__name__)

def sanitize_log_input(text: str) -> str:
    """Sanitize input for logging to prevent log injection"""
    if not text:
        return ""
    # Remove newlines and limit length
    sanitized = str(text).replace('\n', ' ').replace('\r', ' ')[:200]
    return sanitized

class CustomHTTPException(HTTPException):
    """Custom HTTP exception with standardized response"""
    def __init__(self, status_code: int, message: str, errors: list = None):
        self.status_code = status_code
        self.message = message
        self.errors = errors or []
        super().__init__(status_code=status_code, detail=message)

async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with standardized response"""
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(
            message=exc.detail,
            errors=[exc.detail] if isinstance(exc.detail, str) else exc.detail
        ).dict()
    )

async def validation_exception_handler(request: Request, exc: ValidationError):
    """Handle Pydantic validation errors"""
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(x) for x in error["loc"])
        errors.append(f"{field}: {error['msg']}")
    
    return JSONResponse(
        status_code=422,
        content=error_response(
            message="Validation failed",
            errors=errors
        ).dict()
    )

async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors"""
    logger.error(f"Database error: {sanitize_log_input(str(exc))}")
    
    return JSONResponse(
        status_code=500,
        content=error_response(
            message="Database operation failed",
            errors=["A database error occurred"]
        ).dict()
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unexpected error: {sanitize_log_input(str(exc))}")
    
    return JSONResponse(
        status_code=500,
        content=error_response(
            message="Internal server error",
            errors=["An unexpected error occurred"]
        ).dict()
    )

# Common HTTP exceptions
class BadRequestException(CustomHTTPException):
    def __init__(self, message: str = "Bad request", errors: list = None):
        super().__init__(400, message, errors)

class UnauthorizedException(CustomHTTPException):
    def __init__(self, message: str = "Unauthorized", errors: list = None):
        super().__init__(401, message, errors)

class ForbiddenException(CustomHTTPException):
    def __init__(self, message: str = "Forbidden", errors: list = None):
        super().__init__(403, message, errors)

class NotFoundException(CustomHTTPException):
    def __init__(self, message: str = "Resource not found", errors: list = None):
        super().__init__(404, message, errors)

class ConflictException(CustomHTTPException):
    def __init__(self, message: str = "Conflict", errors: list = None):
        super().__init__(409, message, errors)

class TooManyRequestsException(CustomHTTPException):
    def __init__(self, message: str = "Too many requests", errors: list = None):
        super().__init__(429, message, errors)