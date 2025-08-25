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

def test_actual_deletion():
    try:
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        print("🔍 TESTING ACTUAL BOOK DELETION")
        print("=" * 50)
        
        # Check current state
        books_query = text("SELECT id, title FROM books ORDER BY id")
        books_before = session.execute(books_query).fetchall()
        print(f"📚 Books before deletion: {len(books_before)}")
        for book in books_before:
            print(f"  ID: {book.id}, Title: {book.title}")
        
        if not books_before:
            print("No books to delete")
            return
            
        book_id = books_before[0].id
        print(f"\n🎯 ATTEMPTING TO DELETE BOOK ID: {book_id}")
        
        try:
            # Execute the exact same deletion logic as the FastAPI endpoint
            print("\n🗑️ Step 1: Delete reading_sessions")
            result1 = session.execute(text("DELETE FROM reading_sessions WHERE book_id = :book_id"), {"book_id": book_id})
            print(f"   Deleted {result1.rowcount} reading sessions")
            
            print("🗑️ Step 2: Delete reviews")
            result2 = session.execute(text("DELETE FROM reviews WHERE book_id = :book_id"), {"book_id": book_id})
            print(f"   Deleted {result2.rowcount} reviews")
            
            print("🗑️ Step 3: Delete cart items")
            result3 = session.execute(text("DELETE FROM cart WHERE book_id = :book_id"), {"book_id": book_id})
            print(f"   Deleted {result3.rowcount} cart items")
            
            print("🗑️ Step 4: Delete user_library")
            result4 = session.execute(text("DELETE FROM user_library WHERE book_id = :book_id"), {"book_id": book_id})
            print(f"   Deleted {result4.rowcount} library entries")
            
            print("🗑️ Step 5: Delete order_items")
            result5 = session.execute(text("DELETE FROM order_items WHERE book_id = :book_id"), {"book_id": book_id})
            print(f"   Deleted {result5.rowcount} order items")
            
            print("🗑️ Step 6: Delete book")
            result6 = session.execute(text("DELETE FROM books WHERE id = :book_id"), {"book_id": book_id})
            print(f"   Deleted {result6.rowcount} books")
            
            # Commit the transaction
            session.commit()
            print("✅ Transaction committed")
            
            # Verify deletion
            books_after = session.execute(books_query).fetchall()
            print(f"\n📚 Books after deletion: {len(books_after)}")
            for book in books_after:
                print(f"  ID: {book.id}, Title: {book.title}")
            
            if len(books_after) < len(books_before):
                print("🎉 SUCCESS: Book was actually deleted!")
            else:
                print("❌ FAILURE: Book still exists after deletion")
                
        except Exception as e:
            print(f"❌ Deletion failed: {e}")
            session.rollback()
            
        session.close()
        
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    test_actual_deletion()