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

def investigate_books():
    try:
        # Create engine and session
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        print("🔍 INVESTIGATING BOOK DELETION ISSUE")
        print("=" * 50)
        
        # 1. Check all books in database
        query = text("SELECT id, title, author, status FROM books ORDER BY id")
        result = session.execute(query).fetchall()
        
        print(f"📚 Total books in database: {len(result)}")
        for row in result:
            print(f"  ID: {row.id}, Title: {row.title}, Author: {row.author}, Status: {row.status}")
        
        print("\n" + "=" * 50)
        
        # 2. Check for foreign key constraints
        fk_query = text("""
            SELECT 
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND ccu.table_name = 'books'
        """)
        
        fk_result = session.execute(fk_query).fetchall()
        print(f"🔗 Foreign key constraints referencing books table: {len(fk_result)}")
        for row in fk_result:
            print(f"  {row.table_name}.{row.column_name} -> {row.foreign_table_name}.{row.foreign_column_name}")
        
        print("\n" + "=" * 50)
        
        # 3. Check related records for first book (if exists)
        if result:
            first_book_id = result[0].id
            print(f"🔍 Checking related records for book ID {first_book_id}:")
            
            # Check each related table
            related_tables = [
                ('user_library', 'book_id'),
                ('order_items', 'book_id'),
                ('cart', 'book_id'),
                ('reviews', 'book_id'),
                ('reading_sessions', 'book_id')
            ]
            
            for table, column in related_tables:
                try:
                    count_query = text(f"SELECT COUNT(*) as count FROM {table} WHERE {column} = :book_id")
                    count_result = session.execute(count_query, {"book_id": first_book_id}).fetchone()
                    print(f"  {table}: {count_result.count} records")
                except Exception as e:
                    print(f"  {table}: Error checking - {e}")
        
        session.close()
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")

if __name__ == "__main__":
    investigate_books()