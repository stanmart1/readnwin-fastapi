#!/usr/bin/env python3
"""
Update existing admin roles with manage_faq permission
"""

from sqlalchemy.orm import Session
from core.database import engine
from models.role import Role, Permission, RolePermission

def main():
    """Add manage_faq permission to admin and super_admin roles"""
    print("Updating admin permissions...")
    
    db = Session(engine)
    
    try:
        # Get manage_faq permission
        faq_permission = db.query(Permission).filter(Permission.name == "manage_faq").first()
        if not faq_permission:
            print("❌ manage_faq permission not found")
            return
        
        # Update admin and super_admin roles
        for role_name in ["admin", "super_admin"]:
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                print(f"❌ {role_name} role not found")
                continue
            
            # Check if permission already assigned
            existing = db.query(RolePermission).filter(
                RolePermission.role_id == role.id,
                RolePermission.permission_id == faq_permission.id
            ).first()
            
            if not existing:
                role_perm = RolePermission(
                    role_id=role.id,
                    permission_id=faq_permission.id
                )
                db.add(role_perm)
                print(f"✅ Added manage_faq permission to {role_name}")
            else:
                print(f"ℹ️  {role_name} already has manage_faq permission")
        
        db.commit()
        print("✅ Admin permissions updated successfully")
        
    except Exception as e:
        print(f"❌ Error updating permissions: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()