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

def check_book_exists():
    try:
        # Create engine and session
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Query to find "Moby Dickk" book
        query = text("""
            SELECT 
                id,
                title,
                author,
                status,
                created_at,
                updated_at
            FROM books 
            WHERE title ILIKE '%Moby Dickk%'
            ORDER BY id
        """)
        
        result = session.execute(query).fetchall()
        
        if result:
            print(f"📚 Found {len(result)} book(s) matching 'Moby Dickk':")
            for row in result:
                print(f"  ID: {row.id}")
                print(f"  Title: {row.title}")
                print(f"  Author: {row.author}")
                print(f"  Status: {row.status}")
                print(f"  Created: {row.created_at}")
                print(f"  Updated: {row.updated_at}")
                print("-" * 50)
        else:
            print("❌ No book found with title 'Moby Dickk'")
            
        # Also check total books count
        count_query = text("SELECT COUNT(*) as total FROM books")
        total_result = session.execute(count_query).fetchone()
        print(f"\n📊 Total books in database: {total_result.total}")
            
        session.close()
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")

if __name__ == "__main__":
    check_book_exists()