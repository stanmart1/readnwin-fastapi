#!/usr/bin/env python3
import psycopg2

# Old database connection
OLD_DB_CONFIG = {
    'host': '149.102.159.118',
    'database': 'postgres',
    'user': 'postgres',
    'password': '6c8u2MsYqlbQxL5IxftjrV7QQnlLymdsmzMtTeIe4Ur1od7RR9CdODh3VfQ4ka2f',
    'port': 5432
}

def check_table_structure():
    try:
        # Connect to old database
        print("Connecting to old database...")
        conn = psycopg2.connect(**OLD_DB_CONFIG)
        cursor = conn.cursor()
        
        # Check if email_templates table exists
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name LIKE '%email%'
        """)
        tables = cursor.fetchall()
        print(f"Email-related tables: {tables}")
        
        # Get column structure of email_templates table
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'email_templates'
            ORDER BY ordinal_position
        """)
        columns = cursor.fetchall()
        
        if columns:
            print("\nEmail templates table structure:")
            for col in columns:
                print(f"  {col[0]} ({col[1]}) - Nullable: {col[2]}")
            
            # Get sample data
            cursor.execute("SELECT * FROM email_templates LIMIT 3")
            sample_data = cursor.fetchall()
            print(f"\nSample data ({len(sample_data)} rows):")
            for row in sample_data:
                print(f"  {row}")
        else:
            print("No email_templates table found")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_table_structure()