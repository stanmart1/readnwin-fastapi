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

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def debug_deletion_issue():
    try:
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        print("🔍 DEBUGGING BOOK DELETION ISSUE")
        print("=" * 60)
        
        # 1. Check current book state
        books_query = text("SELECT id, title, author, status FROM books ORDER BY id")
        books = session.execute(books_query).fetchall()
        
        print(f"📚 Current books: {len(books)}")
        for book in books:
            print(f"  ID: {book.id}, Title: {book.title}, Status: {book.status}")
        
        if not books:
            print("No books to test deletion with")
            return
            
        book_id = books[0].id
        print(f"\n🎯 Testing deletion for book ID: {book_id}")
        
        # 2. Check foreign key constraints in detail
        print("\n🔗 FOREIGN KEY CONSTRAINT ANALYSIS:")
        fk_query = text("""
            SELECT 
                tc.table_name,
                kcu.column_name,
                tc.constraint_name,
                rc.delete_rule
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.referential_constraints rc 
                ON tc.constraint_name = rc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND kcu.column_name = 'book_id'
            ORDER BY tc.table_name
        """)
        
        fk_constraints = session.execute(fk_query).fetchall()
        for fk in fk_constraints:
            print(f"  {fk.table_name}.{fk.column_name} -> books.id")
            print(f"    Constraint: {fk.constraint_name}")
            print(f"    Delete Rule: {fk.delete_rule}")
        
        # 3. Check actual related records
        print(f"\n📊 RELATED RECORDS FOR BOOK ID {book_id}:")
        related_tables = [
            'user_library',
            'order_items', 
            'cart',
            'reviews',
            'reading_sessions'
        ]
        
        total_related = 0
        for table in related_tables:
            try:
                count_query = text(f"SELECT COUNT(*) as count FROM {table} WHERE book_id = :book_id")
                result = session.execute(count_query, {"book_id": book_id}).fetchone()
                count = result.count
                total_related += count
                print(f"  {table}: {count} records")
                
                # Show actual records if any exist
                if count > 0:
                    detail_query = text(f"SELECT * FROM {table} WHERE book_id = :book_id LIMIT 3")
                    details = session.execute(detail_query, {"book_id": book_id}).fetchall()
                    for detail in details:
                        print(f"    -> {dict(detail._mapping)}")
                        
            except Exception as e:
                print(f"  {table}: ERROR - {e}")
        
        print(f"\n📈 Total related records: {total_related}")
        
        # 4. Test manual deletion simulation
        print(f"\n🧪 SIMULATING MANUAL DELETION:")
        try:
            # Start transaction
            trans = session.begin()
            
            print("  Step 1: Attempting to delete related records...")
            for table in related_tables:
                try:
                    delete_query = text(f"DELETE FROM {table} WHERE book_id = :book_id")
                    result = session.execute(delete_query, {"book_id": book_id})
                    print(f"    {table}: Would delete {result.rowcount} records")
                except Exception as e:
                    print(f"    {table}: ERROR - {e}")
            
            print("  Step 2: Attempting to delete book...")
            book_delete_query = text("DELETE FROM books WHERE id = :book_id")
            result = session.execute(book_delete_query, {"book_id": book_id})
            print(f"    books: Would delete {result.rowcount} records")
            
            # Rollback to not actually delete
            trans.rollback()
            print("  ✅ Simulation completed (rolled back)")
            
        except Exception as e:
            print(f"  ❌ Simulation failed: {e}")
            trans.rollback()
        
        session.close()
        
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    debug_deletion_issue()