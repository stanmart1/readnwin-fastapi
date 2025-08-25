from pydantic import BaseModel
from typing import Any, Optional, Dict, List
from enum import Enum

class ResponseStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"

class StandardResponse(BaseModel):
    """Standard API response format"""
    status: ResponseStatus
    message: str
    data: Optional[Any] = None
    errors: Optional[List[str]] = None
    meta: Optional[Dict[str, Any]] = None

class PaginatedResponse(BaseModel):
    """Paginated response format"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    message: str = "Data retrieved successfully"
    data: List[Any]
    meta: Dict[str, Any]  # Contains pagination info

def success_response(data: Any = None, message: str = "Operation successful", meta: Dict[str, Any] = None):
    """Create standardized success response"""
    return StandardResponse(
        status=ResponseStatus.SUCCESS,
        message=message,
        data=data,
        meta=meta
    )

def error_response(message: str, errors: List[str] = None, data: Any = None):
    """Create standardized error response"""
    return StandardResponse(
        status=ResponseStatus.ERROR,
        message=message,
        errors=errors or [],
        data=data
    )

def paginated_response(data: List[Any], total: int, page: int, limit: int, message: str = "Data retrieved successfully"):
    """Create standardized paginated response"""
    return PaginatedResponse(
        status=ResponseStatus.SUCCESS,
        message=message,
        data=data,
        meta={
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
            "has_next": page * limit < total,
            "has_prev": page > 1
        }
    )