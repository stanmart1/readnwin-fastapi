#!/usr/bin/env python3
"""
Test script for authentication endpoints
"""

import asyncio
import sys
from fastapi.testclient import TestClient
from main import app

def test_auth_endpoints():
    """Test authentication endpoints"""
    client = TestClient(app)
        print("🧪 Testing Authentication Endpoints")
        print("=" * 50)
        
        # Test 1: Login with correct credentials
        print("\n1. Testing login with correct credentials...")
        login_data = {
            "email": "admin@readnwin.com",
            "password": "Admin123!"
        }
        
        try:
            response = client.post("/auth/login", json=login_data)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Login successful!")
                print(f"User ID: {result['user']['id']}")
                print(f"Email: {result['user']['email']}")
                print(f"Role: {result['user']['role']['name']}")
                print(f"Token: {result['access_token'][:50]}...")
                
                # Test 2: Get current user with token
                print("\n2. Testing /auth/me endpoint...")
                headers = {"Authorization": f"Bearer {result['access_token']}"}
                me_response = client.get("/auth/me", headers=headers)
                print(f"Status Code: {me_response.status_code}")
                
                if me_response.status_code == 200:
                    me_result = me_response.json()
                    print("✅ /auth/me successful!")
                    print(f"User: {me_result['email']}")
                    print(f"Permissions: {me_result['permissions']}")
                else:
                    print(f"❌ /auth/me failed: {me_response.text}")
                    
            else:
                print(f"❌ Login failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Error testing login: {e}")
            import traceback
            traceback.print_exc()
        
        # Test 3: Login with wrong credentials
        print("\n3. Testing login with wrong credentials...")
        wrong_login_data = {
            "email": "admin@readnwin.com",
            "password": "wrongpassword"
        }
        
        try:
            response = client.post("/auth/login", json=wrong_login_data)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 401:
                print("✅ Correctly rejected wrong credentials")
            else:
                print(f"❌ Unexpected response: {response.text}")
                
        except Exception as e:
            print(f"❌ Error testing wrong login: {e}")
        
        # Test 4: Registration
        print("\n4. Testing registration...")
        register_data = {
            "email": "test@example.com",
            "username": "testuser123",
            "password": "TestPass123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        try:
            response = client.post("/auth/register", json=register_data)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Registration successful!")
                print(f"User ID: {result['user']['id']}")
                print(f"Email: {result['user']['email']}")
            elif response.status_code == 400:
                print("ℹ️ User already exists (expected if run multiple times)")
            else:
                print(f"❌ Registration failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Error testing registration: {e}")

if __name__ == "__main__":
    test_auth_endpoints()