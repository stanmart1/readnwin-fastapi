"""
Seed fine-grained permissions and assign to super_admin role
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from core.database import SessionLocal, engine
from models.role import Role, Permission, RolePermission
from models.user import User

# Fine-grained permissions organized by resource
PERMISSIONS = {
    # User Management
    "users": [
        {"name": "users.view", "display_name": "View Users", "action": "read"},
        {"name": "users.create", "display_name": "Create Users", "action": "create"},
        {"name": "users.update", "display_name": "Update Users", "action": "update"},
        {"name": "users.delete", "display_name": "Delete Users", "action": "delete"},
        {"name": "users.activate", "display_name": "Activate/Deactivate Users", "action": "update"},
        {"name": "users.reset_password", "display_name": "Reset User Passwords", "action": "update"},
        {"name": "users.assign_role", "display_name": "Assign Roles to Users", "action": "update"},
        {"name": "users.view_analytics", "display_name": "View User Analytics", "action": "read"},
    ],
    
    # Role & Permission Management
    "roles": [
        {"name": "roles.view", "display_name": "View Roles", "action": "read"},
        {"name": "roles.create", "display_name": "Create Roles", "action": "create"},
        {"name": "roles.update", "display_name": "Update Roles", "action": "update"},
        {"name": "roles.delete", "display_name": "Delete Roles", "action": "delete"},
        {"name": "roles.assign_permissions", "display_name": "Assign Permissions to Roles", "action": "update"},
    ],
    
    "permissions": [
        {"name": "permissions.view", "display_name": "View Permissions", "action": "read"},
        {"name": "permissions.create", "display_name": "Create Permissions", "action": "create"},
        {"name": "permissions.update", "display_name": "Update Permissions", "action": "update"},
        {"name": "permissions.delete", "display_name": "Delete Permissions", "action": "delete"},
    ],
    
    # Book Management
    "books": [
        {"name": "books.view", "display_name": "View Books", "action": "read"},
        {"name": "books.create", "display_name": "Create Books", "action": "create"},
        {"name": "books.update", "display_name": "Update Books", "action": "update"},
        {"name": "books.delete", "display_name": "Delete Books", "action": "delete"},
        {"name": "books.upload", "display_name": "Upload Book Files", "action": "create"},
        {"name": "books.assign", "display_name": "Assign Books to Users", "action": "update"},
        {"name": "books.publish", "display_name": "Publish/Unpublish Books", "action": "update"},
    ],
    
    # Order Management
    "orders": [
        {"name": "orders.view", "display_name": "View Orders", "action": "read"},
        {"name": "orders.create", "display_name": "Create Orders", "action": "create"},
        {"name": "orders.update", "display_name": "Update Orders", "action": "update"},
        {"name": "orders.delete", "display_name": "Delete Orders", "action": "delete"},
        {"name": "orders.process", "display_name": "Process Orders", "action": "update"},
        {"name": "orders.refund", "display_name": "Refund Orders", "action": "update"},
    ],
    
    # Review Management
    "reviews": [
        {"name": "reviews.view", "display_name": "View Reviews", "action": "read"},
        {"name": "reviews.moderate", "display_name": "Moderate Reviews", "action": "update"},
        {"name": "reviews.delete", "display_name": "Delete Reviews", "action": "delete"},
        {"name": "reviews.approve", "display_name": "Approve Reviews", "action": "update"},
    ],
    
    # Shipping Management
    "shipping": [
        {"name": "shipping.view", "display_name": "View Shipping", "action": "read"},
        {"name": "shipping.create", "display_name": "Create Shipping Methods", "action": "create"},
        {"name": "shipping.update", "display_name": "Update Shipping", "action": "update"},
        {"name": "shipping.delete", "display_name": "Delete Shipping Methods", "action": "delete"},
    ],
    
    # Payment Management
    "payments": [
        {"name": "payments.view", "display_name": "View Payments", "action": "read"},
        {"name": "payments.verify", "display_name": "Verify Payments", "action": "update"},
        {"name": "payments.settings", "display_name": "Manage Payment Settings", "action": "update"},
    ],
    
    # Content Management
    "blog": [
        {"name": "blog.view", "display_name": "View Blog Posts", "action": "read"},
        {"name": "blog.create", "display_name": "Create Blog Posts", "action": "create"},
        {"name": "blog.update", "display_name": "Update Blog Posts", "action": "update"},
        {"name": "blog.delete", "display_name": "Delete Blog Posts", "action": "delete"},
        {"name": "blog.publish", "display_name": "Publish Blog Posts", "action": "update"},
    ],
    
    "works": [
        {"name": "works.view", "display_name": "View Works", "action": "read"},
        {"name": "works.create", "display_name": "Create Works", "action": "create"},
        {"name": "works.update", "display_name": "Update Works", "action": "update"},
        {"name": "works.delete", "display_name": "Delete Works", "action": "delete"},
    ],
    
    "faq": [
        {"name": "faq.view", "display_name": "View FAQs", "action": "read"},
        {"name": "faq.create", "display_name": "Create FAQs", "action": "create"},
        {"name": "faq.update", "display_name": "Update FAQs", "action": "update"},
        {"name": "faq.delete", "display_name": "Delete FAQs", "action": "delete"},
    ],
    
    "about": [
        {"name": "about.view", "display_name": "View About Page", "action": "read"},
        {"name": "about.update", "display_name": "Update About Page", "action": "update"},
    ],
    
    "contact": [
        {"name": "contact.view", "display_name": "View Contact Page", "action": "read"},
        {"name": "contact.update", "display_name": "Update Contact Page", "action": "update"},
    ],
    
    # Email Management
    "email_templates": [
        {"name": "email_templates.view", "display_name": "View Email Templates", "action": "read"},
        {"name": "email_templates.create", "display_name": "Create Email Templates", "action": "create"},
        {"name": "email_templates.update", "display_name": "Update Email Templates", "action": "update"},
        {"name": "email_templates.delete", "display_name": "Delete Email Templates", "action": "delete"},
        {"name": "email_templates.send", "display_name": "Send Emails", "action": "create"},
    ],
    
    # Analytics & Reports
    "analytics": [
        {"name": "analytics.view", "display_name": "View Analytics", "action": "read"},
        {"name": "analytics.export", "display_name": "Export Analytics", "action": "read"},
    ],
    
    "reports": [
        {"name": "reports.view", "display_name": "View Reports", "action": "read"},
        {"name": "reports.generate", "display_name": "Generate Reports", "action": "create"},
        {"name": "reports.export", "display_name": "Export Reports", "action": "read"},
    ],
    
    # Audit & Security
    "audit_logs": [
        {"name": "audit_logs.view", "display_name": "View Audit Logs", "action": "read"},
        {"name": "audit_logs.export", "display_name": "Export Audit Logs", "action": "read"},
    ],
    
    # System Settings
    "settings": [
        {"name": "settings.view", "display_name": "View Settings", "action": "read"},
        {"name": "settings.update", "display_name": "Update Settings", "action": "update"},
        {"name": "settings.system", "display_name": "Manage System Settings", "action": "update"},
    ],
    
    # Reading Management
    "reading": [
        {"name": "reading.view_analytics", "display_name": "View Reading Analytics", "action": "read"},
        {"name": "reading.manage_goals", "display_name": "Manage Reading Goals", "action": "update"},
    ],
}

def seed_permissions(db: Session):
    """Create all permissions in database"""
    print("🔐 Creating permissions...")
    created_count = 0
    
    for resource, perms in PERMISSIONS.items():
        for perm_data in perms:
            # Check if permission exists
            existing = db.query(Permission).filter(Permission.name == perm_data["name"]).first()
            if not existing:
                permission = Permission(
                    name=perm_data["name"],
                    display_name=perm_data["display_name"],
                    description=f"{perm_data['display_name']} permission",
                    resource=resource,
                    action=perm_data["action"],
                    scope="*"
                )
                db.add(permission)
                created_count += 1
                print(f"  ✅ Created: {perm_data['name']}")
            else:
                print(f"  ⏭️  Exists: {perm_data['name']}")
    
    db.commit()
    print(f"\n✅ Created {created_count} new permissions")
    return created_count

def assign_permissions_to_super_admin(db: Session):
    """Assign all permissions to super_admin role"""
    print("\n👑 Assigning permissions to super_admin role...")
    
    # Get or create super_admin role
    super_admin = db.query(Role).filter(Role.name == "super_admin").first()
    if not super_admin:
        super_admin = Role(
            name="super_admin",
            display_name="Super Administrator",
            description="Full system access with all permissions",
            priority=100,
            is_system_role=True
        )
        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)
        print("  ✅ Created super_admin role")
    
    # Get all permissions
    all_permissions = db.query(Permission).all()
    assigned_count = 0
    
    for permission in all_permissions:
        # Check if already assigned
        existing = db.query(RolePermission).filter(
            RolePermission.role_id == super_admin.id,
            RolePermission.permission_id == permission.id
        ).first()
        
        if not existing:
            role_perm = RolePermission(
                role_id=super_admin.id,
                permission_id=permission.id
            )
            db.add(role_perm)
            assigned_count += 1
    
    db.commit()
    print(f"  ✅ Assigned {assigned_count} new permissions to super_admin")
    print(f"  📊 Total permissions: {len(all_permissions)}")
    
    return assigned_count

def create_default_roles(db: Session):
    """Create default roles with appropriate permissions"""
    print("\n👥 Creating default roles...")
    
    roles_config = [
        {
            "name": "admin",
            "display_name": "Administrator",
            "description": "Administrative access with most permissions",
            "priority": 90,
            "permissions": [
                "users.view", "users.create", "users.update", "users.activate",
                "books.view", "books.create", "books.update", "books.publish",
                "orders.view", "orders.update", "orders.process",
                "reviews.view", "reviews.moderate", "reviews.approve",
                "blog.view", "blog.create", "blog.update", "blog.publish",
                "analytics.view", "reports.view", "reports.generate",
                "audit_logs.view", "about.view", "about.update",
                "contact.view", "contact.update"
            ]
        },
        {
            "name": "moderator",
            "display_name": "Moderator",
            "description": "Content moderation and basic management",
            "priority": 50,
            "permissions": [
                "users.view",
                "books.view",
                "orders.view",
                "reviews.view", "reviews.moderate",
                "blog.view", "blog.update",
                "analytics.view"
            ]
        },
        {
            "name": "user",
            "display_name": "User",
            "description": "Standard user with basic access",
            "priority": 10,
            "permissions": []
        }
    ]
    
    for role_config in roles_config:
        role = db.query(Role).filter(Role.name == role_config["name"]).first()
        if not role:
            role = Role(
                name=role_config["name"],
                display_name=role_config["display_name"],
                description=role_config["description"],
                priority=role_config["priority"],
                is_system_role=True
            )
            db.add(role)
            db.commit()
            db.refresh(role)
            print(f"  ✅ Created role: {role_config['name']}")
            
            # Assign permissions
            for perm_name in role_config["permissions"]:
                permission = db.query(Permission).filter(Permission.name == perm_name).first()
                if permission:
                    role_perm = RolePermission(role_id=role.id, permission_id=permission.id)
                    db.add(role_perm)
            
            db.commit()
            print(f"     Assigned {len(role_config['permissions'])} permissions")
        else:
            print(f"  ⏭️  Role exists: {role_config['name']}")

def main():
    print("=" * 60)
    print("🚀 RBAC Permissions Seeder")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Create permissions
        seed_permissions(db)
        
        # Create default roles
        create_default_roles(db)
        
        # Assign all permissions to super_admin
        assign_permissions_to_super_admin(db)
        
        print("\n" + "=" * 60)
        print("✅ RBAC setup completed successfully!")
        print("=" * 60)
        
        # Summary
        total_permissions = db.query(Permission).count()
        total_roles = db.query(Role).count()
        print(f"\n📊 Summary:")
        print(f"   Total Permissions: {total_permissions}")
        print(f"   Total Roles: {total_roles}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
