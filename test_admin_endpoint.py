#!/usr/bin/env python3
"""
Simple test script to verify admin stats endpoint is working
"""

import requests
import json
import sys

# Configuration
API_BASE_URL = "http://localhost:8000"
TEST_EMAIL = "admin@readnwin.com"
TEST_PASSWORD = "admin123"

def test_admin_endpoint():
    """Test the admin stats endpoint"""
    print("🧪 Testing Admin Stats Endpoint")
    print("=" * 40)

    # First, test health endpoint
    try:
        print("1. Testing health endpoint...")
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

    # Test authentication
    try:
        print("\n2. Testing authentication...")
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }

        response = requests.post(f"{API_BASE_URL}/auth/login", json=login_data)

        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            if token:
                print("✅ Authentication successful")
            else:
                print("❌ No access token received")
                return False
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return False

    # Test admin stats endpoint
    try:
        print("\n3. Testing admin stats endpoint...")
        headers = {"Authorization": f"Bearer {token}"}

        response = requests.get(f"{API_BASE_URL}/admin/stats/overview", headers=headers)

        if response.status_code == 200:
            data = response.json()
            print("✅ Admin stats endpoint working")
            print(f"📊 Total Users: {data.get('total_users', 0)}")
            print(f"📚 Total Books: {data.get('total_books', 0)}")
            print(f"🛒 Total Orders: {data.get('total_orders', 0)}")
            print(f"💰 Total Revenue: ₦{data.get('total_revenue', 0)}")
            return True
        else:
            print(f"❌ Admin stats failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Admin stats error: {e}")
        return False

def main():
    """Main test execution"""
    print(f"Testing API at: {API_BASE_URL}")
    print(f"Using credentials: {TEST_EMAIL}")
    print()

    success = test_admin_endpoint()

    if success:
        print("\n🎉 All tests passed! Admin endpoint is working correctly.")
        sys.exit(0)
    else:
        print("\n🚨 Tests failed. Check the output above for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()
