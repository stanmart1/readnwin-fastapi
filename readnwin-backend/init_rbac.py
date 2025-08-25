#!/usr/bin/env python3
"""
Initialize RBAC system with default roles and permissions
"""

from sqlalchemy.orm import Session
from core.database import engine, get_db
from models.role import Role, Permission, RolePermission

def init_permissions(db: Session):
    """Initialize default permissions"""
    permissions = [
        # Dashboard and Admin access
        {"name": "view_dashboard", "display_name": "View Dashboard", "description": "Access to admin dashboard", "resource": "dashboard"},
        {"name": "admin_access", "display_name": "Admin Access", "description": "Access to admin interface", "resource": "admin"},
        {"name": "super_admin", "display_name": "Super Administrator", "description": "Full system access with all permissions", "resource": "system"},

        # User management
        {"name": "view_users", "display_name": "View Users", "description": "View user profiles and information", "resource": "users"},
        {"name": "manage_users", "display_name": "Manage Users", "description": "Create, update, and delete users", "resource": "users"},
        {"name": "deactivate_users", "display_name": "Deactivate Users", "description": "Activate/deactivate user accounts", "resource": "users"},

        # Role and permission management
        {"name": "view_roles", "display_name": "View Roles", "description": "View roles and permissions", "resource": "roles"},
        {"name": "manage_roles", "display_name": "Manage Roles", "description": "Create, update, and delete roles", "resource": "roles"},
        {"name": "manage_permissions", "display_name": "Manage Permissions", "description": "Create, update, and delete permissions", "resource": "permissions"},
        {"name": "view_audit_logs", "display_name": "View Audit Logs", "description": "View system audit logs", "resource": "audit"},

        # Book and content management
        {"name": "view_books", "display_name": "View Books", "description": "View book catalog", "resource": "books"},
        {"name": "manage_books", "display_name": "Manage Books", "description": "Create, update, and delete books", "resource": "books"},
        {"name": "publish_books", "display_name": "Publish Books", "description": "Publish and unpublish books", "resource": "books"},
        {"name": "view_reviews", "display_name": "View Reviews", "description": "View book reviews", "resource": "reviews"},
        {"name": "manage_reviews", "display_name": "Manage Reviews", "description": "Moderate and manage book reviews", "resource": "reviews"},

        # Order and shipping management
        {"name": "view_orders", "display_name": "View Orders", "description": "View customer orders", "resource": "orders"},
        {"name": "manage_orders", "display_name": "Manage Orders", "description": "Update order status and details", "resource": "orders"},
        {"name": "manage_shipping", "display_name": "Manage Shipping", "description": "Manage shipping and delivery", "resource": "shipping"},
        {"name": "process_refunds", "display_name": "Process Refunds", "description": "Process order refunds", "resource": "orders"},

        # Content management
        {"name": "view_content", "display_name": "View Content", "description": "View blog posts and content", "resource": "content"},
        {"name": "manage_content", "display_name": "Manage Content", "description": "Create, update, and delete content", "resource": "content"},
        {"name": "publish_content", "display_name": "Publish Content", "description": "Publish and unpublish content", "resource": "content"},
        {"name": "manage_blog", "display_name": "Manage Blog", "description": "Manage blog posts and articles", "resource": "blog"},
        {"name": "manage_works", "display_name": "Manage Works", "description": "Manage portfolio works", "resource": "works"},
        {"name": "manage_about", "display_name": "Manage About", "description": "Manage about page content", "resource": "about"},
        {"name": "manage_contact", "display_name": "Manage Contact", "description": "Manage contact information and messages", "resource": "contact"},
        {"name": "manage_faq", "display_name": "Manage FAQ", "description": "Manage frequently asked questions", "resource": "faq"},

        # Notifications and communication
        {"name": "manage_notifications", "display_name": "Manage Notifications", "description": "Send and manage notifications", "resource": "notifications"},
        {"name": "manage_email_templates", "display_name": "Manage Email Templates", "description": "Create and edit email templates", "resource": "email"},

        # Analytics and reports
        {"name": "view_analytics", "display_name": "View Analytics", "description": "View analytics and reports", "resource": "analytics"},
        {"name": "view_reports", "display_name": "View Reports", "description": "View detailed reports", "resource": "reports"},
        {"name": "view_stats", "display_name": "View Statistics", "description": "View system statistics", "resource": "stats"},
        {"name": "export_data", "display_name": "Export Data", "description": "Export system data", "resource": "analytics"},

        # System administration
        {"name": "manage_settings", "display_name": "Manage Settings", "description": "Manage system settings", "resource": "system"},
        {"name": "view_logs", "display_name": "View Logs", "description": "View system logs", "resource": "system"},
        {"name": "manage_system", "display_name": "Manage System", "description": "System administration tasks", "resource": "system"},

        # Library and reading
        {"name": "manage_library", "display_name": "Manage Library", "description": "Manage user libraries", "resource": "library"},
        {"name": "read_books", "display_name": "Read Books", "description": "Access to reading interface", "resource": "reading"},

        # Customer support
        {"name": "view_support", "display_name": "View Support", "description": "View support tickets", "resource": "support"},
        {"name": "manage_support", "display_name": "Manage Support", "description": "Handle customer support", "resource": "support"},
    ]

    created_permissions = {}
    for perm_data in permissions:
        existing = db.query(Permission).filter(Permission.name == perm_data["name"]).first()
        if not existing:
            permission = Permission(**perm_data)
            db.add(permission)
            db.commit()
            db.refresh(permission)
            created_permissions[perm_data["name"]] = permission
            print(f"Created permission: {perm_data['name']}")
        else:
            created_permissions[perm_data["name"]] = existing
            print(f"Permission already exists: {perm_data['name']}")

    return created_permissions

