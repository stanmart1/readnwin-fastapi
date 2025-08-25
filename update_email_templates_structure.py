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

def update_email_templates_structure():
    try:
        print("Connecting to new database...")
        conn = psycopg2.connect(**NEW_DB_CONFIG)
        cursor = conn.cursor()
        
        print("Updating email_templates table structure...")
        
        # Add new columns to match old database
        cursor.execute("ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS html_content TEXT")
        cursor.execute("ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS text_content TEXT")
        cursor.execute("ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS slug VARCHAR(255)")
        cursor.execute("ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS category VARCHAR(255)")
        cursor.execute("ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS description TEXT")
        
        # Change variables column type to jsonb if needed
        cursor.execute("ALTER TABLE email_templates ALTER COLUMN variables TYPE JSONB USING variables::jsonb")
        
        # Drop template_type enum constraint if it exists
        cursor.execute("ALTER TABLE email_templates ALTER COLUMN template_type DROP NOT NULL")
        cursor.execute("ALTER TABLE email_templates ALTER COLUMN template_type TYPE VARCHAR(255)")
        
        # Make body_html nullable and rename columns
        cursor.execute("ALTER TABLE email_templates ALTER COLUMN body_html DROP NOT NULL")
        
        conn.commit()
        print("Email templates table structure updated successfully!")
        
        # Show updated structure
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'email_templates'
            ORDER BY ordinal_position
        """)
        columns = cursor.fetchall()
        
        print("\nUpdated table structure:")
        for col in columns:
            print(f"  {col[0]} ({col[1]}) - Nullable: {col[2]}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")
        if conn:
            conn.rollback()

if __name__ == "__main__":
    update_email_templates_structure()