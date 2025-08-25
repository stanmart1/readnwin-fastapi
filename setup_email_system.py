#!/usr/bin/env python3
"""
Email System Setup Script
Creates default email templates and function assignments
"""

import sys
import os
import requests
import json

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
            return None
    except Exception as e:
        print(f"❌ Error logging in as admin: {str(e)}")
        return None

def create_default_templates(token):
    """Create default email templates"""
    headers = {"Authorization": f"Bearer {token}"}
    
    templates = [
        {
            "name": "Welcome Email",
            "slug": "welcome-email",
            "subject": "Welcome to ReadnWin, {{userName}}!",
            "category": "authentication",
            "html_content": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to ReadnWin</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Welcome to ReadnWin!</h1>
        <p>Hi {{userName}},</p>
        <p>Welcome to ReadnWin! We're excited to have you join our community of book lovers.</p>
        <p>Your account has been successfully created. You can now:</p>
        <ul>
            <li>Browse our extensive book collection</li>
            <li>Purchase and read books online</li>
            <li>Track your reading progress</li>
            <li>Set reading goals</li>
        </ul>
        <p>
            <a href="{{site_url}}/books" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Start Reading
            </a>
        </p>
        <p>Happy reading!</p>
        <p>The ReadnWin Team</p>
    </div>
</body>
</html>
            """,
            "text_content": """
Welcome to ReadnWin!

Hi {{userName}},

Welcome to ReadnWin! We're excited to have you join our community of book lovers.

Your account has been successfully created. You can now:
- Browse our extensive book collection
- Purchase and read books online  
- Track your reading progress
- Set reading goals

Visit {{site_url}}/books to start reading.

Happy reading!
The ReadnWin Team
            """,
            "is_active": True
        },
        {
            "name": "Password Reset",
            "slug": "password-reset",
            "subject": "Reset Your ReadnWin Password",
            "category": "authentication", 
            "html_content": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626;">Password Reset Request</h1>
        <p>Hi {{userName}},</p>
        <p>We received a request to reset your password for your ReadnWin account.</p>
        <p>Click the button below to reset your password:</p>
        <p>
            <a href="{{resetUrl}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
            </a>
        </p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>Best regards,<br>The ReadnWin Team</p>
    </div>
</body>
</html>
            """,
            "text_content": """
Password Reset Request

Hi {{userName}},

We received a request to reset your password for your ReadnWin account.

Click this link to reset your password: {{resetUrl}}

If you didn't request this password reset, please ignore this email.
This link will expire in 1 hour for security reasons.

Best regards,
The ReadnWin Team
            """,
            "is_active": True
        },
        {
            "name": "Order Confirmation",
            "slug": "order-confirmation",
            "subject": "Order Confirmation - {{orderNumber}}",
            "category": "transactional",
            "html_content": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #059669;">Order Confirmed!</h1>
        <p>Hi {{userName}},</p>
        <p>Thank you for your order! We've received your payment and are processing your order.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Order Details:</h3>
            <p><strong>Order Number:</strong> {{orderNumber}}</p>
            <p><strong>Total Amount:</strong> {{orderTotal}}</p>
            <p><strong>Payment Method:</strong> {{payment_method}}</p>
            <p><strong>Status:</strong> {{order_status}}</p>
        </div>
        <p>Your books will be available in your library shortly. You'll receive another email when they're ready to read.</p>
        <p>
            <a href="{{site_url}}/dashboard" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View My Library
            </a>
        </p>
        <p>Thank you for choosing ReadnWin!</p>
        <p>The ReadnWin Team</p>
    </div>
</body>
</html>
            """,
            "text_content": """
Order Confirmed!

Hi {{userName}},

Thank you for your order! We've received your payment and are processing your order.

Order Details:
- Order Number: {{orderNumber}}
- Total Amount: {{orderTotal}}
- Payment Method: {{payment_method}}
- Status: {{order_status}}

Your books will be available in your library shortly. You'll receive another email when they're ready to read.

Visit {{site_url}}/dashboard to view your library.

Thank you for choosing ReadnWin!
The ReadnWin Team
            """,
            "is_active": True
        },
        {
            "name": "Shipping Notification",
            "slug": "shipping-notification", 
            "subject": "Your Order is On Its Way! - {{trackingNumber}}",
            "category": "transactional",
            "html_content": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Shipping Notification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #7c3aed;">Your Order is On Its Way!</h1>
        <p>Hi {{userName}},</p>
        <p>Great news! Your order has been shipped and is on its way to you.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Shipping Details:</h3>
            <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
            <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
            <p><strong>Order Number:</strong> {{order_number}}</p>
        </div>
        <p>You can track your package using the tracking number above.</p>
        <p>
            <a href="{{tracking_url}}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Track Package
            </a>
        </p>
        <p>Thank you for your order!</p>
        <p>The ReadnWin Team</p>
    </div>
</body>
</html>
            """,
            "text_content": """
Your Order is On Its Way!

Hi {{userName}},

Great news! Your order has been shipped and is on its way to you.

Shipping Details:
- Tracking Number: {{trackingNumber}}
- Estimated Delivery: {{estimatedDelivery}}
- Order Number: {{order_number}}

You can track your package using the tracking number above.
Track at: {{tracking_url}}

Thank you for your order!
The ReadnWin Team
            """,
            "is_active": True
        }
    ]
    
    created_templates = []
    
    for template in templates:
        try:
            response = requests.post(
                f"{API_BASE_URL}/admin/email-templates",
                json=template,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                created_templates.append(result["template"])
                print(f"✅ Created template: {template['name']}")
            else:
                print(f"❌ Failed to create template {template['name']}: {response.status_code}")
                print(f"Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Error creating template {template['name']}: {str(e)}")
    
    return created_templates

def create_function_assignments(token):
    """Create function-template assignments"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get functions and templates first
    try:
        functions_response = requests.get(f"{API_BASE_URL}/admin/email-functions", headers=headers)
        templates_response = requests.get(f"{API_BASE_URL}/admin/email-templates", headers=headers)
        
        if functions_response.status_code != 200 or templates_response.status_code != 200:
            print("❌ Failed to get functions or templates for assignments")
            return False
        
        functions = functions_response.json().get("functions", [])
        templates = templates_response.json().get("templates", [])
        
        # Create mapping of slug to ID
        function_map = {f["slug"]: f["id"] for f in functions}
        template_map = {t["slug"]: t["id"] for t in templates}
        
        # Define assignments
        assignments = [
            {"function_slug": "user_registration", "template_slug": "welcome-email"},
            {"function_slug": "password_reset", "template_slug": "password-reset"},
            {"function_slug": "order_confirmation", "template_slug": "order-confirmation"},
            {"function_slug": "shipping_notification", "template_slug": "shipping-notification"}
        ]
        
        created_count = 0
        
        for assignment in assignments:
            function_id = function_map.get(assignment["function_slug"])
            template_id = template_map.get(assignment["template_slug"])
            
            if not function_id or not template_id:
                print(f"❌ Missing function or template for assignment: {assignment}")
                continue
            
            try:
                response = requests.post(
                    f"{API_BASE_URL}/admin/email-templates/assignments",
                    json={
                        "functionId": function_id,
                        "templateId": template_id,
                        "priority": 1
                    },
                    headers=headers
                )
                
                if response.status_code == 200:
                    print(f"✅ Created assignment: {assignment['function_slug']} → {assignment['template_slug']}")
                    created_count += 1
                else:
                    print(f"❌ Failed to create assignment: {response.status_code}")
                    print(f"Response: {response.text}")
                    
            except Exception as e:
                print(f"❌ Error creating assignment: {str(e)}")
        
        return created_count > 0
        
    except Exception as e:
        print(f"❌ Error creating assignments: {str(e)}")
        return False

def main():
    """Main setup function"""
    print("🚀 Email System Setup")
    print("=" * 40)
    
    # Get admin token
    print("\n🔐 Authenticating as admin...")
    token = get_admin_token()
    if not token:
        print("❌ Cannot proceed without admin authentication")
        return False
    
    print("✅ Admin authentication successful")
    
    # Create templates
    print("\n📝 Creating Email Templates...")
    templates = create_default_templates(token)
    
    # Create assignments
    print("\n🔗 Creating Function Assignments...")
    assignments_created = create_function_assignments(token)
    
    # Summary
    print("\n" + "=" * 40)
    print("📊 SETUP SUMMARY")
    print("=" * 40)
    print(f"Templates Created: {len(templates)}")
    print(f"Assignments Created: {'✅ Success' if assignments_created else '❌ Failed'}")
    
    if len(templates) > 0 and assignments_created:
        print("\n🎉 Email system setup completed successfully!")
        print("\n📝 Next Steps:")
        print("  1. Test email sending with verify_email_system.py")
        print("  2. Configure email gateway settings in admin dashboard")
        print("  3. Update email templates as needed")
        return True
    else:
        print("\n⚠️ Setup completed with issues. Please check the logs above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)