def init_roles(db: Session, permissions: dict):
    """Initialize default roles"""
    roles_config = [
        {
            "name": "super_admin",
            "display_name": "Super Administrator",
            "description": "Full system access with all permissions",
            "priority": 100,
            "permissions": [
                "super_admin", "view_dashboard", "admin_access",
                "manage_users", "view_users", "deactivate_users",
                "manage_roles", "view_roles", "manage_permissions", "view_audit_logs",
                "manage_books", "view_books", "publish_books", "manage_reviews", "view_reviews",
                "manage_notifications", "manage_orders", "view_orders", "manage_shipping", "process_refunds",
                "view_analytics", "view_reports", "view_stats", "export_data",
                "manage_email_templates", "manage_blog", "manage_works", "manage_about", "manage_contact", "manage_faq",
                "manage_settings", "view_logs", "manage_system", "admin_access",
                "view_stats", "manage_library", "read_books",
                "view_content", "manage_content", "publish_content",
                "view_support", "manage_support"
            ]
        },
        {
            "name": "admin",
            "display_name": "Administrator",
            "description": "System administrator with most permissions",
            "priority": 90,
            "permissions": [
                "view_dashboard", "admin_access",
                "manage_users", "view_users", "deactivate_users",
                "view_roles", "view_audit_logs",
                "manage_books", "view_books", "publish_books", "manage_reviews", "view_reviews",
                "manage_notifications", "manage_orders", "view_orders", "manage_shipping", "process_refunds",
                "view_analytics", "view_reports", "view_stats", "export_data",
                "manage_email_templates", "manage_blog", "manage_works", "manage_about", "manage_contact", "manage_faq",
                "view_logs", "manage_library", "read_books",
                "view_content", "manage_content", "publish_content",
                "view_support", "manage_support"
            ]
        },
        {
            "name": "moderator",
            "display_name": "Moderator",
            "description": "Content moderator with limited admin access",
            "priority": 70,
            "permissions": [
                "view_dashboard", "admin_access",
                "view_users", "view_books", "manage_reviews", "view_reviews",
                "view_orders", "manage_orders",
                "view_analytics", "view_reports",
                "manage_content", "view_content", "manage_blog",
                "manage_library", "read_books",
                "view_support", "manage_support"
            ]
        },
        {
            "name": "author",
            "display_name": "Author",
            "description": "Content creator with publishing permissions",
            "priority": 60,
            "permissions": [
                "view_dashboard",
                "view_books", "manage_books", "publish_books",
                "view_content", "manage_content", "publish_content", "manage_blog",
                "view_analytics", "read_books", "manage_library"
            ]
        },
        {
            "name": "editor",
            "display_name": "Editor",
            "description": "Content editor with review permissions",
            "priority": 50,
            "permissions": [
                "view_dashboard",
                "view_books", "manage_books", "view_reviews", "manage_reviews",
                "view_content", "manage_content", "manage_blog",
                "view_analytics", "read_books", "manage_library"
            ]
        },
        {
            "name": "reader",
            "display_name": "Reader",
            "description": "Standard user with basic permissions",
            "priority": 10,
            "permissions": [
                "view_books", "view_content", "read_books", "manage_library", "view_reviews"
            ]
        }
    ]

    created_roles = {}
    for role_data in roles_config:
        existing = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing:
            role = Role(
                name=role_data["name"],
                display_name=role_data["display_name"],
                description=role_data["description"],
                priority=role_data["priority"]
            )
            db.add(role)
            db.commit()
            db.refresh(role)

            # Assign permissions to role
            for perm_name in role_data["permissions"]:
                if perm_name in permissions:
                    role_perm = RolePermission(
                        role_id=role.id,
                        permission_id=permissions[perm_name].id
                    )
                    db.add(role_perm)

            db.commit()
            created_roles[role_data["name"]] = role
            print(f"Created role: {role_data['name']} with {len(role_data['permissions'])} permissions")
        else:
            created_roles[role_data["name"]] = existing
            print(f"Role already exists: {role_data['name']}")

    return created_roles

def main():
    """Initialize RBAC system"""
    print("Initializing RBAC system...")

    # Create database session
    db = Session(engine)

    try:
        # Initialize permissions
        print("\n1. Initializing permissions...")
        permissions = init_permissions(db)

        # Initialize roles
        print("\n2. Initializing roles...")
        roles = init_roles(db, permissions)

        print(f"\n✅ RBAC initialization complete!")
        print(f"   - Created/verified {len(permissions)} permissions")
        print(f"   - Created/verified {len(roles)} roles")

    except Exception as e:
        print(f"❌ Error initializing RBAC: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
