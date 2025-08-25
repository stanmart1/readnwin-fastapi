#!/usr/bin/env python3
"""
Comprehensive Email System Verification Script
Verifies that all email sending functions are connected to their templates and can send emails
"""

import sys
import os
import requests
import json
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'readnwin-backend'))

API_BASE_URL = "http://localhost:9000"

def get_admin_token():
    """Get admin authentication token"""
    login_data = {
        "email": "admin@readnwin.com",  # Replace with actual admin email
        "password": "admin123"  # Replace with actual admin password
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            return response.json().get("access_token")
        else:
            print(f"❌ Admin login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error logging in as admin: {str(e)}")
        return None

def verify_email_templates(token):
    """Verify email templates exist in admin dashboard"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n📋 Verifying Email Templates...")
    
    try:
        # Get all email templates
        response = requests.get(f"{API_BASE_URL}/admin/email-templates", headers=headers)
        if response.status_code != 200:
            print(f"❌ Failed to get email templates: {response.status_code}")
            return False
        
        templates = response.json().get("templates", [])
        print(f"✅ Found {len(templates)} email templates")
        
        for template in templates:
            status = "🟢 Active" if template.get("is_active") else "🔴 Inactive"
            print(f"  - {template['name']} ({template['slug']}) - {status}")
        
        return len(templates) > 0
        
    except Exception as e:
        print(f"❌ Error verifying templates: {str(e)}")
        return False

def verify_email_functions(token):
    """Verify email functions exist and are configured"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n⚙️ Verifying Email Functions...")
    
    try:
        # Get all email functions
        response = requests.get(f"{API_BASE_URL}/admin/email-functions", headers=headers)
        if response.status_code != 200:
            print(f"❌ Failed to get email functions: {response.status_code}")
            return False
        
        functions = response.json().get("functions", [])
        print(f"✅ Found {len(functions)} email functions")
        
        expected_functions = [
            "user_registration",
            "password_reset", 
            "order_confirmation",
            "shipping_notification"
        ]
        
        found_functions = [f['slug'] for f in functions]
        
        for expected in expected_functions:
            if expected in found_functions:
                func = next(f for f in functions if f['slug'] == expected)
                status = "🟢 Active" if func.get("is_active") else "🔴 Inactive"
                print(f"  ✅ {func['name']} ({expected}) - {status}")
            else:
                print(f"  ❌ Missing function: {expected}")
        
        return len(functions) >= len(expected_functions)
        
    except Exception as e:
        print(f"❌ Error verifying functions: {str(e)}")
        return False

def verify_email_assignments(token):
    """Verify email function-template assignments"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🔗 Verifying Email Function Assignments...")
    
    try:
        # Get all assignments
        response = requests.get(f"{API_BASE_URL}/admin/email-assignments", headers=headers)
        if response.status_code != 200:
            print(f"❌ Failed to get email assignments: {response.status_code}")
            return False
        
        assignments = response.json().get("assignments", [])
        print(f"✅ Found {len(assignments)} function-template assignments")
        
        for assignment in assignments:
            status = "🟢 Active" if assignment.get("is_active") else "🔴 Inactive"
            print(f"  - {assignment['function_name']} → {assignment['template_name']} - {status}")
        
        return len(assignments) > 0
        
    except Exception as e:
        print(f"❌ Error verifying assignments: {str(e)}")
        return False

def test_email_sending(token):
    """Test actual email sending functionality"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n📧 Testing Email Sending...")
    
    # Test email address (use a real email you can check)
    test_email = "test@example.com"  # Replace with actual test email
    
    test_cases = [
        {
            "function_slug": "user_registration",
            "variables": {
                "userName": "Test User",
                "userEmail": test_email,
                "verificationUrl": "http://localhost:3000/verify-email?token=test123"
            }
        },
        {
            "function_slug": "password_reset", 
            "variables": {
                "userName": "Test User",
                "resetUrl": "http://localhost:3000/reset-password?token=test123",
                "resetToken": "test123"
            }
        },
        {
            "function_slug": "order_confirmation",
            "variables": {
                "userName": "Test Customer",
                "orderNumber": "ORD-12345",
                "orderTotal": "₦15,000.00"
            }
        },
        {
            "function_slug": "shipping_notification",
            "variables": {
                "userName": "Test Customer", 
                "trackingNumber": "TRK-67890",
                "estimatedDelivery": "2024-01-15"
            }
        }
    ]
    
    success_count = 0
    
    for test_case in test_cases:
        print(f"\n  Testing {test_case['function_slug']}...")
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/admin/email/test",
                json={
                    "function_slug": test_case["function_slug"],
                    "to_email": test_email,
                    "variables": test_case["variables"]
                },
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    print(f"    ✅ Email sent successfully")
                    success_count += 1
                else:
                    print(f"    ❌ Email sending failed: {result.get('error')}")
            else:
                print(f"    ❌ API call failed: {response.status_code}")
                print(f"    Response: {response.text}")
                
        except Exception as e:
            print(f"    ❌ Error testing {test_case['function_slug']}: {str(e)}")
    
    print(f"\n📊 Email Test Results: {success_count}/{len(test_cases)} successful")
    return success_count == len(test_cases)

