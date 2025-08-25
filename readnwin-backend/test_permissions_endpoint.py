#!/usr/bin/env python3
"""
Script to test the /auth/permissions endpoint for admin@readnwin.com
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import requests
import json
from core.security import create_access_token
from models.user import User
from core.database import get_db

def test_permissions_endpoint():
    """Test the permissions endpoint with admin credentials"""

    print("🧪 Testing /auth/permissions endpoint")
    print("=" * 60)

    # Get database session
    db = next(get_db())

    try:
        # Get admin user
        admin_user = db.query(User).filter(User.email == "admin@readnwin.com").first()
        if not admin_user:
            print("❌ Admin user not found!")
            return False

        print(f"✅ Found admin user: {admin_user.email}")
        print(f"   Role: {admin_user.role.name if admin_user.role else 'None'}")

        # Create token for the admin user
        token = create_access_token(data={"sub": str(admin_user.id)})
        print(f"✅ Created access token")

        # Test the permissions endpoint
        base_url = "http://localhost:8000"  # Adjust if your backend runs on different port
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        print(f"\n🔗 Making request to {base_url}/auth/permissions")

        try:
            response = requests.get(f"{base_url}/auth/permissions", headers=headers)

            print(f"📊 Response Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                permissions = data.get("permissions", [])

                print(f"✅ Permissions retrieved successfully!")
                print(f"📋 Total permissions: {len(permissions)}")
                print(f"\n🔑 Admin permissions:")

                # Check for critical dashboard permissions
                critical_perms = ["view_dashboard", "manage_users", "admin_access", "manage_books"]

                for perm in sorted(permissions):
                    marker = "🎯" if perm in critical_perms else "  "
                    print(f"   {marker} {perm}")

                # Check if all critical permissions are present
                missing_critical = [p for p in critical_perms if p not in permissions]
                if missing_critical:
                    print(f"\n❌ Missing critical permissions:")
                    for perm in missing_critical:
                        print(f"   - {perm}")
                    return False
                else:
                    print(f"\n✅ All critical dashboard permissions are present!")

                return True

            else:
                print(f"❌ Request failed with status {response.status_code}")
                print(f"Response: {response.text}")
                return False

        except requests.exceptions.ConnectionError:
            print(f"❌ Could not connect to backend at {base_url}")
            print(f"💡 Make sure the backend server is running")
            print(f"   Try: cd readnwin-backend && uvicorn main:app --reload --port 8000")
            return False

    except Exception as e:
        print(f"❌ Error testing permissions endpoint: {e}")
        return False
    finally:
        db.close()

def test_direct_permissions():
    """Test permissions directly from database"""

    print(f"\n🔍 Testing permissions directly from database")
    print("=" * 60)

    # Get database session
    db = next(get_db())

    try:
        # Get admin user with permissions
        admin_user = db.query(User).filter(User.email == "admin@readnwin.com").first()
        if not admin_user:
            print("❌ Admin user not found!")
            return False

        if not admin_user.role:
            print("❌ Admin user has no role!")
            return False

        print(f"✅ Admin user: {admin_user.email}")
        print(f"✅ Role: {admin_user.role.name} - {admin_user.role.display_name}")

        # Get permissions
        permissions = []
        if admin_user.role.permissions:
            permissions = [rp.permission.name for rp in admin_user.role.permissions]

        print(f"✅ Permissions from database: {len(permissions)} total")

        # Show permissions that would be returned by the API
        result = {"permissions": permissions}
        print(f"\n📋 API Response would be:")
        print(json.dumps(result, indent=2))

        return True

    except Exception as e:
        print(f"❌ Error testing direct permissions: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 ReadnWin Permissions Endpoint Test")
    print("=" * 60)

    # Test direct database access first
    db_success = test_direct_permissions()

    if db_success:
        # Test the actual endpoint
        api_success = test_permissions_endpoint()

        if api_success:
            print(f"\n🎉 All tests passed!")
            print(f"💡 The admin@readnwin.com user should now be able to access the admin dashboard")
            print(f"\n🎯 To verify in browser:")
            print(f"   1. Go to your frontend (usually http://localhost:3000)")
            print(f"   2. Log in as admin@readnwin.com with password: admin123")
            print(f"   3. Navigate to /admin")
            print(f"   4. You should see the full admin dashboard with all tabs accessible")
        else:
            print(f"\n⚠️  Database permissions are correct, but API endpoint test failed")
            print(f"💡 This might be because the backend server is not running")
    else:
        print(f"\n❌ Database permissions test failed")
        print(f"💡 Try running the fix_admin_permissions.py script again")
