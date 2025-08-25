#!/usr/bin/env python3

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from decouple import config

# Load environment variables
DB_USER = config('DB_USER', default='postgres')
DB_PASSWORD = config('DB_PASSWORD', default='')
DB_HOST = config('DB_HOST', default='149.102.159.118')
DB_PORT = config('DB_PORT', default=9876, cast=int)
DB_NAME = config('DB_NAME', default='postgres')

# Create database URL
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def test_deletion_fix():
    try:
        # Create engine and session
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        print("🧪 TESTING BOOK DELETION FIX")
        print("=" * 50)
        
        # Check current state
        books_query = text("SELECT id, title FROM books")
        books = session.execute(books_query).fetchall()
        print(f"📚 Books before deletion: {len(books)}")
        for book in books:
            print(f"  ID: {book.id}, Title: {book.title}")
        
        if books:
            book_id = books[0].id
            print(f"\n🔍 Checking related records for book ID {book_id}:")
            
            # Check related records
            related_queries = [
                ("user_library", "book_id"),
                ("order_items", "book_id"),
                ("cart", "book_id"),
                ("reviews", "book_id"),
                ("reading_sessions", "book_id")
            ]
            
            total_related = 0
            for table, column in related_queries:
                try:
                    count_query = text(f"SELECT COUNT(*) as count FROM {table} WHERE {column} = :book_id")
                    count_result = session.execute(count_query, {"book_id": book_id}).fetchone()
                    print(f"  {table}: {count_result.count} records")
                    total_related += count_result.count
                except Exception as e:
                    print(f"  {table}: Error - {e}")
            
            print(f"\n📊 Total related records: {total_related}")
            
            if total_related > 0:
                print("⚠️  Book has related records - deletion should handle these properly")
            else:
                print("✅ Book has no related records - deletion should be straightforward")
        
        session.close()
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")

if __name__ == "__main__":
    test_deletion_fix()