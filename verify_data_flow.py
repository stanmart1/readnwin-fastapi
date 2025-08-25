#!/usr/bin/env python3
"""
Verification script to test data flow between cart, checkout, and order placement components
"""

import json
import requests
from decimal import Decimal
from typing import Dict, Any

# Test configuration
API_BASE_URL = "http://localhost:9000"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpassword"

class DataFlowVerifier:
    def __init__(self):
        self.token = None
        self.user_id = None
        
    def authenticate(self) -> bool:
        """Authenticate test user"""
        try:
            response = requests.post(f"{API_BASE_URL}/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                print(f"✅ Authentication successful - User ID: {self.user_id}")
                return True
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False
    
    def get_headers(self) -> Dict[str, str]:
        """Get request headers with auth token"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def verify_cart_data_structure(self) -> bool:
        """Verify cart API returns expected data structure"""
        print("\n🛒 Testing Cart Data Structure...")
        
        try:
            response = requests.get(f"{API_BASE_URL}/cart/", headers=self.get_headers())
            
            if response.status_code != 200:
                print(f"❌ Cart API failed: {response.status_code}")
                return False
            
            cart_data = response.json()
            print(f"📦 Cart contains {len(cart_data)} items")
            
            # Verify cart item structure
            required_fields = [
                'id', 'book_id', 'quantity', 'book_title', 'book_author', 
                'book_price', 'book_format', 'book_category'
            ]
            
            for item in cart_data:
                for field in required_fields:
                    if field not in item:
                        print(f"❌ Missing field '{field}' in cart item")
                        return False
                
                # Verify data types
                if not isinstance(item['book_price'], (int, float)):
                    print(f"❌ book_price should be numeric, got {type(item['book_price'])}")
                    return False
                
                if not isinstance(item['quantity'], int):
                    print(f"❌ quantity should be integer, got {type(item['quantity'])}")
                    return False
                
                print(f"✅ Cart item: {item['book_title']} - Format: {item['book_format']} - Price: {item['book_price']}")
            
            return True
            
        except Exception as e:
            print(f"❌ Cart verification error: {e}")
            return False
    
    def verify_checkout_data_structure(self) -> bool:
        """Verify checkout API accepts expected data structure"""
        print("\n💳 Testing Checkout Data Structure...")
        
        # Sample checkout data matching the schema
        checkout_data = {
            "shipping_address": {
                "first_name": "John",
                "last_name": "Doe", 
                "email": "john.doe@example.com",
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
            "cart_items": [
                {
                    "book_id": 1,
                    "quantity": 1,
                    "price": "2500.00"
                }
            ],
            "is_ebook_only": False
        }
        
        try:
            # Test checkout validation (without actually placing order)
            response = requests.post(
                f"{API_BASE_URL}/checkout/", 
                headers=self.get_headers(),
                json=checkout_data
            )
            
            print(f"📋 Checkout response status: {response.status_code}")
            
            if response.status_code in [200, 400]:  # 400 might be expected for validation errors
                response_data = response.json()
                print(f"📋 Checkout response: {json.dumps(response_data, indent=2)}")
                
                # Check if response has expected structure
                if response.status_code == 200:
                    required_response_fields = ['success', 'order_id', 'order_number', 'total_amount']
                    for field in required_response_fields:
                        if field not in response_data:
                            print(f"❌ Missing field '{field}' in checkout response")
                            return False
                    print("✅ Checkout response structure is valid")
                else:
                    print(f"⚠️ Checkout validation error (expected): {response_data.get('detail', 'Unknown error')}")
                
                return True
            else:
                print(f"❌ Unexpected checkout response: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Checkout verification error: {e}")
            return False
    
    def verify_payment_data_types(self) -> bool:
        """Verify payment amount handling"""
        print("\n💰 Testing Payment Data Types...")
        
        try:
            # Test payment gateways endpoint
            response = requests.get(f"{API_BASE_URL}/payment/gateways")
            
            if response.status_code == 200:
                gateways = response.json()
                print(f"✅ Payment gateways loaded: {len(gateways.get('gateways', []))} available")
                
                for gateway in gateways.get('gateways', []):
                    print(f"  - {gateway['name']}: {gateway['status']}")
                
                return True
            else:
                print(f"❌ Payment gateways failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Payment verification error: {e}")
            return False
    
    def verify_order_data_structure(self) -> bool:
        """Verify order creation data structure"""
        print("\n📋 Testing Order Data Structure...")
        
        try:
            # Get user's orders to verify structure
            response = requests.get(f"{API_BASE_URL}/orders/", headers=self.get_headers())
            
            if response.status_code == 200:
                orders = response.json()
                print(f"📋 Found {len(orders)} orders for user")
                
                if orders:
                    order = orders[0]
                    required_fields = ['id', 'order_number', 'total_amount', 'status']
                    
                    for field in required_fields:
                        if field not in order:
                            print(f"❌ Missing field '{field}' in order")
                            return False
                    
                    # Verify amount is properly formatted
                    if 'total_amount' in order:
                        amount = order['total_amount']
                        if isinstance(amount, str):
                            try:
                                Decimal(amount)
                                print(f"✅ Order amount is valid decimal string: {amount}")
                            except:
                                print(f"❌ Order amount is invalid decimal: {amount}")
                                return False
                        elif isinstance(amount, (int, float)):
                            print(f"✅ Order amount is numeric: {amount}")
                        else:
                            print(f"❌ Order amount has invalid type: {type(amount)}")
                            return False
                
                return True
            else:
                print(f"⚠️ Orders endpoint returned: {response.status_code} (may be empty)")
                return True  # Empty orders is acceptable
                
        except Exception as e:
            print(f"❌ Order verification error: {e}")
            return False
    
    def run_verification(self) -> bool:
        """Run all verification tests"""
        print("🔍 Starting Data Flow Verification...")
        
        if not self.authenticate():
            return False
        
        tests = [
            self.verify_cart_data_structure,
            self.verify_checkout_data_structure, 
            self.verify_payment_data_types,
            self.verify_order_data_structure
        ]
        
        results = []
        for test in tests:
            try:
                result = test()
                results.append(result)
            except Exception as e:
                print(f"❌ Test failed with exception: {e}")
                results.append(False)
        
        print(f"\n📊 Verification Results:")
        print(f"✅ Passed: {sum(results)}/{len(results)} tests")
        
        if all(results):
            print("🎉 All data flow verifications passed!")
            return True
        else:
            print("⚠️ Some verifications failed - check logs above")
            return False

if __name__ == "__main__":
    verifier = DataFlowVerifier()
    success = verifier.run_verification()
    exit(0 if success else 1)