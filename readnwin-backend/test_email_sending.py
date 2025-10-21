"""
Test email sending with Resend
"""
import sys
from services.resend_email_service import ResendEmailService
from core.database import SessionLocal

def test_emails():
    """Test all email types"""
    db = SessionLocal()
    email_service = ResendEmailService(db)
    
    print("=" * 60)
    print("EMAIL SENDING TEST")
    print("=" * 60)
    
    # Test email address (replace with your email)
    test_email = input("\nEnter your email address to test: ").strip()
    
    if not test_email:
        print("❌ No email provided")
        return False
    
    print(f"\nTesting emails to: {test_email}\n")
    
    # Test 1: Welcome Email
    print("1. Testing Welcome Email...")
    result = email_service.send_welcome_email(test_email, "Test User")
    if result.get("success"):
        print(f"   ✅ Welcome email sent (ID: {result.get('id')})")
    else:
        print(f"   ❌ Failed: {result.get('error')}")
    
    # Test 2: Password Reset Email
    print("\n2. Testing Password Reset Email...")
    result = email_service.send_password_reset_email(test_email, "test_token_123", "Test User")
    if result.get("success"):
        print(f"   ✅ Password reset email sent (ID: {result.get('id')})")
    else:
        print(f"   ❌ Failed: {result.get('error')}")
    
    # Test 3: Email Verification
    print("\n3. Testing Email Verification...")
    result = email_service.send_verification_email(test_email, "testuser", "verify_token_456")
    if result.get("success"):
        print(f"   ✅ Verification email sent (ID: {result.get('id')})")
    else:
        print(f"   ❌ Failed: {result.get('error')}")
    
    # Test 4: Order Confirmation
    print("\n4. Testing Order Confirmation Email...")
    order_data = {
        "order_number": "ORD-12345",
        "total_amount": 29.99,
        "items": [
            {"title": "Sample Book 1", "price": 14.99},
            {"title": "Sample Book 2", "price": 15.00}
        ]
    }
    result = email_service.send_order_confirmation_email(test_email, order_data, "Test User")
    if result.get("success"):
        print(f"   ✅ Order confirmation sent (ID: {result.get('id')})")
    else:
        print(f"   ❌ Failed: {result.get('error')}")
    
    print("\n" + "=" * 60)
    print("✅ Email testing complete! Check your inbox.")
    print("=" * 60)
    
    db.close()
    return True

if __name__ == "__main__":
    try:
        test_emails()
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        sys.exit(1)
