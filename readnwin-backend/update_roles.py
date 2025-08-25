#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from core.database import get_db, engine
from models.role import Role, Permission, RolePermission
from models.user import User

def update_roles():
    """Update roles to match the new role structure"""
    
    # Create database session
    db = Session(bind=engine)
    
    try:
        print("🔄 Updating roles to new structure...")
        
        # Define new roles
        new_roles = [
            {
                "name": "super_admin",
                "display_name": "SuperAdministrator", 
                "description": "Full system access with all permissions",
                "priority": 1
            },
            {
                "name": "admin",
                "display_name": "Administrator",
                "description": "Administrative access to most system functions", 
                "priority": 2
            },
            {
                "name": "moderator",
                "display_name": "Moderator",
                "description": "Content moderation and user management",
                "priority": 3
            },
            {
                "name": "content_manager", 
                "display_name": "Content Manager",
                "description": "Manage books, reviews, and content",
                "priority": 4
            },
            {
                "name": "author",
                "display_name": "Author", 
                "description": "Create and manage own content",
                "priority": 5
            },
            {
                "name": "reader",
                "display_name": "Reader",
                "description": "Basic user access for reading and purchasing",
                "priority": 6
            }
        ]
        
        # Get existing roles
        existing_roles = db.query(Role).all()
        existing_role_names = [role.name for role in existing_roles]
        
        print(f"📋 Found {len(existing_roles)} existing roles: {existing_role_names}")
        
        # Update users with old roles to new roles
        role_mapping = {
            "user": "reader",
            "customer": "reader", 
            "staff": "content_manager",
            "editor": "content_manager",
            "manager": "admin"
        }
        
        for old_role, new_role in role_mapping.items():
            users_to_update = db.query(User).join(Role).filter(Role.name == old_role).all()
            if users_to_update:
                print(f"🔄 Updating {len(users_to_update)} users from '{old_role}' to '{new_role}'")
                new_role_obj = db.query(Role).filter(Role.name == new_role).first()
                if not new_role_obj:
                    # Create the new role if it doesn't exist
                    role_data = next((r for r in new_roles if r["name"] == new_role), None)
                    if role_data:
                        new_role_obj = Role(**role_data)
                        db.add(new_role_obj)
                        db.commit()
                        db.refresh(new_role_obj)
                
                if new_role_obj:
                    for user in users_to_update:
                        user.role_id = new_role_obj.id
        
        # Delete old roles that are not in the new list
        new_role_names = [role["name"] for role in new_roles]
        roles_to_delete = [role for role in existing_roles if role.name not in new_role_names]
        
        for role in roles_to_delete:
            print(f"🗑️ Deleting old role: {role.name}")
            # Delete role permissions first
            db.query(RolePermission).filter(RolePermission.role_id == role.id).delete()
            # Update users with this role to reader role
            reader_role = db.query(Role).filter(Role.name == "reader").first()
            if reader_role:
                db.query(User).filter(User.role_id == role.id).update({"role_id": reader_role.id})
            db.delete(role)
        
        # Create or update new roles
        for role_data in new_roles:
            existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
            if existing_role:
                print(f"✏️ Updating existing role: {role_data['name']}")
                existing_role.display_name = role_data["display_name"]
                existing_role.description = role_data["description"] 
                existing_role.priority = role_data["priority"]
            else:
                print(f"➕ Creating new role: {role_data['name']}")
                new_role = Role(**role_data)
                db.add(new_role)
        
        db.commit()
        
        # Display final roles
        final_roles = db.query(Role).order_by(Role.priority).all()
        print(f"\n✅ Updated roles ({len(final_roles)} total):")
        for role in final_roles:
            user_count = db.query(User).filter(User.role_id == role.id).count()
            print(f"  - {role.display_name} ({role.name}) - {user_count} users")
        
        print("\n🎉 Role update completed successfully!")
        
    except Exception as e:
        print(f"❌ Error updating roles: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    update_roles()