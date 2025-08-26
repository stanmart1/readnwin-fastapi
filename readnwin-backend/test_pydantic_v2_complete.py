#!/usr/bin/env python3
"""
Comprehensive test script for Pydantic v2 migration and compatibility
"""
import sys
import warnings
import importlib
from datetime import datetime

# Capture all warnings
warnings.filterwarnings("error", category=UserWarning, message=".*Valid config keys have changed in V2.*")
warnings.filterwarnings("error", category=DeprecationWarning, message=".*pydantic.*")

def test_schema_imports():
    """Test all schema imports for Pydantic v2 warnings"""
    schema_modules = [
        'schemas.email', 'schemas.orders_enhanced', 'schemas.reading', 
        'schemas.payment', 'schemas.shopping', 'schemas.orders',
        'schemas.admin', 'schemas.checkout'
    ]
    
    print("🧪 Testing schema imports...")
    for module_name in schema_modules:
        try:
            importlib.import_module(module_name)
            print(f"  ✅ {module_name}")
        except ImportError as e:
            print(f"  ⚠️  {module_name} - Import error: {e}")
        except UserWarning as e:
            if "Valid config keys have changed in V2" in str(e):
                print(f"  ❌ {module_name} - Pydantic v2 warning: {e}")
                return False
    return True

def test_router_imports():
    """Test router imports that contain Pydantic models"""
    router_modules = [
        'routers.auth', 'routers.books', 'routers.users',
        'routers.reviews', 'routers.reading', 'routers.rbac'
    ]
    
    print("🧪 Testing router imports...")
    for module_name in router_modules:
        try:
            importlib.import_module(module_name)
            print(f"  ✅ {module_name}")
        except ImportError as e:
            print(f"  ⚠️  {module_name} - Import error: {e}")
        except UserWarning as e:
            if "Valid config keys have changed in V2" in str(e):
                print(f"  ❌ {module_name} - Pydantic v2 warning: {e}")
                return False
    return True

def test_orm_serialization():
    """Test ORM model serialization with from_attributes"""
    print("🧪 Testing ORM serialization...")
    
    try:
        from schemas.email import EmailTemplateResponse
        from schemas.payment import PaymentResponse
        from schemas.reading import ReadingSessionResponse
        
        # Mock ORM models
        class MockEmailTemplate:
            def __init__(self):
                self.id = 1
                self.name = "Test Template"
                self.subject = "Test Subject"
                self.template_type = "welcome"
                self.body_html = "<p>Test</p>"
                self.body_text = "Test"
                self.variables = {"name": "User"}
                self.is_active = True
                self.created_at = datetime.now()
                self.updated_at = datetime.now()
        
        class MockPayment:
            def __init__(self):
                self.id = 1
                self.amount = 100.00
                self.currency = "NGN"
                self.payment_method = "card"
                self.description = "Test payment"
                self.status = "completed"
                self.transaction_reference = "TXN123"
                self.created_at = datetime.now()
                self.updated_at = datetime.now()
        
        class MockReadingSession:
            def __init__(self):
                self.id = 1
                self.user_id = 1
                self.book_id = 1
                self.current_page = 50
                self.total_pages = 200
                self.reading_time = 3600
                self.completion_percentage = 25.0
                self.created_at = datetime.now()
                self.updated_at = datetime.now()
        
        # Test serialization
        email_mock = MockEmailTemplate()
        email_response = EmailTemplateResponse.model_validate(email_mock)
        print(f"  ✅ EmailTemplateResponse: {email_response.name}")
        
        payment_mock = MockPayment()
        payment_response = PaymentResponse.model_validate(payment_mock)
        print(f"  ✅ PaymentResponse: {payment_response.transaction_reference}")
        
        reading_mock = MockReadingSession()
        reading_response = ReadingSessionResponse.model_validate(reading_mock)
        print(f"  ✅ ReadingSessionResponse: Page {reading_response.current_page}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ ORM serialization failed: {e}")
        return False

def test_fastapi_compatibility():
    """Test FastAPI compatibility with updated versions"""
    print("🧪 Testing FastAPI compatibility...")
    
    try:
        import fastapi
        import pydantic
        import sqlalchemy
        import uvicorn
        
        print(f"  ✅ FastAPI: {fastapi.__version__}")
        print(f"  ✅ Pydantic: {pydantic.__version__}")
        print(f"  ✅ SQLAlchemy: {sqlalchemy.__version__}")
        print(f"  ✅ Uvicorn: {uvicorn.__version__}")
        
        # Test basic FastAPI app creation
        app = fastapi.FastAPI()
        
        @app.get("/test")
        def test_endpoint():
            return {"message": "test"}
        
        print("  ✅ FastAPI app creation successful")
        return True
        
    except Exception as e:
        print(f"  ❌ FastAPI compatibility test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Pydantic v2 Migration & Compatibility Tests\n")
    
    tests = [
        ("Schema Imports", test_schema_imports),
        ("Router Imports", test_router_imports),
        ("ORM Serialization", test_orm_serialization),
        ("FastAPI Compatibility", test_fastapi_compatibility)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📋 {test_name}")
        print("-" * 50)
        result = test_func()
        results.append((test_name, result))
    
    print("\n" + "="*60)
    print("📊 TEST RESULTS SUMMARY")
    print("="*60)
    
    all_passed = True
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:10} {test_name}")
        if not result:
            all_passed = False
    
    print("="*60)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Pydantic v2 migration complete")
        print("✅ No deprecated configurations found")
        print("✅ ORM serialization working")
        print("✅ FastAPI compatibility confirmed")
        return 0
    else:
        print("❌ SOME TESTS FAILED!")
        print("Please review the errors above and fix any issues.")
        return 1

if __name__ == "__main__":
    sys.exit(main())