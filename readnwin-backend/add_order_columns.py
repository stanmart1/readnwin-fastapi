#!/usr/bin/env python3

import os
import sys
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
print(f"Connecting to: postgresql://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")

def add_order_columns():
    """Add missing columns to orders table"""
    engine = create_engine(DATABASE_URL)
    print(f"Database URL: {DATABASE_URL.replace(DB_PASSWORD, '***')}")
    
    try:
        with engine.connect() as conn:
            # Check if columns exist and add them if they don't
            columns_to_add = [
                ("order_number", "VARCHAR UNIQUE"),
                ("billing_address", "JSON"),
                ("notes", "TEXT"),
                ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            ]
            
            for column_name, column_type in columns_to_add:
                try:
                    # Try to add the column
                    conn.execute(text(f"ALTER TABLE orders ADD COLUMN {column_name} {column_type}"))
                    print(f"✅ Added column: {column_name}")
                except Exception as e:
                    if "already exists" in str(e):
                        print(f"⚠️  Column {column_name} already exists")
                    else:
                        print(f"❌ Error adding column {column_name}: {e}")
            
            # Update shipping_address column type to JSON if it's TEXT
            try:
                conn.execute(text("ALTER TABLE orders ALTER COLUMN shipping_address TYPE JSON USING shipping_address::JSON"))
                print("✅ Updated shipping_address column to JSON type")
            except Exception as e:
                if "cannot be cast automatically" in str(e):
                    print("⚠️  shipping_address column type conversion skipped (data exists)")
                else:
                    print(f"❌ Error updating shipping_address column: {e}")
            
            conn.commit()
            conn.close()
            print("✅ Database migration completed successfully")
            
    except Exception as e:
        print(f"❌ Database migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    add_order_columns()