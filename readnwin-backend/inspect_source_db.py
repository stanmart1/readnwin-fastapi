#!/usr/bin/env python3
"""
Inspect source database to understand the reviews structure
"""

from sqlalchemy import create_engine, text, inspect
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Source database configuration
SOURCE_DB_URL = "postgresql://postgres:6ClkKJ7uc4eWWi6OGMQjKyjEAhRTgjUnvU5t2Zi22l7MIsirdhCoNYT81IODMDiK@149.102.159.118:5432/postgres"

try:
    logger.info("🔌 Connecting to source database...")
    engine = create_engine(SOURCE_DB_URL)
    
    with engine.connect() as conn:
        # Get all tables
        logger.info("\n📋 Available tables:")
        result = conn.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """))
        tables = result.fetchall()
        for table in tables:
            logger.info(f"  - {table[0]}")
        
        # Inspect book_reviews table
        logger.info("\n📊 book_reviews table structure:")
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'book_reviews'
            ORDER BY ordinal_position
        """))
        columns = result.fetchall()
        for col in columns:
            logger.info(f"  {col[0]:25} | {col[1]:15} | nullable={col[2]:5} | default={col[3]}")
        
        # Count reviews
        logger.info("\n📈 Book Reviews statistics:")
        result = conn.execute(text("SELECT COUNT(*) FROM book_reviews"))
        count = result.scalar()
        logger.info(f"  Total reviews: {count}")
        
        # Sample reviews
        logger.info("\n📝 Sample reviews (first 5):")
        result = conn.execute(text("""
            SELECT * FROM book_reviews LIMIT 5
        """))
        samples = result.fetchall()
        if samples:
            # Show column names
            result = conn.execute(text("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'book_reviews'
                ORDER BY ordinal_position
            """))
            col_names = [c[0] for c in result.fetchall()]
            logger.info(f"  Columns: {col_names}")
            for sample in samples:
                logger.info(f"  {dict(zip(col_names, sample))}")
        
        # Check related tables
        logger.info("\n🔗 Users table count:")
        result = conn.execute(text("SELECT COUNT(*) FROM users"))
        logger.info(f"  Total users: {result.scalar()}")
        
        logger.info("\n🔗 Books table count:")
        result = conn.execute(text("SELECT COUNT(*) FROM books"))
        logger.info(f"  Total books: {result.scalar()}")
        
        # Check data types and constraints
        logger.info("\n🔑 book_reviews table constraints and indexes:")
        result = conn.execute(text("""
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints
            WHERE table_name = 'book_reviews'
        """))
        constraints = result.fetchall()
        for constraint in constraints:
            logger.info(f"  {constraint[0]}: {constraint[1]}")

    logger.info("\n✅ Database inspection completed successfully!")
    
except Exception as e:
    logger.error(f"❌ Error connecting to database: {str(e)}")
    import traceback
    traceback.print_exc()
