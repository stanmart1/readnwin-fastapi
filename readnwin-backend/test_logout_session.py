"""
Test script to verify session expires upon logout
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_logout_session_expiry():
    """Test that session expires after logout"""
    print("=" * 60)
    print("LOGOUT SESSION EXPIRY TEST")
    print("=" * 60)
    
    # Step 1: Register a test user
    print("\n1. Registering test user...")
    register_data = {
        "email": "logout_test@example.com",
        "username": "logouttest",
        "password": "Test123!@#",
        "first_name": "Logout",
        "last_name": "Test"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
        if response.status_code == 400 and "already registered" in response.text:
            print("   ℹ️  User already exists, proceeding to login...")
        elif response.status_code == 201 or response.status_code == 200:
            print("   ✅ User registered successfully")
        else:
            print(f"   ⚠️  Registration response: {response.status_code}")
    except Exception as e:
        print(f"   ⚠️  Registration error: {e}")
    
    # Step 2: Login to get token
    print("\n2. Logging in...")
    login_data = {
        "email": "logout_test@example.com",
        "password": "Test123!@#"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"   ❌ Login failed: {response.status_code} - {response.text}")
        return False
    
    login_result = response.json()
    access_token = login_result.get("access_token")
    print(f"   ✅ Login successful, token received")
    
    # Step 3: Test authenticated request (should work)
    print("\n3. Testing authenticated request BEFORE logout...")
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    
    if response.status_code == 200:
        user_data = response.json()
        print(f"   ✅ Authenticated request successful")
        print(f"      User: {user_data.get('email')}")
    else:
        print(f"   ❌ Authenticated request failed: {response.status_code}")
        return False
    
    # Step 4: Logout
    print("\n4. Logging out...")
    response = requests.post(f"{BASE_URL}/auth/logout", headers=headers)
    
    if response.status_code == 200:
        logout_result = response.json()
        print(f"   ✅ Logout successful")
        print(f"      Message: {logout_result.get('message')}")
    else:
        print(f"   ❌ Logout failed: {response.status_code}")
        return False
    
    # Step 5: Test authenticated request AFTER logout (should fail)
    print("\n5. Testing authenticated request AFTER logout...")
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    
    if response.status_code == 401:
        error_detail = response.json().get("detail", "")
        print(f"   ✅ Request correctly rejected: {error_detail}")
        
        if "revoked" in error_detail.lower() or "blacklisted" in error_detail.lower():
            print(f"   ✅ Token is blacklisted as expected")
        else:
            print(f"   ⚠️  Token rejected but reason unclear")
        
        return True
    else:
        print(f"   ❌ Request should have been rejected but got: {response.status_code}")
        print(f"      Response: {response.text}")
        return False

def test_token_blacklist_persistence():
    """Test that blacklisted tokens remain invalid"""
    print("\n" + "=" * 60)
    print("TOKEN BLACKLIST PERSISTENCE TEST")
    print("=" * 60)
    
    # Login
    print("\n1. Logging in...")
    login_data = {
        "email": "logout_test@example.com",
        "password": "Test123!@#"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"   ❌ Login failed")
        return False
    
    access_token = response.json().get("access_token")
    print(f"   ✅ Login successful")
    
    # Logout
    print("\n2. Logging out...")
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.post(f"{BASE_URL}/auth/logout", headers=headers)
    print(f"   ✅ Logout successful")
    
    # Try multiple times to ensure persistence
    print("\n3. Testing token remains blacklisted (3 attempts)...")
    for i in range(3):
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        if response.status_code == 401:
            print(f"   ✅ Attempt {i+1}: Token correctly rejected")
        else:
            print(f"   ❌ Attempt {i+1}: Token should be rejected but got {response.status_code}")
            return False
    
    return True

if __name__ == "__main__":
    print("\n🔐 Starting Logout Session Expiry Tests\n")
    
    # Test 1: Basic logout functionality
    test1_passed = test_logout_session_expiry()
    
    # Test 2: Persistence
    test2_passed = test_token_blacklist_persistence()
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Test 1 - Session Expiry on Logout: {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    print(f"Test 2 - Token Blacklist Persistence: {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    
    if test1_passed and test2_passed:
        print("\n✅ All tests passed! Sessions correctly expire upon logout.")
    else:
        print("\n❌ Some tests failed. Check implementation.")
    
    print("=" * 60)
