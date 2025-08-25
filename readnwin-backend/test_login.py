#!/usr/bin/env python3
"""
Test script to verify backend login functionality
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8000"
LOGIN_ENDPOINT = f"{BASE_URL}/auth/login"

def test_login():
    """Test the login endpoint with sample credentials"""

    print("🔍 Testing ReadnWin Backend Login Functionality")
    print("=" * 50)

    # Test data - you may need to adjust these credentials
    test_credentials = [
        {"email": "admin@example.com", "password": "admin123"},
        {"email": "test@example.com", "password": "test123"},
        {"email": "user@example.com", "password": "password123"}
    ]

    print(f"📡 Testing connection to: {BASE_URL}")

    # First, test if the server is running
    try:
        response = requests.get(BASE_URL, timeout=5)
        if response.status_code == 200:
            print("✅ Backend server is running")
            print(f"   Response: {response.json()}")
        else:
            print(f"⚠️  Backend server responded with status: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server")
        print("   Make sure the FastAPI server is running on port 8000")
        print("   Run: cd readnwin-backend && python run.py")
        return False
    except Exception as e:
        print(f"❌ Error connecting to backend: {e}")
        return False

    print("\n🔐 Testing Login Endpoint")
    print("-" * 30)

    # Test each credential set
    for i, creds in enumerate(test_credentials, 1):
        print(f"\nTest {i}: Attempting login with {creds['email']}")

        try:
            response = requests.post(
                LOGIN_ENDPOINT,
                headers={"Content-Type": "application/json"},
                json=creds,
                timeout=10
            )

            print(f"   Status Code: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print("   ✅ Login successful!")
                print(f"   User ID: {data.get('user', {}).get('id')}")
                print(f"   Email: {data.get('user', {}).get('email')}")
                print(f"   Role: {data.get('user', {}).get('role', {}).get('name', 'No role')}")
                print(f"   Token: {data.get('access_token', '')[:20]}...")
                return True

            elif response.status_code == 401:
                print("   ❌ Invalid credentials")
                try:
                    error_detail = response.json().get('detail', 'Unknown error')
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Raw response: {response.text}")

            elif response.status_code == 422:
                print("   ❌ Validation error")
                try:
                    errors = response.json().get('detail', [])
                    for error in errors:
                        print(f"   - {error.get('msg', error)}")
                except:
                    print(f"   Raw response: {response.text}")

            else:
                print(f"   ❌ Unexpected status code: {response.status_code}")
                print(f"   Response: {response.text}")

        except requests.exceptions.Timeout:
            print("   ❌ Request timed out")
        except requests.exceptions.ConnectionError:
            print("   ❌ Connection error")
        except Exception as e:
            print(f"   ❌ Error: {e}")

    print("\n" + "=" * 50)
    print("❌ All login attempts failed")
    print("\nNext steps:")
    print("1. Make sure the database is set up and running")
    print("2. Create a test user with one of the above credentials")
    print("3. Check the backend logs for detailed error messages")
    print("4. Verify the .env file has correct database settings")

    return False

def test_auth_endpoints():
    """Test other auth-related endpoints"""

    print("\n🔍 Testing Other Auth Endpoints")
    print("-" * 30)

    # Test check verification status
    try:
        response = requests.post(
            f"{BASE_URL}/auth/check-verification-status",
            headers={"Content-Type": "application/json"},
            json={"email": "test@example.com"},
            timeout=5
        )
        print(f"Check verification status: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {response.json()}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"Check verification status error: {e}")

if __name__ == "__main__":
    print("ReadnWin Backend Login Test")
    print("=" * 50)

    success = test_login()
    test_auth_endpoints()

    if success:
        print("\n✅ Backend login test completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Backend login test failed!")
        sys.exit(1)
