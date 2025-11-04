#!/usr/bin/env python3
"""
Test script for Redis settings functionality
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import sessionmaker
from core.database import engine
from models.system_settings import SystemSetting
from services.redis_service import is_redis_enabled, reset_redis_setting_cache

def test_redis_settings():
    """Test Redis settings functionality"""
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        print("🧪 Testing Redis settings functionality...")
        
        # Test 1: Check initial Redis setting
        print(f"1. Initial Redis enabled status: {is_redis_enabled()}")
        
        # Test 2: Disable Redis
        setting = db.query(SystemSetting).filter(SystemSetting.key == "redis_enabled").first()
        if setting:
            setting.value = "false"
            db.commit()
            reset_redis_setting_cache()
            print(f"2. After disabling Redis: {is_redis_enabled()}")
            
            # Test 3: Enable Redis again
            setting.value = "true"
            db.commit()
            reset_redis_setting_cache()
            print(f"3. After enabling Redis: {is_redis_enabled()}")
        else:
            print("❌ Redis setting not found in database")
            return
        
        # Test 4: Test Redis client with setting disabled
        setting.value = "false"
        db.commit()
        reset_redis_setting_cache()
        
        from services.redis_service import get_redis_client
        client = get_redis_client()
        print(f"4. Redis client when disabled: {client is not None}")
        
        # Test 5: Test Redis client with setting enabled
        setting.value = "true"
        db.commit()
        reset_redis_setting_cache()
        
        client = get_redis_client()
        print(f"5. Redis client when enabled: {client is not None}")
        
        print("✅ All tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    test_redis_settings()