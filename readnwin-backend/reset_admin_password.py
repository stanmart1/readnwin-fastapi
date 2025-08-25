#!/usr/bin/env python3
"""
Script to reset admin password for ReadnWin application
"""

from core.database import SessionLocal
from models.user import User
from core.security import get_password_hash
import sys

def reset_admin_password(email="admin@readnwin.com", new_password="Admin123!"):
    """Reset admin password"""
    db = SessionLocal()
    try:
        # Find admin user
        admin_user = db.query(User).filter(User.email == email).first()
        
        if not admin_user:
            print(f"❌ Admin user with email {email} not found!")
            return False
        
        # Generate new password hash
        new_hash = get_password_hash(new_password)
        
        # Update password
        admin_user.password_hash = new_hash
        admin_user.is_active = True  # Ensure account is active
        
        db.commit()
        
        print(f"✅ Password reset successful for {email}")
        print(f"📧 Email: {email}")
        print(f"🔑 New Password: {new_password}")
        print(f"🔒 Password Hash: {new_hash}")
        print(f"✅ Account Active: {admin_user.is_active}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error resetting password: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def verify_admin_login(email="admin@readnwin.com", password="Admin123!"):
    """Verify admin can login with new password"""
    from core.security import verify_password
    
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == email).first()
        
        if not admin_user:
            print(f"❌ Admin user not found!")
            return False
        
        # Test password verification
        is_valid = verify_password(password, admin_user.password_hash)
        
        print(f"\n🔍 Login Verification Test:")
        print(f"📧 Email: {email}")
        print(f"🔑 Password: {password}")
        print(f"✅ Valid: {is_valid}")
        print(f"🏃 Active: {admin_user.is_active}")
        
        return is_valid
        
    except Exception as e:
        print(f"❌ Error verifying login: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 ReadnWin Admin Password Reset Tool")
    print("=" * 50)
    
    # Get email and password from command line or use defaults
    email = sys.argv[1] if len(sys.argv) > 1 else "admin@readnwin.com"
    password = sys.argv[2] if len(sys.argv) > 2 else "Admin123!"
    
    print(f"📧 Target Email: {email}")
    print(f"🔑 New Password: {password}")
    print()
    
    # Reset password
    if reset_admin_password(email, password):
        print()
        # Verify login works
        verify_admin_login(email, password)
        print()
        print("🎉 Admin password reset completed successfully!")
        print("You can now login with the new credentials.")
    else:
        print("❌ Password reset failed!")
        sys.exit(1)