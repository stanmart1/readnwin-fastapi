#!/usr/bin/env python3

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import database and models
from core.database import engine, Base

# Import all models to ensure they're registered
from models import (
    user, role, book, order, cart, contact, blog, faq, portfolio, 
    review, notification, reading_session, user_library, auth_log, 
    payment, payment_settings, shipping, enhanced_shopping, email, 
    email_templates, author
)

def create_all_tables():
    """Create all database tables"""
    try:
        print("🔄 Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        
        # List created tables
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"))
            tables = [row[0] for row in result]
            
            print(f"\n📋 Total tables: {len(tables)}")
            for table in tables:
                print(f"  - {table}")
                
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    create_all_tables()