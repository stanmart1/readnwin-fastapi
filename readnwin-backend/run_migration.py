#!/usr/bin/env python3
"""
Simple script to add new user profile fields to existing database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from core.database import engine

def run_migration():
    """Add new user profile fields"""
    try:
        with engine.connect() as conn:
            # Add new columns to users table
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS school_name VARCHAR"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS school_category VARCHAR"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS class_level VARCHAR"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR"))
            conn.commit()
            print("✅ Migration completed successfully!")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    run_migration()