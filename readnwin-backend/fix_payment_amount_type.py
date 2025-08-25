#!/usr/bin/env python3
"""
Fix payment amount column type from double precision to numeric(12,2)
"""

import psycopg2
import os
from dotenv import load_dotenv

def fix_payment_amount_type():
    # Load environment variables
    load_dotenv('../.env')
    
    # Database connection
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST'),
        port=os.getenv('DB_PORT'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )
    
    cursor = conn.cursor()
    
    try:
        print("Fixing payment amount column type...")
        
        # Check current type
        cursor.execute("""
            SELECT data_type, numeric_precision, numeric_scale
            FROM information_schema.columns 
            WHERE table_name = 'payments' AND column_name = 'amount';
        """)
        current_type = cursor.fetchone()
        print(f"Current type: {current_type}")
        
        # Alter column type to numeric(12,2)
        cursor.execute("""
            ALTER TABLE payments 
            ALTER COLUMN amount TYPE NUMERIC(12,2);
        """)
        
        # Verify the change
        cursor.execute("""
            SELECT data_type, numeric_precision, numeric_scale
            FROM information_schema.columns 
            WHERE table_name = 'payments' AND column_name = 'amount';
        """)
        new_type = cursor.fetchone()
        print(f"New type: {new_type}")
        
        # Commit changes
        conn.commit()
        print("✅ Payment amount column type fixed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    fix_payment_amount_type()