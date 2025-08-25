#!/usr/bin/env python3
"""
Migration script to add missing fields to notifications table
Run this script to update your database schema
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from core.database import engine

def migrate_notifications():
    """Add missing fields to notifications table"""
    try:
        with engine.connect() as connection:
            # Start transaction
            trans = connection.begin()
            
            try:
                # Add the missing columns
                print("Adding is_global column...")
                connection.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT FALSE"))
                
                print("Adding priority column...")
                connection.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority VARCHAR DEFAULT 'normal'"))
                
                print("Adding read_at column...")
                connection.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE"))
                
                # Update existing records with default values
                print("Updating existing records...")
                connection.execute(text("UPDATE notifications SET is_global = FALSE WHERE is_global IS NULL"))
                connection.execute(text("UPDATE notifications SET priority = 'normal' WHERE priority IS NULL"))
                
                # Commit transaction
                trans.commit()
                print("✅ Migration completed successfully!")
                
            except Exception as e:
                trans.rollback()
                print(f"❌ Migration failed: {e}")
                raise
                
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate_notifications()