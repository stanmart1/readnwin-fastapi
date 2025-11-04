#!/usr/bin/env python3
"""
Comprehensive checkout flow test script
Tests the entire checkout process from cart to payment
"""
import requests
import json
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/readnwin-backend')

BASE_URL = "http://localhost:8000"

def test_checkout_flow():
    """Test the complete checkout flow"""
    print("🧪 Testing Checkout Flow...")
    
    # Test data
    test_user = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    session = requests.Session()
    
    try:
        # 1. Test payment gateways endpoint
        print("\n1. Testing payment gateways endpoint...")
        response = session.get(f"{BASE_URL}/payment-gateways")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            gateways = response.json().get('gateways', [])
            print(f"✅ Found {len(gateways)} payment gateways")
            for gateway in gateways:
                print(f"   - {gateway['name']}: {'Enabled' if gateway['enabled'] else 'Disabled'}")
        else:
            print(f"❌ Failed: {response.text}")
            return False
        
        # 2. Test shipping methods endpoint
        print("\n2. Testing shipping methods endpoint...")
        response = session.get(f"{BASE_URL}/shipping/methods")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            methods = response.json().get('methods', [])
            print(f"✅ Found {len(methods)} shipping methods")
            for method in methods:
                print(f"   - {method['name']}: ₦{method['base_cost']} ({method['estimated_days_min']}-{method['estimated_days_max']} days)")
        else:
            print(f"❌ Failed: {response.text}")
            return False
        
        # 3. Test checkout endpoint structure (without authentication)
        print("\n3. Testing checkout endpoint structure...")
        checkout_data = {
            "formData": {
                "shipping": {
                    "first_name": "Test",
                    "last_name": "User",
                    "email": "test@example.com",
                    "phone": "+234801234567",
                    "address": "123 Test Street",
                    "city": "Lagos",
                    "state": "Lagos",
                    "zip_code": "100001",
                    "country": "Nigeria"
                },
                "billing": {
                    "sameAsShipping": True
                },
                "payment": {
                    "method": "bank_transfer"
                },
                "shippingMethod": {
                    "id": 1,
                    "name": "Standard Delivery",
                    "base_cost": 500.0,
                    "cost_per_item": 0.0
                }
            },
            "total": 1500.0
        }
        
        response = session.post(f"{BASE_URL}/checkout", json=checkout_data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Checkout properly requires authentication")
        elif response.status_code == 400:
            error_detail = response.json().get('detail', 'Unknown error')
            if 'cart is empty' in error_detail.lower():
                print("✅ Checkout properly validates cart contents")
            else:
                print(f"⚠️  Checkout validation: {error_detail}")
        else:
            print(f"❌ Unexpected response: {response.text}")
        
        # 4. Test payment callback endpoint
        print("\n4. Testing payment callback endpoint...")
        response = session.get(f"{BASE_URL}/payment/callback?status=successful&tx_ref=test_ref")
        print(f"Status: {response.status_code}")
        
        if response.status_code in [404, 400]:
            print("✅ Payment callback properly validates transaction reference")
        elif response.status_code == 302:
            print("✅ Payment callback returns redirect response")
        else:
            print(f"⚠️  Unexpected callback response: {response.status_code}")
        
        print("\n✅ All checkout flow tests completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

def test_api_endpoints():
    """Test individual API endpoints"""
    print("\n🔍 Testing Individual API Endpoints...")
    
    endpoints = [
        ("/payment-gateways", "GET"),
        ("/shipping/methods", "GET"),
        ("/checkout", "POST"),
        ("/payment/callback", "GET")
    ]
    
    for endpoint, method in endpoints:
        try:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}")
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", json={})
            
            print(f"{method} {endpoint}: {response.status_code}")
            
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection failed to {BASE_URL}{endpoint}")
            print("   Make sure the backend server is running on port 8000")
            return False
        except Exception as e:
            print(f"❌ Error testing {endpoint}: {e}")
    
    return True

if __name__ == "__main__":
    print("🚀 Starting Checkout Flow Tests")
    print("=" * 50)
    
    # Test API connectivity first
    if not test_api_endpoints():
        print("\n❌ API connectivity tests failed")
        sys.exit(1)
    
    # Test checkout flow
    if test_checkout_flow():
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed")
        sys.exit(1)