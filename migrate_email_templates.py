#!/usr/bin/env python3
import psycopg2
import json
from datetime import datetime
import sys

# Old database connection
OLD_DB_CONFIG = {
    'host': '149.102.159.118',
    'database': 'postgres',
    'user': 'postgres',
    'password': '6c8u2MsYqlbQxL5IxftjrV7QQnlLymdsmzMtTeIe4Ur1od7RR9CdODh3VfQ4ka2f',
    'port': 5432
}

# New database connection
NEW_DB_CONFIG = {
    'host': '149.102.159.118',
    'database': 'postgres',
    'user': 'postgres',
    'password': 'RYUVtweistNIWGSxjKINyczCEoURQuY1YYEyslmbn9klYtcKvwG4r9gLenQc3jZ3',
    'port': 9876
}

def migrate_email_templates():
    old_conn = None
    new_conn = None
    
    try:
        # Connect to old database
        print("Connecting to old database...")
        old_conn = psycopg2.connect(**OLD_DB_CONFIG)
        old_cursor = old_conn.cursor()
        
        # Connect to new database
        print("Connecting to new database...")
        new_conn = psycopg2.connect(**NEW_DB_CONFIG)
        new_cursor = new_conn.cursor()
        
        # Get email templates from old database
        print("Fetching email templates from old database...")
        old_cursor.execute("""
            SELECT id, name, subject, html_content, text_content, variables, is_active, created_at, updated_at, slug, category, description
            FROM email_templates
            ORDER BY id
        """)
        
        templates = old_cursor.fetchall()
        print(f"Found {len(templates)} email templates")
        
        if not templates:
            print("No email templates found in old database")
            return
        
        # Insert into new database
        print("Inserting email templates into new database...")
        
        for template in templates:
            old_id, name, subject, html_content, text_content, variables, is_active, created_at, updated_at, slug, category, description = template
            
            # Check if template already exists
            new_cursor.execute("SELECT id FROM email_templates WHERE name = %s", (name,))
            existing = new_cursor.fetchone()
            
            if existing:
                print(f"Template '{name}' already exists, updating...")
                new_cursor.execute("""
                    UPDATE email_templates 
                    SET subject = %s, html_content = %s, text_content = %s, variables = %s, is_active = %s, updated_at = %s, slug = %s, category = %s, description = %s
                    WHERE name = %s
                """, (subject, html_content, text_content, json.dumps(variables) if variables else None, is_active, updated_at or datetime.now(), slug, category, description, name))
            else:
                print(f"Inserting new template '{name}'...")
                new_cursor.execute("""
                    INSERT INTO email_templates (name, subject, html_content, text_content, variables, is_active, created_at, updated_at, slug, category, description)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (name, subject, html_content, text_content, json.dumps(variables) if variables else None, is_active, created_at or datetime.now(), updated_at or datetime.now(), slug, category, description))
        
        # Commit changes
        new_conn.commit()
        print("Email templates migration completed successfully!")
        
        # Verify migration
        new_cursor.execute("SELECT COUNT(*) FROM email_templates")
        count = new_cursor.fetchone()[0]
        print(f"Total email templates in new database: {count}")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        if new_conn:
            new_conn.rollback()
    
    finally:
        if old_conn:
            old_conn.close()
        if new_conn:
            new_conn.close()

if __name__ == "__main__":
    migrate_email_templates()