#!/usr/bin/env python3
"""
Migration script to add book_format and book_title columns to order_items table
"""

import os
import sys
from sqlalchemy import create_engine, text
from core.config import settings

def add_order_item_columns():
    """Add book_format and book_title columns to order_items table if they don't exist"""
    
    # Create database connection
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Check if columns already exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'order_items' AND column_name IN ('book_format', 'book_title')
            """))
            
            existing_columns = [row[0] for row in result.fetchall()]
            
            # Add book_format column if it doesn't exist
            if 'book_format' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE order_items 
                    ADD COLUMN book_format VARCHAR
                """))
                print("✅ Added book_format column to order_items table")
            else:
                print("✅ book_format column already exists in order_items table")
            
            # Add book_title column if it doesn't exist
            if 'book_title' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE order_items 
                    ADD COLUMN book_title VARCHAR
                """))
                print("✅ Added book_title column to order_items table")
            else:
                print("✅ book_title column already exists in order_items table")
            
            # Update existing order items with book format and title
            if 'book_format' not in existing_columns or 'book_title' not in existing_columns:
                result = conn.execute(text("""
                    UPDATE order_items 
                    SET book_format = COALESCE(books.format, 'ebook'),
                        book_title = books.title
                    FROM books 
                    WHERE order_items.book_id = books.id 
                    AND (order_items.book_format IS NULL OR order_items.book_title IS NULL)
                """))
                print(f"✅ Updated {result.rowcount} existing order items with book format and title")
            
            conn.commit()
            
    except Exception as e:
        print(f"❌ Error adding order item columns: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🔄 Adding book_format and book_title columns to order_items table...")
    add_order_item_columns()
    print("✅ Migration completed successfully!")