#!/usr/bin/env python3
"""
Script to test password verification for admin user
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from core.database import get_db
from core.security import verify_password, get_password_hash
from models.user import User

def test_admin_password():
    """Test password verification for admin user"""
    
    db = next(get_db())
    
    try:
        print("🔍 Testing admin password verification")
        print("=" * 50)
        
        # Get admin user
        admin_user = db.query(User).filter(User.email == "admin@readnwin.com").first()
        
        if not admin_user:
            print("❌ Admin user not found!")
            return
            
        print(f"✅ Admin user found: {admin_user.email}")
        print(f"   Password hash: {admin_user.password_hash[:50]}...")
        
        # Test different passwords
        test_passwords = ["admin123", "admin", "password", "123456"]
        
        for password in test_passwords:
            try:
                is_valid = verify_password(password, admin_user.password_hash)
                status = "✅ VALID" if is_valid else "❌ INVALID"
                print(f"   Password '{password}': {status}")
                
                if is_valid:
                    print(f"   🎉 Correct password found: '{password}'")
                    break
            except Exception as e:
                print(f"   ❌ Error verifying '{password}': {e}")
        
        # Test creating a new hash for admin123
        print(f"\n🔧 Creating new hash for 'admin123':")
        new_hash = get_password_hash("admin123")
        print(f"   New hash: {new_hash[:50]}...")
        
        # Test the new hash
        is_new_valid = verify_password("admin123", new_hash)
        print(f"   New hash verification: {'✅ VALID' if is_new_valid else '❌ INVALID'}")
        
        # Update the user's password if needed
        if not verify_password("admin123", admin_user.password_hash):
            print(f"\n🔄 Updating admin password hash...")
            admin_user.password_hash = new_hash
            db.commit()
            print(f"   ✅ Password updated successfully!")
            
            # Verify the update worked
            updated_user = db.query(User).filter(User.email == "admin@readnwin.com").first()
            final_check = verify_password("admin123", updated_user.password_hash)
            print(f"   Final verification: {'✅ SUCCESS' if final_check else '❌ FAILED'}")
        
    except Exception as e:
        print(f"❌ Error testing password: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    test_admin_password()