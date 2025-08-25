#!/usr/bin/env python3
"""
Script to check the admin user's password hash directly from database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from core.database import get_db
from core.security import verify_password, get_password_hash
from models.user import User

def check_admin_password_direct():
    """Check admin password hash directly from database"""
    
    db = next(get_db())
    
    try:
        print("🔍 Checking admin user password in database")
        print("=" * 60)
        
        # Get admin user directly from database
        admin_user = db.query(User).filter(User.email == "admin@readnwin.com").first()
        
        if not admin_user:
            print("❌ Admin user not found!")
            return
            
        print(f"✅ Admin user found:")
        print(f"   ID: {admin_user.id}")
        print(f"   Email: {admin_user.email}")
        print(f"   Username: {admin_user.username}")
        print(f"   Is Active: {admin_user.is_active}")
        print(f"   Password Hash: {admin_user.password_hash}")
        
        # Test common passwords
        test_passwords = [
            "admin123",
            "admin", 
            "password",
            "123456",
            "readnwin123",
            "Admin123",
            "ADMIN123"
        ]
        
        print(f"\n🔧 Testing passwords:")
        found_password = None
        
        for password in test_passwords:
            try:
                is_valid = verify_password(password, admin_user.password_hash)
                status = "✅ MATCH" if is_valid else "❌ NO MATCH"
                print(f"   '{password}': {status}")
                
                if is_valid:
                    found_password = password
                    break
                    
            except Exception as e:
                print(f"   '{password}': ❌ ERROR - {e}")
        
        if found_password:
            print(f"\n🎉 CORRECT PASSWORD FOUND: '{found_password}'")
        else:
            print(f"\n❌ No matching password found from test list")
            
            # Create a new password hash for admin123
            print(f"\n🔄 Setting new password 'admin123'...")
            new_hash = get_password_hash("admin123")
            admin_user.password_hash = new_hash
            db.commit()
            
            # Verify the new password works
            verify_new = verify_password("admin123", admin_user.password_hash)
            if verify_new:
                print(f"✅ New password 'admin123' set successfully!")
                found_password = "admin123"
            else:
                print(f"❌ Failed to set new password")
        
        # Final verification
        if found_password:
            print(f"\n🔐 FINAL CREDENTIALS:")
            print(f"   Email: admin@readnwin.com")
            print(f"   Password: {found_password}")
            
            # Test login simulation
            print(f"\n🧪 Testing login simulation...")
            final_user = db.query(User).filter(User.email == "admin@readnwin.com").first()
            login_test = verify_password(found_password, final_user.password_hash)
            print(f"   Login test: {'✅ SUCCESS' if login_test else '❌ FAILED'}")
        
    except Exception as e:
        print(f"❌ Error checking password: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    check_admin_password_direct()