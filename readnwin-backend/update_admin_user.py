#!/usr/bin/env python3
"""
Update admin@readnwin.com user to have Super Administrator role
"""

import sys
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from core.database import engine, get_db
from models.user import User
from models.role import Role

def get_password_hash(password: str) -> str:
    """Hash password"""
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.hash(password)

def update_admin_user():
    """Update or create admin@readnwin.com user with Super Administrator role"""
    db = Session(engine)

    try:
        # Get Super Administrator role
        super_admin_role = db.query(Role).filter(Role.name == "super_admin").first()
        if not super_admin_role:
            print("❌ Super Administrator role not found. Please run init_rbac.py first.")
            return False

        # Check if admin@readnwin.com user exists
        admin_user = db.query(User).filter(User.email == "admin@readnwin.com").first()

        if admin_user:
            # Update existing user
            print(f"📝 Updating existing user: {admin_user.email}")
            admin_user.role_id = super_admin_role.id
            admin_user.is_active = True
            admin_user.is_email_verified = True
            admin_user.first_name = "Admin"
            admin_user.last_name = "User"
            admin_user.username = "admin"

            # Update password if needed (optional - you can remove this if user already has a password)
            # admin_user.password_hash = get_password_hash("admin123")

            print(f"✅ Updated user {admin_user.email} with Super Administrator role")
        else:
            # Create new user
            print("🆕 Creating new admin@readnwin.com user")
            admin_user = User(
                email="admin@readnwin.com",
                username="admin",
                password_hash=get_password_hash("admin123"),  # Default password - change this!
                first_name="Admin",
                last_name="User",
                role_id=super_admin_role.id,
                is_active=True,
                is_email_verified=True
            )
            db.add(admin_user)
            print(f"✅ Created new user {admin_user.email} with Super Administrator role")
            print("⚠️  Default password is 'admin123' - Please change this immediately!")

        db.commit()

        # Verify the update
        db.refresh(admin_user)
        print(f"\n📋 User Details:")
        print(f"   Email: {admin_user.email}")
        print(f"   Username: {admin_user.username}")
        print(f"   Role: {admin_user.role.display_name if admin_user.role else 'No role'}")
        print(f"   Active: {admin_user.is_active}")
        print(f"   Email Verified: {admin_user.is_email_verified}")

        # Show permissions
        if admin_user.role and admin_user.role.permissions:
            permissions = [rp.permission.name for rp in admin_user.role.permissions]
            print(f"   Permissions: {len(permissions)} permissions assigned")
            print(f"   Sample permissions: {permissions[:5]}...")

        return True

    except Exception as e:
        print(f"❌ Error updating admin user: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def main():
    """Main function"""
    print("Updating admin@readnwin.com user...")

    success = update_admin_user()

    if success:
        print("\n🎉 Admin user update completed successfully!")
        print("\n🔒 Security Notes:")
        print("   - Ensure the password is secure")
        print("   - The user now has full Super Administrator access")
        print("   - All admin dashboard features should be accessible")
    else:
        print("\n❌ Admin user update failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
