#!/usr/bin/env python3

import os
import sys
sys.path.append('readnwin-backend')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from decouple import config

# Import models
from models.book import Book
from models.user_library import UserLibrary
from models.order import OrderItem
from models.cart import Cart
from models.review import Review
from models.reading_session import ReadingSession

# Load environment variables
DB_USER = config('DB_USER', default='postgres')
DB_PASSWORD = config('DB_PASSWORD', default='')
DB_HOST = config('DB_HOST', default='149.102.159.118')
DB_PORT = config('DB_PORT', default=9876, cast=int)
DB_NAME = config('DB_NAME', default='postgres')

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def test_orm_deletion():
    try:
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        print("🔍 TESTING ORM-BASED DELETION (Same as FastAPI)")
        print("=" * 60)
        
        # Check current state
        books_before = session.query(Book).all()
        print(f"📚 Books before deletion: {len(books_before)}")
        for book in books_before:
            print(f"  ID: {book.id}, Title: {book.title}")
        
        if not books_before:
            print("No books to delete")
            return
            
        book_id = books_before[0].id
        book = books_before[0]
        print(f"\n🎯 ATTEMPTING ORM DELETION FOR BOOK ID: {book_id}")
        
        try:
            # Use exact same ORM logic as FastAPI endpoint
            print("\n🗑️ Step 1: Delete reading_sessions (ORM)")
            deleted_sessions = session.query(ReadingSession).filter(ReadingSession.book_id == book_id).delete()
            print(f"   Deleted {deleted_sessions} reading sessions")
            
            print("🗑️ Step 2: Delete reviews (ORM)")
            deleted_reviews = session.query(Review).filter(Review.book_id == book_id).delete()
            print(f"   Deleted {deleted_reviews} reviews")
            
            print("🗑️ Step 3: Delete cart items (ORM)")
            deleted_cart = session.query(Cart).filter(Cart.book_id == book_id).delete()
            print(f"   Deleted {deleted_cart} cart items")
            
            print("🗑️ Step 4: Delete user_library (ORM)")
            deleted_library = session.query(UserLibrary).filter(UserLibrary.book_id == book_id).delete()
            print(f"   Deleted {deleted_library} library entries")
            
            print("🗑️ Step 5: Delete order_items (ORM)")
            deleted_orders = session.query(OrderItem).filter(OrderItem.book_id == book_id).delete()
            print(f"   Deleted {deleted_orders} order items")
            
            print("🗑️ Step 6: Delete book (ORM)")
            session.delete(book)
            print(f"   Book marked for deletion")
            
            # Commit the transaction
            session.commit()
            print("✅ ORM Transaction committed")
            
            # Verify deletion
            books_after = session.query(Book).all()
            print(f"\n📚 Books after deletion: {len(books_after)}")
            for book in books_after:
                print(f"  ID: {book.id}, Title: {book.title}")
            
            if len(books_after) < len(books_before):
                print("🎉 SUCCESS: ORM deletion worked!")
            else:
                print("❌ FAILURE: ORM deletion failed")
                
        except Exception as e:
            print(f"❌ ORM Deletion failed: {e}")
            import traceback
            traceback.print_exc()
            session.rollback()
            
        session.close()
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_orm_deletion()