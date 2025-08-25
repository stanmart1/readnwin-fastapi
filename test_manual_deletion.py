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

def test_manual_deletion():
    try:
        engine = create_engine(DATABASE_URL)
        
        print("🧪 TESTING MANUAL DELETION SIMULATION")
        print("=" * 50)
        
        with engine.begin() as conn:
            book_id = 1
            
            print(f"Testing deletion of book ID: {book_id}")
            
            # Test deleting related records first
            tables_to_clear = [
                'reading_sessions',
                'reviews', 
                'cart',
                'user_library',
                'order_items'
            ]
            
            print("\n🗑️ Attempting to delete related records:")
            for table in tables_to_clear:
                try:
                    delete_query = text(f"DELETE FROM {table} WHERE book_id = :book_id")
                    result = conn.execute(delete_query, {"book_id": book_id})
                    print(f"  ✅ {table}: Would delete {result.rowcount} records")
                except Exception as e:
                    print(f"  ❌ {table}: ERROR - {e}")
                    return
            
            print("\n📚 Attempting to delete book:")
            try:
                book_delete_query = text("DELETE FROM books WHERE id = :book_id")
                result = conn.execute(book_delete_query, {"book_id": book_id})
                print(f"  ✅ books: Would delete {result.rowcount} records")
            except Exception as e:
                print(f"  ❌ books: ERROR - {e}")
                return
            
            print("\n✅ MANUAL DELETION SIMULATION SUCCESSFUL")
            print("   All foreign key constraints can be resolved")
            print("   The issue is likely in the FastAPI endpoint implementation")
            
            # Rollback - don't actually delete
            conn.rollback()
            
    except Exception as e:
        print(f"❌ Simulation error: {e}")

if __name__ == "__main__":
    test_manual_deletion()