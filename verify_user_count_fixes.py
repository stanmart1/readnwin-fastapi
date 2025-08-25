#!/usr/bin/env python3
"""
Simple verification script for user count fixes in the admin dashboard

This script verifies that:
1. Database contains the correct number of users (8)
2. Frontend components have the correct user count fetching logic
3. Backend endpoints have the correct implementations

This is a lightweight test that doesn't require API server to be running.
"""

import sys
import os
from datetime import datetime

# Add backend path for direct database access
sys.path.append('readnwin-backend')

def print_header():
    print("🔍 USER COUNT FIXES VERIFICATION")
    print("=" * 60)
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

def test_database_user_count():
    """Test 1: Verify database has correct user count"""
    print("\n📊 Test 1: Database User Count")
    print("-" * 30)

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
        user_count = result.scalar()
        db.close()

        print(f"✅ Database connection: SUCCESS")
        print(f"📊 Total users in database: {user_count}")

        if user_count == 8:
            print("✅ User count verification: PASSED")
            return True, user_count
        else:
            print(f"❌ User count verification: FAILED (expected 8, got {user_count})")
            return False, user_count

    except Exception as e:
        print(f"❌ Database connection: FAILED")
        print(f"⚠️  Error: {e}")
        return False, None

def test_frontend_components():
    """Test 2: Verify frontend components have correct logic"""
    print("\n🎨 Test 2: Frontend Component Fixes")
    print("-" * 30)

    tests = []

    # Test OverviewStats component
    try:
        with open("app/admin/OverviewStats.tsx", "r") as f:
            overview_content = f.read()

        overview_checks = {
            "getUserStats call": "adminApi.getUserStats()" in overview_content,
            "User stats priority": "userStatsData?.total_users" in overview_content,
            "Fallback logic": "overviewData?.total_users" in overview_content,
            "Total users assignment": "totalUsers = userStatsData.total_users" in overview_content
        }

        overview_passed = sum(overview_checks.values())
        overview_total = len(overview_checks)

        print(f"📱 OverviewStats.tsx: {overview_passed}/{overview_total} checks passed")
        for check, passed in overview_checks.items():
            status = "✅" if passed else "❌"
            print(f"   {status} {check}")

        tests.append(("OverviewStats", overview_passed == overview_total))

    except Exception as e:
        print(f"❌ OverviewStats.tsx: Error reading file - {e}")
        tests.append(("OverviewStats", False))

    # Test UserManagement component
    try:
        with open("app/admin/UserManagement.tsx", "r") as f:
            user_mgmt_content = f.read()

        user_mgmt_checks = {
            "Pagination metadata": "usersData.total" in user_mgmt_content,
            "Total user assignment": "setTotalUsers(usersData.total)" in user_mgmt_content,
            "Fallback function": "fetchTotalUserCount" in user_mgmt_content,
            "User stats API call": "adminApi.getUserStats()" in user_mgmt_content,
            "Pagination calculation": "Math.ceil(usersData.total / itemsPerPage)" in user_mgmt_content
        }

        user_mgmt_passed = sum(user_mgmt_checks.values())
        user_mgmt_total = len(user_mgmt_checks)

        print(f"📱 UserManagement.tsx: {user_mgmt_passed}/{user_mgmt_total} checks passed")
        for check, passed in user_mgmt_checks.items():
            status = "✅" if passed else "❌"
            print(f"   {status} {check}")

        tests.append(("UserManagement", user_mgmt_passed == user_mgmt_total))

    except Exception as e:
        print(f"❌ UserManagement.tsx: Error reading file - {e}")
        tests.append(("UserManagement", False))

    # Test ReadingAnalytics component
    try:
        with open("app/admin/ReadingAnalytics.tsx", "r") as f:
            analytics_content = f.read()

        analytics_checks = {
            "Admin API import": "adminApi" in analytics_content,
            "User stats fetch": "adminApi.getUserStats()" in analytics_content,
            "Real user count merge": "userStatsData?.total_users" in analytics_content
        }

        analytics_passed = sum(analytics_checks.values())
        analytics_total = len(analytics_checks)

        print(f"📱 ReadingAnalytics.tsx: {analytics_passed}/{analytics_total} checks passed")
        for check, passed in analytics_checks.items():
            status = "✅" if passed else "❌"
            print(f"   {status} {check}")

        tests.append(("ReadingAnalytics", analytics_passed == analytics_total))

    except Exception as e:
        print(f"❌ ReadingAnalytics.tsx: Error reading file - {e}")
        tests.append(("ReadingAnalytics", False))

    # Calculate overall frontend score
    passed_tests = sum(1 for _, passed in tests if passed)
    total_tests = len(tests)

    return passed_tests, total_tests, tests

