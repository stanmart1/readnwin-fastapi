from core.database import SessionLocal, engine
from models.faq import FAQ, FAQCategory
from sqlalchemy import text

db = SessionLocal()

try:
    # Add new columns to faqs table
    with engine.connect() as conn:
        # Check and add priority column
        try:
            conn.execute(text("ALTER TABLE faqs ADD COLUMN priority INTEGER DEFAULT 0"))
            conn.commit()
            print("Added priority column")
        except Exception as e:
            print(f"Priority column might already exist: {e}")
        
        # Check and add is_featured column
        try:
            conn.execute(text("ALTER TABLE faqs ADD COLUMN is_featured BOOLEAN DEFAULT FALSE"))
            conn.commit()
            print("Added is_featured column")
        except Exception as e:
            print(f"is_featured column might already exist: {e}")
        
        # Check and add view_count column
        try:
            conn.execute(text("ALTER TABLE faqs ADD COLUMN view_count INTEGER DEFAULT 0"))
            conn.commit()
            print("Added view_count column")
        except Exception as e:
            print(f"view_count column might already exist: {e}")
        
        # Check and add updated_at column
        try:
            conn.execute(text("ALTER TABLE faqs ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE"))
            conn.commit()
            print("Added updated_at column")
        except Exception as e:
            print(f"updated_at column might already exist: {e}")
    
    # Create faq_categories table
    FAQCategory.__table__.create(engine, checkfirst=True)
    print("Created faq_categories table")
    
    print("Migration completed successfully!")
    
except Exception as e:
    print(f"Migration error: {e}")
finally:
    db.close()
