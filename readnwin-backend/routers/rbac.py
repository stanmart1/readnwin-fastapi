from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
from models.role import Role, Permission, RolePermission
from services.audit_service import AuditService
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class RoleResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str]
    priority: Optional[int]
    is_system_role: bool = False
    created_at: str
    permissions: List[dict] = []

    class Config:
        from_attributes = True

class PermissionResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str]
    resource: Optional[str]
    action: str = "*"
    scope: str = "*"

    class Config:
        from_attributes = True

class CreateRole(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    priority: Optional[int] = 0
    permission_ids: List[int] = []

class UpdateRole(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None
    permission_ids: Optional[List[int]] = None

class CreatePermission(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    resource: Optional[str] = None

class AssignRole(BaseModel):
    user_id: int
    role_id: int

def require_permission(permission_name: str):
    def permission_checker(current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
        try:
            if not current_user or not current_user.role:
                raise HTTPException(status_code=403, detail="Access denied")

            # Super admin and admin bypass permission checks
            if current_user.role.name in ["admin", "super_admin"]:
                return current_user

            # Check if user has the required permission (already loaded via joinedload)
            user_permissions = [perm.permission.name for perm in current_user.role.permissions] if current_user.role.permissions else []
            
            if permission_name not in user_permissions:
                raise HTTPException(status_code=403, detail="Access denied")

            return current_user
        except HTTPException:
            raise
        except Exception as e:
            print(f"Permission check error: {e}")
            raise HTTPException(status_code=403, detail="Access denied")

    return permission_checker

# Role Management Endpoints
@router.get("/roles", response_model=List[RoleResponse])
def get_roles(user: User = Depends(require_permission("manage_roles")), db: Session = Depends(get_db)):
    try:
        from sqlalchemy.orm import joinedload
        
        # Eager load permissions to avoid N+1 queries
        query = db.query(Role).options(
            joinedload(Role.permissions).joinedload(RolePermission.permission)
        )
        
        # Hide super_admin role from non-super_admin users
        if user.role and user.role.name != 'super_admin':
            query = query.filter(Role.name != 'super_admin')
        
        roles = query.all()
        
        result = []
        for role in roles:
            permissions = [
                {
                    "id": rp.permission.id,
                    "name": rp.permission.name,
                    "display_name": rp.permission.display_name,
                    "description": rp.permission.description,
                    "resource": rp.permission.resource,
                    "action": rp.permission.action,
                    "scope": rp.permission.scope
                }
                for rp in role.permissions
            ]
            result.append(RoleResponse(
                id=role.id,
                name=role.name,
                display_name=role.display_name,
                description=role.description,
                priority=role.priority,
                is_system_role=role.is_system_role,
                created_at=role.created_at.isoformat() if role.created_at else "",
                permissions=permissions
            ))
        return result
    except Exception as e:
        print(f"Get roles error: {e}")
        return []

@router.post("/roles", response_model=RoleResponse)
def create_role(role_data: CreateRole, user: User = Depends(require_permission("manage_roles")), db: Session = Depends(get_db)):
    try:
        # Check if role name already exists
        existing_role = db.query(Role).filter(Role.name == role_data.name).first()
        if existing_role:
            raise HTTPException(status_code=400, detail="Role name already exists")

        # Create role
        role = Role(
            name=role_data.name,
            display_name=role_data.display_name,
            description=role_data.description,
            priority=role_data.priority
        )
        db.add(role)
        db.commit()
        db.refresh(role)

        # Assign permissions
        for perm_id in role_data.permission_ids:
            permission = db.query(Permission).filter(Permission.id == perm_id).first()
            if permission:
                role_perm = RolePermission(role_id=role.id, permission_id=perm_id)
                db.add(role_perm)

        db.commit()
        db.refresh(role)

        # Get permissions for response
        permissions = [
            {
                "id": rp.permission.id,
                "name": rp.permission.name,
                "display_name": rp.permission.display_name,
                "description": rp.permission.description,
                "resource": rp.permission.resource
            }
            for rp in role.permissions
        ]

        return RoleResponse(
            id=role.id,
            name=role.name,
            display_name=role.display_name,
            description=role.description,
            priority=role.priority,
            permissions=permissions
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Create role error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create role")

@router.put("/roles/{role_id}", response_model=RoleResponse)
def update_role(role_id: int, role_data: UpdateRole, user: User = Depends(require_permission("manage_roles")), db: Session = Depends(get_db)):
    try:
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")

        # Update role fields
        if role_data.display_name is not None:
            role.display_name = role_data.display_name
        if role_data.description is not None:
            role.description = role_data.description
        if role_data.priority is not None:
            role.priority = role_data.priority

        # Update permissions if provided
        if role_data.permission_ids is not None:
            # Remove existing permissions
            db.query(RolePermission).filter(RolePermission.role_id == role_id).delete()

            # Add new permissions
            for perm_id in role_data.permission_ids:
                permission = db.query(Permission).filter(Permission.id == perm_id).first()
                if permission:
                    role_perm = RolePermission(role_id=role_id, permission_id=perm_id)
                    db.add(role_perm)

        db.commit()
        db.refresh(role)

        # Get permissions for response
        permissions = [
            {
                "id": rp.permission.id,
                "name": rp.permission.name,
                "display_name": rp.permission.display_name,
                "description": rp.permission.description,
                "resource": rp.permission.resource
            }
            for rp in role.permissions
        ]

        return RoleResponse(
            id=role.id,
            name=role.name,
            display_name=role.display_name,
            description=role.description,
            priority=role.priority,
            permissions=permissions
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update role error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update role")

@router.delete("/roles/{role_id}")
def delete_role(role_id: int, user: User = Depends(require_permission("manage_roles")), db: Session = Depends(get_db)):
    try:
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")

        # Check if role is a system role
        if role.is_system_role:
            raise HTTPException(status_code=400, detail="Cannot delete system role")
        
        # Check if role is assigned to any users
        users_with_role = db.query(User).filter(User.role_id == role_id).count()
        if users_with_role > 0:
            raise HTTPException(status_code=400, detail="Cannot delete role that is assigned to users")

        # Delete role permissions first
        db.query(RolePermission).filter(RolePermission.role_id == role_id).delete()

        # Delete role
        db.delete(role)
        db.commit()

        return {"message": "Role deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete role error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete role")

# Permission Management Endpoints
@router.get("/permissions", response_model=List[PermissionResponse])
@router.get("/permissions")
def get_permissions(
    skip: int = 0,
    limit: int = 100,
    user: User = Depends(require_permission("manage_permissions")), 
    db: Session = Depends(get_db)
):
    try:
        # Get total count
        total = db.query(Permission).count()
        
        # Get paginated permissions
        permissions = db.query(Permission).offset(skip).limit(limit).all()
        
        return {
            "permissions": [
                {
                    "id": perm.id,
                    "name": perm.name,
                    "display_name": perm.display_name,
                    "description": perm.description,
                    "resource": perm.resource,
                    "action": perm.action,
                    "scope": perm.scope
                }
                for perm in permissions
            ],
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        print(f"Get permissions error: {e}")
        return {"permissions": [], "total": 0, "skip": 0, "limit": limit}

@router.post("/permissions", response_model=PermissionResponse)
def create_permission(perm_data: CreatePermission, user: User = Depends(require_permission("manage_permissions")), db: Session = Depends(get_db)):
    try:
        # Check if permission name already exists
        existing_perm = db.query(Permission).filter(Permission.name == perm_data.name).first()
        if existing_perm:
            raise HTTPException(status_code=400, detail="Permission name already exists")

        permission = Permission(
            name=perm_data.name,
            display_name=perm_data.display_name,
            description=perm_data.description,
            resource=perm_data.resource
        )
        db.add(permission)
        db.commit()
        db.refresh(permission)

        return PermissionResponse(
            id=permission.id,
            name=permission.name,
            display_name=permission.display_name,
            description=permission.description,
            resource=permission.resource
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Create permission error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create permission")

@router.delete("/permissions/{permission_id}")
def delete_permission(permission_id: int, user: User = Depends(require_permission("manage_permissions")), db: Session = Depends(get_db)):
    try:
        permission = db.query(Permission).filter(Permission.id == permission_id).first()
        if not permission:
            raise HTTPException(status_code=404, detail="Permission not found")

        # Delete role permissions first
        db.query(RolePermission).filter(RolePermission.permission_id == permission_id).delete()

        # Delete permission
        db.delete(permission)
        db.commit()

        return {"message": "Permission deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete permission error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete permission")

# User Role Assignment Endpoints
@router.post("/assign-role")
def assign_role_to_user(data: AssignRole, user: User = Depends(require_permission("manage_users")), db: Session = Depends(get_db)):
    try:
        # Check if user exists
        target_user = db.query(User).filter(User.id == data.user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if role exists
        role = db.query(Role).filter(Role.id == data.role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")

        # Assign role
        target_user.role_id = data.role_id
        db.commit()

        return {"message": f"Role '{role.display_name}' assigned to user successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Assign role error: {e}")
        raise HTTPException(status_code=500, detail="Failed to assign role")

@router.delete("/users/{user_id}/role")
def remove_user_role(user_id: int, user: User = Depends(require_permission("manage_users")), db: Session = Depends(get_db)):
    try:
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")

        target_user.role_id = None
        db.commit()

        return {"message": "Role removed from user successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Remove user role error: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove role")

@router.get("/users/{user_id}/permissions")
def get_user_permissions(user_id: int, user: User = Depends(require_permission("view_users")), db: Session = Depends(get_db)):
    try:
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")

        permissions = []
        if target_user.role:
            permissions = [
                {
                    "id": rp.permission.id,
                    "name": rp.permission.name,
                    "display_name": rp.permission.display_name,
                    "description": rp.permission.description,
                    "resource": rp.permission.resource
                }
                for rp in target_user.role.permissions
            ]

        return {
            "user_id": user_id,
            "role": {
                "id": target_user.role.id,
                "name": target_user.role.name,
                "display_name": target_user.role.display_name
            } if target_user.role else None,
            "permissions": permissions
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get user permissions error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user permissions")

# Check Permission Endpoint
@router.get("/roles/{role_id}/permissions")
def get_role_permissions(role_id: int, user: User = Depends(require_permission("manage_roles")), db: Session = Depends(get_db)):
    """Get permissions for a specific role"""
    try:
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        permissions = [
            {
                "id": rp.permission.id,
                "name": rp.permission.name,
                "display_name": rp.permission.display_name,
                "description": rp.permission.description,
                "resource": rp.permission.resource
            }
            for rp in role.permissions
        ]
        
        return {
            "role_id": role_id,
            "role_name": role.name,
            "permissions": permissions
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get role permissions error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get role permissions")

@router.put("/permissions/{permission_id}")
def update_permission(permission_id: int, perm_data: CreatePermission, user: User = Depends(require_permission("manage_permissions")), db: Session = Depends(get_db)):
    """Update an existing permission"""
    try:
        permission = db.query(Permission).filter(Permission.id == permission_id).first()
        if not permission:
            raise HTTPException(status_code=404, detail="Permission not found")
        
        # Check if name already exists (excluding current permission)
        existing_perm = db.query(Permission).filter(
            Permission.name == perm_data.name,
            Permission.id != permission_id
        ).first()
        if existing_perm:
            raise HTTPException(status_code=400, detail="Permission name already exists")
        
        permission.name = perm_data.name
        permission.display_name = perm_data.display_name
        permission.description = perm_data.description
        permission.resource = perm_data.resource
        
        db.commit()
        db.refresh(permission)
        
        return PermissionResponse(
            id=permission.id,
            name=permission.name,
            display_name=permission.display_name,
            description=permission.description,
            resource=permission.resource
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update permission error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update permission")

@router.post("/roles/{role_id}/permissions")
def add_permission_to_role(role_id: int, permission_data: dict, user: User = Depends(require_permission("manage_roles")), db: Session = Depends(get_db)):
    """Add a permission to a role"""
    try:
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        permission_id = permission_data.get("permission_id")
        if not permission_id:
            raise HTTPException(status_code=400, detail="Permission ID is required")
        
        permission = db.query(Permission).filter(Permission.id == permission_id).first()
        if not permission:
            raise HTTPException(status_code=404, detail="Permission not found")
        
        # Check if permission is already assigned
        existing = db.query(RolePermission).filter(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Permission already assigned to role")
        
        # Add permission to role
        role_permission = RolePermission(role_id=role_id, permission_id=permission_id)
        db.add(role_permission)
        db.commit()
        
        return {"message": "Permission added to role successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Add permission to role error: {e}")
        raise HTTPException(status_code=500, detail="Failed to add permission to role")

@router.delete("/roles/{role_id}/permissions")
def remove_permission_from_role(role_id: int, permission_id: int, user: User = Depends(require_permission("manage_roles")), db: Session = Depends(get_db)):
    """Remove a permission from a role"""
    try:
        role_permission = db.query(RolePermission).filter(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id
        ).first()
        
        if not role_permission:
            raise HTTPException(status_code=404, detail="Permission not assigned to role")
        
        db.delete(role_permission)
        db.commit()
        
        return {"message": "Permission removed from role successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Remove permission from role error: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove permission from role")

@router.get("/check-permission/{permission_name}")
def check_user_permission(permission_name: str, current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    try:
        if not current_user or not current_user.role:
            return {"has_permission": False}

        user_permissions = [perm.permission.name for perm in current_user.role.permissions] if current_user.role.permissions else []
        has_permission = permission_name in user_permissions or "admin" in user_permissions or current_user.role.name in ["admin", "super_admin"]

        return {"has_permission": has_permission}
    except Exception as e:
        print(f"Check permission error: {e}")
        return {"has_permission": False}

# User Role Assignment
@router.post("/users/{user_id}/assign-role")
def assign_role_to_user(
    user_id: int, 
    role_id: int, 
    request: Request,
    current_user: User = Depends(require_permission("manage_roles")), 
    db: Session = Depends(get_db)
):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        
        # Prevent non-super_admin from assigning super_admin role
        if role.name == 'super_admin':
            if not current_user.role or current_user.role.name != 'super_admin':
                raise HTTPException(status_code=403, detail="Only super admins can assign the super admin role")
        
        # Prevent non-super_admin from modifying super_admin users
        if user.role and user.role.name == 'super_admin':
            if not current_user.role or current_user.role.name != 'super_admin':
                raise HTTPException(status_code=403, detail="Only super admins can modify super admin users")
        
        old_role_id = user.role_id
        user.role_id = role_id
        db.commit()
        
        # Audit log
        AuditService.log_action(
            db=db,
            user_id=current_user.id,
            action="assign_role",
            resource="user",
            resource_id=str(user_id),
            details={"old_role_id": old_role_id, "new_role_id": role_id, "role_name": role.name},
            request=request
        )
        
        return {"success": True, "message": f"Role {role.display_name} assigned to user"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Assign role error: {e}")
        raise HTTPException(status_code=500, detail="Failed to assign role")

# Get User Permissions
@router.get("/users/{user_id}/permissions")
def get_user_permissions(
    user_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.role:
            return {"permissions": [], "role": None}
        
        permissions = [
            {
                "id": rp.permission.id,
                "name": rp.permission.name,
                "display_name": rp.permission.display_name,
                "resource": rp.permission.resource,
                "action": rp.permission.action
            }
            for rp in user.role.permissions
        ]
        
        return {
            "permissions": permissions,
            "role": {
                "id": user.role.id,
                "name": user.role.name,
                "display_name": user.role.display_name
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get user permissions error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user permissions")

# Get Audit Logs
@router.get("/audit-logs")
def get_audit_logs(
    skip: int = 0,
    limit: int = 50,
    user_id: Optional[int] = None,
    resource: Optional[str] = None,
    action: Optional[str] = None,
    current_user: User = Depends(require_permission("view_audit_logs")),
    db: Session = Depends(get_db)
):
    try:
        from models.audit_log import AuditLog
        from sqlalchemy.orm import joinedload
        
        query = db.query(AuditLog).options(joinedload(AuditLog.user))
        
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if resource:
            query = query.filter(AuditLog.resource == resource)
        if action:
            query = query.filter(AuditLog.action == action)
        
        total = query.count()
        logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
        
        return {
            "logs": [
                {
                    "id": log.id,
                    "user_id": log.user_id,
                    "user_name": f"{log.user.first_name or ''} {log.user.last_name or ''}".strip() if log.user else "System",
                    "user_email": log.user.email if log.user else None,
                    "action": log.action,
                    "resource": log.resource,
                    "resource_id": log.resource_id,
                    "details": log.details,
                    "ip_address": log.ip_address,
                    "user_agent": log.user_agent,
                    "page_visited": log.details.get("page") if log.details and isinstance(log.details, dict) else None,
                    "status": log.status,
                    "created_at": log.created_at.isoformat() if log.created_at else None
                }
                for log in logs
            ],
            "total": total
        }
    except Exception as e:
        print(f"Get audit logs error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get audit logs")
