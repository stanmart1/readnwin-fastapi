"""XSS Protection Middleware and Utilities"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import bleach
import html


class XSSProtectionMiddleware(BaseHTTPMiddleware):
    """Add XSS protection headers to all responses"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Add security headers
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        
        return response


def sanitize_html(text: str, allowed_tags: list = None) -> str:
    """Sanitize HTML to prevent XSS attacks
    
    Args:
        text: HTML text to sanitize
        allowed_tags: List of allowed HTML tags (default: none)
    
    Returns:
        Sanitized HTML string
    """
    if not text:
        return ""
    
    if allowed_tags is None:
        # Strip all HTML tags by default
        return bleach.clean(text, tags=[], strip=True)
    
    # Allow specific tags
    return bleach.clean(text, tags=allowed_tags, strip=True)


def escape_html(text: str) -> str:
    """Escape HTML entities
    
    Args:
        text: Text to escape
    
    Returns:
        HTML-escaped string
    """
    if not text:
        return ""
    
    return html.escape(str(text))
