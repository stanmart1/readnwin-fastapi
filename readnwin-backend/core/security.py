from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .config import settings
from .database import get_db
from models.user import User
from models.role import Role, RolePermission
from sqlalchemy.orm import joinedload
from .admin_security import check_admin_access
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def check_admin_access(user: User) -> bool:
    """Check if the user has admin role/permissions - optimized."""
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Fast check using has_admin_access property
    if hasattr(user, 'has_admin_access') and user.has_admin_access:
        return True

    raise HTTPException(status_code=403, detail="Admin access required")

def create_access_token(data: dict, db: Optional[Session] = None):
    to_encode = data.copy()
    # Add unique JWT ID for blacklisting
    to_encode.update({
        "jti": str(uuid.uuid4()),
        "exp": datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes),
        "iat": datetime.utcnow(),
        "type": "access"
    })
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    to_encode.update({
        "jti": str(uuid.uuid4()),
        "exp": datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days),
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        # Check token expiration
        exp = payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def get_current_user_from_token(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    request: Request = None
) -> User:
    try:
        # Check if token is blacklisted
        from services.security_service import SecurityService
        if SecurityService.is_token_blacklisted(db, token):
            raise HTTPException(status_code=401, detail="Token has been revoked")
        
        payload = verify_token(token)
        user_id = payload.get("sub")
        token_type = payload.get("type", "access")
        
        if user_id is None or token_type != "access":
            raise HTTPException(status_code=401, detail="Invalid authentication token")

        # Optimized query with eager loading of role and permissions
        from sqlalchemy.orm import joinedload
        from models.role import Role, RolePermission, Permission
        
        user = db.query(User).options(
            joinedload(User.role).joinedload(Role.permissions).joinedload(RolePermission.permission)
        ).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not user.is_active:
            raise HTTPException(status_code=403, detail="User is not active")

        # Log token usage for suspicious activity detection
        if request:
            SecurityService.detect_suspicious_activity(db, user.id, request)
        
        # Generate and attach CSRF token for authenticated users
        if hasattr(user, '_csrf_token'):
            user._csrf_token = SecurityService.generate_csrf_token()

        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
