from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access, verify_token, get_password_hash
from models.user import User
from models.role import Role
from typing import Optional
from pydantic import BaseModel
import re

router = APIRouter(prefix="/admin", tags=["admin", "users"])

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    phone_number: Optional[str] = None
    school_name: Optional[str] = None
    school_category: Optional[str] = None
    class_level: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None
    role_id: Optional[int] = None

class PasswordResetRequest(BaseModel):
    new_password: str

def get_admin_without_active_check(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Get admin user without checking active status"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    check_admin_access(user)
    return user

@router.get("/users")
def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all users with filtering"""
    check_admin_access(current_user)
    
    try:
        query = db.query(User)
        
        # Hide super_admin users from non-super_admin users
        if current_user.role and current_user.role.name != 'super_admin':
            query = query.join(Role).filter(Role.name != 'super_admin')
        
        # Search filter
        if search:
            query = query.filter(
                or_(
                    User.email.ilike(f"%{search}%"),
                    User.username.ilike(f"%{search}%"),
                    User.first_name.ilike(f"%{search}%"),
                    User.last_name.ilike(f"%{search}%")
                )
            )
        
        # Role filter
        if role and role != 'all':
            if not query._join_entities:
                query = query.join(Role)
            query = query.filter(Role.name == role)
        
        # Status filter
        if status and status != 'all':
            is_active = status == 'active'
            query = query.filter(User.is_active == is_active)
        
        total = query.count()
        users = query.offset(skip).limit(limit).all()
        
        return {
            "users": [
                {
                    "id": u.id,
                    "email": u.email,
                    "username": u.username,
                    "first_name": u.first_name,
                    "last_name": u.last_name,
                    "phone_number": u.phone_number,
                    "school_name": u.school_name,
                    "school_category": u.school_category,
                    "class_level": u.class_level,
                    "department": u.department,
                    "is_active": u.is_active,
                    "is_email_verified": u.is_email_verified,
                    "created_at": u.created_at,
                    "updated_at": u.created_at,
                    "last_login": u.last_login,
                    "role": {
                        "id": u.role.id,
                        "name": u.role.name,
                        "display_name": u.role.display_name
                    } if u.role else None
                }
                for u in users
            ],
            "total": total,
            "skip": skip,
            "limit": limit,
            "has_more": (skip + limit) < total
        }
    except Exception as e:
        print(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")

@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    is_active: bool,
    current_user: User = Depends(get_admin_without_active_check),
    db: Session = Depends(get_db)
):
    """Update user status"""
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent non-super_admin from modifying super_admin users
        if user.role and user.role.name == 'super_admin':
            if not current_user.role or current_user.role.name != 'super_admin':
                raise HTTPException(status_code=403, detail="Only super admins can modify super admin users")
        
        user.is_active = is_active
        db.commit()
        
        return {"success": True, "message": "User status updated"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating user status: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user status")

@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update user details"""
    check_admin_access(current_user)
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent non-super_admin from modifying super_admin users
        if user.role and user.role.name == 'super_admin':
            if not current_user.role or current_user.role.name != 'super_admin':
                raise HTTPException(status_code=403, detail="Only super admins can modify super admin users")
        
        # Update fields if provided
        if user_data.first_name is not None:
            user.first_name = user_data.first_name
        if user_data.last_name is not None:
            user.last_name = user_data.last_name
        if user_data.email is not None:
            # Check if email already exists
            existing = db.query(User).filter(User.email == user_data.email, User.id != user_id).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already in use")
            user.email = user_data.email
        if user_data.username is not None:
            # Check if username already exists
            existing = db.query(User).filter(User.username == user_data.username, User.id != user_id).first()
            if existing:
                raise HTTPException(status_code=400, detail="Username already in use")
            user.username = user_data.username
        if user_data.phone_number is not None:
            user.phone_number = user_data.phone_number
        if user_data.school_name is not None:
            user.school_name = user_data.school_name
        if user_data.school_category is not None:
            user.school_category = user_data.school_category
        if user_data.class_level is not None:
            user.class_level = user_data.class_level
        if user_data.department is not None:
            user.department = user_data.department
        if user_data.is_active is not None:
            user.is_active = user_data.is_active
        if user_data.role_id is not None:
            user.role_id = user_data.role_id
        
        db.commit()
        db.refresh(user)
        
        return {
            "success": True,
            "message": "User updated successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone_number": user.phone_number,
                "school_name": user.school_name,
                "school_category": user.school_category,
                "class_level": user.class_level,
                "department": user.department,
                "is_active": user.is_active,
                "role_id": user.role_id
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user")

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete a user"""
    check_admin_access(current_user)
    
    try:
        if user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent non-super_admin from deleting super_admin users
        if user.role and user.role.name == 'super_admin':
            if not current_user.role or current_user.role.name != 'super_admin':
                raise HTTPException(status_code=403, detail="Only super admins can delete super admin users")
        
        db.delete(user)
        db.commit()
        
        return {"success": True, "message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete user")

@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    password_data: PasswordResetRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Admin endpoint to reset a user's password"""
    check_admin_access(current_user)
    
    try:
        # Prevent admin from resetting their own password via this endpoint
        if user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Use the change-password endpoint to change your own password")
        
        # Find the user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent non-super_admin from resetting super_admin passwords
        if user.role and user.role.name == 'super_admin':
            if not current_user.role or current_user.role.name != 'super_admin':
                raise HTTPException(status_code=403, detail="Only super admins can reset super admin passwords")
        
        # Validate password strength (same as registration)
        pwd = password_data.new_password
        
        if not pwd or len(pwd) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        if not re.search(r'[A-Z]', pwd):
            raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
        if not re.search(r'[a-z]', pwd):
            raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
        if not re.search(r'\d', pwd):
            raise HTTPException(status_code=400, detail="Password must contain at least one number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', pwd):
            raise HTTPException(status_code=400, detail="Password must contain at least one special character")
        
        # Update password
        user.password_hash = get_password_hash(password_data.new_password)
        db.commit()
        db.refresh(user)
        
        return {
            "success": True,
            "message": "Password reset successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error resetting password: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset password")

@router.get("/users/stats")
def get_user_stats(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get user statistics"""
    check_admin_access(current_user)
    
    try:
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        verified_users = db.query(User).filter(User.is_email_verified == True).count()
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "verified_users": verified_users,
            "inactive_users": total_users - active_users
        }
    except Exception as e:
        print(f"Error fetching user stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user stats")
