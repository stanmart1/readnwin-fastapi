#!/usr/bin/env python3
"""
Email Template Connection Verification Script
Verifies existing email templates are properly connected to email functions
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

def check_existing_templates(token):
    """Check existing email templates"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("📋 Checking Existing Email Templates...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/admin/email-templates", headers=headers)
        if response.status_code != 200:
            print(f"❌ Failed to get templates: {response.status_code}")
            return []
        
        templates = response.json().get("templates", [])
        print(f"✅ Found {len(templates)} existing templates:")
        
        for template in templates:
            status = "🟢 Active" if template.get("is_active") else "🔴 Inactive"
            print(f"  - {template['name']} ({template['slug']}) - {status}")
        
        return templates
        
    except Exception as e:
        print(f"❌ Error checking templates: {str(e)}")
        return []

def check_email_functions(token):
    """Check email functions"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n⚙️ Checking Email Functions...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/admin/email-functions", headers=headers)
        if response.status_code != 200:
            print(f"❌ Failed to get functions: {response.status_code}")
            return []
        
        functions = response.json().get("functions", [])
        print(f"✅ Found {len(functions)} email functions:")
        
        for func in functions:
            status = "🟢 Active" if func.get("is_active") else "🔴 Inactive"
            print(f"  - {func['name']} ({func['slug']}) - {status}")
        
        return functions
        
    except Exception as e:
        print(f"❌ Error checking functions: {str(e)}")
        return []

def check_assignments(token):
    """Check function-template assignments"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🔗 Checking Function-Template Assignments...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/admin/email-assignments", headers=headers)
        if response.status_code != 200:
            print(f"❌ Failed to get assignments: {response.status_code}")
            return []
        
        assignments = response.json().get("assignments", [])
        print(f"✅ Found {len(assignments)} assignments:")
        
        for assignment in assignments:
            status = "🟢 Active" if assignment.get("is_active") else "🔴 Inactive"
            print(f"  - {assignment['function_name']} → {assignment['template_name']} - {status}")
        
        return assignments
        
    except Exception as e:
        print(f"❌ Error checking assignments: {str(e)}")
        return []

