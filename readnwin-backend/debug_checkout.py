#!/usr/bin/env python3

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test checkout endpoint with sample data
def test_checkout():
    url = "http://localhost:9000/checkout/"
    
    # Sample checkout data that matches the schema
    checkout_data = {
        "shipping_address": {
            "first_name": "John",
            "last_name": "Doe", 
            "email": "john.doe@example.com",
            "phone": "+2348123456789",
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
            "method": "flutterwave",
            "gateway": "flutterwave"
        },
        "cart_items": [
            {
                "book_id": 1,
                "quantity": 1,
                "price": "2500.00"
            }
        ],
        "shipping_method": {
            "id": 1,
            "name": "Standard Delivery",
            "base_cost": "1000.00",
            "cost_per_item": "500.00",
            "estimated_days_min": 3,
            "estimated_days_max": 7
        },
        "is_ebook_only": False
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token"  # You'll need a real token
    }
    
    try:
        response = requests.post(url, json=checkout_data, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 422:
            print("\n=== VALIDATION ERROR DETAILS ===")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2))
            except:
                print("Could not parse error response as JSON")
                
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_checkout()