#!/usr/bin/env python3
"""
Test script to verify the library endpoint fix
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'readnwin-backend'))

def test_user_model():
    """Test User model properties"""
    print("Testing User model properties...")
    
    from models.user import User
    from models.role import Role
    
    # Create a mock user without role
    user = User()
    user.id = 1
    user.email = "test@example.com"
    user.username = "testuser"
    user.role = None
    
    # Test has_admin_access with no role
    try:
        result = user.has_admin_access
        print(f"✓ has_admin_access with no role: {result} (expected False)")
        assert result == False, "Should return False when no role"
    except Exception as e:
        print(f"✗ has_admin_access failed: {e}")
        return False
    
    # Test permissions with no role
    try:
        result = user.permissions
        print(f"✓ permissions with no role: {result} (expected [])")
        assert result == [], "Should return empty list when no role"
    except Exception as e:
        print(f"✗ permissions failed: {e}")
        return False
    
    # Create a mock user with admin role
    user2 = User()
    user2.id = 2
    user2.email = "admin@example.com"
    user2.username = "admin"
    
    role = Role()
    role.name = "admin"
    role.permissions = []
    user2.role = role
    
    # Test has_admin_access with admin role
    try:
        result = user2.has_admin_access
        print(f"✓ has_admin_access with admin role: {result} (expected True)")
        assert result == True, "Should return True for admin role"
    except Exception as e:
        print(f"✗ has_admin_access with admin role failed: {e}")
        return False
    
    print("\n✓ All User model tests passed!\n")
    return True

def test_admin_library_endpoint():
    """Test admin library endpoint structure"""
    print("Testing admin library endpoint...")
    
    try:
        from routers.admin_library import router
        from fastapi import FastAPI
        
        app = FastAPI()
        app.include_router(router)
        
        # Check routes exist
        routes = [route.path for route in app.routes if hasattr(route, 'path')]
        
        expected_routes = [
            '/admin/user-library',
            '/admin/library-assignments',
            '/admin/library-assignment/{assignment_id}'
        ]
        
        for expected in expected_routes:
            if expected in routes:
                print(f"✓ Route exists: {expected}")
            else:
                print(f"✗ Route missing: {expected}")
                return False
        
        print("\n✓ All admin library endpoint tests passed!\n")
        return True
        
    except Exception as e:
        print(f"✗ Admin library endpoint test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("=" * 60)
    print("Library Fix Verification Tests")
    print("=" * 60)
    print()
    
    tests_passed = 0
    tests_total = 2
    
    if test_user_model():
        tests_passed += 1
    
    if test_admin_library_endpoint():
        tests_passed += 1
    
    print("=" * 60)
    print(f"Results: {tests_passed}/{tests_total} tests passed")
    print("=" * 60)
    
    if tests_passed == tests_total:
        print("\n✓ All tests passed! The fix is working correctly.")
        return 0
    else:
        print(f"\n✗ {tests_total - tests_passed} test(s) failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
