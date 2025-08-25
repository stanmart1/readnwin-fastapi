#!/usr/bin/env python3
"""
Test script to verify the admin users endpoint returns the correct total count
"""

import requests
import json
import sys
import os

# Configuration
API_BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@readnwin.com"
ADMIN_PASSWORD = "admin123"

def login_as_admin():
    """Login as admin and get access token"""
    login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(f"{API_BASE_URL}/auth/login", json=login_data, headers=headers)
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get("access_token")
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_admin_users_endpoint(token):
    """Test the admin users endpoint"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print("🔍 Testing /admin/users endpoint...")

    try:
        # Test without pagination parameters
        response = requests.get(f"{API_BASE_URL}/admin/users", headers=headers)

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Admin users endpoint successful")
            print(f"📊 Response structure: {type(data)}")

            if isinstance(data, dict) and "users" in data and "total" in data:
                print(f"✅ New pagination format detected")
                print(f"📊 Total users in database: {data['total']}")
                print(f"📊 Users returned in this page: {len(data['users'])}")
                print(f"📊 Skip: {data.get('skip', 0)}")
                print(f"📊 Limit: {data.get('limit', 50)}")
                print(f"📊 Has more: {data.get('has_more', False)}")

                # Verify some user data
                if data['users']:
                    user = data['users'][0]
                    print(f"📋 Sample user fields: {list(user.keys())}")

                return data['total']
            elif isinstance(data, list):
                print(f"⚠️ Legacy format detected (array of users)")
                print(f"📊 Users returned: {len(data)}")

                # Test with pagination to see if it's paginated
                response_page2 = requests.get(f"{API_BASE_URL}/admin/users?skip=50&limit=50", headers=headers)
                if response_page2.status_code == 200:
                    page2_data = response_page2.json()
                    if isinstance(page2_data, list) and len(page2_data) > 0:
                        print(f"📊 Page 2 has {len(page2_data)} users - pagination works")
                    else:
                        print(f"📊 Page 2 empty - all users fit in first page")

                return len(data)
            else:
                print(f"❌ Unexpected response format: {type(data)}")
                return None
        else:
            print(f"❌ Request failed: {response.status_code} - {response.text}")
            return None

    except Exception as e:
        print(f"❌ Request error: {e}")
        return None

def test_user_stats_endpoint(token):
    """Test the user stats endpoint for comparison"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print("\n🔍 Testing /users/stats/overview endpoint...")

    try:
        response = requests.get(f"{API_BASE_URL}/users/stats/overview", headers=headers)

        if response.status_code == 200:
            data = response.json()
            print(f"✅ User stats endpoint successful")
            print(f"📊 Total users from stats: {data.get('total_users', 'N/A')}")
            print(f"📊 Active users: {data.get('active_users', 'N/A')}")
            print(f"📊 Inactive users: {data.get('inactive_users', 'N/A')}")
            return data.get('total_users')
        else:
            print(f"❌ User stats request failed: {response.status_code} - {response.text}")
            return None

    except Exception as e:
        print(f"❌ User stats error: {e}")
        return None

def test_overview_stats_endpoint(token):
    """Test the overview stats endpoint for comparison"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print("\n🔍 Testing /admin/stats/overview endpoint...")

    try:
        response = requests.get(f"{API_BASE_URL}/admin/stats/overview", headers=headers)

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Overview stats endpoint successful")
            print(f"📊 Total users from overview: {data.get('total_users', 'N/A')}")
            print(f"📊 Total books: {data.get('total_books', 'N/A')}")
            print(f"📊 Total orders: {data.get('total_orders', 'N/A')}")
            print(f"📊 Total revenue: ₦{data.get('total_revenue', 'N/A')}")
            return data.get('total_users')
        else:
            print(f"❌ Overview stats request failed: {response.status_code} - {response.text}")
            return None

    except Exception as e:
        print(f"❌ Overview stats error: {e}")
        return None

def main():
    print("🧪 Admin Users Count Test")
    print("=" * 50)

    # Step 1: Login
    print("🔑 Step 1: Logging in as admin...")
    token = login_as_admin()
    if not token:
        print("❌ Cannot proceed without admin token")
        sys.exit(1)

    print(f"✅ Login successful, token received")

    # Step 2: Test admin users endpoint
    print("\n📊 Step 2: Testing admin users endpoint...")
    admin_users_count = test_admin_users_endpoint(token)

    # Step 3: Test user stats endpoint for comparison
    print("\n📊 Step 3: Testing user stats endpoint...")
    user_stats_count = test_user_stats_endpoint(token)

    # Step 4: Test overview stats endpoint for comparison
    print("\n📊 Step 4: Testing overview stats endpoint...")
    overview_stats_count = test_overview_stats_endpoint(token)

    # Step 5: Compare results
    print("\n🔍 Step 5: Comparing results...")
    print("=" * 50)
    print(f"📊 Admin users endpoint count: {admin_users_count}")
    print(f"📊 User stats endpoint count: {user_stats_count}")
    print(f"📊 Overview stats endpoint count: {overview_stats_count}")

    # Check if all counts match
    counts = [admin_users_count, user_stats_count, overview_stats_count]
    valid_counts = [c for c in counts if c is not None]

    if len(valid_counts) == 0:
        print("❌ No valid counts received from any endpoint")
        sys.exit(1)
    elif len(set(valid_counts)) == 1:
        print(f"✅ All endpoints return consistent count: {valid_counts[0]}")
        print(f"🎉 SUCCESS: User count is consistent across all admin endpoints!")
    else:
        print(f"⚠️ Inconsistent counts detected: {valid_counts}")
        print(f"🔧 ISSUE: User counts are not consistent across endpoints")

        # Recommend which count to trust
        if overview_stats_count is not None:
            print(f"💡 Recommendation: Trust overview stats count ({overview_stats_count}) as it comes from admin dashboard")
        elif user_stats_count is not None:
            print(f"💡 Recommendation: Trust user stats count ({user_stats_count}) as fallback")

    print("\n🏁 Test completed!")

if __name__ == "__main__":
    main()
