#!/usr/bin/env python3
"""
Inspect source database shipping structure
"""

from sqlalchemy import create_engine, text
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Source database configuration
SOURCE_DB_URL = "postgresql://postgres:6ClkKJ7uc4eWWi6OGMQjKyjEAhRTgjUnvU5t2Zi22l7MIsirdhCoNYT81IODMDiK@149.102.159.118:5432/postgres"

try:
    logger.info("🔌 Connecting to source database...")
    engine = create_engine(SOURCE_DB_URL)
    
    with engine.connect() as conn:
        # Get all tables containing 'shipping'
        logger.info("\n📋 Shipping-related tables:")
        result = conn.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name ILIKE '%shipping%'
            ORDER BY table_name
        """))
        tables = result.fetchall()
        
        if tables:
            for table in tables:
                table_name = table[0]
                logger.info(f"\n📊 {table_name} structure:")
                
                # Get column info
                result = conn.execute(text(f"""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_name = '{table_name}'
                    ORDER BY ordinal_position
                """))
                columns = result.fetchall()
                
                for col in columns:
                    logger.info(f"  {col[0]:30} | {col[1]:20} | nullable={col[2]:5} | default={col[3]}")
                
                # Count rows
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                count = result.scalar()
                logger.info(f"  Total rows: {count}")
                
                # Show sample data if exists
                if count > 0:
                    logger.info(f"\n  Sample data (first 3 rows):")
                    result = conn.execute(text(f"SELECT * FROM {table_name} LIMIT 3"))
                    samples = result.fetchall()
                    
                    result = conn.execute(text(f"""
                        SELECT column_name FROM information_schema.columns
                        WHERE table_name = '{table_name}'
                        ORDER BY ordinal_position
                    """))
                    col_names = [c[0] for c in result.fetchall()]
                    
                    for sample in samples:
                        logger.info(f"    {dict(zip(col_names, sample))}")
        else:
            logger.info("  No shipping tables found")
        
        # Check for order-related shipping info
        logger.info("\n\n📦 Checking orders table for shipping info:")
        result = conn.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name ILIKE '%order%'
            ORDER BY table_name
        """))
        order_tables = result.fetchall()
        
        for table in order_tables:
            table_name = table[0]
            logger.info(f"\n  {table_name} shipping-related columns:")
            
            result = conn.execute(text(f"""
                SELECT column_name, data_type FROM information_schema.columns
                WHERE table_name = '{table_name}' AND column_name ILIKE '%ship%'
                ORDER BY ordinal_position
            """))
            cols = result.fetchall()
            
            if cols:
                for col in cols:
                    logger.info(f"    - {col[0]}: {col[1]}")
            else:
                logger.info(f"    - No shipping columns found")

    logger.info("\n\n✅ Database inspection completed successfully!")
    
except Exception as e:
    logger.error(f"❌ Error connecting to database: {str(e)}")
    import traceback
    traceback.print_exc()
