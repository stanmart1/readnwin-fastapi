#!/usr/bin/env python3
"""
Test script to verify admin API endpoints are working correctly
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"
TEST_EMAIL = "admin@readnwin.com"
TEST_PASSWORD = "admin123"

class AdminAPITester:
    def __init__(self):
        self.base_url = API_BASE_URL
        self.token = None
        self.session = requests.Session()

    def login(self):
        """Login and get authentication token"""
        print("🔐 Testing authentication...")

        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }

        try:
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json=login_data
            )

            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                if self.token:
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.token}"
                    })
                    print("✅ Authentication successful")
                    return True
                else:
                    print("❌ No access token in response")
                    return False
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                print(response.text)
                return False

        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False

    def test_endpoint(self, method, endpoint, data=None, description=""):
        """Test a single endpoint"""
        print(f"\n🧪 Testing {description or endpoint}...")

        try:
            url = f"{self.base_url}{endpoint}"

            if method.upper() == "GET":
                response = self.session.get(url)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(url)
            else:
                print(f"❌ Unsupported method: {method}")
                return False

            if response.status_code in [200, 201]:
                print(f"✅ {description or endpoint} - Status: {response.status_code}")

                # Try to parse JSON response
                try:
                    data = response.json()
                    if isinstance(data, dict) and data.get("total_users") is not None:
                        print(f"   📊 Users: {data.get('total_users', 0)}")
                    if isinstance(data, dict) and data.get("total_books") is not None:
                        print(f"   📚 Books: {data.get('total_books', 0)}")
                    if isinstance(data, list):
                        print(f"   📝 Items returned: {len(data)}")
                except:
                    print(f"   📄 Response length: {len(response.text)} chars")

                return True
            else:
                print(f"❌ {description or endpoint} - Status: {response.status_code}")
                print(f"   Error: {response.text[:200]}...")
                return False

        except Exception as e:
            print(f"❌ {description or endpoint} - Error: {e}")
            return False

    def run_tests(self):
        """Run all admin API tests"""
        print("🚀 Starting Admin API Integration Tests")
        print("=" * 50)

        # Authenticate first
        if not self.login():
            print("\n❌ Authentication failed. Cannot proceed with tests.")
            return False

        # Test results tracking
        tests = []

        # Core Admin Stats
        tests.append(("GET", "/admin/stats/overview", None, "Admin Overview Stats"))
        tests.append(("GET", "/admin/stats/reading-progress", None, "Reading Progress Stats"))
        tests.append(("GET", "/admin/notifications", None, "Admin Notifications"))

        # User Management
        tests.append(("GET", "/users", None, "Users List"))
        tests.append(("GET", "/admin/users/stats", None, "User Statistics"))

        # Books Management
        tests.append(("GET", "/admin/books", None, "Admin Books List"))
        tests.append(("GET", "/admin/categories", None, "Book Categories"))
        tests.append(("GET", "/admin/authors", None, "Authors List"))

        # Orders Management
        tests.append(("GET", "/admin/orders", None, "Orders List"))

        # Blog Management
        tests.append(("GET", "/blog/posts", None, "Blog Posts"))

        # Email Management
        tests.append(("GET", "/admin/email/templates", None, "Email Templates"))
        tests.append(("GET", "/admin/email/templates/categories", None, "Email Template Categories"))
        tests.append(("GET", "/admin/email/templates/stats", None, "Email Template Stats"))
        tests.append(("GET", "/admin/email/gateways", None, "Email Gateway Config"))

        # Enhanced Admin Features
        tests.append(("GET", "/admin/enhanced/settings", None, "System Settings"))
        tests.append(("GET", "/admin/enhanced/shipping/config", None, "Shipping Configurations"))
        tests.append(("GET", "/admin/enhanced/analytics/overview", None, "Enhanced Analytics"))

        # Content Management
        tests.append(("GET", "/contact/info", None, "Contact Information"))
        tests.append(("GET", "/faq", None, "FAQ List"))
        tests.append(("GET", "/about", None, "About Information"))

        # Run all tests
        passed = 0
        failed = 0

        for method, endpoint, data, description in tests:
            if self.test_endpoint(method, endpoint, data, description):
                passed += 1
            else:
                failed += 1

        # Test Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed / (passed + failed) * 100):.1f}%")

        if failed == 0:
            print("\n🎉 ALL TESTS PASSED! Admin API is fully integrated.")
        elif passed > failed:
            print(f"\n⚠️  Most endpoints working. {failed} endpoints need attention.")
        else:
            print(f"\n🚨 CRITICAL: {failed} endpoints failing. Requires immediate attention.")

        return failed == 0

def main():
    """Main test execution"""
    tester = AdminAPITester()

    print(f"Testing Admin API at: {API_BASE_URL}")
    print(f"Using credentials: {TEST_EMAIL}")
    print()

    success = tester.run_tests()

    if success:
        print("\n🏆 Admin dashboard is ready for production!")
        sys.exit(0)
    else:
        print("\n🔧 Some endpoints need fixes. Check the failed tests above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
