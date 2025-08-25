#!/usr/bin/env python3
"""
Database synchronization script for updated book management system
"""

import os
import sys
from sqlalchemy import create_engine, text, inspect
from core.config import settings

def sync_database_schema():
    """Synchronize database schema with updated book management system"""
    
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as conn:
            print("🔄 Synchronizing database schema...")
            
            # Get existing columns
            inspector = inspect(engine)
            
            # 1. Add is_active column to books table
            books_columns = [col['name'] for col in inspector.get_columns('books')]
            if 'is_active' not in books_columns:
                conn.execute(text("""
                    ALTER TABLE books 
                    ADD COLUMN is_active BOOLEAN DEFAULT TRUE
                """))
                conn.execute(text("""
                    UPDATE books 
                    SET is_active = TRUE 
                    WHERE is_active IS NULL
                """))
                print("✅ Added is_active column to books table")
            else:
                print("✅ is_active column already exists in books table")
            
            # 2. Add book_format and book_title columns to order_items table
            order_items_columns = [col['name'] for col in inspector.get_columns('order_items')]
            
            if 'book_format' not in order_items_columns:
                conn.execute(text("""
                    ALTER TABLE order_items 
                    ADD COLUMN book_format VARCHAR
                """))
                print("✅ Added book_format column to order_items table")
            
            if 'book_title' not in order_items_columns:
                conn.execute(text("""
                    ALTER TABLE order_items 
                    ADD COLUMN book_title VARCHAR
                """))
                print("✅ Added book_title column to order_items table")
            
            # 3. Update existing order_items with book format and title
            if 'book_format' not in order_items_columns or 'book_title' not in order_items_columns:
                result = conn.execute(text("""
                    UPDATE order_items 
                    SET book_format = COALESCE(books.format, 'ebook'),
                        book_title = books.title
                    FROM books 
                    WHERE order_items.book_id = books.id 
                    AND (order_items.book_format IS NULL OR order_items.book_title IS NULL)
                """))
                print(f"✅ Updated {result.rowcount} existing order items")
            
            # 4. Ensure inventory_enabled defaults to FALSE for existing books
            conn.execute(text("""
                UPDATE books 
                SET inventory_enabled = FALSE 
                WHERE inventory_enabled IS NULL
            """))
            
            # 5. Set stock_quantity to NULL for books with inventory_enabled = FALSE
            conn.execute(text("""
                UPDATE books 
                SET stock_quantity = NULL 
                WHERE inventory_enabled = FALSE AND stock_quantity IS NOT NULL
            """))
            
            # 6. Remove audiobook_path column if it exists (cleanup)
            if 'audiobook_path' in books_columns:
                conn.execute(text("ALTER TABLE books DROP COLUMN audiobook_path"))
                print("✅ Removed audiobook_path column from books table")
            
            conn.commit()
            print("✅ Database schema synchronized successfully!")
            
    except Exception as e:
        print(f"❌ Error synchronizing database: {e}")
        sys.exit(1)

def verify_schema():
    """Verify the database schema is correct"""
    
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as conn:
            print("\n🔍 Verifying database schema...")
            
            inspector = inspect(engine)
            
            # Check books table
            books_columns = [col['name'] for col in inspector.get_columns('books')]
            required_books_columns = ['is_active', 'inventory_enabled', 'stock_quantity', 'format']
            
            for col in required_books_columns:
                if col in books_columns:
                    print(f"✅ books.{col} exists")
                else:
                    print(f"❌ books.{col} missing")
            
            # Check order_items table
            order_items_columns = [col['name'] for col in inspector.get_columns('order_items')]
            required_order_items_columns = ['book_format', 'book_title']
            
            for col in required_order_items_columns:
                if col in order_items_columns:
                    print(f"✅ order_items.{col} exists")
                else:
                    print(f"❌ order_items.{col} missing")
            
            # Check data integrity
            result = conn.execute(text("""
                SELECT COUNT(*) as total_books,
                       COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_books,
                       COUNT(CASE WHEN inventory_enabled = TRUE THEN 1 END) as inventory_enabled_books
                FROM books
            """))
            
            stats = result.fetchone()
            print(f"\n📊 Database Statistics:")
            print(f"   Total books: {stats[0]}")
            print(f"   Active books: {stats[1]}")
            print(f"   Books with inventory: {stats[2]}")
            
            print("\n✅ Schema verification completed!")
            
    except Exception as e:
        print(f"❌ Error verifying schema: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🚀 Starting database synchronization...")
    sync_database_schema()
    verify_schema()
    print("\n🎉 Database synchronization completed successfully!")