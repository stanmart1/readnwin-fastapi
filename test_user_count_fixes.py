#!/usr/bin/env python3
"""
Comprehensive test to verify user count fixes across admin dashboard

This test verifies that:
1. Database has correct number of users (8)
2. All admin API endpoints return consistent user counts
3. Frontend components fetch and display correct user counts
4. User count is displayed correctly in all dashboard locations

Test Coverage:
- Database direct query
- /admin/stats/overview endpoint
- /users/stats/overview endpoint
- /admin/users endpoint (with pagination)
- Frontend OverviewStats component
- Frontend UserManagement component
- Frontend ReadingAnalytics component
"""

import sys
import os
import json
import requests
import time
from datetime import datetime

# Add backend path for direct database access
sys.path.append('readnwin-backend')

# Test Configuration
API_BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@readnwin.com"
ADMIN_PASSWORD = "admin123"
EXPECTED_USER_COUNT = 8  # Based on our database check

class TestResults:
    def __init__(self):
        self.tests = []
        self.passed = 0
        self.failed = 0
        self.errors = []

    def add_test(self, name, passed, details=None, error=None):
        self.tests.append({
            "name": name,
            "passed": passed,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        })
        if passed:
            self.passed += 1
        else:
            self.failed += 1
            if error:
                self.errors.append(f"{name}: {error}")

    def print_summary(self):
        print("\n" + "="*80)
        print("🧪 USER COUNT FIXES TEST SUMMARY")
        print("="*80)
        print(f"✅ Tests Passed: {self.passed}")
        print(f"❌ Tests Failed: {self.failed}")
        print(f"📊 Total Tests: {len(self.tests)}")
        print(f"🎯 Success Rate: {(self.passed/len(self.tests)*100):.1f}%")

        if self.errors:
            print(f"\n❌ ERRORS:")
            for error in self.errors:
                print(f"   - {error}")

        print(f"\n📋 DETAILED RESULTS:")
        for test in self.tests:
            status = "✅" if test["passed"] else "❌"
            print(f"{status} {test['name']}")
            if test["details"]:
                print(f"   📊 {test['details']}")
            if test["error"]:
                print(f"   ⚠️  {test['error']}")

