#!/usr/bin/env python3
"""
Ensure Email Functions Script
Ensures required email functions exist in the database
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'readnwin-backend'))

from sqlalchemy.orm import Session
from core.database import get_db
from models.email_templates import AdminEmailFunction

def ensure_email_functions():
    """Ensure required email functions exist"""
    
    db = next(get_db())
    
    required_functions = [
        {
            "name": "User Registration",
            "slug": "user_registration",
            "description": "Welcome email sent when user registers",
            "category": "authentication",
            "required_variables": ["userName", "userEmail", "verificationUrl", "site_url"],
            "is_active": True
        },
        {
            "name": "Password Reset",
            "slug": "password_reset",
            "description": "Email sent when user requests password reset",
            "category": "authentication",
            "required_variables": ["userName", "resetUrl", "resetToken", "site_url"],
            "is_active": True
        },
        {
            "name": "Order Confirmation",
            "slug": "order_confirmation",
            "description": "Email sent when order is placed",
            "category": "transactional",
            "required_variables": ["userName", "orderNumber", "orderTotal", "payment_method", "order_status", "site_url"],
            "is_active": True
        },
        {
            "name": "Shipping Notification",
            "slug": "shipping_notification",
            "description": "Email sent when order is shipped",
            "category": "transactional",
            "required_variables": ["userName", "trackingNumber", "estimatedDelivery", "order_number", "tracking_url", "site_url"],
            "is_active": True
        }
    ]
    
    created_count = 0
    
    for func_data in required_functions:
        # Check if function already exists
        existing = db.query(AdminEmailFunction).filter(
            AdminEmailFunction.slug == func_data["slug"]
        ).first()
        
        if existing:
            print(f"✅ Function already exists: {func_data['name']}")
            continue
        
        # Create new function
        try:
            new_function = AdminEmailFunction(
                name=func_data["name"],
                slug=func_data["slug"],
                description=func_data["description"],
                category=func_data["category"],
                required_variables=func_data["required_variables"],
                is_active=func_data["is_active"]
            )
            
            db.add(new_function)
            db.commit()
            
            print(f"✅ Created function: {func_data['name']}")
            created_count += 1
            
        except Exception as e:
            print(f"❌ Error creating function {func_data['name']}: {str(e)}")
            db.rollback()
    
    db.close()
    
    print(f"\n📊 Summary: {created_count} new functions created")
    return created_count

if __name__ == "__main__":
    print("🔧 Ensuring Email Functions Exist...")
    print("=" * 40)
    
    try:
        created = ensure_email_functions()
        print(f"\n🎉 Email functions setup complete!")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)