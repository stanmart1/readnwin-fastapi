#!/usr/bin/env python3
"""
Assign permissions to existing roles
"""

from sqlalchemy.orm import Session
from core.database import engine, get_db
from models.role import Role, Permission, RolePermission

def assign_role_permissions():
    """Assign permissions to existing roles"""
    db = Session(engine)

    try:
        # Get all roles and permissions
        roles = {role.name: role for role in db.query(Role).all()}
        permissions = {perm.name: perm for perm in db.query(Permission).all()}

        # Define role permissions mapping
        role_permissions_map = {
            "super_admin": [
                "super_admin", "view_dashboard", "admin_access",
                "manage_users", "view_users", "deactivate_users",
                "manage_roles", "view_roles", "manage_permissions", "view_audit_logs",
                "manage_books", "view_books", "publish_books", "manage_reviews", "view_reviews",
                "manage_notifications", "manage_orders", "view_orders", "manage_shipping", "process_refunds",
                "view_analytics", "view_reports", "view_stats", "export_data",
                "manage_email_templates", "manage_blog", "manage_works", "manage_about", "manage_contact",
                "manage_settings", "view_logs", "manage_system", "admin_access",
                "view_stats", "manage_library", "read_books",
                "view_content", "manage_content", "publish_content",
                "view_support", "manage_support"
            ],
            "admin": [
                "view_dashboard", "admin_access",
                "manage_users", "view_users", "deactivate_users",
                "view_roles", "view_audit_logs",
                "manage_books", "view_books", "publish_books", "manage_reviews", "view_reviews",
                "manage_notifications", "manage_orders", "view_orders", "manage_shipping", "process_refunds",
                "view_analytics", "view_reports", "view_stats", "export_data",
                "manage_email_templates", "manage_blog", "manage_works", "manage_about", "manage_contact",
                "view_logs", "manage_library", "read_books",
                "view_content", "manage_content", "publish_content",
                "view_support", "manage_support"
            ],
            "moderator": [
                "view_dashboard", "admin_access",
                "view_users", "view_books", "manage_reviews", "view_reviews",
                "view_orders", "manage_orders",
                "view_analytics", "view_reports",
                "manage_content", "view_content", "manage_blog",
                "manage_library", "read_books",
                "view_support", "manage_support"
            ],
            "author": [
                "view_dashboard",
                "view_books", "manage_books", "publish_books",
                "view_content", "manage_content", "publish_content", "manage_blog",
                "view_analytics", "read_books", "manage_library"
            ],
            "editor": [
                "view_dashboard",
                "view_books", "manage_books", "view_reviews", "manage_reviews",
                "view_content", "manage_content", "manage_blog",
                "view_analytics", "read_books", "manage_library"
            ],
            "reader": [
                "view_books", "view_content", "read_books", "manage_library", "view_reviews"
            ]
        }

        # Clear existing role permissions
        for role_name in role_permissions_map.keys():
            if role_name in roles:
                role = roles[role_name]
                # Delete existing permissions for this role
                db.query(RolePermission).filter(RolePermission.role_id == role.id).delete()
                print(f"Cleared existing permissions for role: {role_name}")

        db.commit()

        # Assign new permissions
        for role_name, permission_names in role_permissions_map.items():
            if role_name not in roles:
                print(f"❌ Role '{role_name}' not found, skipping...")
                continue

            role = roles[role_name]
            assigned_count = 0

            for perm_name in permission_names:
                if perm_name not in permissions:
                    print(f"⚠️ Permission '{perm_name}' not found, skipping...")
                    continue

                permission = permissions[perm_name]

                # Create role permission
                role_permission = RolePermission(
                    role_id=role.id,
                    permission_id=permission.id
                )
                db.add(role_permission)
                assigned_count += 1

            print(f"✅ Assigned {assigned_count} permissions to role: {role_name}")

        db.commit()
        print(f"\n🎉 Role permissions assignment completed successfully!")

        # Verify assignments
        print("\n📋 Verification:")
        for role_name in role_permissions_map.keys():
            if role_name in roles:
                role = roles[role_name]
                count = db.query(RolePermission).filter(RolePermission.role_id == role.id).count()
                print(f"   {role_name}: {count} permissions assigned")

        return True

    except Exception as e:
        print(f"❌ Error assigning role permissions: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def main():
    """Main function"""
    print("Assigning permissions to existing roles...")

    success = assign_role_permissions()

    if success:
        print("\n✅ Role permissions assignment completed!")
    else:
        print("\n❌ Role permissions assignment failed!")

if __name__ == "__main__":
    main()
