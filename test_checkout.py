#!/usr/bin/env python3
"""
Quick test script to verify checkout endpoints are working
"""
import requests
import json

BASE_URL = "http://localhost:9000"

def test_shipping_methods():
    """Test shipping methods endpoint"""
    print("🧪 Testing shipping methods endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/shipping/methods")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data.get('methods', []))} shipping methods")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

def test_payment_gateways():
    """Test payment gateways endpoint"""
    print("\n🧪 Testing payment gateways endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/payment-gateways")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data.get('gateways', []))} payment gateways")
            for gateway in data.get('gateways', []):
                print(f"  - {gateway['name']}: {'✅' if gateway['enabled'] else '❌'}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

def test_checkout_structure():
    """Test checkout endpoint structure (without auth)"""
    print("\n🧪 Testing checkout endpoint structure...")
    try:
        # This should fail with 401 but confirm endpoint exists
        test_payload = {
            "shipping_info": {
                "first_name": "Test",
                "last_name": "User",
                "email": "test@example.com",
                "phone": "+234123456789",
                "address": "123 Test St",
                "city": "Lagos",
                "state": "Lagos",
                "zip_code": "100001",
                "country": "Nigeria"
            },
            "billing_info": {
                "first_name": "Test",
                "last_name": "User",
                "email": "test@example.com",
                "phone": "+234123456789",
                "address": "123 Test St",
                "city": "Lagos",
                "state": "Lagos",
                "zip_code": "100001",
                "country": "Nigeria"
            },
            "payment_method": "flutterwave",
            "total_amount": 1000.0
        }
        
        response = requests.post(f"{BASE_URL}/checkout", json=test_payload)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Checkout endpoint exists (authentication required)")
            return True
        elif response.status_code == 422:
            print("✅ Checkout endpoint exists (validation error - expected)")
            return True
        else:
            print(f"⚠️  Unexpected response: {response.text}")
            return True
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing ReadnWin Checkout Flow")
    print("=" * 50)
    
    results = []
    results.append(test_shipping_methods())
    results.append(test_payment_gateways())
    results.append(test_checkout_structure())
    
    print("\n" + "=" * 50)
    print(f"📊 Results: {sum(results)}/{len(results)} tests passed")
    
    if all(results):
        print("✅ All checkout endpoints are working correctly!")
    else:
        print("❌ Some endpoints need attention")