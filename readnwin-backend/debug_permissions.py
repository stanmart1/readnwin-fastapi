#!/usr/bin/env python3
"""
Debug admin permissions
"""

from sqlalchemy.orm import Session
from core.database import engine
from models.role import Role, Permission, RolePermission
from models.user import User
from sqlalchemy.orm import joinedload

def main():
    """Check admin permissions"""
    print("Checking admin permissions...")
    
    db = Session(engine)
    
    try:
        # Get admin users
        admin_users = db.query(User).options(
            joinedload(User.role).joinedload(Role.permissions).joinedload(RolePermission.permission)
        ).filter(User.role.has(Role.name.in_(['admin', 'super_admin']))).all()
        
        for user in admin_users:
            print(f"\nUser: {user.email} (Role: {user.role.name})")
            if user.role and user.role.permissions:
                permissions = [rp.permission.name for rp in user.role.permissions]
                print(f"Permissions ({len(permissions)}):")
                for perm in sorted(permissions):
                    print(f"  - {perm}")
                
                # Check specific permissions
                has_manage_books = 'manage_books' in permissions
                has_admin_access = 'admin_access' in permissions
                print(f"\nKey permissions:")
                print(f"  - manage_books: {has_manage_books}")
                print(f"  - admin_access: {has_admin_access}")
            else:
                print("  No permissions found")
        
        # Check if manage_books permission exists
        manage_books_perm = db.query(Permission).filter(Permission.name == 'manage_books').first()
        if manage_books_perm:
            print(f"\nmanage_books permission exists: {manage_books_perm.description}")
        else:
            print("\nmanage_books permission does NOT exist")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()