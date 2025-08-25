#!/usr/bin/env python3
"""
Migration script to add is_active column to books table
"""

import os
import sys
from sqlalchemy import create_engine, text
from core.config import settings

def add_is_active_column():
    """Add is_active column to books table if it doesn't exist"""
    
    # Create database connection
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'books' AND column_name = 'is_active'
            """))
            
            if result.fetchone():
                print("✅ is_active column already exists in books table")
                return
            
            # Add the column
            conn.execute(text("""
                ALTER TABLE books 
                ADD COLUMN is_active BOOLEAN DEFAULT TRUE
            """))
            
            # Update existing books to be active by default
            result = conn.execute(text("""
                UPDATE books 
                SET is_active = TRUE 
                WHERE is_active IS NULL
            """))
            
            conn.commit()
            print(f"✅ Added is_active column to books table and updated {result.rowcount} existing books")
            
    except Exception as e:
        print(f"❌ Error adding is_active column: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🔄 Adding is_active column to books table...")
    add_is_active_column()
    print("✅ Migration completed successfully!")