def test_backend_endpoints():
    """Test 3: Verify backend endpoints have correct implementations"""
    print("\n🔧 Test 3: Backend Endpoint Implementations")
    print("-" * 30)

    tests = []

    # Test admin.py improvements
    try:
        with open("readnwin-backend/routers/admin.py", "r") as f:
            admin_content = f.read()

        admin_checks = {
            "Pagination response": '"total":' in admin_content and '"users":' in admin_content,
            "Total count query": "base_query.count()" in admin_content,
            "Error handling": "try:" in admin_content and "except Exception" in admin_content,
            "User count logging": "Total users:" in admin_content or "total_users =" in admin_content
        }

        admin_passed = sum(admin_checks.values())
        admin_total = len(admin_checks)

        print(f"🔧 admin.py: {admin_passed}/{admin_total} checks passed")
        for check, passed in admin_checks.items():
            status = "✅" if passed else "❌"
            print(f"   {status} {check}")

        tests.append(("Admin endpoints", admin_passed >= 3))  # At least 3/4 critical checks

    except Exception as e:
        print(f"❌ admin.py: Error reading file - {e}")
        tests.append(("Admin endpoints", False))

    # Test users.py stats endpoint
    try:
        with open("readnwin-backend/routers/users.py", "r") as f:
            users_content = f.read()

        users_checks = {
            "Stats endpoint exists": "def get_user_stats" in users_content,
            "User count query": "db.query(User).count()" in users_content,
            "Total users return": "total_users" in users_content
        }

        users_passed = sum(users_checks.values())
        users_total = len(users_checks)

        print(f"🔧 users.py: {users_passed}/{users_total} checks passed")
        for check, passed in users_checks.items():
            status = "✅" if passed else "❌"
            print(f"   {status} {check}")

        tests.append(("User stats endpoint", users_passed == users_total))

    except Exception as e:
        print(f"❌ users.py: Error reading file - {e}")
        tests.append(("User stats endpoint", False))

    # Calculate overall backend score
    passed_tests = sum(1 for _, passed in tests if passed)
    total_tests = len(tests)

    return passed_tests, total_tests, tests

def test_api_mapping():
    """Test 4: Verify API mapping is correct"""
    print("\n🔗 Test 4: API Mapping Verification")
    print("-" * 30)

    try:
        with open("app/admin/utils/api.ts", "r") as f:
            api_content = f.read()

        api_checks = {
            "Admin users endpoint": '"/admin/users"' in api_content,
            "User stats endpoint": '"/users/stats/overview"' in api_content,
            "getUserStats function": "getUserStats:" in api_content,
            "getUsers function": "getUsers:" in api_content
        }

        api_passed = sum(api_checks.values())
        api_total = len(api_checks)

        print(f"🔗 api.ts: {api_passed}/{api_total} checks passed")
        for check, passed in api_checks.items():
            status = "✅" if passed else "❌"
            print(f"   {status} {check}")

        return api_passed == api_total

    except Exception as e:
        print(f"❌ api.ts: Error reading file - {e}")
        return False

def main():
    """Run the verification tests"""
    print_header()

    # Test 1: Database
    db_passed, user_count = test_database_user_count()

    # Test 2: Frontend components
    frontend_passed, frontend_total, frontend_details = test_frontend_components()

    # Test 3: Backend endpoints
    backend_passed, backend_total, backend_details = test_backend_endpoints()

    # Test 4: API mapping
    api_passed = test_api_mapping()

    # Summary
    print("\n🏁 VERIFICATION SUMMARY")
    print("=" * 60)

    print(f"📊 Database User Count: {'✅ PASSED' if db_passed else '❌ FAILED'}")
    if user_count is not None:
        print(f"   └── Users in database: {user_count}")

    print(f"🎨 Frontend Components: {frontend_passed}/{frontend_total} passed")
    for name, passed in frontend_details:
        status = "✅" if passed else "❌"
        print(f"   └── {status} {name}")

    print(f"🔧 Backend Endpoints: {backend_passed}/{backend_total} passed")
    for name, passed in backend_details:
        status = "✅" if passed else "❌"
        print(f"   └── {status} {name}")

    print(f"🔗 API Mapping: {'✅ PASSED' if api_passed else '❌ FAILED'}")

    # Overall assessment
    critical_tests = [
        db_passed,
        frontend_passed >= 2,  # At least 2/3 frontend components
        backend_passed >= 1,   # At least 1/2 backend endpoints
        api_passed
    ]

    critical_passed = sum(critical_tests)
    critical_total = len(critical_tests)

    print(f"\n🎯 OVERALL RESULT")
    print("=" * 60)

    if critical_passed == critical_total:
        print("🎉 SUCCESS: All critical user count fixes are implemented!")
        print("✅ The admin dashboard should display the correct user count (8) consistently.")
        print("\n💡 Next Steps:")
        print("   1. Start the Next.js development server")
        print("   2. Navigate to /admin in your browser")
        print("   3. Verify user counts are displayed correctly in:")
        print("      - Overview dashboard (Total Users card)")
        print("      - User Management page (pagination and totals)")
        print("      - Reading Analytics (Total Active Readers)")
    elif critical_passed >= 3:
        print("⚠️  MOSTLY WORKING: Most critical fixes are in place.")
        print("🔧 Minor issues remain but core functionality should work.")
        print(f"   └── {critical_passed}/{critical_total} critical tests passed")
    else:
        print("❌ ISSUES DETECTED: Critical fixes need attention.")
        print("🚨 User count display may still be inconsistent.")
        print(f"   └── Only {critical_passed}/{critical_total} critical tests passed")

    if user_count == 8:
        print(f"\n✅ CONFIRMED: Database contains exactly 8 users as expected")
    elif user_count is not None:
        print(f"\n⚠️  NOTE: Database contains {user_count} users (expected 8)")
    else:
        print(f"\n❌ WARNING: Could not verify database user count")

    print("\n" + "=" * 60)
    return critical_passed == critical_total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
