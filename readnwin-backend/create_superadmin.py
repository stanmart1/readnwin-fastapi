#!/usr/bin/env python3
"""
Script to create a superadmin user peter@readnwin.com
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from core.database import get_db, engine, Base
from core.security import get_password_hash
from models.user import User
from models.role import Role, Permission, RolePermission

def create_superadmin_user():
    """Create a superadmin user peter@readnwin.com with password Peter123$"""

    # Create tables
    Base.metadata.create_all(bind=engine)

    # Get database session
    db = next(get_db())

    try:
        # Create superadmin role if it doesn't exist
        superadmin_role = db.query(Role).filter(Role.name == "superadmin").first()
        if not superadmin_role:
            superadmin_role = Role(
                name="superadmin",
                display_name="Super Administrator",
                description="Super administrator with all system permissions",
                priority=999
            )
            db.add(superadmin_role)
            db.commit()
            db.refresh(superadmin_role)
            print("✅ Created superadmin role")
        else:
            print("ℹ️ Superadmin role already exists")

        # Create admin role if it doesn't exist (fallback)
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(
                name="admin",
                display_name="Administrator",
                description="Full system administrator with all permissions",
                priority=100
            )
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
            print("✅ Created admin role")

        # Use superadmin role if available, otherwise admin role
        target_role = superadmin_role if superadmin_role else admin_role

        # Create superadmin user
        superadmin_email = "peter@readnwin.com"
        superadmin_user = db.query(User).filter(User.email == superadmin_email).first()

        if not superadmin_user:
            superadmin_user = User(
                email=superadmin_email,
                username="peter",
                password_hash=get_password_hash("Peter123$"),
                first_name="Peter",
                last_name="Admin",
                role_id=target_role.id,
                is_active=True,
                is_email_verified=True
            )
            db.add(superadmin_user)
            db.commit()
            db.refresh(superadmin_user)
            print(f"✅ Created superadmin user: {superadmin_email}")
            print(f"🔑 Username: peter")
            print(f"🔑 Password: Peter123$")
            print(f"👑 Role: {target_role.display_name}")
        else:
            # Update existing user to be superadmin
            superadmin_user.role_id = target_role.id
            superadmin_user.password_hash = get_password_hash("Peter123$")
            superadmin_user.is_active = True
            superadmin_user.is_email_verified = True
            superadmin_user.first_name = "Peter"
            superadmin_user.last_name = "Admin"
            superadmin_user.username = "peter"
            db.commit()
            print(f"✅ Updated existing user {superadmin_email} to superadmin role")
            print(f"🔑 Password updated to: Peter123$")
            print(f"👑 Role: {target_role.display_name}")

        print("\n🎉 Superadmin user creation complete!")
        print("\n📋 Superadmin Account:")
        print(f"   Email: {superadmin_email}")
        print(f"   Username: peter")
        print(f"   Password: Peter123$")
        print(f"   Role: {target_role.display_name}")
        print("\n🔐 This account has full system access!")

    except Exception as e:
        print(f"❌ Error creating superadmin user: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_superadmin_user()
