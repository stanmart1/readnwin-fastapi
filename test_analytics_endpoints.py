#!/usr/bin/env python3
"""
Test script for new admin analytics endpoints
Tests all the newly added analytics endpoints to ensure they return proper data
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "admin@readnwin.com"
TEST_USER_PASSWORD = "admin123"

def get_auth_token():
    """Get authentication token for admin user"""
    login_data = {
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    }

    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get("access_token")
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_endpoint(endpoint, token, description):
    """Test a specific endpoint"""
    headers = {"Authorization": f"Bearer {token}"}

    try:
        print(f"\n🔄 Testing {description}...")
        print(f"   Endpoint: {endpoint}")

        response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)

        if response.status_code == 200:
            data = response.json()
            print(f"✅ {description} - SUCCESS")
            print(f"   Response keys: {list(data.keys()) if isinstance(data, dict) else 'Non-dict response'}")

            # Print sample data for verification
            if isinstance(data, dict):
                for key, value in data.items():
                    if isinstance(value, list) and len(value) > 0:
                        print(f"   {key}: {len(value)} items (sample: {value[0] if value else 'empty'})")
                    else:
                        print(f"   {key}: {value}")
            return True
        else:
            print(f"❌ {description} - FAILED")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            return False

    except Exception as e:
        print(f"❌ {description} - ERROR: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting Analytics Endpoints Test")
    print("=" * 50)

    # Get authentication token
    print("🔑 Getting authentication token...")
    token = get_auth_token()

    if not token:
        print("❌ Failed to get authentication token. Exiting.")
        sys.exit(1)

    print(f"✅ Authentication successful")

    # Test endpoints
    endpoints_to_test = [
        ("/admin/stats/overview", "Overview Stats"),
        ("/admin/stats/daily-activity", "Daily Activity"),
        ("/admin/stats/monthly-trends", "Monthly Trends"),
        ("/admin/stats/recent-activities", "Recent Activities"),
        ("/admin/stats/growth-metrics", "Growth Metrics"),
        ("/admin/enhanced/analytics/overview", "Enhanced Analytics")
    ]

    results = []
    for endpoint, description in endpoints_to_test:
        success = test_endpoint(endpoint, token, description)
        results.append((description, success))

    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)

    successful = sum(1 for _, success in results if success)
    total = len(results)

    for description, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {description}")

    print(f"\nResults: {successful}/{total} endpoints working")

    if successful == total:
        print("🎉 All analytics endpoints are working correctly!")
        return 0
    else:
        print("⚠️  Some endpoints need attention.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
