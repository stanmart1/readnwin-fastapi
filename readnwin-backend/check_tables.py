#!/usr/bin/env python3

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection - direct details
DB_USER = "postgres"
DB_PASSWORD = "RYUVtweistNIWGSxjKINyczCEoURQuY1YYEyslmbn9klYtcKvwG4r9gLenQc3jZ3"
DB_HOST = "149.102.159.118"
DB_PORT = "9876"
DB_NAME = "postgres"

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def check_tables():
    """Check what tables exist in the database"""
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # List all tables
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result]
            
            print("📋 Existing tables:")
            for table in sorted(tables):
                print(f"  - {table}")
            
            # Check if orders table exists
            if 'orders' in tables:
                print("\n📊 Orders table structure:")
                result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders'"))
                for row in result:
                    print(f"  - {row[0]}: {row[1]}")
            else:
                print("\n❌ Orders table does not exist")
                
    except Exception as e:
        print(f"❌ Database check failed: {e}")

if __name__ == "__main__":
    check_tables()