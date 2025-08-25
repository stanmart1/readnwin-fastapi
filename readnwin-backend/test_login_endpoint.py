#!/usr/bin/env python3
"""
Script to test the login endpoint directly and debug authentication issues
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import requests
import json
from core.security import verify_password
from models.user import User
from core.database import get_db

def test_login_endpoint():
    """Test the login endpoint with admin credentials"""

    print("🧪 Testing /auth/login endpoint")
    print("=" * 60)

    # Test credentials
    test_email = "admin@readnwin.com"
    test_password = "admin123"

    print(f"📧 Email: {test_email}")
    print(f"🔑 Password: {test_password}")

    # First, verify the user exists in database
    db = next(get_db())
    try:
        admin_user = db.query(User).filter(User.email == test_email).first()
        if not admin_user:
            print("❌ Admin user not found in database!")
            return False

        print(f"✅ User found in database:")
        print(f"   ID: {admin_user.id}")
        print(f"   Email: {admin_user.email}")
        print(f"   Username: {admin_user.username}")
        print(f"   Active: {admin_user.is_active}")
        print(f"   Email Verified: {admin_user.is_email_verified}")
        print(f"   Role: {admin_user.role.name if admin_user.role else 'None'}")

        # Test password verification
        password_valid = verify_password(test_password, admin_user.password_hash)
        print(f"   Password Valid: {password_valid}")

        if not password_valid:
            print("❌ Password verification failed!")
            print("💡 The stored password hash might be incorrect")
            return False

        if not admin_user.is_active:
            print("❌ User account is not active!")
            return False

    except Exception as e:
        print(f"❌ Database error: {e}")
        return False
    finally:
        db.close()

    # Now test the actual login endpoint
    base_url = "http://localhost:8000"
    login_url = f"{base_url}/auth/login"

    login_data = {
        "email": test_email,
        "password": test_password
    }

    headers = {
        "Content-Type": "application/json"
    }

    print(f"\n🔗 Making POST request to {login_url}")
    print(f"📤 Request data: {json.dumps(login_data, indent=2)}")

    try:
        response = requests.post(login_url, json=login_data, headers=headers)

        print(f"\n📊 Response Status: {response.status_code}")
        print(f"📤 Response Headers: {dict(response.headers)}")

        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✅ Login successful!")
                print(f"📋 Response data:")
                print(json.dumps(data, indent=2))

                # Verify token is present
                if "access_token" in data:
                    print(f"🎯 Access token received: {data['access_token'][:50]}...")
                else:
                    print(f"⚠️  No access token in response")

                # Verify user data
                if "user" in data:
                    user_data = data["user"]
                    print(f"👤 User data received:")
                    print(f"   Email: {user_data.get('email')}")
                    print(f"   Role: {user_data.get('role', {}).get('name') if user_data.get('role') else 'None'}")
                    print(f"   Permissions: {len(user_data.get('permissions', []))} total")

                return True

            except json.JSONDecodeError as e:
                print(f"❌ Invalid JSON response: {e}")
                print(f"Raw response: {response.text}")
                return False

        else:
            print(f"❌ Login failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Raw error response: {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        print(f"❌ Could not connect to backend at {base_url}")
        print(f"💡 Make sure the backend server is running")
        print(f"   Try: cd readnwin-backend && uvicorn main:app --reload --port 8000")
        return False

    except Exception as e:
        print(f"❌ Request error: {e}")
        return False

def test_password_reset():
    """Test if we need to reset the admin password"""

    print(f"\n🔧 Testing password reset for admin user")
    print("=" * 60)

    db = next(get_db())
    try:
        from core.security import get_password_hash

        admin_user = db.query(User).filter(User.email == "admin@readnwin.com").first()
        if not admin_user:
            print("❌ Admin user not found!")
            return False

        # Test different possible passwords
        test_passwords = ["admin123", "Admin123!", "admin", "readnwin123"]

        print(f"🔍 Testing different passwords for {admin_user.email}:")

        for pwd in test_passwords:
            is_valid = verify_password(pwd, admin_user.password_hash)
            print(f"   Password '{pwd}': {'✅ VALID' if is_valid else '❌ Invalid'}")

            if is_valid:
                print(f"🎯 Found working password: {pwd}")
                return True

        # If no password works, reset to admin123
        print(f"\n🔄 Resetting password to 'admin123'")
        new_hash = get_password_hash("admin123")
        admin_user.password_hash = new_hash
        admin_user.is_active = True
        admin_user.is_email_verified = True
        db.commit()

        print(f"✅ Password reset completed")
        print(f"🔑 New credentials: admin@readnwin.com / admin123")

        return True

    except Exception as e:
        print(f"❌ Error resetting password: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def check_backend_status():
    """Check if backend is running and responsive"""

    print(f"\n🏥 Checking backend health")
    print("=" * 60)

    base_url = "http://localhost:8000"

    try:
        # Check root endpoint
        response = requests.get(f"{base_url}/", timeout=5)
        print(f"✅ Backend is running at {base_url}")
        print(f"   Status: {response.status_code}")

        # Check docs endpoint
        docs_response = requests.get(f"{base_url}/docs", timeout=5)
        print(f"✅ API docs available at {base_url}/docs")

        return True

    except requests.exceptions.ConnectionError:
        print(f"❌ Backend not running at {base_url}")
        print(f"💡 Start backend with: cd readnwin-backend && uvicorn main:app --reload --port 8000")
        return False

    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 ReadnWin Login Endpoint Test")
    print("=" * 60)

    # Check backend status
    backend_running = check_backend_status()

    if backend_running:
        # Test login
        login_success = test_login_endpoint()

        if not login_success:
            print(f"\n🔧 Login failed, attempting password reset...")
            reset_success = test_password_reset()

            if reset_success:
                print(f"\n🔄 Retesting login after password reset...")
                final_test = test_login_endpoint()

                if final_test:
                    print(f"\n🎉 Login test passed after password reset!")
                else:
                    print(f"\n❌ Login still failing after password reset")
            else:
                print(f"\n❌ Password reset failed")
        else:
            print(f"\n🎉 Login test passed!")

    print(f"\n🎯 Summary:")
    print(f"   Backend Running: {'✅' if backend_running else '❌'}")
    if backend_running:
        print(f"   If login works: Try logging in at your frontend")
        print(f"   If login fails: Check the error messages above")
    else:
        print(f"   Start the backend server first")
