#!/usr/bin/env python3
"""
Test script to verify book management and cart/checkout integration
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:9000"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpassword123"

class BookCartIntegrationTest:
    def __init__(self):
        self.token = None
        self.test_book_id = None
        self.test_order_id = None
        
    def authenticate(self):
        """Authenticate test user"""
        print("🔐 Authenticating test user...")
        
        # Try to login first
        login_data = {
            "username": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        response = requests.post(f"{API_BASE_URL}/auth/login", data=login_data)
        
        if response.status_code == 200:
            result = response.json()
            self.token = result.get("access_token")
            print(f"✅ Login successful")
            return True
        else:
            print(f"❌ Login failed: {response.status_code}")
            return False
    
    def get_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}
    
    def test_book_creation(self):
        """Test creating a book with new structure"""
        print("\n📚 Testing book creation...")
        
        # Create form data for book creation
        book_data = {
            "title": "Test Integration Book",
            "author_id": "1",
            "category_id": "1", 
            "price": "2500.00",
            "description": "Test book for integration testing",
            "language": "English",
            "book_type": "ebook",
            "format": "ebook",
            "inventory_enabled": "false",
            "status": "published",
            "is_featured": "false"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/admin/books",
            data=book_data,
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            result = response.json()
            self.test_book_id = result.get("book_id")
            print(f"✅ Book created successfully with ID: {self.test_book_id}")
            return True
        else:
            print(f"❌ Book creation failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    
    def test_book_active_toggle(self):
        """Test toggling book active status"""
        if not self.test_book_id:
            print("❌ No test book ID available")
            return False
            
        print(f"\n🔄 Testing book active toggle for book {self.test_book_id}...")
        
        response = requests.patch(
            f"{API_BASE_URL}/admin/books/{self.test_book_id}/toggle-active",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Book active status toggled: {result.get('message')}")
            return True
        else:
            print(f"❌ Toggle active failed: {response.status_code}")
            return False
    
    def test_add_to_cart(self):
        """Test adding book to cart"""
        if not self.test_book_id:
            print("❌ No test book ID available")
            return False
            
        print(f"\n🛒 Testing add to cart for book {self.test_book_id}...")
        
        cart_data = {
            "book_id": self.test_book_id,
            "quantity": 1
        }
        
        response = requests.post(
            f"{API_BASE_URL}/cart/add",
            json=cart_data,
            headers={**self.get_headers(), "Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("✅ Book added to cart successfully")
            return True
        else:
            print(f"❌ Add to cart failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    
    def test_get_cart(self):
        """Test retrieving cart with new book structure"""
        print("\n📋 Testing cart retrieval...")
        
        response = requests.get(
            f"{API_BASE_URL}/cart/",
            headers=self.get_headers()
        )
        
        if response.status_code == 200:
            cart_items = response.json()
            print(f"✅ Cart retrieved successfully with {len(cart_items)} items")
            
            # Verify cart item structure
            if cart_items:
                item = cart_items[0]
                required_fields = [
                    'book_title', 'book_author', 'book_price', 'book_format',
                    'book_is_active', 'book_inventory_enabled'
                ]
                
                missing_fields = [field for field in required_fields if field not in item]
                if missing_fields:
                    print(f"⚠️ Missing fields in cart item: {missing_fields}")
                else:
                    print("✅ Cart item structure is correct")
                    print(f"   - Title: {item.get('book_title')}")
                    print(f"   - Format: {item.get('book_format')}")
                    print(f"   - Active: {item.get('book_is_active')}")
            
            return True
        else:
            print(f"❌ Cart retrieval failed: {response.status_code}")
            return False
    
    def test_checkout_process(self):
        """Test checkout process with new book structure"""
        print("\n💳 Testing checkout process...")
        
        checkout_data = {
            "shipping_address": {
                "first_name": "Test",
                "last_name": "User",
                "email": TEST_USER_EMAIL,
                "phone": "+2348012345678",
                "address": "123 Test Street",
                "city": "Lagos",
                "state": "Lagos",
                "zip_code": "100001",
                "country": "NG"
            },
            "billing_address": {
                "same_as_shipping": True
            },
            "payment": {
                "method": "bank_transfer",
                "gateway": "bank_transfer"
            },
            "shipping_method": None,
            "cart_items": [],
            "notes": "Test order",
            "is_ebook_only": True
        }
        
        response = requests.post(
            f"{API_BASE_URL}/checkout/",
            json=checkout_data,
            headers={**self.get_headers(), "Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                self.test_order_id = result.get("order", {}).get("id")
                print(f"✅ Checkout successful, Order ID: {self.test_order_id}")
                return True
            else:
                print(f"❌ Checkout failed: {result.get('message', 'Unknown error')}")
                return False
        else:
            print(f"❌ Checkout failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    
    def test_inactive_book_cart_prevention(self):
        """Test that inactive books cannot be added to cart"""
        if not self.test_book_id:
            print("❌ No test book ID available")
            return False
            
        print(f"\n🚫 Testing inactive book cart prevention...")
        
        # First, make the book inactive
        response = requests.patch(
            f"{API_BASE_URL}/admin/books/{self.test_book_id}/toggle-active",
            headers=self.get_headers()
        )
        
        if response.status_code != 200:
            print("❌ Failed to make book inactive")
            return False
        
        # Try to add inactive book to cart
        cart_data = {
            "book_id": self.test_book_id,
            "quantity": 1
        }
        
        response = requests.post(
            f"{API_BASE_URL}/cart/add",
            json=cart_data,
            headers={**self.get_headers(), "Content-Type": "application/json"}
        )
        
        if response.status_code == 400:
            print("✅ Inactive book correctly prevented from being added to cart")
            return True
        else:
            print(f"❌ Inactive book was allowed in cart (status: {response.status_code})")
            return False
    
    def cleanup(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Clear cart
        requests.delete(f"{API_BASE_URL}/cart/clear", headers=self.get_headers())
        
        # Delete test book if created
        if self.test_book_id:
            response = requests.delete(
                f"{API_BASE_URL}/admin/books/{self.test_book_id}",
                headers=self.get_headers()
            )
            if response.status_code == 200:
                print("✅ Test book deleted")
            else:
                print(f"⚠️ Failed to delete test book: {response.status_code}")
    
    def run_all_tests(self):
        """Run all integration tests"""
        print("🚀 Starting Book-Cart Integration Tests")
        print("=" * 50)
        
        tests = [
            ("Authentication", self.authenticate),
            ("Book Creation", self.test_book_creation),
            ("Book Active Toggle", self.test_book_active_toggle),
            ("Add to Cart", self.test_add_to_cart),
            ("Get Cart", self.test_get_cart),
            ("Checkout Process", self.test_checkout_process),
            ("Inactive Book Prevention", self.test_inactive_book_cart_prevention)
        ]
        
        results = []
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                results.append((test_name, False))
        
        # Cleanup
        self.cleanup()
        
        # Print summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
        
        print(f"\nResults: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Integration is working correctly.")
            return True
        else:
            print("⚠️ Some tests failed. Please check the integration.")
            return False

if __name__ == "__main__":
    tester = BookCartIntegrationTest()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)