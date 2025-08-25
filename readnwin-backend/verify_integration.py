#!/usr/bin/env python3
"""
Quick verification script to test book management integration
"""

from sqlalchemy import create_engine, text
from core.config import settings

def verify_integration():
    """Verify the integration is working correctly"""
    
    engine = create_engine(settings.database_url)
    
    try:
        with engine.connect() as conn:
            print("🔍 Verifying book management integration...")
            
            # Test 1: Check book with all new fields
            result = conn.execute(text("""
                SELECT id, title, format, is_active, inventory_enabled, stock_quantity
                FROM books 
                LIMIT 1
            """))
            
            book = result.fetchone()
            if book:
                print(f"✅ Sample book: {book[1]} (Format: {book[2]}, Active: {book[3]}, Inventory: {book[4]})")
            
            # Test 2: Check order_items with new fields
            result = conn.execute(text("""
                SELECT COUNT(*) as count
                FROM order_items 
                WHERE book_format IS NOT NULL AND book_title IS NOT NULL
            """))
            
            count = result.fetchone()[0]
            print(f"✅ Order items with format/title: {count}")
            
            # Test 3: Check cart compatibility
            result = conn.execute(text("""
                SELECT c.id, c.quantity, b.title, b.format, b.is_active, b.price
                FROM cart c
                JOIN books b ON c.book_id = b.id
                LIMIT 3
            """))
            
            cart_items = result.fetchall()
            print(f"✅ Cart items found: {len(cart_items)}")
            for item in cart_items:
                print(f"   - {item[2]} (₦{item[5]}, {item[3]}, Active: {item[4]})")
            
            print("\n🎉 Integration verification completed successfully!")
            
    except Exception as e:
        print(f"❌ Verification failed: {e}")

if __name__ == "__main__":
    verify_integration()