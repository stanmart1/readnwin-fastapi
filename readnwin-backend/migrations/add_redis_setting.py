#!/usr/bin/env python3
"""
Migration script to add Redis setting to system_settings table
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import sessionmaker
from core.database import engine
from models.system_settings import SystemSetting

def add_redis_setting():
    """Add Redis setting to system_settings table"""
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Check if Redis setting already exists
        existing = db.query(SystemSetting).filter(SystemSetting.key == "redis_enabled").first()
        
        if existing:
            print("✅ Redis setting already exists")
            return
        
        # Add Redis setting
        redis_setting = SystemSetting(
            key="redis_enabled",
            value="true",
            data_type="boolean",
            category="cache",
            description="Enable Redis caching and rate limiting"
        )
        
        db.add(redis_setting)
        db.commit()
        
        print("✅ Redis setting added successfully")
        
    except Exception as e:
        print(f"❌ Error adding Redis setting: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_redis_setting()