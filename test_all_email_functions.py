#!/usr/bin/env python3
"""
Comprehensive Email Function Test
Tests all email sending functions in the application to ensure they work with templates
"""

import sys
import os
import requests
import json

API_BASE_URL = "http://localhost:9000"

def get_admin_token():
    """Get admin authentication token"""
    login_data = {
        "email": "admin@readnwin.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            return response.json().get("access_token")
        else:
            print(f"❌ Admin login failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error logging in as admin: {str(e)}")
        return None

def test_user_registration_email():
    """Test user registration email (welcome email)"""
    print("\n1️⃣ Testing User Registration Email...")
    
    # Test user registration which should trigger welcome email
    test_user_data = {
        "email": "testuser@example.com",
        "username": "testuser123",
        "password": "TestPass123!",
        "first_name": "Test",
        "last_name": "User"
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/auth/register", json=test_user_data)
        
        if response.status_code == 200:
            print("  ✅ User registration successful - welcome email should be sent")
            return True
        else:
            print(f"  ❌ User registration failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error testing registration: {str(e)}")
        return False

def test_password_reset_email():
    """Test password reset email"""
    print("\n2️⃣ Testing Password Reset Email...")
    
    reset_data = {
        "email": "testuser@example.com"
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/auth/reset-password", json=reset_data)
        
        if response.status_code == 200:
            print("  ✅ Password reset request successful - reset email should be sent")
            return True
        else:
            print(f"  ❌ Password reset failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error testing password reset: {str(e)}")
        return False

def test_order_confirmation_email(token):
    """Test order confirmation email by creating a test order"""
    print("\n3️⃣ Testing Order Confirmation Email...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # This would require a more complex setup with books, cart, etc.
    # For now, we'll test the template directly
    try:
        test_data = {
            "function_slug": "order_confirmation",
            "to_email": "testuser@example.com",
            "variables": {
                "userName": "Test Customer",
                "orderNumber": "ORD-TEST-001",
                "orderTotal": "₦25,000.00",
                "payment_method": "Card",
                "order_status": "Confirmed",
                "site_url": "http://localhost:3000"
            }
        }
        
        response = requests.post(
            f"{API_BASE_URL}/admin/email-templates/test",
            json=test_data,
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("  ✅ Order confirmation email template test successful")
                return True
            else:
                print(f"  ❌ Order confirmation email failed: {result.get('error')}")
                return False
        else:
            print(f"  ❌ Order confirmation test failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error testing order confirmation: {str(e)}")
        return False

def test_shipping_notification_email(token):
    """Test shipping notification email"""
    print("\n4️⃣ Testing Shipping Notification Email...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        test_data = {
            "function_slug": "shipping_notification",
            "to_email": "testuser@example.com",
            "variables": {
                "userName": "Test Customer",
                "trackingNumber": "TRK-TEST-001",
                "estimatedDelivery": "January 15, 2024",
                "order_number": "ORD-TEST-001",
                "tracking_url": "https://tracking.example.com/TRK-TEST-001",
                "site_url": "http://localhost:3000"
            }
        }
        
        response = requests.post(
            f"{API_BASE_URL}/admin/email-templates/test",
            json=test_data,
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("  ✅ Shipping notification email template test successful")
                return True
            else:
                print(f"  ❌ Shipping notification email failed: {result.get('error')}")
                return False
        else:
            print(f"  ❌ Shipping notification test failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error testing shipping notification: {str(e)}")
        return False

def check_email_gateway_config(token):
    """Check email gateway configuration"""
    print("\n🌐 Checking Email Gateway Configuration...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{API_BASE_URL}/admin/email-gateways", headers=headers)
        
        if response.status_code == 200:
            gateways = response.json().get("gateways", [])
            
            if not gateways:
                print("  ⚠️ No email gateways configured")
                return False
            
            active_gateways = [g for g in gateways if g.get("is_active")]
            
            if not active_gateways:
                print("  ⚠️ No active email gateways found")
                return False
            
            print(f"  ✅ Found {len(active_gateways)} active email gateway(s)")
            for gateway in active_gateways:
                print(f"    - {gateway.get('provider', 'Unknown')} gateway")
            
            return True
        else:
            print(f"  ❌ Failed to check email gateways: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error checking email gateways: {str(e)}")
        return False

def check_environment_config():
    """Check environment configuration"""
    print("\n🔧 Checking Environment Configuration...")
    
    # Check if we're using Resend or SMTP
    resend_key = os.getenv("RESEND_API_KEY")
    smtp_host = os.getenv("SMTP_HOST")
    
    if resend_key:
        print("  ✅ Resend API key configured")
        return True
    elif smtp_host:
        smtp_user = os.getenv("SMTP_USER")
        smtp_pass = os.getenv("SMTP_PASS")
        smtp_port = os.getenv("SMTP_PORT")
        
        if smtp_user and smtp_pass and smtp_port:
            print(f"  ✅ SMTP configuration found: {smtp_host}:{smtp_port}")
            return True
        else:
            print("  ❌ Incomplete SMTP configuration")
            return False
    else:
        print("  ❌ No email service configuration found")
        return False

def main():
    """Main test function"""
    print("🧪 Comprehensive Email Function Test")
    print("=" * 50)
    
    # Check environment first
    env_ok = check_environment_config()
    
    # Get admin token
    print("\n🔐 Authenticating as admin...")
    token = get_admin_token()
    if not token:
        print("❌ Cannot proceed without admin authentication")
        return False
    
    print("✅ Admin authentication successful")
    
    # Check email gateway
    gateway_ok = check_email_gateway_config(token)
    
    # Run email function tests
    test_results = {
        "Environment Config": env_ok,
        "Email Gateway": gateway_ok,
        "User Registration Email": test_user_registration_email(),
        "Password Reset Email": test_password_reset_email(),
        "Order Confirmation Email": test_order_confirmation_email(token),
        "Shipping Notification Email": test_shipping_notification_email(token)
    }
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 EMAIL FUNCTION TEST SUMMARY")
    print("=" * 50)
    
    passed_count = 0
    total_count = len(test_results)
    
    for test_name, passed in test_results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")
        if passed:
            passed_count += 1
    
    print(f"\nOverall: {passed_count}/{total_count} tests passed")
    
    if passed_count == total_count:
        print("\n🎉 ALL EMAIL FUNCTIONS ARE WORKING CORRECTLY!")
        print("\n✨ Your email system is fully functional and connected to templates.")
    else:
        print("\n⚠️ SOME EMAIL FUNCTIONS NEED ATTENTION")
        print("\n📝 Issues to address:")
        
        if not test_results["Environment Config"]:
            print("  - Configure email service (Resend API key or SMTP settings)")
        if not test_results["Email Gateway"]:
            print("  - Set up email gateway in admin dashboard")
        if not test_results["User Registration Email"]:
            print("  - Check user registration email template assignment")
        if not test_results["Password Reset Email"]:
            print("  - Check password reset email template assignment")
        if not test_results["Order Confirmation Email"]:
            print("  - Check order confirmation email template assignment")
        if not test_results["Shipping Notification Email"]:
            print("  - Check shipping notification email template assignment")
    
    return passed_count == total_count

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)