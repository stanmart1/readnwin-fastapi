from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
from models.role import Role
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class UserListResponse(BaseModel):
    id: int
    email: str
    username: str
    first_name: Optional[str]
    last_name: Optional[str]
    is_active: bool
    role: Optional[dict]
    created_at: str
    last_login: Optional[str]

    class Config:
        from_attributes = True

class UserDetailResponse(BaseModel):
    id: int
    email: str
    username: str
    first_name: Optional[str]
    last_name: Optional[str]
    is_active: bool
    role: Optional[dict]
    permissions: List[str] = []
    created_at: str
    last_login: Optional[str]

    class Config:
        from_attributes = True

class UpdateUserStatus(BaseModel):
    is_active: bool

class UpdateUserRole(BaseModel):
    role_id: Optional[int]

class UpdateUser(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None
    role_id: Optional[int] = None

def require_admin_or_manager(current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    """Require admin or manager role"""
    try:
        if not current_user or not current_user.role:
            raise HTTPException(status_code=403, detail="Access denied")

        # Check if user has admin role
        if current_user.role.name not in ["admin", "super_admin", "moderator", "content_manager"]:
            # Check for specific permissions
            user_permissions = [perm.permission.name for perm in current_user.role.permissions] if current_user.role.permissions else []
            if "admin" not in user_permissions and "manage_users" not in user_permissions:
                raise HTTPException(status_code=403, detail="Insufficient permissions")

        return current_user
    except HTTPException:
        raise
    except Exception as e:
        print(f"Permission check error: {e}")
        raise HTTPException(status_code=403, detail="Access denied")

@router.get("/", response_model=List[UserListResponse])
def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    role_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(require_admin_or_manager),
    db: Session = Depends(get_db)
):
    """Get list of users with filtering and pagination"""
    try:
        query = db.query(User)

        # Apply filters
        if search:
            query = query.filter(
                (User.email.contains(search)) |
                (User.username.contains(search)) |
                (User.first_name.contains(search)) |
                (User.last_name.contains(search))
            )

        if role_id is not None:
            query = query.filter(User.role_id == role_id)

        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        # Get users with pagination
        users = query.offset(skip).limit(limit).all()

        # Format response
        result = []
        for user in users:
            role_data = None
            if user.role:
                role_data = {
                    "id": user.role.id,
                    "name": user.role.name,
                    "display_name": user.role.display_name
                }

            result.append(UserListResponse(
                id=user.id,
                email=user.email,
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name,
                is_active=user.is_active,
                role=role_data,
                created_at=str(user.created_at),
                last_login=str(user.last_login) if user.last_login else None
            ))

        return result
    except Exception as e:
        print(f"Get users error: {e}")
        return []

@router.get("/{user_id}", response_model=UserDetailResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(require_admin_or_manager),
    db: Session = Depends(get_db)
):
    """Get detailed user information"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get role and permissions
        role_data = None
        permissions = []
        if user.role:
            role_data = {
                "id": user.role.id,
                "name": user.role.name,
                "display_name": user.role.display_name,
                "description": user.role.description
            }
            permissions = [perm.permission.name for perm in user.role.permissions]

        return UserDetailResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            is_active=user.is_active,
            role=role_data,
            permissions=permissions,
            created_at=str(user.created_at),
            last_login=str(user.last_login) if user.last_login else None
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get user error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user")

@router.put("/{user_id}/status")
def update_user_status(
    user_id: int,
    status_data: UpdateUserStatus,
    current_user: User = Depends(require_admin_or_manager),
    db: Session = Depends(get_db)
):
    """Activate or deactivate a user"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Prevent deactivating yourself
        if user_id == current_user.id and not status_data.is_active:
            raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

        user.is_active = status_data.is_active
        db.commit()

        action = "activated" if status_data.is_active else "deactivated"
        return {"message": f"User {action} successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update user status error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user status")

@router.put("/{user_id}/role")
def update_user_role(
    user_id: int,
    role_data: UpdateUserRole,
    current_user: User = Depends(require_admin_or_manager),
    db: Session = Depends(get_db)
):
    """Update user's role"""
    try:
        print(f"🔄 Role update request for user {user_id}: role_id={role_data.role_id}")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        print(f"👤 Current user role_id: {user.role_id}")

        # Prevent changing your own role unless you're super_admin
        if user_id == current_user.id and current_user.role.name not in ["super_admin"]:
            raise HTTPException(status_code=400, detail="Cannot change your own role")

        # Validate role exists if provided
        role = None
        if role_data.role_id is not None:
            role = db.query(Role).filter(Role.id == role_data.role_id).first()
            if not role:
                raise HTTPException(status_code=404, detail="Role not found")
            print(f"🏇 Target role: {role.display_name} (id: {role.id})")

        # Update role
        old_role_id = user.role_id
        user.role_id = role_data.role_id
        
        # Force commit and verify
        db.commit()
        db.flush()
        
        # Verify the change persisted
        verification_user = db.query(User).filter(User.id == user_id).first()
        print(f"✅ Role update verified: {old_role_id} → {verification_user.role_id}")
        
        if verification_user.role_id != role_data.role_id:
            raise HTTPException(status_code=500, detail="Role update failed to persist")

        if role_data.role_id and role:
            return {"message": f"User role updated to {role.display_name}"}
        else:
            return {"message": "User role removed"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update user role error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update user role")

@router.put("/{user_id}")
def update_user(
    user_id: int,
    user_data: UpdateUser,
    current_user: User = Depends(require_admin_or_manager),
    db: Session = Depends(get_db)
):
    """Update user information"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check for email uniqueness if email is being updated
        if user_data.email and user_data.email != user.email:
            existing_user = db.query(User).filter(User.email == user_data.email).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already exists")

        # Check for username uniqueness if username is being updated
        if user_data.username and user_data.username != user.username:
            existing_user = db.query(User).filter(User.username == user_data.username).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="Username already exists")

        # Validate role exists if provided
        if user_data.role_id is not None:
            role = db.query(Role).filter(Role.id == user_data.role_id).first()
            if not role:
                raise HTTPException(status_code=404, detail="Role not found")

        # Log the update attempt
        print(f"🔄 Updating user {user_id}: role_id={user_data.role_id}")
        
        # Update fields
        if user_data.first_name is not None:
            user.first_name = user_data.first_name
        if user_data.last_name is not None:
            user.last_name = user_data.last_name
        if user_data.username is not None:
            user.username = user_data.username
        if user_data.email is not None:
            user.email = user_data.email
        if user_data.is_active is not None:
            user.is_active = user_data.is_active
        if user_data.role_id is not None:
            old_role_id = user.role_id
            user.role_id = user_data.role_id
            print(f"📝 Role update: {old_role_id} → {user_data.role_id}")

        # Commit changes
        db.commit()
        
        # Verify the update
        updated_user = db.query(User).filter(User.id == user_id).first()
        print(f"✅ User {user_id} role after update: {updated_user.role_id}")
        
        db.refresh(user)
        db.expire_all()

        return {"message": "User updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update user error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user")

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin_or_manager),
    db: Session = Depends(get_db)
):
    """Delete a user (soft delete by deactivating)"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Prevent deleting yourself
        if user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")

        # Soft delete by deactivating
        user.is_active = False
        db.commit()

        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete user error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete user")

@router.get("/stats/overview")
def get_user_stats(
    current_user: User = Depends(require_admin_or_manager),
    db: Session = Depends(get_db)
):
    """Get user statistics overview"""
    try:
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        inactive_users = total_users - active_users

        # Users by role
        roles_stats = []
        roles = db.query(Role).all()
        for role in roles:
            count = db.query(User).filter(User.role_id == role.id, User.is_active == True).count()
            roles_stats.append({
                "role": role.display_name,
                "count": count
            })

        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": inactive_users,
            "roles_distribution": roles_stats
        }
    except Exception as e:
        print(f"Get user stats error: {e}")
        return {
            "total_users": 0,
            "active_users": 0,
            "inactive_users": 0,
            "roles_distribution": []
        }
