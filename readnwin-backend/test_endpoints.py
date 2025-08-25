#!/usr/bin/env python3
"""
Test script to verify backend endpoints are working correctly
Run this after starting the backend server to check all endpoints
"""

import requests
import json
import os
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpass123"
TEST_ADMIN_EMAIL = "admin@example.com"
TEST_ADMIN_PASSWORD = "adminpass123"

class EndpointTester:
    def __init__(self):
        self.session = requests.Session()
        self.user_token = None
        self.admin_token = None

    def print_result(self, test_name, success, message="", data=None):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if message:
            print(f"    {message}")
        if data and isinstance(data, dict):
            print(f"    Response: {json.dumps(data, indent=2)[:200]}...")
        print()

    def test_auth_endpoints(self):
        print("🔐 Testing Authentication Endpoints")
        print("=" * 50)

        # Test user login
        try:
            response = self.session.post(f"{BASE_URL}/auth/login",
                json={
                    "email": TEST_USER_EMAIL,
                    "password": TEST_USER_PASSWORD
                })

            if response.status_code == 200:
                data = response.json()
                self.user_token = data.get("access_token")
                self.print_result("User Login", True, f"Token: {self.user_token[:20]}...")
            else:
                self.print_result("User Login", False, f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            self.print_result("User Login", False, f"Exception: {str(e)}")

        # Test admin login
        try:
            response = self.session.post(f"{BASE_URL}/auth/login",
                json={
                    "email": TEST_ADMIN_EMAIL,
                    "password": TEST_ADMIN_PASSWORD
                })

            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                self.print_result("Admin Login", True, f"Token: {self.admin_token[:20]}...")
            else:
                self.print_result("Admin Login", False, f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            self.print_result("Admin Login", False, f"Exception: {str(e)}")

    def test_admin_endpoints(self):
        print("👑 Testing Admin Endpoints")
        print("=" * 50)

        if not self.admin_token:
            self.print_result("Admin Endpoints", False, "No admin token available")
            return

        headers = {"Authorization": f"Bearer {self.admin_token}"}

        # Test admin stats overview
        try:
            response = self.session.get(f"{BASE_URL}/admin/stats/overview", headers=headers)
            if response.status_code == 200:
                data = response.json()
                self.print_result("Admin Stats Overview", True,
                    f"Users: {data.get('total_users', 0)}, Books: {data.get('total_books', 0)}")
            else:
                self.print_result("Admin Stats Overview", False,
                    f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            self.print_result("Admin Stats Overview", False, f"Exception: {str(e)}")

        # Test admin reading progress
        try:
            response = self.session.get(f"{BASE_URL}/admin/stats/reading-progress", headers=headers)
            if response.status_code == 200:
                data = response.json()
                self.print_result("Admin Reading Progress", True,
                    f"Total readers: {data.get('total_readers', 0)}")
            else:
                self.print_result("Admin Reading Progress", False,
                    f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            self.print_result("Admin Reading Progress", False, f"Exception: {str(e)}")

        # Test admin notifications
        try:
            response = self.session.get(f"{BASE_URL}/admin/notifications", headers=headers)
            if response.status_code == 200:
                data = response.json()
                self.print_result("Admin Notifications", True,
                    f"Count: {len(data) if isinstance(data, list) else 0}")
            else:
                self.print_result("Admin Notifications", False,
                    f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            self.print_result("Admin Notifications", False, f"Exception: {str(e)}")

        # Test admin orders
        try:
            response = self.session.get(f"{BASE_URL}/admin/orders", headers=headers)
            if response.status_code == 200:
                data = response.json()
                self.print_result("Admin Orders", True,
                    f"Orders count: {len(data) if isinstance(data, list) else 0}")
            else:
                self.print_result("Admin Orders", False,
                    f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            self.print_result("Admin Orders", False, f"Exception: {str(e)}")

    def test_user_endpoints(self):
        print("👤 Testing User Endpoints")
        print("=" * 50)

        if not self.user_token:
            self.print_result("User Endpoints", False, "No user token available")
            return

        headers = {"Authorization": f"Bearer {self.user_token}"}

        # Test user profile
        try:
            response = self.session.get(f"{BASE_URL}/user/profile", headers=headers)
            if response.status_code == 200:
                data = response.json()
                self.print_result("User Profile", True,
                    f"Email: {data.get('email', 'N/A')}")
            else:
                self.print_result("User Profile", False,
                    f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            self.print_result("User Profile", False, f"Exception: {str(e)}")

        # Test user library
        try:
            response = self.session.get(f"{BASE_URL}/user/library", headers=headers)
            if response.status_code == 200:
                data = response.json()
                self.print_result("User Library", True,
                    f"Total books: {data.get('total_books', 0)}")
            else:
                self.print_result("User Library", False,
                    f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            self.print_result("User Library", False, f"Exception: {str(e)}")

        # Test user reading stats
        try:
            response = self.session.get(f"{BASE_URL}/user/reading-stats", headers=headers)
            if response.status_code == 200:
                data = response.json()
                self.print_result("User Reading Stats", True,
                    f"Books completed: {data.get('books_completed', 0)}")
            else:
                self.print_result("User Reading Stats", False,
                    f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            self.print_result("User Reading Stats", False, f"Exception: {str(e)}")

    def test_dashboard_endpoints(self):
        print("📊 Testing Dashboard Endpoints")
        print("=" * 50)

        if not self.user_token:
            self.print_result("Dashboard Endpoints", False, "No user token available")
            return

        headers = {"Authorization": f"Bearer {self.user_token}"}

        # Test dashboard data
        try:
            response = self.session.get(f"{BASE_URL}/dashboard/data", headers=headers)
            if response.status_code == 200:
                data = response.json()
                self.print_result("Dashboard Data", True,
                    f"User: {data.get('user', {}).get('email', 'N/A')}")
            else:
                self.print_result("Dashboard Data", False,
                    f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            self.print_result("Dashboard Data", False, f"Exception: {str(e)}")

        # Test dashboard initialize
        try:
            response = self.session.post(f"{BASE_URL}/dashboard/initialize", headers=headers)
            if response.status_code == 200:
                data = response.json()
                self.print_result("Dashboard Initialize", True,
                    f"User ID: {data.get('user_id', 'N/A')}")
            else:
                self.print_result("Dashboard Initialize", False,
                    f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            self.print_result("Dashboard Initialize", False, f"Exception: {str(e)}")

        # Test dashboard summary
        try:
            response = self.session.get(f"{BASE_URL}/dashboard/summary", headers=headers)
            if response.status_code == 200:
                data = response.json()
                self.print_result("Dashboard Summary", True,
                    f"Library count: {data.get('library_count', 0)}")
            else:
                self.print_result("Dashboard Summary", False,
                    f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            self.print_result("Dashboard Summary", False, f"Exception: {str(e)}")

        # Test activity feed
        try:
            response = self.session.get(f"{BASE_URL}/dashboard/activity", headers=headers)
            if response.status_code == 200:
                data = response.json()
                self.print_result("Dashboard Activity", True,
                    f"Activities: {len(data.get('activities', []))}")
            else:
                self.print_result("Dashboard Activity", False,
                    f"Status: {response.status_code}, Error: {response.text}")
        except Exception as e:
            self.print_result("Dashboard Activity", False, f"Exception: {str(e)}")

    def test_database_connectivity(self):
        print("🗄️ Testing Database Connectivity")
        print("=" * 50)

        # Test basic endpoint that should work without auth
        try:
            response = self.session.get(f"{BASE_URL}/")
            if response.status_code == 200:
                data = response.json()
                self.print_result("Server Health", True, data.get("message", ""))
            else:
                self.print_result("Server Health", False, f"Status: {response.status_code}")
        except Exception as e:
            self.print_result("Server Health", False, f"Exception: {str(e)}")

        # Test books endpoint (should work without auth for listing)
        try:
            response = self.session.get(f"{BASE_URL}/books/")
            if response.status_code in [200, 404]:  # 404 is OK if no books exist
                self.print_result("Books Endpoint", True, f"Status: {response.status_code}")
            else:
                self.print_result("Books Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.print_result("Books Endpoint", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        print("🧪 ReadnWin Backend Endpoint Tests")
        print("=" * 50)
        print(f"Testing against: {BASE_URL}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print()

        # Test database connectivity first
        self.test_database_connectivity()

        # Test authentication
        self.test_auth_endpoints()

        # Test admin endpoints (requires admin token)
        self.test_admin_endpoints()

        # Test user endpoints (requires user token)
        self.test_user_endpoints()

        # Test dashboard endpoints (requires user token)
        self.test_dashboard_endpoints()

        print("🏁 Test Summary")
        print("=" * 50)
        print("Tests completed. Check the results above for any failures.")
        print("If tests fail due to missing users, create them first:")
        print(f"  - User: {TEST_USER_EMAIL} / {TEST_USER_PASSWORD}")
        print(f"  - Admin: {TEST_ADMIN_EMAIL} / {TEST_ADMIN_PASSWORD}")
        print()
        print("To create users, you can use the backend's create_admin_user.py script")
        print("or register through the frontend.")

def main():
    """Main function to run all tests"""
    tester = EndpointTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
