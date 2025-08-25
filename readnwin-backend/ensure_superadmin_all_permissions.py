#!/usr/bin/env python3
"""
Ensure super_admin role has ALL permissions in the database
"""

from sqlalchemy.orm import Session
from core.database import engine, get_db
from models.role import Role, Permission, RolePermission

def ensure_superadmin_all_permissions():
    """Ensure super_admin role has every single permission in the database"""
    db = Session(engine)

    try:
        # Get super_admin role
        super_admin_role = db.query(Role).filter(Role.name == "super_admin").first()
        if not super_admin_role:
            print("❌ Super admin role not found!")
            return False

        # Get ALL permissions from the database
        all_permissions = db.query(Permission).all()
        print(f"📋 Found {len(all_permissions)} total permissions in database")

        # Get current super_admin permissions
        current_role_perms = db.query(RolePermission).filter(
            RolePermission.role_id == super_admin_role.id
        ).all()
        current_perm_ids = {rp.permission_id for rp in current_role_perms}

        print(f"📋 Super admin currently has {len(current_perm_ids)} permissions")

        # Find missing permissions
        missing_permissions = []
        for permission in all_permissions:
            if permission.id not in current_perm_ids:
                missing_permissions.append(permission)

        if not missing_permissions:
            print("✅ Super admin already has ALL permissions!")
            return True

        print(f"🔧 Adding {len(missing_permissions)} missing permissions:")

        # Add missing permissions
        for permission in missing_permissions:
            print(f"   + {permission.name}: {permission.display_name}")
            role_permission = RolePermission(
                role_id=super_admin_role.id,
                permission_id=permission.id
            )
            db.add(role_permission)

        # Commit changes
        db.commit()

        # Verify the result
        final_count = db.query(RolePermission).filter(
            RolePermission.role_id == super_admin_role.id
        ).count()

        total_permissions = db.query(Permission).count()

        print(f"\n✅ Super admin now has {final_count}/{total_permissions} permissions")

        if final_count == total_permissions:
            print("🎉 SUCCESS: Super admin has ALL permissions!")
            return True
        else:
            print("❌ WARNING: Super admin still missing some permissions")
            return False

    except Exception as e:
        print(f"❌ Error ensuring super admin permissions: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def verify_superadmin_permissions():
    """Verify super admin has all permissions and list them"""
    db = Session(engine)

    try:
        # Get super_admin role with permissions
        super_admin_role = db.query(Role).filter(Role.name == "super_admin").first()
        if not super_admin_role:
            print("❌ Super admin role not found!")
            return False

        # Get all role permissions
        role_perms = db.query(RolePermission).filter(
            RolePermission.role_id == super_admin_role.id
        ).all()

        # Get permission details
        permission_names = []
        for rp in role_perms:
            permission = db.query(Permission).filter(Permission.id == rp.permission_id).first()
            if permission:
                permission_names.append(permission.name)

        permission_names.sort()

        print(f"📋 Super Admin Permissions ({len(permission_names)} total):")
        for i, perm_name in enumerate(permission_names, 1):
            print(f"   {i:2d}. {perm_name}")

        # Check if admin@readnwin.com user has access
        from models.user import User
        admin_user = db.query(User).filter(User.email == "admin@readnwin.com").first()
        if admin_user:
            print(f"\n👤 Admin User ({admin_user.email}):")
            print(f"   Role: {admin_user.role.name if admin_user.role else 'No role'}")
            print(f"   Has admin access: {admin_user.has_admin_access}")
            print(f"   Total permissions: {len(admin_user.permissions)}")

        return True

    except Exception as e:
        print(f"❌ Error verifying super admin permissions: {e}")
        return False
    finally:
        db.close()

def main():
    """Main function"""
    print("🔧 Ensuring Super Admin has ALL permissions...")
    print("=" * 60)

    # Step 1: Ensure super admin has all permissions
    success = ensure_superadmin_all_permissions()

    if success:
        print("\n" + "=" * 60)
        print("📋 VERIFICATION:")
        print("=" * 60)
        verify_superadmin_permissions()

        print("\n" + "=" * 60)
        print("🎉 SUPER ADMIN SETUP COMPLETE!")
        print("=" * 60)
        print("✅ admin@readnwin.com now has FULL system access")
        print("✅ All admin dashboard features should be accessible")
        print("✅ All API endpoints should work for this user")
    else:
        print("\n❌ Failed to set up super admin permissions!")

if __name__ == "__main__":
    main()
