#!/usr/bin/env python3
"""
Script to create an admin user for testing admin login redirection
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from core.database import get_db, engine, Base
from core.security import get_password_hash
from models.user import User
from models.role import Role, Permission, RolePermission

def create_admin_user():
    """Create an admin user and necessary roles/permissions"""
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Get database session
    db = next(get_db())
    
    try:
        # Create admin role if it doesn't exist
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
        else:
            print("ℹ️ Admin role already exists")
        
        # Create user role if it doesn't exist
        user_role = db.query(Role).filter(Role.name == "user").first()
        if not user_role:
            user_role = Role(
                name="user",
                display_name="Regular User",
                description="Standard user with basic permissions",
                priority=1
            )
            db.add(user_role)
            db.commit()
            db.refresh(user_role)
            print("✅ Created user role")
        else:
            print("ℹ️ User role already exists")
        
        # Create admin user
        admin_email = "admin@readnwin.com"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        
        if not admin_user:
            admin_user = User(
                email=admin_email,
                username="admin",
                password_hash=get_password_hash("admin123"),  # Change this password!
                first_name="System",
                last_name="Administrator",
                role_id=admin_role.id,
                is_active=True,
                is_email_verified=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"✅ Created admin user: {admin_email}")
            print(f"🔑 Password: admin123 (CHANGE THIS!)")
        else:
            # Update existing user to be admin
            admin_user.role_id = admin_role.id
            admin_user.is_active = True
            admin_user.is_email_verified = True
            db.commit()
            print(f"✅ Updated existing user {admin_email} to admin role")
        
        # Create test regular user
        test_email = "user@readnwin.com"
        test_user = db.query(User).filter(User.email == test_email).first()
        
        if not test_user:
            test_user = User(
                email=test_email,
                username="testuser",
                password_hash=get_password_hash("user123"),
                first_name="Test",
                last_name="User",
                role_id=user_role.id,
                is_active=True,
                is_email_verified=True
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
            print(f"✅ Created test user: {test_email}")
            print(f"🔑 Password: user123")
        else:
            print(f"ℹ️ Test user {test_email} already exists")
        
        print("\n🎉 Setup complete!")
        print("\n📋 Test Accounts:")
        print(f"   Admin: {admin_email} / admin123")
        print(f"   User:  {test_email} / user123")
        print("\n⚠️  IMPORTANT: Change the admin password after first login!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()