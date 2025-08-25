from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import hmac
import hashlib
import time
from core.config import settings
from typing import List

class CSRFProtection:
    def __init__(self, exempt_paths: List[str] = None):
        self.exempt_paths = exempt_paths or [
            "/auth/login",
            "/auth/register", 
            "/auth/refresh",
            "/health",
            "/docs",
            "/openapi.json",
            "/checkout/",
            "/cart/",
            "/books/",
            "/payment/"
        ]
    
    async def __call__(self, request: Request, call_next):
        # Skip CSRF check for safe methods and exempt paths
        if (request.method in ["GET", "HEAD", "OPTIONS"] or 
            any(request.url.path.startswith(path) for path in self.exempt_paths)):
            return await call_next(request)
        
        # Check for CSRF token in headers
        csrf_token = request.headers.get("X-CSRF-Token")
        if not csrf_token:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "CSRF token missing"}
            )
        
        # Validate CSRF token (basic validation - in production use proper CSRF validation)
        if not self.validate_csrf_token(csrf_token):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Invalid CSRF token"}
            )
        
        return await call_next(request)
    
    def validate_csrf_token(self, token: str) -> bool:
        """Cryptographic CSRF token validation"""
        try:
            # Token format: timestamp:hash
            parts = token.split(':')
            if len(parts) != 2:
                return False
            
            timestamp_str, provided_hash = parts
            timestamp = int(timestamp_str)
            
            # Check if token is not expired (1 hour)
            current_time = int(time.time())
            if current_time - timestamp > 3600:
                return False
            
            # Verify HMAC signature
            expected_hash = hmac.new(
                settings.csrf_secret_key.encode(),
                timestamp_str.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(expected_hash, provided_hash)
        except (ValueError, TypeError):
            return False