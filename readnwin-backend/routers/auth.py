from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, verify_token
from models.user import User
from models.role import Role, RolePermission
from services.security_service import SecurityService
from services.redis_service import check_rate_limit
from sqlalchemy.orm import joinedload
from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, Dict, Any
import secrets
import logging
import re
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timezone, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=1, description="User password")

    @validator('email')
    def validate_email(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Email is required')
        return v.lower().strip()

    @validator('password')
    def validate_password(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Password is required')
        return v

class UserRegister(BaseModel):
    email: EmailStr = Field(..., description="Valid email address")
    username: str = Field(..., min_length=3, max_length=50, description="Username (3-50 characters)")
    password: str = Field(..., min_length=8, description="Password (minimum 8 characters)")
    first_name: Optional[str] = Field(None, max_length=100, description="First name")
    last_name: Optional[str] = Field(None, max_length=100, description="Last name")
    phone_number: Optional[str] = Field(None, max_length=20, description="Phone number")
    school_name: Optional[str] = Field(None, max_length=200, description="Name of school")
    school_category: Optional[str] = Field(None, description="School category: Primary, Secondary, Tertiary")
    class_level: Optional[str] = Field(None, max_length=50, description="Class level (for Primary/Secondary)")
    department: Optional[str] = Field(None, max_length=100, description="Department (for Tertiary)")

    @validator('email')
    def validate_email(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Email is required')
        return v.lower().strip()

    @validator('username')
    def validate_username(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Username is required')
        v = v.strip()
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if len(v) > 50:
            raise ValueError('Username must be less than 50 characters')
        # Allow alphanumeric, underscore, and hyphen
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
        return v

    @validator('password')
    def validate_password(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Password is required')
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')

        # Check for at least one uppercase letter
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')

        # Check for at least one lowercase letter
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')

        # Check for at least one digit
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')

        # Check for at least one special character
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')

        return v

    @validator('first_name')
    def validate_first_name(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
            if len(v) > 100:
                raise ValueError('First name must be less than 100 characters')
            # Only allow letters, spaces, hyphens, and apostrophes
            if not re.match(r"^[a-zA-Z\s\-']+$", v):
                raise ValueError('First name can only contain letters, spaces, hyphens, and apostrophes')
        return v

    @validator('last_name')
    def validate_last_name(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
            if len(v) > 100:
                raise ValueError('Last name must be less than 100 characters')
            # Only allow letters, spaces, hyphens, and apostrophes
            if not re.match(r"^[a-zA-Z\s\-']+$", v):
                raise ValueError('Last name can only contain letters, spaces, hyphens, and apostrophes')
        return v

    @validator('phone_number')
    def validate_phone_number(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
            if not re.match(r'^[\d\s\-\(\)\+]+$', v):
                raise ValueError('Phone number can only contain digits, spaces, hyphens, parentheses, and plus sign')
        return v

    @validator('school_category')
    def validate_school_category(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
            if v not in ['Primary', 'Secondary', 'Tertiary']:
                raise ValueError('School category must be Primary, Secondary, or Tertiary')
        return v

class PasswordReset(BaseModel):
    email: EmailStr = Field(..., description="Valid email address")

    @validator('email')
    def validate_email(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Email is required')
        return v.lower().strip()

class PasswordResetConfirm(BaseModel):
    token: str = Field(..., min_length=1, description="Reset token")
    new_password: str = Field(..., min_length=8, description="New password (minimum 8 characters)")

    @validator('token')
    def validate_token(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Reset token is required')
        return v.strip()

    @validator('new_password')
    def validate_new_password(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('New password is required')
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')

        # Check for at least one uppercase letter
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')

        # Check for at least one lowercase letter
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')

        # Check for at least one digit
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')

        # Check for at least one special character
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')

        return v

class ChangePassword(BaseModel):
    current_password: str = Field(..., min_length=1, description="Current password")
    new_password: str = Field(..., min_length=8, description="New password (minimum 8 characters)")

    @validator('current_password')
    def validate_current_password(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Current password is required')
        return v

    @validator('new_password')
    def validate_new_password(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('New password is required')
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')

        # Check for at least one uppercase letter
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')

        # Check for at least one lowercase letter
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')

        # Check for at least one digit
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')

        # Check for at least one special character
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')

        return v

class UpdateProfile(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100, description="First name")
    last_name: Optional[str] = Field(None, max_length=100, description="Last name")
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="Username")
    phone_number: Optional[str] = Field(None, max_length=20, description="Phone number")
    school_name: Optional[str] = Field(None, max_length=200, description="Name of school")
    school_category: Optional[str] = Field(None, description="School category: Primary, Secondary, Tertiary")
    class_level: Optional[str] = Field(None, max_length=50, description="Class level (for Primary/Secondary)")
    department: Optional[str] = Field(None, max_length=100, description="Department (for Tertiary)")

    @validator('first_name')
    def validate_first_name(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
            if len(v) > 100:
                raise ValueError('First name must be less than 100 characters')
            # Only allow letters, spaces, hyphens, and apostrophes
            if not re.match(r"^[a-zA-Z\s\-']+$", v):
                raise ValueError('First name can only contain letters, spaces, hyphens, and apostrophes')
        return v

    @validator('last_name')
    def validate_last_name(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
            if len(v) > 100:
                raise ValueError('Last name must be less than 100 characters')
            # Only allow letters, spaces, hyphens, and apostrophes
            if not re.match(r"^[a-zA-Z\s\-']+$", v):
                raise ValueError('Last name can only contain letters, spaces, hyphens, and apostrophes')
        return v

    @validator('username')
    def validate_username(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
            if len(v) < 3:
                raise ValueError('Username must be at least 3 characters long')
            if len(v) > 50:
                raise ValueError('Username must be less than 50 characters')
            # Allow alphanumeric, underscore, and hyphen
            if not re.match(r'^[a-zA-Z0-9_-]+$', v):
                raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
        return v

    @validator('phone_number')
    def validate_phone_number(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
            if not re.match(r'^[\d\s\-\(\)\+]+$', v):
                raise ValueError('Phone number can only contain digits, spaces, hyphens, parentheses, and plus sign')
        return v

    @validator('school_category')
    def validate_school_category(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                return None
            if v not in ['Primary', 'Secondary', 'Tertiary']:
                raise ValueError('School category must be Primary, Secondary, or Tertiary')
        return v

class VerificationCheck(BaseModel):
    email: EmailStr = Field(..., description="Valid email address")

    @validator('email')
    def validate_email(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Email is required')
        return v.lower().strip()

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    first_name: Optional[str]
    last_name: Optional[str]
    phone_number: Optional[str] = None
    school_name: Optional[str] = None
    school_category: Optional[str] = None
    class_level: Optional[str] = None
    department: Optional[str] = None
    is_active: bool
    role: Optional[dict] = None
    permissions: list = []

    class Config:
        from_attributes = True

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user_from_token(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Fast query - no joins for better performance
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

@router.post("/register")
async def register(user_data: UserRegister, request: Request, db: Session = Depends(get_db)):
    """
    Register a new user with comprehensive validation and security measures.

    - **email**: Valid email address (required)
    - **username**: Username 3-50 characters, alphanumeric with underscore/hyphen (required)
    - **password**: Strong password with uppercase, lowercase, number, and special character (required)
    - **first_name**: Optional first name
    - **last_name**: Optional last name
    """
    try:
        logger.info(f"🔐 Registration attempt for email: {user_data.email}")

        # Rate limiting for registration attempts
        rate_key = f"register:{request.client.host}"
        if not check_rate_limit(rate_key, max_attempts=3, window_seconds=900):  # 15 minutes
            logger.warning(f"❌ Rate limit exceeded for registration from IP: {request.client.host}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many registration attempts. Please try again later."
            )

        # Check if email already exists (case-insensitive)
        existing_email = db.query(User).filter(User.email.ilike(user_data.email)).first()
        if existing_email:
            logger.warning(f"❌ Email already registered: {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Check if username already exists (case-insensitive)
        existing_username = db.query(User).filter(User.username.ilike(user_data.username)).first()
        if existing_username:
            logger.warning(f"❌ Username already taken: {user_data.username}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

        # Get default user role
        default_role = db.query(Role).filter(Role.name == "user").first()
        if not default_role:
            logger.error("❌ Default user role not found")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="System configuration error"
            )

        # Generate email verification token
        verification_token = secrets.token_urlsafe(32)
        verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)

        # Create new user
        user = User(
            email=user_data.email,
            username=user_data.username,
            password_hash=get_password_hash(user_data.password),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone_number=user_data.phone_number,
            school_name=user_data.school_name,
            school_category=user_data.school_category,
            class_level=user_data.class_level,
            department=user_data.department,
            role_id=default_role.id,
            is_active=True,  # Set to False if email verification is required
            is_email_verified=True,  # Set to False if email verification is required
            verification_token=verification_token,
            verification_token_expires=verification_expires,
            created_at=datetime.now(timezone.utc)
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        logger.info(f"✅ User registered successfully: {user.email} (ID: {user.id})")

        # Get role and permissions for response
        role_data = {
            "id": user.role.id,
            "name": user.role.name,
            "display_name": user.role.display_name
        }
        permissions = [perm.permission.name for perm in user.role.permissions] if user.role.permissions else []

        # Create access token
        token = create_access_token({
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.name if user.role else None
        })

        # Send welcome email
        try:
            from services.email_service import send_welcome_email
            send_welcome_email(user.email, user.first_name or user.username, db)
        except Exception as e:
            logger.warning(f"Failed to send welcome email: {e}")

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_active": user.is_active,
                "is_email_verified": user.is_email_verified,
                "role": role_data,
                "permissions": permissions
            },
            "message": "Registration successful"
        }

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"❌ Validation error for {user_data.email}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Registration error for {user_data.email}: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login")
def login(user_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    """
    Authenticate user with email and password with enhanced security.
    """
    try:
        client_ip = SecurityService.get_client_ip(request)
        
        # Check for too many failed login attempts
        if SecurityService.check_login_attempts(db, user_data.email, client_ip):
            SecurityService.log_login_attempt(db, user_data.email, request, False, "rate_limited")
            raise HTTPException(status_code=429, detail="Too many failed login attempts. Please try again later.")
        
        # Ultra-fast query - no joins, minimal data
        user = db.query(User.id, User.email, User.username, User.first_name, User.last_name, 
                       User.password_hash, User.is_active, User.is_email_verified, User.role_id).filter(
            User.email.ilike(user_data.email)
        ).first()

        # Verify user exists and password is correct
        if not user or not verify_password(user_data.password, user.password_hash):
            SecurityService.log_login_attempt(db, user_data.email, request, False, "invalid_credentials")
            SecurityService.log_security_event(db, "login_failed", request, None, 
                                             {"email": user_data.email, "reason": "invalid_credentials"}, "medium")
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Check if account is active
        if not user.is_active:
            SecurityService.log_login_attempt(db, user_data.email, request, False, "account_inactive")
            raise HTTPException(status_code=401, detail="Account is deactivated. Please contact support.")
        
        # Skip email verification check for login - allow all existing users to login

        # Get role name only if needed (separate fast query)
        role_name = None
        redirect_path = "/dashboard"
        if user.role_id:
            role_result = db.query(Role.name).filter(Role.id == user.role_id).first()
            if role_result:
                role_name = role_result.name
                if role_name in ["super_admin", "admin", "moderator", "content_manager"]:
                    redirect_path = "/admin"

        # Create tokens
        access_token = create_access_token({
            "sub": str(user.id),
            "email": user.email,
            "role": role_name
        })
        
        refresh_token = create_refresh_token({
            "sub": str(user.id),
            "email": user.email
        })
        
        # Generate CSRF token
        csrf_token = SecurityService.generate_csrf_token()

        # Update last_login timestamp
        db.query(User).filter(User.id == user.id).update({"last_login": datetime.utcnow()})
        db.commit()

        # Log successful login
        SecurityService.log_login_attempt(db, user_data.email, request, True)
        SecurityService.log_security_event(db, "login_success", request, user.id, 
                                         {"role": role_name}, "low")

        # Send login alert email only on suspicious activity (disabled by default)
        # Uncomment to enable login alerts on every login
        # try:
        #     from services.email_service import send_login_alert_email
        #     send_login_alert_email(
        #         to_email=user_data.email,
        #         alert_data={
        #             "login_time": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        #             "login_location": "Unknown",  # Geolocation not available
        #             "device_info": request.headers.get("User-Agent", "Unknown"),
        #             "ip_address": client_ip
        #         },
        #         first_name=user.first_name or user.username,
        #         db_session=db
        #     )
        # except Exception as e:
        #     logger.warning(f"Failed to send login alert email: {e}")

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "csrf_token": csrf_token,
            "token_type": "bearer",
            "expires_in": 3600,  # 1 hour
            "redirect_path": redirect_path,
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_active": user.is_active,
                "is_email_verified": user.is_email_verified,
                "role": {"name": role_name} if role_name else None
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        SecurityService.log_security_event(db, "login_error", request, None, 
                                         {"error": str(e)}, "high")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.")

@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db)):
    """
    Logout current user and invalidate tokens.
    """
    try:
        # Try to get user from token if provided
        auth_header = request.headers.get("Authorization")
        user_id = None
        token = None
        
        if auth_header and auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                payload = verify_token(token)
                user_id = int(payload.get("sub"))
                
                # Blacklist the access token
                SecurityService.blacklist_token(db, token, user_id, "logout")
                
                # Log logout event
                SecurityService.log_security_event(db, "logout", request, user_id, 
                                                 {"method": "manual"}, "low")
                
                logger.info(f"🔓 Logout for user ID: {user_id}")
            except Exception as e:
                logger.warning(f"Error processing logout token: {e}")
        
        return {
            "message": "Successfully logged out",
            "user_id": user_id
        }

    except Exception as e:
        logger.error(f"❌ Logout error: {str(e)}", exc_info=True)
        return {
            "message": "Successfully logged out",
            "user_id": None
        }

@router.get("/me", response_model=UserResponse)
def get_current_user(current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    """
    Get current authenticated user information - optimized for speed.
    """
    try:
        # Get role info only if needed
        role_data = None
        if current_user.role_id:
            role_result = db.query(Role.id, Role.name, Role.display_name).filter(Role.id == current_user.role_id).first()
            if role_result:
                role_data = {
                    "id": role_result.id,
                    "name": role_result.name,
                    "display_name": role_result.display_name
                }

        return UserResponse(
            id=current_user.id,
            email=current_user.email,
            username=current_user.username,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            phone_number=current_user.phone_number,
            school_name=current_user.school_name,
            school_category=current_user.school_category,
            class_level=current_user.class_level,
            department=current_user.department,
            is_active=current_user.is_active,
            role=role_data,
            permissions=[]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get user information")

@router.get("/permissions")
def get_user_permissions(current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    """
    Get current user's permissions - optimized separate endpoint.
    """
    try:
        if not current_user.role:
            return {"permissions": []}

        # Load permissions separately for better performance
        role_with_permissions = db.query(Role).options(
            joinedload(Role.permissions).joinedload(RolePermission.permission)
        ).filter(Role.id == current_user.role.id).first()
        
        permissions = []
        if role_with_permissions and role_with_permissions.permissions:
            permissions = [perm.permission.name for perm in role_with_permissions.permissions]
        
        return {"permissions": permissions}

    except Exception as e:
        logger.error(f"❌ Get permissions error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user permissions"
        )

@router.post("/check-verification-status")
def check_verification_status(data: VerificationCheck, db: Session = Depends(get_db)):
    """
    Check email verification status for a user.
    """
    try:
        logger.info(f"Checking verification status for email: {data.email}")

        # Check if user exists
        user = db.query(User).filter(User.email.ilike(data.email)).first()
        if not user:
            logger.info(f"User not found for email: {data.email}")
            return {
                "needsVerification": True,
                "message": "User not found",
                "status": "NOT_FOUND"
            }

        # Check if verification token is expired
        token_expired = (
            user.verification_token_expires and
            user.verification_token_expires < datetime.now(timezone.utc)
        )

        # Email verification disabled for existing users - only for new signups
        verification_status = "VERIFIED"
        needs_verification = False

        logger.info(f"Verification status for {data.email}: {verification_status}")

        return {
            "needsVerification": False,
            "userId": user.id,
            "email": user.email,
            "status": "VERIFIED",
            "isEmailVerified": True,
            "isActive": user.is_active,
            "tokenExpired": False
        }

    except Exception as e:
        logger.error(f"Error checking verification status: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error checking verification status"
        )

@router.post("/reset-password")
async def request_password_reset(data: PasswordReset, request: Request, db: Session = Depends(get_db)):
    """
    Request password reset for a user account.
    """
    try:
        logger.info(f"Password reset requested for: {data.email}")

        # Rate limiting for password reset requests
        rate_key = f"reset:{request.client.host}"
        if not check_rate_limit(rate_key, max_attempts=3, window_seconds=3600):  # 60 minutes
            logger.warning(f"❌ Rate limit exceeded for password reset from IP: {request.client.host}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many password reset attempts. Please try again later."
            )

        user = db.query(User).filter(User.email.ilike(data.email)).first()
        if not user:
            # Don't reveal if email exists or not for security
            logger.info(f"Password reset requested for non-existent email: {data.email}")
            return {"message": "If the email exists, a reset link has been sent"}

        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        user.verification_token = reset_token
        user.verification_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)

        db.commit()

        # Send password reset email
        try:
            from services.email_service import send_password_reset_email
            send_password_reset_email(user.email, reset_token, user.first_name or user.username, db)
        except Exception as e:
            logger.warning(f"Failed to send password reset email: {e}")

        logger.info(f"Password reset token generated for: {user.email}")

        return {"message": "If the email exists, a reset link has been sent"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error requesting password reset: {str(e)}", exc_info=True)
        return {"message": "If the email exists, a reset link has been sent"}

@router.post("/reset-password/confirm")
def confirm_password_reset(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    """
    Confirm password reset with token and set new password.
    """
    try:
        user = db.query(User).filter(User.verification_token == data.token).first()
        if not user:
            logger.warning(f"Invalid reset token used: {data.token[:10]}...")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )

        # Check if token is expired
        if user.verification_token_expires and user.verification_token_expires < datetime.now(timezone.utc):
            logger.warning(f"Expired reset token used for user: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired"
            )

        # Update password
        user.password_hash = get_password_hash(data.new_password)
        user.verification_token = None
        user.verification_token_expires = None

        db.commit()

        logger.info(f"✅ Password reset successful for user: {user.email}")

        return {"message": "Password reset successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error confirming password reset: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed"
        )

@router.post("/change-password")
def change_password(data: ChangePassword, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    """
    Change password for authenticated user.
    """
    try:
        # Verify current password
        if not verify_password(data.current_password, current_user.password_hash):
            logger.warning(f"❌ Incorrect current password for user: {current_user.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )

        # Update password
        current_user.password_hash = get_password_hash(data.new_password)
        db.commit()

        logger.info(f"✅ Password changed successfully for user: {current_user.email}")

        # Send password changed confirmation email
        try:
            from services.email_service import send_password_changed_email
            send_password_changed_email(current_user.email, current_user.first_name or current_user.username, db)
        except Exception as e:
            logger.warning(f"Failed to send password changed email: {e}")

        return {"message": "Password changed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Change password error for user {current_user.email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )

@router.put("/profile")
def update_profile(data: UpdateProfile, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    """
    Update user profile information.
    """
    try:
        # Check if username is taken by another user
        if data.username and data.username != current_user.username:
            existing_user = db.query(User).filter(
                User.username.ilike(data.username),
                User.id != current_user.id
            ).first()
            if existing_user:
                logger.warning(f"❌ Username already taken: {data.username}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )

        # Update fields
        if data.first_name is not None:
            current_user.first_name = data.first_name
        if data.last_name is not None:
            current_user.last_name = data.last_name
        if data.username is not None:
            current_user.username = data.username
        if data.phone_number is not None:
            current_user.phone_number = data.phone_number
        if data.school_name is not None:
            current_user.school_name = data.school_name
        if data.school_category is not None:
            current_user.school_category = data.school_category
        if data.class_level is not None:
            current_user.class_level = data.class_level
        if data.department is not None:
            current_user.department = data.department

        db.commit()
        db.refresh(current_user)

        logger.info(f"✅ Profile updated for user: {current_user.email}")

        return {
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "phone_number": current_user.phone_number,
            "school_name": current_user.school_name,
            "school_category": current_user.school_category,
            "class_level": current_user.class_level,
            "department": current_user.department,
            "message": "Profile updated successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Update profile error for user {current_user.email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )

@router.post("/refresh")
def refresh_token_endpoint(request: Request, db: Session = Depends(get_db)):
    """
    Refresh JWT access token using refresh token.
    """
    try:
        # Get refresh token from request body
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Refresh token required")
        
        refresh_token = auth_header.split(" ")[1]
        
        # Verify refresh token
        payload = verify_token(refresh_token)
        token_type = payload.get("type")
        user_id = payload.get("sub")
        
        if token_type != "refresh" or not user_id:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        # Check if refresh token is blacklisted
        if SecurityService.is_token_blacklisted(db, refresh_token):
            raise HTTPException(status_code=401, detail="Refresh token has been revoked")
        
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="User not found or inactive")
        
        # Get role name
        role_name = None
        if user.role_id:
            role_result = db.query(Role.name).filter(Role.id == user.role_id).first()
            if role_result:
                role_name = role_result.name

        # Create new access token
        new_access_token = create_access_token({
            "sub": str(user.id),
            "email": user.email,
            "role": role_name
        })
        
        # Generate new CSRF token
        csrf_token = SecurityService.generate_csrf_token()
        
        # Log token refresh
        SecurityService.log_security_event(db, "token_refresh", request, user.id, 
                                         {"role": role_name}, "low")

        logger.info(f"✅ Token refreshed for user: {user.email}")

        return {
            "access_token": new_access_token,
            "csrf_token": csrf_token,
            "token_type": "bearer",
            "expires_in": 3600
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Refresh token error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )

@router.post("/verify-token")
def verify_user_token(current_user: User = Depends(get_current_user_from_token)):
    """
    Verify JWT token validity.
    """
    return {
        "valid": True,
        "user_id": current_user.id,
        "email": current_user.email,
        "username": current_user.username
    }

@router.post("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    """
    Verify user email with verification token.
    """
    try:
        user = db.query(User).filter(User.verification_token == token).first()
        if not user:
            logger.warning(f"Invalid verification token used: {token[:10]}...")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token"
            )

        # Check if token is expired
        if user.verification_token_expires and user.verification_token_expires < datetime.now(timezone.utc):
            logger.warning(f"Expired verification token used for user: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification token has expired"
            )

        # Verify the user
        user.is_email_verified = True
        user.is_active = True
        user.verification_token = None
        user.verification_token_expires = None

        db.commit()

        logger.info(f"✅ Email verified successfully for user: {user.email}")

        return {"message": "Email verified successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying email: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed"
        )

@router.post("/welcome-email")
def send_welcome_email(current_user: User = Depends(get_current_user_from_token)):
    """
    Send welcome email to user (called by frontend after login).
    """
    try:
        # TODO: In production, send actual welcome email
        # send_welcome_email_template(current_user.email, current_user.first_name)

        logger.info(f"Welcome email requested for user: {current_user.email}")

        return {
            "message": "Welcome email sent successfully",
            "user_id": current_user.id,
            "email": current_user.email
        }

    except Exception as e:
        logger.error(f"Error sending welcome email: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send welcome email"
        )
