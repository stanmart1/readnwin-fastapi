#!/usr/bin/env python3
import psycopg2

# New database connection
NEW_DB_CONFIG = {
    'host': '149.102.159.118',
    'database': 'postgres',
    'user': 'postgres',
    'password': 'RYUVtweistNIWGSxjKINyczCEoURQuY1YYEyslmbn9klYtcKvwG4r9gLenQc3jZ3',
    'port': 9876
}

def check_new_table_structure():
    try:
        # Connect to new database
        print("Connecting to new database...")
        conn = psycopg2.connect(**NEW_DB_CONFIG)
        cursor = conn.cursor()
        
        # Get column structure of email_templates table
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'email_templates'
            ORDER BY ordinal_position
        """)
        columns = cursor.fetchall()
        
        if columns:
            print("\nNew database email templates table structure:")
            for col in columns:
                print(f"  {col[0]} ({col[1]}) - Nullable: {col[2]}")
        else:
            print("No email_templates table found in new database")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_new_table_structure()