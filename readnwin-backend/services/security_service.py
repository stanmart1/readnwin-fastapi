import uuid
import json
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import Request, HTTPException
from models.token_blacklist import TokenBlacklist
from models.security_log import SecurityLog, LoginAttempt
from models.user import User
from core.config import settings
from core.security import verify_token
import logging

logger = logging.getLogger(__name__)

class SecurityService:
    
    @staticmethod
    def generate_csrf_token() -> str:
        """Generate cryptographically secure CSRF token"""
        from core.config import settings
        import time
        import hmac
        import hashlib
        
        timestamp = str(int(time.time()))
        signature = hmac.new(
            settings.csrf_secret_key.encode(),
            timestamp.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return f"{timestamp}:{signature}"
    
    @staticmethod
    def validate_csrf_token(request: Request, provided_token: str) -> bool:
        """Validate CSRF token from request headers"""
        expected_token = request.headers.get("X-CSRF-Token")
        return expected_token == provided_token
    
    @staticmethod
    def blacklist_token(db: Session, token: str, user_id: int, reason: str = "logout"):
        """Add token to blacklist"""
        try:
            payload = verify_token(token)
            jti = payload.get("jti", str(uuid.uuid4()))
            exp = payload.get("exp")
            expires_at = datetime.fromtimestamp(exp, tz=timezone.utc) if exp else datetime.now(timezone.utc) + timedelta(hours=1)
            
            blacklisted_token = TokenBlacklist(
                token_jti=jti,
                user_id=user_id,
                expires_at=expires_at,
                reason=reason
            )
            db.add(blacklisted_token)
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to blacklist token: {e}")
            return False
    
    @staticmethod
    def is_token_blacklisted(db: Session, token: str) -> bool:
        """Check if token is blacklisted"""
        try:
            payload = verify_token(token)
            jti = payload.get("jti")
            if not jti:
                return False
            
            blacklisted = db.query(TokenBlacklist).filter(
                TokenBlacklist.token_jti == jti,
                TokenBlacklist.expires_at > datetime.now(timezone.utc)
            ).first()
            return blacklisted is not None
        except:
            return True  # If token is invalid, consider it blacklisted
    
    @staticmethod
    def log_security_event(db: Session, event_type: str, request: Request, user_id: Optional[int] = None, 
                          details: Optional[Dict[str, Any]] = None, risk_level: str = "low"):
        """Log security events"""
        try:
            security_log = SecurityLog(
                user_id=user_id,
                event_type=event_type,
                ip_address=SecurityService.get_client_ip(request),
                user_agent=request.headers.get("user-agent", ""),
                details=json.dumps(details) if details else None,
                risk_level=risk_level
            )
            db.add(security_log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log security event: {e}")
    
    @staticmethod
    def log_login_attempt(db: Session, email: str, request: Request, success: bool, 
                         failure_reason: Optional[str] = None):
        """Log login attempts"""
        try:
            login_attempt = LoginAttempt(
                email=email,
                ip_address=SecurityService.get_client_ip(request),
                success=success,
                failure_reason=failure_reason,
                user_agent=request.headers.get("user-agent", "")
            )
            db.add(login_attempt)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log login attempt: {e}")
    
    @staticmethod
    def check_login_attempts(db: Session, email: str, ip_address: str) -> bool:
        """Check if login attempts exceed limit"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=settings.lockout_duration_minutes)
        
        # Check failed attempts by email
        email_attempts = db.query(LoginAttempt).filter(
            LoginAttempt.email == email,
            LoginAttempt.success == False,
            LoginAttempt.attempted_at > cutoff_time
        ).count()
        
        # Check failed attempts by IP
        ip_attempts = db.query(LoginAttempt).filter(
            LoginAttempt.ip_address == ip_address,
            LoginAttempt.success == False,
            LoginAttempt.attempted_at > cutoff_time
        ).count()
        
        return email_attempts >= settings.max_login_attempts or ip_attempts >= settings.max_login_attempts
    
    @staticmethod
    def get_client_ip(request: Request) -> str:
        """Get client IP with proxy support"""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    @staticmethod
    def detect_suspicious_activity(db: Session, user_id: int, request: Request) -> bool:
        """Basic suspicious activity detection"""
        try:
            current_ip = SecurityService.get_client_ip(request)
            
            # Check for rapid location changes (different IPs in short time)
            recent_logs = db.query(SecurityLog).filter(
                SecurityLog.user_id == user_id,
                SecurityLog.event_type.in_(["login_success", "token_refresh"]),
                SecurityLog.created_at > datetime.now(timezone.utc) - timedelta(hours=1)
            ).order_by(SecurityLog.created_at.desc()).limit(5).all()
            
            if len(recent_logs) >= 3:
                unique_ips = set(log.ip_address for log in recent_logs)
                if len(unique_ips) >= 3:  # 3+ different IPs in 1 hour
                    SecurityService.log_security_event(
                        db, "suspicious_activity", request, user_id,
                        {"reason": "multiple_ip_addresses", "ips": list(unique_ips)},
                        "high"
                    )
                    return True
            
            return False
        except Exception as e:
            logger.error(f"Error in suspicious activity detection: {e}")
            return False