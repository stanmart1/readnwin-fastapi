#!/usr/bin/env python3
"""
Remove audiobook support from the database and application
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from core.config import settings

def remove_audiobook_column():
    """Remove the audiobook_path column from the books table"""
    try:
        # Get database URL
        db_url = settings.database_url
        engine = create_engine(db_url)
        
        with engine.connect() as connection:
            # Check if column exists first
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'books' AND column_name = 'audiobook_path'
            """))
            
            if result.fetchone():
                print("🔍 Found audiobook_path column, removing...")
                
                # Remove the audiobook_path column
                connection.execute(text("ALTER TABLE books DROP COLUMN IF EXISTS audiobook_path"))
                connection.commit()
                
                print("✅ Successfully removed audiobook_path column from books table")
            else:
                print("ℹ️  audiobook_path column not found in books table")
                
    except Exception as e:
        print(f"❌ Error removing audiobook column: {e}")
        return False
    
    return True

def main():
    """Main function to remove audiobook support"""
    print("🚀 Starting audiobook support removal...")
    
    if remove_audiobook_column():
        print("✅ Audiobook support removal completed successfully!")
    else:
        print("❌ Failed to remove audiobook support")
        sys.exit(1)

if __name__ == "__main__":
    main()