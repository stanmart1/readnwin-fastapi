"""
Middleware to reduce logging noise from frequent 401 errors
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import logging

class QuietLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to reduce noise from frequent 401 authentication errors"""
    
    def __init__(self, app, quiet_paths: list = None):
        super().__init__(app)
        self.quiet_paths = quiet_paths or ["/admin/notifications/stats"]
        
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # If this is a 401 error on a quiet path, don't let it generate noise
        if (response.status_code == 401 and 
            any(path in str(request.url) for path in self.quiet_paths)):
            # Suppress the default logging for these endpoints
            pass
            
        return response