def create_missing_assignments(token, functions, templates, existing_assignments):
    """Create missing function-template assignments"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n🔧 Creating Missing Assignments...")
    
    # Create mapping
    function_map = {f["slug"]: f for f in functions}
    template_map = {t["slug"]: t for t in templates}
    
    # Check existing assignments
    existing_pairs = set()
    for assignment in existing_assignments:
        existing_pairs.add((assignment["function_slug"], assignment["template_slug"]))
    
    # Define expected mappings based on common patterns
    expected_mappings = [
        ("user_registration", ["welcome", "registration", "signup"]),
        ("password_reset", ["password", "reset"]),
        ("order_confirmation", ["order", "confirmation", "purchase"]),
        ("shipping_notification", ["shipping", "delivery", "tracking"])
    ]
    
    created_count = 0
    
    for function_slug, template_keywords in expected_mappings:
        if function_slug not in function_map:
            continue
            
        # Find matching template
        matching_template = None
        for template in templates:
            template_slug = template["slug"].lower()
            template_name = template["name"].lower()
            
            # Check if any keyword matches
            for keyword in template_keywords:
                if keyword in template_slug or keyword in template_name:
                    matching_template = template
                    break
            
            if matching_template:
                break
        
        if not matching_template:
            print(f"  ❌ No matching template found for function: {function_slug}")
            continue
        
        # Check if assignment already exists
        if (function_slug, matching_template["slug"]) in existing_pairs:
            print(f"  ✅ Assignment already exists: {function_slug} → {matching_template['slug']}")
            continue
        
        # Create assignment
        try:
            response = requests.post(
                f"{API_BASE_URL}/admin/email-templates/assignments",
                json={
                    "functionId": function_map[function_slug]["id"],
                    "templateId": matching_template["id"],
                    "priority": 1
                },
                headers=headers
            )
            
            if response.status_code == 200:
                print(f"  ✅ Created: {function_slug} → {matching_template['slug']}")
                created_count += 1
            else:
                print(f"  ❌ Failed to create assignment: {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ Error creating assignment: {str(e)}")
    
    return created_count

def test_email_sending(token, test_email="test@example.com"):
    """Test email sending for each function"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n📧 Testing Email Sending (to {test_email})...")
    
    test_cases = [
        {
            "function_slug": "user_registration",
            "variables": {
                "userName": "Test User",
                "userEmail": test_email,
                "verificationUrl": "http://localhost:3000/verify-email?token=test123",
                "site_url": "http://localhost:3000"
            }
        },
        {
            "function_slug": "password_reset",
            "variables": {
                "userName": "Test User",
                "resetUrl": "http://localhost:3000/reset-password?token=test123",
                "resetToken": "test123",
                "site_url": "http://localhost:3000"
            }
        },
        {
            "function_slug": "order_confirmation",
            "variables": {
                "userName": "Test Customer",
                "orderNumber": "ORD-12345",
                "orderTotal": "₦15,000.00",
                "payment_method": "Card",
                "order_status": "Confirmed",
                "site_url": "http://localhost:3000"
            }
        },
        {
            "function_slug": "shipping_notification",
            "variables": {
                "userName": "Test Customer",
                "trackingNumber": "TRK-67890",
                "estimatedDelivery": "2024-01-15",
                "order_number": "ORD-12345",
                "tracking_url": "https://tracking.example.com/TRK-67890",
                "site_url": "http://localhost:3000"
            }
        }
    ]
    
    success_count = 0
    
    for test_case in test_cases:
        print(f"\n  Testing {test_case['function_slug']}...")
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/admin/email-templates/test",
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
                    error_msg = result.get("error", "Unknown error")
                    print(f"    ❌ Email sending failed: {error_msg}")
            else:
                print(f"    ❌ API call failed: {response.status_code}")
                if response.text:
                    print(f"    Response: {response.text}")
                    
        except Exception as e:
            print(f"    ❌ Error testing {test_case['function_slug']}: {str(e)}")
    
    print(f"\n📊 Email Test Results: {success_count}/{len(test_cases)} successful")
    return success_count == len(test_cases)

def main():
    """Main verification function"""
    print("🔍 Email Template Connection Verification")
    print("=" * 50)
    
    # Get admin token
    print("🔐 Authenticating as admin...")
    token = get_admin_token()
    if not token:
        print("❌ Cannot proceed without admin authentication")
        return False
    
    print("✅ Admin authentication successful")
    
    # Check existing components
    templates = check_existing_templates(token)
    functions = check_email_functions(token)
    assignments = check_assignments(token)
    
    if not templates:
        print("\n❌ No email templates found. Please create templates first.")
        return False
    
    if not functions:
        print("\n❌ No email functions found. System may not be properly initialized.")
        return False
    
    # Create missing assignments
    created_assignments = create_missing_assignments(token, functions, templates, assignments)
    
    # Test email sending
    test_email = input("\n📧 Enter test email address (or press Enter to skip): ").strip()
    if test_email:
        email_test_success = test_email_sending(token, test_email)
    else:
        print("📧 Email sending test skipped")
        email_test_success = True
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 VERIFICATION SUMMARY")
    print("=" * 50)
    print(f"Email Templates: {len(templates)} found")
    print(f"Email Functions: {len(functions)} found")
    print(f"Existing Assignments: {len(assignments)} found")
    print(f"New Assignments Created: {created_assignments}")
    print(f"Email Sending Test: {'✅ PASS' if email_test_success else '❌ FAIL'}")
    
    if len(templates) > 0 and len(functions) > 0 and (len(assignments) > 0 or created_assignments > 0):
        print("\n🎉 Email system connections verified successfully!")
        
        if created_assignments > 0:
            print(f"\n✨ Created {created_assignments} new template assignments")
        
        print("\n📝 Next Steps:")
        print("  1. Test email sending from the application")
        print("  2. Verify email templates render correctly")
        print("  3. Check email gateway configuration if sending fails")
        
        return True
    else:
        print("\n⚠️ Email system needs attention. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)