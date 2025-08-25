#!/usr/bin/env python3
"""
Script to get exact admin credentials from the database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from core.database import get_db, engine, Base
from core.security import verify_password
from models.user import User
from models.role import Role

def get_admin_credentials():
    """Get admin credentials from database"""

    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    # Get database session
    db = next(get_db())

    try:
        print("🔍 Searching for admin users in database...")
        print("=" * 60)

        # Find admin roles
        admin_roles = db.query(Role).filter(
            Role.name.in_(["admin", "super_admin", "superadmin"])
        ).all()

        if not admin_roles:
            print("❌ No admin roles found in database!")
            return

        admin_role_ids = [role.id for role in admin_roles]
        print(f"📋 Found admin roles: {[role.name for role in admin_roles]}")

        # Find users with admin roles
        admin_users = db.query(User).filter(
            User.role_id.in_(admin_role_ids),
            User.is_active == True
        ).all()

        if not admin_users:
            print("❌ No active admin users found!")
            return

        print(f"\n🔑 Found {len(admin_users)} active admin user(s):")
        print("-" * 60)

        # Test known passwords
        known_passwords = ["admin123", "password", "123456", "admin", "password123"]

        for user in admin_users:
            print(f"\n👤 User: {user.email}")
            print(f"   Username: {user.username}")
            print(f"   Name: {user.first_name} {user.last_name}")
            print(f"   Role: {user.role.name if user.role else 'No role'}")
            print(f"   Active: {user.is_active}")
            print(f"   Verified: {user.is_email_verified}")
            print(f"   Created: {user.created_at}")
            print(f"   Last Login: {user.last_login or 'Never'}")

            # Test passwords
            print(f"\n🔐 Testing known passwords for {user.email}:")
            password_found = False

            for password in known_passwords:
                try:
                    if verify_password(password, user.password_hash):
                        print(f"   ✅ PASSWORD FOUND: '{password}'")
                        print(f"\n🎯 WORKING LOGIN CREDENTIALS:")
                        print(f"   Email: {user.email}")
                        print(f"   Password: {password}")
                        print(f"   Role: {user.role.name}")
                        password_found = True
                        break
                except Exception as e:
                    print(f"   ❌ Error testing password '{password}': {e}")

            if not password_found:
                print(f"   ⚠️  None of the known passwords work for {user.email}")
                print(f"   💡 You may need to reset the password")

        # If no working passwords found, suggest creating a new admin
        working_admins = []
        for user in admin_users:
            for password in known_passwords:
                try:
                    if verify_password(password, user.password_hash):
                        working_admins.append((user, password))
                        break
                except:
                    continue

        if not working_admins:
            print(f"\n⚠️  No working passwords found for any admin users!")
            print(f"🔧 To create a new admin with known password, run:")
            print(f"   python create_admin_user.py")
        else:
            print(f"\n✅ Summary of working admin credentials:")
            print("=" * 60)
            for user, password in working_admins:
                print(f"Email: {user.email}")
                print(f"Password: {password}")
                print(f"Role: {user.role.name}")
                print("-" * 30)

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    get_admin_credentials()
