"""
Security middleware for request validation and protection
"""
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import time
import hashlib
from collections import defaultdict
from typing import Dict, List
import logging

# Rate limiting storage (in production, use Redis)
rate_limit_storage: Dict[str, List[float]] = defaultdict(list)

class SecurityMiddleware:
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            
            # Apply security checks
            try:
                await self.check_rate_limit(request)
                await self.validate_request_headers(request)
                await self.check_request_size(request)
            except HTTPException as e:
                response = JSONResponse(
                    status_code=e.status_code,
                    content={"detail": e.detail}
                )
                await response(scope, receive, send)
                return
        
        await self.app(scope, receive, send)
    
    async def check_rate_limit(self, request: Request):
        """Rate limiting based on IP address"""
        client_ip = self.get_client_ip(request)
        current_time = time.time()
        
        # Clean old entries (older than 1 minute)
        rate_limit_storage[client_ip] = [
            timestamp for timestamp in rate_limit_storage[client_ip]
            if current_time - timestamp < 60
        ]
        
        # Check rate limits based on endpoint
        path = request.url.path
        
        if path.startswith("/admin/"):
            # Admin endpoints: 100 requests per minute
            limit = 100
        elif path.startswith("/auth/"):
            # Auth endpoints: 20 requests per minute
            limit = 40
        elif path.startswith("/upload/"):
            # Upload endpoints: 10 requests per minute
            limit = 20
        else:
            # General endpoints: 200 requests per minute
            limit = 200
        
        if len(rate_limit_storage[client_ip]) >= limit:
            # Sanitize inputs for logging
            safe_ip = client_ip.replace('\n', '').replace('\r', '')[:45]
            safe_path = path.replace('\n', '').replace('\r', '')[:100]
            logging.warning(f"Rate limit exceeded for IP {safe_ip} on {safe_path}")
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later."
            )
        
        rate_limit_storage[client_ip].append(current_time)
    
    async def validate_request_headers(self, request: Request):
        """Validate request headers for security"""
        headers = request.headers
        
        # Check for required security headers on admin requests
        if request.url.path.startswith("/admin/"):
            if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
                # Require X-Requested-With header for CSRF protection
                if "x-requested-with" not in headers:
                    safe_ip = self.get_client_ip(request).replace('\n', '').replace('\r', '')[:45]
                    logging.warning(f"Missing X-Requested-With header from {safe_ip}")
                    raise HTTPException(
                        status_code=400,
                        detail="Missing required security header"
                    )
        
        # Validate Content-Type for POST/PUT requests
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = headers.get("content-type", "")
            if not content_type:
                raise HTTPException(
                    status_code=400,
                    detail="Content-Type header is required"
                )
    
    async def check_request_size(self, request: Request):
        """Check request size limits"""
        content_length = request.headers.get("content-length")
        if content_length:
            size = int(content_length)
            
            # Different limits for different endpoints
            if request.url.path.startswith("/upload/"):
                max_size = 50 * 1024 * 1024  # 50MB for uploads
            elif request.url.path.startswith("/admin/books"):
                max_size = 50 * 1024 * 1024  # 50MB for book uploads
            else:
                max_size = 10 * 1024 * 1024  # 10MB for other requests
            
            if size > max_size:
                raise HTTPException(
                    status_code=413,
                    detail="Request too large"
                )
    
    def get_client_ip(self, request: Request) -> str:
        """Get client IP address with proxy support"""
        # Check for forwarded headers (when behind proxy)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection
        return request.client.host if request.client else "unknown"

def add_security_headers(response):
    """Add security headers to response"""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self'; "
        "frame-ancestors 'none';"
    )
    return response