def verify_email_gateway_config(token):
    """Verify email gateway configuration"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🌐 Verifying Email Gateway Configuration...")
    
    try:
        # Check if email gateway endpoints exist
        response = requests.get(f"{API_BASE_URL}/admin/email-gateways", headers=headers)
        if response.status_code == 200:
            gateways = response.json().get("gateways", [])
            print(f"✅ Found {len(gateways)} email gateways configured")
            
            for gateway in gateways:
                status = "🟢 Active" if gateway.get("is_active") else "🔴 Inactive"
                print(f"  - {gateway.get('provider', 'Unknown')} - {status}")
            
            return len(gateways) > 0
        else:
            print(f"❌ Failed to get email gateways: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error verifying email gateway: {str(e)}")
        return False

def check_environment_variables():
    """Check if required environment variables are set"""
    print("\n🔧 Checking Environment Variables...")
    
    required_vars = [
        "RESEND_API_KEY",
        "SMTP_HOST", 
        "SMTP_USER",
        "SMTP_PASS",
        "SMTP_PORT"
    ]
    
    missing_vars = []
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            # Don't print sensitive values
            if "KEY" in var or "PASS" in var:
                print(f"  ✅ {var}: [CONFIGURED]")
            else:
                print(f"  ✅ {var}: {value}")
        else:
            print(f"  ❌ {var}: [NOT SET]")
            missing_vars.append(var)
    
    if missing_vars:
        print(f"\n⚠️ Missing environment variables: {', '.join(missing_vars)}")
        return False
    
    return True

def main():
    """Main verification function"""
    print("🔍 Email System Verification")
    print("=" * 50)
    
    # Check environment variables first
    env_ok = check_environment_variables()
    
    # Get admin token
    print("\n🔐 Authenticating as admin...")
    token = get_admin_token()
    if not token:
        print("❌ Cannot proceed without admin authentication")
        return False
    
    print("✅ Admin authentication successful")
    
    # Run all verifications
    results = {
        "Environment Variables": env_ok,
        "Email Templates": verify_email_templates(token),
        "Email Functions": verify_email_functions(token), 
        "Function Assignments": verify_email_assignments(token),
        "Email Gateway Config": verify_email_gateway_config(token),
        "Email Sending": test_email_sending(token)
    }
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 VERIFICATION SUMMARY")
    print("=" * 50)
    
    all_passed = True
    for check, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{check}: {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 ALL CHECKS PASSED - Email system is fully functional!")
    else:
        print("⚠️ SOME CHECKS FAILED - Please review the issues above")
    
    print("\n📝 Next Steps:")
    if not env_ok:
        print("  1. Configure missing environment variables in .env file")
    if not results.get("Email Templates"):
        print("  2. Create email templates in admin dashboard")
    if not results.get("Function Assignments"):
        print("  3. Assign templates to email functions in admin dashboard")
    if not results.get("Email Sending"):
        print("  4. Check email gateway configuration and API keys")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)