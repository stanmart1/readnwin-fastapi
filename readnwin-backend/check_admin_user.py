#!/usr/bin/env python3
"""
Script to check if admin user exists in the database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from sqlalchemy import func
from core.database import get_db, engine, Base
from models.user import User
from models.role import Role

def check_admin_user():
    """Check if admin user exists and display user information"""
    
    # Get database session
    db = next(get_db())
    
    try:
        print("🔍 Checking for admin user: admin@readnwin.com")
        print("=" * 50)
        
        # Check if user exists
        admin_user = db.query(User).filter(User.email == "admin@readnwin.com").first()
        
        if admin_user:
            print("✅ Admin user found!")
            print(f"   ID: {admin_user.id}")
            print(f"   Email: {admin_user.email}")
            print(f"   Username: {admin_user.username}")
            print(f"   First Name: {admin_user.first_name}")
            print(f"   Last Name: {admin_user.last_name}")
            print(f"   Is Active: {admin_user.is_active}")
            print(f"   Is Email Verified: {admin_user.is_email_verified}")
            print(f"   Role ID: {admin_user.role_id}")
            
            # Check role information
            if admin_user.role:
                print(f"   Role Name: {admin_user.role.name}")
                print(f"   Role Display Name: {admin_user.role.display_name}")
                print(f"   Role Priority: {admin_user.role.priority}")
                
                # Check permissions
                if admin_user.role.permissions:
                    print(f"   Permissions: {[perm.permission.name for perm in admin_user.role.permissions]}")
                else:
                    print("   Permissions: None")
            else:
                print("   ❌ No role assigned!")
                
        else:
            print("❌ Admin user NOT found!")
            
        print("\n" + "=" * 50)
        print("📊 All users in database:")
        
        all_users = db.query(User).all()
        for user in all_users:
            role_name = user.role.name if user.role else "No Role"
            print(f"   • {user.email} ({user.username}) - Role: {role_name} - Active: {user.is_active}")
            
        print(f"\n📈 Total users: {len(all_users)}")
        
        print("\n" + "=" * 50)
        print("🎭 All roles in database:")
        
        # Optimized query to avoid N+1 problem
        from sqlalchemy import func
        role_counts = db.query(
            Role.id,
            Role.name,
            Role.display_name,
            Role.priority,
            func.count(User.id).label('user_count')
        ).outerjoin(User, Role.id == User.role_id).group_by(
            Role.id, Role.name, Role.display_name, Role.priority
        ).all()
        
        for role_data in role_counts:
            print(f"   • {role_data.name} ({role_data.display_name}) - Priority: {role_data.priority} - Users: {role_data.user_count}")
            
        print(f"\n📈 Total roles: {len(role_counts)}")
        
    except Exception as e:
        print(f"❌ Error checking admin user: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    check_admin_user()