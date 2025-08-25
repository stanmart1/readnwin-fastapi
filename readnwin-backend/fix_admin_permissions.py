#!/usr/bin/env python3
"""
Script to fix admin permissions for the admin@readnwin.com user
This will ensure the admin role has all necessary permissions for the admin dashboard
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from core.database import get_db, engine, Base
from models.user import User
from models.role import Role, RolePermission, Permission

def fix_admin_permissions():
    """Add all necessary permissions to the admin role"""

    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    # Get database session
    db = next(get_db())

    try:
        print("🔧 Fixing admin permissions...")
        print("=" * 60)

        # Get admin role
        admin_role = db.query(Role).filter(Role.name == 'admin').first()
        if not admin_role:
            print("❌ Admin role not found!")
            return False

        print(f"✅ Found admin role: {admin_role.display_name}")

        # Define all permissions needed for admin dashboard
        required_permissions = [
            'view_dashboard',
            'manage_users',
            'manage_roles',
            'view_audit_logs',
            'manage_books',
            'manage_reviews',
            'manage_notifications',
            'manage_orders',
            'manage_shipping',
            'view_analytics',
            'view_reports',
            'manage_email_templates',
            'manage_blog',
            'manage_works',
            'manage_about',
            'manage_contact',
            'manage_settings',
            'admin_access',
            'view_stats',
            'manage_library',
            'read_books'
        ]

        print(f"\n📋 Ensuring admin role has {len(required_permissions)} permissions...")

        permissions_added = 0
        permissions_existing = 0

        for perm_name in required_permissions:
            # Get or create permission
            permission = db.query(Permission).filter(Permission.name == perm_name).first()
            if not permission:
                permission = Permission(
                    name=perm_name,
                    display_name=perm_name.replace('_', ' ').title(),
                    description=f"Permission for {perm_name.replace('_', ' ').title()}"
                )
                db.add(permission)
                db.commit()
                db.refresh(permission)
                print(f"   ➕ Created permission: {perm_name}")

            # Check if role already has this permission
            existing = db.query(RolePermission).filter(
                RolePermission.role_id == admin_role.id,
                RolePermission.permission_id == permission.id
            ).first()

            if not existing:
                # Add permission to admin role
                role_permission = RolePermission(
                    role_id=admin_role.id,
                    permission_id=permission.id
                )
                db.add(role_permission)
                permissions_added += 1
                print(f"   ✅ Added permission: {perm_name}")
            else:
                permissions_existing += 1
                print(f"   ℹ️  Already has permission: {perm_name}")

        db.commit()

        print(f"\n📊 Summary:")
        print(f"   Permissions added: {permissions_added}")
        print(f"   Permissions already existing: {permissions_existing}")
        print(f"   Total permissions: {permissions_added + permissions_existing}")

        # Verify admin user can access dashboard
        admin_user = db.query(User).filter(User.email == 'admin@readnwin.com').first()
        if admin_user:
            print(f"\n👤 Admin User: {admin_user.email}")
            print(f"   Role: {admin_user.role.name if admin_user.role else 'None'}")
            print(f"   Active: {admin_user.is_active}")
            print(f"   Email Verified: {admin_user.is_email_verified}")

            if admin_user.role and admin_user.role.permissions:
                print(f"   Total Permissions: {len(admin_user.role.permissions)}")
            else:
                print("   ⚠️  No permissions found!")

        print(f"\n🎉 Admin permissions fix completed successfully!")
        print(f"💡 The admin@readnwin.com user should now have full access to the admin dashboard")

        return True

    except Exception as e:
        print(f"❌ Error fixing admin permissions: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def verify_permissions():
    """Verify that admin role has all required permissions"""

    # Get database session
    db = next(get_db())

    try:
        print("\n🔍 Verifying admin permissions...")
        print("=" * 60)

        admin_user = db.query(User).filter(User.email == 'admin@readnwin.com').first()
        if not admin_user or not admin_user.role:
            print("❌ Admin user or role not found!")
            return False

        permissions = [rp.permission.name for rp in admin_user.role.permissions] if admin_user.role.permissions else []

        required_for_dashboard = [
            'view_dashboard',
            'manage_users',
            'manage_books',
            'admin_access'
        ]

        print(f"📋 Admin user permissions ({len(permissions)} total):")
        for perm in sorted(permissions):
            marker = "🔑" if perm in required_for_dashboard else "  "
            print(f"   {marker} {perm}")

        missing = [perm for perm in required_for_dashboard if perm not in permissions]
        if missing:
            print(f"\n❌ Missing critical permissions:")
            for perm in missing:
                print(f"   - {perm}")
            return False
        else:
            print(f"\n✅ All critical dashboard permissions are present!")
            return True

    except Exception as e:
        print(f"❌ Error verifying permissions: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 ReadnWin Admin Permissions Fix")
    print("=" * 60)

    # Fix permissions
    success = fix_admin_permissions()

    if success:
        # Verify the fix worked
        verify_permissions()

        print(f"\n🎯 Next Steps:")
        print(f"   1. Refresh your browser/clear cache")
        print(f"   2. Log out and log back in as admin@readnwin.com")
        print(f"   3. Navigate to /admin - you should now have full access")
        print(f"   4. All admin dashboard tabs should be accessible")
    else:
        print(f"\n❌ Failed to fix admin permissions. Please check the error messages above.")
