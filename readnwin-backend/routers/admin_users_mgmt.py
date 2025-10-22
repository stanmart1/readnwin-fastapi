from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.user import User
from models.role import Role
from typing import Optional

router = APIRouter(prefix="/admin", tags=["admin", "users"])

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
            query = query.join(Role).filter(Role.name == role)
        
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
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update user status"""
    check_admin_access(current_user)
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.is_active = is_active
        db.commit()
        
        return {"success": True, "message": "User status updated"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating user status: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user status")

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
        
        db.delete(user)
        db.commit()
        
        return {"success": True, "message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete user")

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
