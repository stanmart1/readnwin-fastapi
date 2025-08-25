#!/usr/bin/env python3
"""
Test script to verify all API endpoints are working correctly
"""

import requests
import json
import sys
import time

# Configuration
API_BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@readnwin.com"
ADMIN_PASSWORD = "admin123"

def login_admin():
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

def test_endpoint(name, url, headers, expected_status=200):
    """Test a single endpoint"""
    try:
        response = requests.get(url, headers=headers)

        if response.status_code == expected_status:
            try:
                data = response.json()
                if isinstance(data, list):
                    count = len(data)
                    print(f"✅ {name}: {count} items returned")
                elif isinstance(data, dict):
                    if "total_users" in data:
                        print(f"✅ {name}: total_users = {data['total_users']}")
                    elif "total" in data:
                        print(f"✅ {name}: total = {data['total']}")
                    else:
                        print(f"✅ {name}: Response OK")
                else:
                    print(f"✅ {name}: Response OK")
                return True
            except json.JSONDecodeError:
                print(f"✅ {name}: Response OK (non-JSON)")
                return True
        else:
            print(f"❌ {name}: HTTP {response.status_code} - {response.text[:100]}")
            return False
    except Exception as e:
        print(f"❌ {name}: Error - {e}")
        return False

def main():
    """Test all endpoints"""
    print("🧪 TESTING ALL API ENDPOINTS")
    print("=" * 60)

    # Wait for server to be ready
    print("⏳ Waiting for server to start...")
    time.sleep(3)

    # Step 1: Login
    print("\n🔑 Step 1: Admin Authentication")
    token = login_admin()
    if not token:
        print("❌ Cannot proceed without admin token")
        sys.exit(1)

    print("✅ Admin authentication successful")

    # Setup headers
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Step 2: Test all endpoints
    print("\n📊 Step 2: Testing All Endpoints")
    print("-" * 40)

    endpoints = [
        # User Count Related Endpoints
        ("User Stats Overview", f"{API_BASE_URL}/users/stats/overview"),
        ("Admin Stats Overview", f"{API_BASE_URL}/admin/stats/overview"),
        ("Admin Users", f"{API_BASE_URL}/admin/users"),
        ("Admin Users (with pagination)", f"{API_BASE_URL}/admin/users?skip=0&limit=10"),

        # Role and Permission Endpoints
        ("Admin Roles", f"{API_BASE_URL}/admin/roles"),
        ("RBAC Roles", f"{API_BASE_URL}/rbac/roles"),
        ("RBAC Permissions", f"{API_BASE_URL}/rbac/permissions"),

        # Other Admin Endpoints
        ("Admin Books", f"{API_BASE_URL}/admin/books"),
        ("Admin Categories", f"{API_BASE_URL}/admin/categories"),
        ("Admin Authors", f"{API_BASE_URL}/admin/authors"),
        ("Admin Orders", f"{API_BASE_URL}/admin/orders"),

        # Analytics Endpoints
        ("Growth Metrics", f"{API_BASE_URL}/admin/stats/growth-metrics"),
        ("Daily Activity", f"{API_BASE_URL}/admin/stats/daily-activity"),
        ("Monthly Trends", f"{API_BASE_URL}/admin/stats/monthly-trends"),
        ("Recent Activities", f"{API_BASE_URL}/admin/stats/recent-activities"),
    ]

    # Test all endpoints
    successful = 0
    total = len(endpoints)

    for name, url in endpoints:
        if test_endpoint(name, url, headers):
            successful += 1

    # Step 3: Summary
    print(f"\n🏁 SUMMARY")
    print("=" * 60)
    print(f"✅ Successful: {successful}/{total}")
    print(f"❌ Failed: {total - successful}/{total}")
    print(f"🎯 Success Rate: {(successful/total*100):.1f}%")

    if successful == total:
        print("🎉 ALL ENDPOINTS WORKING!")
        print("✅ User count fixes are properly integrated")
    elif successful >= total * 0.8:
        print("⚠️  MOSTLY WORKING - minor issues remain")
    else:
        print("❌ SIGNIFICANT ISSUES - needs attention")

    # Step 4: Specific User Count Check
    print(f"\n📊 Step 4: User Count Verification")
    print("-" * 40)

    user_count_endpoints = [
        ("Database Direct", "Check database manually"),
        ("User Stats API", f"{API_BASE_URL}/users/stats/overview"),
        ("Admin Stats API", f"{API_BASE_URL}/admin/stats/overview"),
        ("Admin Users API", f"{API_BASE_URL}/admin/users"),
    ]

    user_counts = {}

    # Test user stats
    try:
        response = requests.get(f"{API_BASE_URL}/users/stats/overview", headers=headers)
        if response.status_code == 200:
            data = response.json()
            user_counts["User Stats"] = data.get("total_users", "N/A")
        else:
            user_counts["User Stats"] = f"Error: {response.status_code}"
    except Exception as e:
        user_counts["User Stats"] = f"Error: {e}"

    # Test admin stats
    try:
        response = requests.get(f"{API_BASE_URL}/admin/stats/overview", headers=headers)
        if response.status_code == 200:
            data = response.json()
            user_counts["Admin Stats"] = data.get("total_users", "N/A")
        else:
            user_counts["Admin Stats"] = f"Error: {response.status_code}"
    except Exception as e:
        user_counts["Admin Stats"] = f"Error: {e}"

    # Test admin users
    try:
        response = requests.get(f"{API_BASE_URL}/admin/users", headers=headers)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict) and "total" in data:
                user_counts["Admin Users"] = data.get("total", "N/A")
            elif isinstance(data, list):
                user_counts["Admin Users"] = f"{len(data)} (legacy format)"
            else:
                user_counts["Admin Users"] = "Unknown format"
        else:
            user_counts["Admin Users"] = f"Error: {response.status_code}"
    except Exception as e:
        user_counts["Admin Users"] = f"Error: {e}"

    # Display user counts
    print("User count from different endpoints:")
    for source, count in user_counts.items():
        print(f"   {source}: {count}")

    # Check consistency
    valid_counts = []
    for source, count in user_counts.items():
        if isinstance(count, int):
            valid_counts.append(count)
        elif isinstance(count, str) and count.isdigit():
            valid_counts.append(int(count))

    if len(valid_counts) > 0:
        if len(set(valid_counts)) == 1:
            print(f"✅ CONSISTENT: All endpoints return {valid_counts[0]} users")
        else:
            print(f"⚠️  INCONSISTENT: Different counts found: {set(valid_counts)}")
    else:
        print("❌ NO VALID COUNTS: All endpoints returned errors")

    print("\n" + "=" * 60)
    return successful == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
