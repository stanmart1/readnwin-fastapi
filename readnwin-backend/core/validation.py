"""
Security validation utilities for input sanitization and validation
"""
import re
import os
from typing import Optional, List, Dict, Any
from pathlib import Path
from pydantic import BaseModel, validator, Field
from fastapi import HTTPException, UploadFile
import magic
import hashlib

# File security constants
ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
ALLOWED_EBOOK_TYPES = {'text/html', 'application/xhtml+xml'}
ALLOWED_SAMPLE_TYPES = {'text/html', 'application/xhtml+xml'}

MAX_FILE_SIZES = {
    'image': 5 * 1024 * 1024,  # 5MB
    'ebook': 50 * 1024 * 1024,  # 50MB
    'sample': 10 * 1024 * 1024,  # 10MB
}

# Dangerous file extensions
DANGEROUS_EXTENSIONS = {
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.sh', '.bash'
}

class BookValidationSchema(BaseModel):
    """Secure validation schema for book data"""
    title: str = Field(..., min_length=1, max_length=200)
    author_id: Optional[int] = Field(None, ge=1)
    category_id: int = Field(..., ge=1)
    price: float = Field(..., ge=0, le=999999.99)
    isbn: Optional[str] = Field(None, max_length=17)
    description: Optional[str] = Field(None, max_length=5000)
    language: str = Field(default="English", max_length=50)
    pages: Optional[int] = Field(None, ge=1, le=10000)
    publisher: Optional[str] = Field(None, max_length=200)
    status: str = Field(default="draft")
    is_featured: bool = Field(default=False)
    is_bestseller: bool = Field(default=False)
    is_new_release: bool = Field(default=False)
    inventory_enabled: bool = Field(default=False)
    stock_quantity: Optional[int] = Field(None, ge=0, le=999999)
    low_stock_threshold: Optional[int] = Field(None, ge=0, le=1000)
    
    @validator('title')
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        # Remove potentially dangerous characters
        sanitized = re.sub(r'[<>"\']', '', v.strip())
        if len(sanitized) < 1:
            raise ValueError('Title must contain valid characters')
        return sanitized
    
    @validator('isbn')
    def validate_isbn(cls, v):
        if v:
            # Remove hyphens and spaces
            isbn = re.sub(r'[-\s]', '', v)
            # Check if it's a valid ISBN-10 or ISBN-13
            if not re.match(r'^(?:\d{9}[\dX]|\d{13})$', isbn):
                raise ValueError('Invalid ISBN format')
            return isbn
        return v
    
    @validator('description')
    def validate_description(cls, v):
        if v:
            # Remove script tags and other dangerous HTML
            sanitized = re.sub(r'<script[^>]*>.*?</script>', '', v, flags=re.IGNORECASE | re.DOTALL)
            sanitized = re.sub(r'<[^>]+>', '', sanitized)  # Remove all HTML tags
            return sanitized.strip()
        return v
    
    @validator('status')
    def validate_status(cls, v):
        allowed_statuses = {'draft', 'published', 'pending', 'archived'}
        if v not in allowed_statuses:
            raise ValueError(f'Status must be one of: {", ".join(allowed_statuses)}')
        return v

def validate_file_security(file: UploadFile, file_type: str) -> Dict[str, Any]:
    """
    Comprehensive file security validation
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    filename = file.filename.lower()
    file_ext = Path(filename).suffix.lower()
    
    # Check for dangerous extensions
    if file_ext in DANGEROUS_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not allowed for security reasons")
    
    # Validate file size
    max_size = MAX_FILE_SIZES.get(file_type, 5 * 1024 * 1024)
    if hasattr(file, 'size') and file.size > max_size:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size: {max_size // (1024*1024)}MB")
    
    # Read file content for validation
    try:
        content = file.file.read()
        file.file.seek(0)  # Reset file pointer
        
        if len(content) > max_size:
            raise HTTPException(status_code=400, detail=f"File too large. Maximum size: {max_size // (1024*1024)}MB")
        
        # Validate MIME type using python-magic
        mime_type = magic.from_buffer(content, mime=True)
        
        # Check allowed MIME types based on file type
        allowed_types = set()
        if file_type == 'image':
            allowed_types = ALLOWED_IMAGE_TYPES
        elif file_type == 'ebook':
            allowed_types = ALLOWED_EBOOK_TYPES
        elif file_type == 'sample':
            allowed_types = ALLOWED_SAMPLE_TYPES
        
        if mime_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Expected: {', '.join(allowed_types)}, got: {mime_type}"
            )
        
        # Generate secure filename using MD5 (consistent with book upload)
        file_hash = hashlib.md5(content).hexdigest()[:16]
        secure_filename = f"{file_hash}_{filename}"
        
        return {
            'content': content,
            'mime_type': mime_type,
            'size': len(content),
            'secure_filename': secure_filename,
            'original_filename': file.filename
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File validation failed: {str(e)}")

def sanitize_search_query(query: str) -> str:
    """Sanitize search queries to prevent injection attacks"""
    if not query:
        return ""
    
    # Remove SQL injection patterns
    dangerous_patterns = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)",
        r"(--|#|/\*|\*/)",
        r"(\b(OR|AND)\s+\d+\s*=\s*\d+)",
        r"(\b(OR|AND)\s+['\"].*['\"])",
    ]
    
    sanitized = query
    for pattern in dangerous_patterns:
        sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)
    
    # Limit length and remove special characters
    sanitized = re.sub(r'[<>"\';\\]', '', sanitized)
    return sanitized[:100]  # Limit to 100 characters

def validate_pagination(page: int, limit: int) -> tuple[int, int]:
    """Validate and sanitize pagination parameters"""
    page = max(1, min(page, 1000))  # Limit to reasonable range
    limit = max(1, min(limit, 100))  # Limit to prevent resource exhaustion
    return page, limit

def validate_sort_params(sort_by: str, sort_order: str) -> tuple[str, str]:
    """Validate sorting parameters to prevent injection"""
    allowed_sort_fields = {
        'id', 'title', 'author', 'price', 'created_at', 'updated_at', 
        'status', 'is_featured', 'category_id'
    }
    
    if sort_by not in allowed_sort_fields:
        sort_by = 'created_at'
    
    if sort_order.lower() not in ['asc', 'desc']:
        sort_order = 'desc'
    
    return sort_by, sort_order.lower()

class BulkOperationSchema(BaseModel):
    """Validation for bulk operations"""
    book_ids: List[int] = Field(..., min_items=1, max_items=100)
    
    @validator('book_ids')
    def validate_book_ids(cls, v):
        if not v:
            raise ValueError('At least one book ID is required')
        if len(v) > 100:
            raise ValueError('Too many books selected (max 100)')
        # Ensure all IDs are positive integers
        for book_id in v:
            if not isinstance(book_id, int) or book_id <= 0:
                raise ValueError('Invalid book ID')
        return list(set(v))  # Remove duplicates

def validate_admin_permissions(user, required_permission: str = None):
    """Enhanced admin permission validation"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if not hasattr(user, 'has_admin_access') or not user.has_admin_access:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Additional permission checks can be added here
    if required_permission:
        # Check specific permissions if implemented
        pass
    
    return True