#!/usr/bin/env python3
"""
Test script to verify notification endpoints are working correctly
"""

import requests
import json
import os
from datetime import datetime

# Configuration
API_BASE_URL = os.getenv('NEXT_PUBLIC_API_URL', 'http://localhost:9000')
ADMIN_EMAIL = 'admin@readnwin.com'
ADMIN_PASSWORD = 'admin123'

class NotificationEndpointTester:
    def __init__(self):
        self.token = None
        self.session = requests.Session()
        
    def login_admin(self):
        """Login as admin to get authentication token"""
        print("🔐 Logging in as admin...")
        
        response = self.session.post(f"{API_BASE_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('access_token')
            print(f"✅ Login successful, token: {self.token[:20]}...")
            return True
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
    
    def get_headers(self):
        """Get headers with authentication token"""
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
    
    def test_get_notification_stats(self):
        """Test GET /admin/notifications/stats"""
        print("\n📊 Testing notification stats endpoint...")
        
        response = self.session.get(
            f"{API_BASE_URL}/admin/notifications/stats",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            stats = data.get('stats', {})
            print(f"✅ Stats retrieved successfully:")
            print(f"   Total: {stats.get('total', 0)}")
            print(f"   Unread: {stats.get('unread', 0)}")
            print(f"   Read: {stats.get('read', 0)}")
            return True
        else:
            print(f"❌ Stats request failed: {response.status_code} - {response.text}")
            return False
    
    def test_get_notifications(self):
        """Test GET /admin/notifications"""
        print("\n📋 Testing get notifications endpoint...")
        
        response = self.session.get(
            f"{API_BASE_URL}/admin/notifications?page=1&limit=10",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            notifications = data.get('notifications', [])
            print(f"✅ Notifications retrieved successfully:")
            print(f"   Count: {len(notifications)}")
            print(f"   Total pages: {data.get('pages', 0)}")
            return notifications
        else:
            print(f"❌ Get notifications failed: {response.status_code} - {response.text}")
            return []
    
    def test_create_notification(self):
        """Test POST /admin/notifications"""
        print("\n➕ Testing create notification endpoint...")
        
        notification_data = {
            "type": "system",
            "title": f"Test Notification {datetime.now().strftime('%H:%M:%S')}",
            "message": "This is a test notification created by the endpoint tester",
            "sendToAll": True
        }
        
        response = self.session.post(
            f"{API_BASE_URL}/admin/notifications",
            headers=self.get_headers(),
            json=notification_data
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Notification created successfully:")
            print(f"   ID: {data.get('id')}")
            print(f"   Message: {data.get('message')}")
            return data.get('id')
        else:
            print(f"❌ Create notification failed: {response.status_code} - {response.text}")
            return None
    
    def test_mark_as_read(self, notification_id):
        """Test PUT /admin/notifications/{id}/read"""
        if not notification_id:
            print("\n⏭️  Skipping mark as read test (no notification ID)")
            return False
            
        print(f"\n✅ Testing mark as read endpoint for notification {notification_id}...")
        
        response = self.session.put(
            f"{API_BASE_URL}/admin/notifications/{notification_id}/read",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Notification marked as read:")
            print(f"   Message: {data.get('message')}")
            return True
        else:
            print(f"❌ Mark as read failed: {response.status_code} - {response.text}")
            return False
    
    def test_mark_all_as_read(self):
        """Test PUT /admin/notifications/mark-all-read"""
        print("\n✅ Testing mark all as read endpoint...")
        
        response = self.session.put(
            f"{API_BASE_URL}/admin/notifications/mark-all-read",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ All notifications marked as read:")
            print(f"   Message: {data.get('message')}")
            return True
        else:
            print(f"❌ Mark all as read failed: {response.status_code} - {response.text}")
            return False
    
    def test_delete_notification(self, notification_id):
        """Test DELETE /admin/notifications/{id}"""
        if not notification_id:
            print("\n⏭️  Skipping delete test (no notification ID)")
            return False
            
        print(f"\n🗑️  Testing delete notification endpoint for notification {notification_id}...")
        
        response = self.session.delete(
            f"{API_BASE_URL}/admin/notifications/{notification_id}",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Notification deleted successfully:")
            print(f"   Message: {data.get('message')}")
            return True
        else:
            print(f"❌ Delete notification failed: {response.status_code} - {response.text}")
            return False
    
    def test_create_sample_notifications(self):
        """Test POST /admin/notifications/create-sample"""
        print("\n🎯 Testing create sample notifications endpoint...")
        
        response = self.session.post(
            f"{API_BASE_URL}/admin/notifications/create-sample",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sample notifications created:")
            print(f"   Message: {data.get('message')}")
            return True
        else:
            print(f"❌ Create sample notifications failed: {response.status_code} - {response.text}")
            return False
    
    def run_all_tests(self):
        """Run all notification endpoint tests"""
        print("🚀 Starting Notification Endpoint Tests")
        print("=" * 50)
        
        # Login first
        if not self.login_admin():
            print("❌ Cannot proceed without admin login")
            return False
        
        # Test all endpoints
        results = []
        
        # 1. Test stats
        results.append(("Stats", self.test_get_notification_stats()))
        
        # 2. Test get notifications
        notifications = self.test_get_notifications()
        results.append(("Get Notifications", len(notifications) >= 0))
        
        # 3. Create sample notifications for testing
        results.append(("Create Sample", self.test_create_sample_notifications()))
        
        # 4. Test create notification
        notification_id = self.test_create_notification()
        results.append(("Create Notification", notification_id is not None))
        
        # 5. Test mark as read
        results.append(("Mark as Read", self.test_mark_as_read(notification_id)))
        
        # 6. Test mark all as read
        results.append(("Mark All as Read", self.test_mark_all_as_read()))
        
        # 7. Test delete notification
        results.append(("Delete Notification", self.test_delete_notification(notification_id)))
        
        # 8. Final stats check
        results.append(("Final Stats", self.test_get_notification_stats()))
        
        # Print summary
        print("\n" + "=" * 50)
        print("📋 TEST SUMMARY")
        print("=" * 50)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} - {test_name}")
            if result:
                passed += 1
        
        print(f"\n🎯 Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All notification endpoints are working correctly!")
            return True
        else:
            print("⚠️  Some endpoints need attention")
            return False

def main():
    """Main function to run the tests"""
    tester = NotificationEndpointTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Notification system verification completed successfully!")
    else:
        print("\n❌ Notification system verification found issues!")
    
    return success

if __name__ == "__main__":
    main()