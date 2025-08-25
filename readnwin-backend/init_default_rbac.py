#!/usr/bin/env python3
"""
Initialize default roles and permissions for the RBAC system
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from core.database import get_db, engine
from models.role import Role, Permission, RolePermission

def init_default_permissions(db: Session):
    """Create default permissions"""
    default_permissions = [
        # User Management
        {"name": "manage_users", "display_name": "Manage Users", "description": "Create, update, delete users", "resource": "users", "action": "*", "scope": "*"},
        {"name": "view_users", "display_name": "View Users", "description": "View user information", "resource": "users", "action": "read", "scope": "*"},
        {"name": "edit_users", "display_name": "Edit Users", "description": "Edit user information", "resource": "users", "action": "update", "scope": "*"},
        
        # Role Management
        {"name": "manage_roles", "display_name": "Manage Roles", "description": "Create, update, delete roles", "resource": "roles", "action": "*", "scope": "*"},
        {"name": "view_roles", "display_name": "View Roles", "description": "View role information", "resource": "roles", "action": "read", "scope": "*"},
        {"name": "assign_roles", "display_name": "Assign Roles", "description": "Assign roles to users", "resource": "roles", "action": "assign", "scope": "*"},
        
        # Permission Management
        {"name": "manage_permissions", "display_name": "Manage Permissions", "description": "Create, update, delete permissions", "resource": "permissions", "action": "*", "scope": "*"},
        {"name": "view_permissions", "display_name": "View Permissions", "description": "View permission information", "resource": "permissions", "action": "read", "scope": "*"},
        
        # Book Management
        {"name": "manage_books", "display_name": "Manage Books", "description": "Create, update, delete books", "resource": "books", "action": "*", "scope": "*"},
        {"name": "view_books", "display_name": "View Books", "description": "View book information", "resource": "books", "action": "read", "scope": "*"},
        {"name": "edit_books", "display_name": "Edit Books", "description": "Edit book information", "resource": "books", "action": "update", "scope": "*"},
        
        # Order Management
        {"name": "manage_orders", "display_name": "Manage Orders", "description": "Create, update, delete orders", "resource": "orders", "action": "*", "scope": "*"},
        {"name": "view_orders", "display_name": "View Orders", "description": "View order information", "resource": "orders", "action": "read", "scope": "*"},
        {"name": "process_orders", "display_name": "Process Orders", "description": "Process and fulfill orders", "resource": "orders", "action": "process", "scope": "*"},
        
        # Admin Functions
        {"name": "admin_dashboard", "display_name": "Admin Dashboard", "description": "Access admin dashboard", "resource": "admin", "action": "read", "scope": "*"},
        {"name": "system_settings", "display_name": "System Settings", "description": "Manage system settings", "resource": "system", "action": "*", "scope": "*"},
        {"name": "view_analytics", "display_name": "View Analytics", "description": "View system analytics", "resource": "admin", "action": "analytics", "scope": "*"},
        
        # Content Management
        {"name": "manage_content", "display_name": "Manage Content", "description": "Manage website content", "resource": "content", "action": "*", "scope": "*"},
        {"name": "edit_content", "display_name": "Edit Content", "description": "Edit website content", "resource": "content", "action": "update", "scope": "*"},
        
        # Reading Management
        {"name": "read_books", "display_name": "Read Books", "description": "Read books in the library", "resource": "books", "action": "read", "scope": "own"},
        {"name": "manage_library", "display_name": "Manage Library", "description": "Manage personal library", "resource": "library", "action": "*", "scope": "own"},
    ]
    
    created_permissions = []
    for perm_data in default_permissions:
        existing = db.query(Permission).filter(Permission.name == perm_data["name"]).first()
        if not existing:
            permission = Permission(**perm_data)
            db.add(permission)
            db.flush()
            created_permissions.append(permission)
            print(f"✅ Created permission: {perm_data['name']}")
        else:
            created_permissions.append(existing)
            print(f"⚠️ Permission already exists: {perm_data['name']}")
    
    return created_permissions

def init_default_roles(db: Session, permissions: list):
    """Create default roles and assign permissions"""
    # Create permission lookup
    perm_lookup = {p.name: p for p in permissions}
    
    default_roles = [
        {
            "name": "super_admin",
            "display_name": "Super Administrator",
            "description": "Full system access with all permissions",
            "priority": 100,
            "is_system_role": True,
            "permissions": list(perm_lookup.keys())  # All permissions
        },
        {
            "name": "admin",
            "display_name": "Administrator",
            "description": "Administrative access with most permissions",
            "priority": 90,
            "is_system_role": True,
            "permissions": [
                "manage_users", "view_users", "edit_users",
                "view_roles", "assign_roles",
                "manage_books", "view_books", "edit_books",
                "manage_orders", "view_orders", "process_orders",
                "admin_dashboard", "view_analytics",
                "manage_content", "edit_content"
            ]
        },
        {
            "name": "moderator",
            "display_name": "Moderator",
            "description": "Content moderation and user management",
            "priority": 70,
            "is_system_role": False,
            "permissions": [
                "view_users", "edit_users",
                "view_books", "edit_books",
                "view_orders",
                "admin_dashboard",
                "edit_content"
            ]
        },
        {
            "name": "editor",
            "display_name": "Content Editor",
            "description": "Content creation and editing",
            "priority": 60,
            "is_system_role": False,
            "permissions": [
                "view_books", "edit_books",
                "manage_content", "edit_content",
                "admin_dashboard"
            ]
        },
        {
            "name": "author",
            "display_name": "Author",
            "description": "Book creation and management",
            "priority": 50,
            "is_system_role": False,
            "permissions": [
                "view_books", "edit_books",
                "edit_content"
            ]
        },
        {
            "name": "reader",
            "display_name": "Reader",
            "description": "Basic reading access",
            "priority": 10,
            "is_system_role": True,
            "permissions": [
                "read_books", "manage_library"
            ]
        }
    ]
    
    for role_data in default_roles:
        existing = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing:
            # Create role
            role = Role(
                name=role_data["name"],
                display_name=role_data["display_name"],
                description=role_data["description"],
                priority=role_data["priority"],
                is_system_role=role_data["is_system_role"]
            )
            db.add(role)
            db.flush()
            
            # Assign permissions
            for perm_name in role_data["permissions"]:
                if perm_name in perm_lookup:
                    role_perm = RolePermission(
                        role_id=role.id,
                        permission_id=perm_lookup[perm_name].id
                    )
                    db.add(role_perm)
            
            print(f"✅ Created role: {role_data['name']} with {len(role_data['permissions'])} permissions")
        else:
            print(f"⚠️ Role already exists: {role_data['name']}")

def main():
    """Initialize default RBAC data"""
    try:
        # Create database session
        db = next(get_db())
        
        print("🔄 Initializing default RBAC data...")
        
        # Create permissions first
        print("\n📋 Creating default permissions...")
        permissions = init_default_permissions(db)
        
        # Create roles and assign permissions
        print("\n👥 Creating default roles...")
        init_default_roles(db, permissions)
        
        # Commit all changes
        db.commit()
        print("\n✅ Default RBAC initialization completed successfully!")
        
        # Print summary
        total_permissions = db.query(Permission).count()
        total_roles = db.query(Role).count()
        total_assignments = db.query(RolePermission).count()
        
        print(f"\n📊 Summary:")
        print(f"   - Total Permissions: {total_permissions}")
        print(f"   - Total Roles: {total_roles}")
        print(f"   - Total Role-Permission Assignments: {total_assignments}")
        
    except Exception as e:
        print(f"❌ Error initializing RBAC data: {e}")
        if 'db' in locals():
            db.rollback()
        sys.exit(1)
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    main()