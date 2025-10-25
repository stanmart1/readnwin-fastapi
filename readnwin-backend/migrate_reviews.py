#!/usr/bin/env python3
"""
Migration script to import reviews from remote database to current database
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Source database configuration (remote)
SOURCE_DB_CONFIG = {
    'host': '149.102.159.118',
    'port': 5432,
    'database': 'postgres',
    'user': 'postgres',
    'password': '6ClkKJ7uc4eWWi6OGMQjKyjEAhRTgjUnvU5t2Zi22l7MIsirdhCoNYT81IODMDiK'
}

# Import current database configuration
sys.path.insert(0, os.path.dirname(__file__))
from core.config import settings
from core.database import SessionLocal, engine
from models.review import Review
from models.user import User
from models.book import Book

def get_source_connection():
    """Create connection to source database"""
    source_url = f"postgresql://{SOURCE_DB_CONFIG['user']}:{SOURCE_DB_CONFIG['password']}@{SOURCE_DB_CONFIG['host']}:{SOURCE_DB_CONFIG['port']}/{SOURCE_DB_CONFIG['database']}"
    
    try:
        source_engine = create_engine(source_url, echo=False)
        source_engine.connect().close()
        logger.info("✅ Connected to source database")
        return source_engine
    except Exception as e:
        logger.error(f"❌ Failed to connect to source database: {str(e)}")
        return None

def get_reviews_from_source(source_engine):
    """Fetch all reviews from source database"""
    try:
        SourceSession = sessionmaker(bind=source_engine)
        source_session = SourceSession()
        
        # Query book_reviews table - GET ALL REVIEWS
        query = text("""
            SELECT id, user_id, book_id, rating, title, review_text, 
                   is_verified_purchase, is_featured, is_helpful_count, created_at, status
            FROM book_reviews
            ORDER BY id
        """)
        
        result = source_session.execute(query)
        rows = result.fetchall()
        source_session.close()
        
        logger.info(f"📊 Found {len(rows)} total reviews in source database")
        return rows
    except Exception as e:
        logger.error(f"❌ Error fetching reviews from source: {str(e)}")
        return []

def migrate_reviews(reviews_data):
    """Migrate reviews to current database"""
    db = SessionLocal()
    migrated = 0
    failed = 0
    skipped = 0
    
    try:
        for row in reviews_data:
            try:
                review_id, user_id, book_id, rating, title, review_text, is_verified, is_featured, helpful_count, created_at, status = row
                
                # Check if review already exists
                existing = db.query(Review).filter(Review.id == review_id).first()
                if existing:
                    logger.debug(f"⏭️  Skipping review ID {review_id} (already exists)")
                    skipped += 1
                    continue
                
                # Check if user and book exist in target database
                user = db.query(User).filter(User.id == user_id).first()
                book = db.query(Book).filter(Book.id == book_id).first()
                
                if not user:
                    logger.warning(f"⚠️  Skipping review ID {review_id} - User ID {user_id} not found")
                    skipped += 1
                    continue
                
                if not book:
                    logger.warning(f"⚠️  Skipping review ID {review_id} - Book ID {book_id} not found")
                    skipped += 1
                    continue
                
                # Create review in target database
                new_review = Review(
                    id=review_id,
                    user_id=user_id,
                    book_id=book_id,
                    rating=rating,
                    title=title,
                    review_text=review_text,
                    comment=None,  # No comment field in source
                    is_verified_purchase=is_verified,
                    is_featured=is_featured,
                    is_helpful_count=helpful_count or 0,
                    created_at=created_at
                )
                
                db.add(new_review)
                migrated += 1
                
                if migrated % 100 == 0:
                    db.commit()
                    logger.info(f"✅ Migrated {migrated} reviews...")
                    
            except Exception as e:
                logger.error(f"❌ Error migrating review: {str(e)}")
                failed += 1
                db.rollback()
        
        # Final commit
        db.commit()
        logger.info(f"✅ Final commit complete")
        
    except Exception as e:
        logger.error(f"❌ Migration error: {str(e)}")
        db.rollback()
    finally:
        db.close()
    
    return migrated, failed, skipped

def main():
    """Main migration function"""
    logger.info("=" * 60)
    logger.info("Starting Reviews Migration")
    logger.info("=" * 60)
    
    # Connect to source database
    logger.info("📡 Connecting to source database...")
    source_engine = get_source_connection()
    if not source_engine:
        logger.error("❌ Migration failed: Could not connect to source database")
        return
    
    # Fetch reviews from source
    logger.info("📥 Fetching reviews from source database...")
    reviews_data = get_reviews_from_source(source_engine)
    if not reviews_data:
        logger.warning("⚠️  No reviews found in source database")
        return
    
    # Migrate reviews to target
    logger.info("💾 Migrating reviews to target database...")
    migrated, failed, skipped = migrate_reviews(reviews_data)
    
    # Print summary
    logger.info("=" * 60)
    logger.info("Migration Summary")
    logger.info("=" * 60)
    logger.info(f"✅ Successfully migrated: {migrated}")
    logger.info(f"⏭️  Skipped (already exist or missing user/book): {skipped}")
    logger.info(f"❌ Failed: {failed}")
    logger.info(f"📊 Total processed: {migrated + skipped + failed}")
    logger.info("=" * 60)
    
    if failed == 0:
        logger.info("✅ Migration completed successfully!")
    else:
        logger.warning(f"⚠️  Migration completed with {failed} errors")

if __name__ == "__main__":
    main()
