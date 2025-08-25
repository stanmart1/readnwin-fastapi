#!/usr/bin/env python3
"""
Test script for admin notifications functionality
"""

import requests
import json
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'readnwin-backend'))

API_BASE_URL = "http://localhost:9000"

def test_admin_notifications():
    """Test admin notifications endpoints"""
    
    # First, we need to login as admin to get a token
    login_data = {
        "email": "admin@readnwin.com",  # Replace with actual admin email
        "password": "admin123"  # Replace with actual admin password
    }
    
    try:
        # Login
        print("🔐 Logging in as admin...")
        login_response = requests.post(f"{API_BASE_URL}/auth/login", json=login_data)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return
        
        token = login_response.json().get("access_token")
        if not token:
            print("❌ No access token received")
            return
        
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Login successful")
        
        # Create sample notifications
        print("\n📝 Creating sample notifications...")
        create_response = requests.post(
            f"{API_BASE_URL}/admin/notifications/create-sample",
            headers=headers
        )
        
        if create_response.status_code == 200:
            print("✅ Sample notifications created")
            print(f"Response: {create_response.json()}")
        else:
            print(f"❌ Failed to create notifications: {create_response.status_code}")
            print(f"Response: {create_response.text}")
        
        # Get notification stats
        print("\n📊 Getting notification stats...")
        stats_response = requests.get(
            f"{API_BASE_URL}/admin/notifications/stats",
            headers=headers
        )
        
        if stats_response.status_code == 200:
            print("✅ Stats retrieved successfully")
            stats = stats_response.json()
            print(f"Total: {stats['stats']['total']}")
            print(f"Unread: {stats['stats']['unread']}")
            print(f"By Type: {stats['stats']['byType']}")
            print(f"By Priority: {stats['stats']['byPriority']}")
        else:
            print(f"❌ Failed to get stats: {stats_response.status_code}")
            print(f"Response: {stats_response.text}")
        
        # Get notifications list
        print("\n📋 Getting notifications list...")
        notifications_response = requests.get(
            f"{API_BASE_URL}/admin/notifications?limit=10&isRead=false",
            headers=headers
        )
        
        if notifications_response.status_code == 200:
            print("✅ Notifications retrieved successfully")
            notifications = notifications_response.json()
            print(f"Total notifications: {notifications['total']}")
            print(f"Pages: {notifications['pages']}")
            
            for notif in notifications['notifications'][:3]:  # Show first 3
                print(f"  - {notif['title']}: {notif['message'][:50]}...")
        else:
            print(f"❌ Failed to get notifications: {notifications_response.status_code}")
            print(f"Response: {notifications_response.text}")
        
        print("\n🎉 Admin notifications test completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the API server.")
        print("Make sure the backend server is running on http://localhost:9000")
    except Exception as e:
        print(f"❌ An error occurred: {str(e)}")

if __name__ == "__main__":
    test_admin_notifications()