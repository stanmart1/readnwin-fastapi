#!/usr/bin/env python3

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
DB_USER = "postgres"
DB_PASSWORD = "RYUVtweistNIWGSxjKINyczCEoURQuY1YYEyslmbn9klYtcKvwG4r9gLenQc3jZ3"
DB_HOST = "149.102.159.118"
DB_PORT = "9876"
DB_NAME = "postgres"

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def add_payment_columns():
    """Add missing columns to payments table"""
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Use autocommit mode
            conn = conn.execution_options(autocommit=True)
            
            # Check if columns exist and add them if they don't
            columns_to_add = [
                ("proof_of_payment_url", "VARCHAR(500)"),
                ("admin_notes", "VARCHAR(1000)")
            ]
            
            for column_name, column_type in columns_to_add:
                try:
                    # Try to add the column
                    conn.execute(text(f"ALTER TABLE payments ADD COLUMN {column_name} {column_type}"))
                    print(f"✅ Added column: {column_name}")
                except Exception as e:
                    if "already exists" in str(e):
                        print(f"⚠️  Column {column_name} already exists")
                    else:
                        print(f"❌ Error adding column {column_name}: {e}")
            print("✅ Payment table migration completed successfully")
            
    except Exception as e:
        print(f"❌ Payment table migration failed: {e}")

if __name__ == "__main__":
    add_payment_columns()