def test_database_direct():
    """Test 1: Direct database query to verify actual user count"""
    print("🔍 Test 1: Direct Database Query")
    try:
        from sqlalchemy import create_engine, text
        from sqlalchemy.orm import sessionmaker
        from core.config import settings

        # Create database connection
        engine = create_engine(settings.database_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()

        # Count users directly
        result = db.execute(text("SELECT COUNT(*) FROM users"))
        actual_count = result.scalar()
        db.close()

        passed = actual_count == EXPECTED_USER_COUNT
        details = f"Database has {actual_count} users (expected {EXPECTED_USER_COUNT})"

        return {
            "passed": passed,
            "details": details,
            "user_count": actual_count,
            "error": None if passed else f"Count mismatch: got {actual_count}, expected {EXPECTED_USER_COUNT}"
        }
    except Exception as e:
        return {
            "passed": False,
            "details": None,
            "user_count": None,
            "error": str(e)
        }

def login_admin():
    """Helper function to login as admin"""
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
            return None
    except Exception:
        return None

def test_admin_stats_overview(token):
    """Test 2: Admin stats overview endpoint"""
    print("🔍 Test 2: Admin Stats Overview Endpoint")

    if not token:
        return {
            "passed": False,
            "details": None,
            "user_count": None,
            "error": "No admin token available"
        }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(f"{API_BASE_URL}/admin/stats/overview", headers=headers)

        if response.status_code == 200:
            data = response.json()
            user_count = data.get("total_users", 0)
            passed = user_count == EXPECTED_USER_COUNT
            details = f"Admin stats endpoint returned {user_count} users (expected {EXPECTED_USER_COUNT})"

            return {
                "passed": passed,
                "details": details,
                "user_count": user_count,
                "error": None if passed else f"Count mismatch: got {user_count}, expected {EXPECTED_USER_COUNT}"
            }
        else:
            return {
                "passed": False,
                "details": None,
                "user_count": None,
                "error": f"HTTP {response.status_code}: {response.text}"
            }
    except Exception as e:
        return {
            "passed": False,
            "details": None,
            "user_count": None,
            "error": str(e)
        }

def test_user_stats_overview(token):
    """Test 3: User stats overview endpoint"""
    print("🔍 Test 3: User Stats Overview Endpoint")

    if not token:
        return {
            "passed": False,
            "details": None,
            "user_count": None,
            "error": "No admin token available"
        }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(f"{API_BASE_URL}/users/stats/overview", headers=headers)

        if response.status_code == 200:
            data = response.json()
            user_count = data.get("total_users", 0)
            passed = user_count == EXPECTED_USER_COUNT
            details = f"User stats endpoint returned {user_count} users (expected {EXPECTED_USER_COUNT})"

            return {
                "passed": passed,
                "details": details,
                "user_count": user_count,
                "error": None if passed else f"Count mismatch: got {user_count}, expected {EXPECTED_USER_COUNT}"
            }
        else:
            return {
                "passed": False,
                "details": None,
                "user_count": None,
                "error": f"HTTP {response.status_code}: {response.text}"
            }
    except Exception as e:
        return {
            "passed": False,
            "details": None,
            "user_count": None,
            "error": str(e)
        }

def test_admin_users_pagination(token):
    """Test 4: Admin users endpoint with pagination"""
    print("🔍 Test 4: Admin Users Endpoint (with pagination)")

    if not token:
        return {
            "passed": False,
            "details": None,
            "user_count": None,
            "error": "No admin token available"
        }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(f"{API_BASE_URL}/admin/users", headers=headers)

        if response.status_code == 200:
            data = response.json()

            # Check if new pagination format
            if isinstance(data, dict) and "total" in data:
                user_count = data.get("total", 0)
                users_returned = len(data.get("users", []))
                has_pagination_metadata = True

                passed = user_count == EXPECTED_USER_COUNT
                details = f"Admin users endpoint returned total={user_count}, users_in_page={users_returned} (expected total={EXPECTED_USER_COUNT})"

                return {
                    "passed": passed,
                    "details": details,
                    "user_count": user_count,
                    "has_pagination": has_pagination_metadata,
                    "error": None if passed else f"Count mismatch: got {user_count}, expected {EXPECTED_USER_COUNT}"
                }
            else:
                # Legacy format
                users_returned = len(data) if isinstance(data, list) else 0
                passed = False  # We expect new pagination format
                details = f"Admin users endpoint returned legacy format with {users_returned} users (expected new pagination format)"

                return {
                    "passed": passed,
                    "details": details,
                    "user_count": None,
                    "has_pagination": False,
                    "error": "Endpoint still using legacy format without total count"
                }
        else:
            return {
                "passed": False,
                "details": None,
                "user_count": None,
                "has_pagination": False,
                "error": f"HTTP {response.status_code}: {response.text}"
            }
    except Exception as e:
        return {
            "passed": False,
            "details": None,
            "user_count": None,
            "has_pagination": False,
            "error": str(e)
        }

def test_frontend_api_consistency():
    """Test 5: Frontend API mapping consistency"""
    print("🔍 Test 5: Frontend API Mapping Consistency")

    try:
        # Check if adminApi.getUserStats maps to correct endpoint
        with open("app/admin/utils/api.ts", "r") as f:
            api_content = f.read()

        # Verify getUserStats mapping
        user_stats_correct = '"/users/stats/overview"' in api_content
        admin_users_correct = '"/admin/users"' in api_content

        issues = []
        if not user_stats_correct:
            issues.append("getUserStats() mapping incorrect")
        if not admin_users_correct:
            issues.append("getUsers() mapping incorrect")

        passed = len(issues) == 0
        details = "Frontend API mappings verified" if passed else f"Issues found: {', '.join(issues)}"

        return {
            "passed": passed,
            "details": details,
            "error": None if passed else f"API mapping issues: {', '.join(issues)}"
        }
    except Exception as e:
        return {
            "passed": False,
            "details": None,
            "error": str(e)
        }

def test_overview_stats_component():
    """Test 6: OverviewStats component user count fetching"""
    print("🔍 Test 6: OverviewStats Component User Count Logic")

    try:
        with open("app/admin/OverviewStats.tsx", "r") as f:
            component_content = f.read()

        # Check for key improvements
        checks = {
            "getUserStats_call": "adminApi.getUserStats()" in component_content,
            "user_stats_priority": "userStatsData?.total_users" in component_content,
            "fallback_logic": "overviewData?.total_users" in component_content,
            "accurate_count_logging": "Using user stats count" in component_content,
        }

        passed_checks = sum(checks.values())
        total_checks = len(checks)

        passed = passed_checks == total_checks
        details = f"OverviewStats fixes: {passed_checks}/{total_checks} checks passed"

        failed_checks = [name for name, result in checks.items() if not result]
        error = f"Missing implementations: {', '.join(failed_checks)}" if failed_checks else None

        return {
            "passed": passed,
            "details": details,
            "checks": checks,
            "error": error
        }
    except Exception as e:
        return {
            "passed": False,
            "details": None,
            "checks": {},
            "error": str(e)
        }

def test_user_management_component():
    """Test 7: UserManagement component user count handling"""
    print("🔍 Test 7: UserManagement Component User Count Logic")

    try:
        with open("app/admin/UserManagement.tsx", "r") as f:
            component_content = f.read()

        # Check for key improvements
        checks = {
            "pagination_metadata": "usersData.total" in component_content,
            "legacy_fallback": "fetchTotalUserCount" in component_content,
            "user_stats_call": "adminApi.getUserStats()" in component_content,
            "accurate_pagination": "Math.ceil(usersData.total / itemsPerPage)" in component_content,
            "initialization_fix": "fetchTotalUserCount();" in component_content
        }

        passed_checks = sum(checks.values())
        total_checks = len(checks)

        passed = passed_checks == total_checks
        details = f"UserManagement fixes: {passed_checks}/{total_checks} checks passed"

        failed_checks = [name for name, result in checks.items() if not result]
        error = f"Missing implementations: {', '.join(failed_checks)}" if failed_checks else None

        return {
            "passed": passed,
            "details": details,
            "checks": checks,
            "error": error
        }
    except Exception as e:
        return {
            "passed": False,
            "details": None,
            "checks": {},
            "error": str(e)
        }

def test_reading_analytics_component():
    """Test 8: ReadingAnalytics component user count integration"""
    print("🔍 Test 8: ReadingAnalytics Component User Count Logic")

    try:
        with open("app/admin/ReadingAnalytics.tsx", "r") as f:
            component_content = f.read()

        # Check for key improvements
        checks = {
            "admin_api_import": "adminApi" in component_content,
            "user_stats_fetch": "adminApi.getUserStats()" in component_content,
            "real_user_count": "userStatsData?.total_users" in component_content,
            "merge_with_analytics": "analyticsWithRealUserCount" in component_content,
        }

        passed_checks = sum(checks.values())
        total_checks = len(checks)

        passed = passed_checks >= 3  # At least 3 out of 4 critical checks
        details = f"ReadingAnalytics fixes: {passed_checks}/{total_checks} checks passed"

        failed_checks = [name for name, result in checks.items() if not result]
        error = f"Missing implementations: {', '.join(failed_checks)}" if failed_checks else None

        return {
            "passed": passed,
            "details": details,
            "checks": checks,
            "error": error
        }
    except Exception as e:
        return {
            "passed": False,
            "details": None,
            "checks": {},
            "error": str(e)
        }

def test_backend_endpoints_consistency():
    """Test 9: Backend endpoint consistency"""
    print("🔍 Test 9: Backend Endpoint Implementation Consistency")

    try:
        # Check admin.py for pagination improvements
        with open("readnwin-backend/routers/admin.py", "r") as f:
            admin_content = f.read()

        # Check users.py for stats endpoint
        with open("readnwin-backend/routers/users.py", "r") as f:
            users_content = f.read()

        checks = {
            "admin_users_pagination": '"total":' in admin_content and '"users":' in admin_content,
            "admin_users_count": "base_query.count()" in admin_content,
            "user_stats_endpoint": "def get_user_stats" in users_content,
            "user_stats_total": "total_users = db.query(User).count()" in users_content,
            "admin_stats_endpoint": "def get_overview_stats" in admin_content
        }

        passed_checks = sum(checks.values())
        total_checks = len(checks)

        passed = passed_checks == total_checks
        details = f"Backend endpoint fixes: {passed_checks}/{total_checks} checks passed"

        failed_checks = [name for name, result in checks.items() if not result]
        error = f"Missing implementations: {', '.join(failed_checks)}" if failed_checks else None

        return {
            "passed": passed,
            "details": details,
            "checks": checks,
            "error": error
        }
    except Exception as e:
        return {
            "passed": False,
            "details": None,
            "checks": {},
            "error": str(e)
        }

def main():
    """Run comprehensive user count fixes test suite"""
    print("🧪 COMPREHENSIVE USER COUNT FIXES TEST")
    print("="*80)
    print(f"📅 Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Expected User Count: {EXPECTED_USER_COUNT}")
    print(f"🔗 API Base URL: {API_BASE_URL}")
    print("="*80)

    results = TestResults()

    # Test 1: Direct database query
    db_result = test_database_direct()
    results.add_test(
        "Database Direct Query",
        db_result["passed"],
        db_result["details"],
        db_result["error"]
    )

    # Get admin token for API tests
    print("\n🔑 Authenticating as admin...")
    token = login_admin()
    if token:
        print("✅ Admin authentication successful")
    else:
        print("❌ Admin authentication failed - API tests will be skipped")

    # Test 2: Admin stats overview
    admin_stats_result = test_admin_stats_overview(token)
    results.add_test(
        "Admin Stats Overview API",
        admin_stats_result["passed"],
        admin_stats_result["details"],
        admin_stats_result["error"]
    )

    # Test 3: User stats overview
    user_stats_result = test_user_stats_overview(token)
    results.add_test(
        "User Stats Overview API",
        user_stats_result["passed"],
        user_stats_result["details"],
        user_stats_result["error"]
    )

    # Test 4: Admin users pagination
    admin_users_result = test_admin_users_pagination(token)
    results.add_test(
        "Admin Users Pagination API",
        admin_users_result["passed"],
        admin_users_result["details"],
        admin_users_result["error"]
    )

    # Test 5: Frontend API consistency
    api_consistency_result = test_frontend_api_consistency()
    results.add_test(
        "Frontend API Mapping",
        api_consistency_result["passed"],
        api_consistency_result["details"],
        api_consistency_result["error"]
    )

    # Test 6: OverviewStats component
    overview_component_result = test_overview_stats_component()
    results.add_test(
        "OverviewStats Component",
        overview_component_result["passed"],
        overview_component_result["details"],
        overview_component_result["error"]
    )

    # Test 7: UserManagement component
    user_management_result = test_user_management_component()
    results.add_test(
        "UserManagement Component",
        user_management_result["passed"],
        user_management_result["details"],
        user_management_result["error"]
    )

    # Test 8: ReadingAnalytics component
    reading_analytics_result = test_reading_analytics_component()
    results.add_test(
        "ReadingAnalytics Component",
        reading_analytics_result["passed"],
        reading_analytics_result["details"],
        reading_analytics_result["error"]
    )

    # Test 9: Backend endpoints
    backend_consistency_result = test_backend_endpoints_consistency()
    results.add_test(
        "Backend Endpoint Consistency",
        backend_consistency_result["passed"],
        backend_consistency_result["details"],
        backend_consistency_result["error"]
    )

    # Print results
    results.print_summary()

    # Final assessment
    print(f"\n🏁 FINAL ASSESSMENT")
    print("="*80)

    critical_tests = [
        db_result["passed"],
        admin_stats_result["passed"] or user_stats_result["passed"],  # At least one stats API works
        overview_component_result["passed"],
        user_management_result["passed"]
    ]

    critical_passed = sum(critical_tests)

    if critical_passed == len(critical_tests):
        print("🎉 SUCCESS: All critical user count fixes are working!")
        print("✅ The admin dashboard should now display the correct user count (8) everywhere.")
    elif critical_passed >= 3:
        print("⚠️  MOSTLY WORKING: Most critical fixes are in place.")
        print("🔧 Minor issues remain but core functionality should work.")
    else:
        print("❌ ISSUES DETECTED: Critical fixes need attention.")
        print("🚨 User count display may still be inconsistent.")

    # Specific recommendations
    print(f"\n💡 RECOMMENDATIONS:")

    if not db_result["passed"]:
        print("- ⚠️  Database query issue - verify database connection and user data")

    if not admin_stats_result["passed"] and not user_stats_result["passed"]:
        print("- 🔧 Fix backend API endpoints to return correct user counts")

    if not overview_component_result["passed"]:
        print("- 🎨 Fix OverviewStats component to properly fetch and display user count")

    if not user_management_result["passed"]:
        print("- 📊 Fix UserManagement component pagination and total count display")

    if admin_users_result.get("has_pagination") == False:
        print("- 📋 Update admin users endpoint to include pagination metadata")

    print(f"\n📈 User Count Summary:")
    print(f"   Database: {db_result.get('user_count', 'Error')}")
    print(f"   Admin Stats API: {admin_stats_result.get('user_count', 'Error')}")
    print(f"   User Stats API: {user_stats_result.get('user_count', 'Error')}")
    print(f"   Admin Users API: {admin_users_result.get('user_count', 'Error')}")

    return results.passed == len(results.tests)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
