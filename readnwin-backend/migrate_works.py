#!/usr/bin/env python3
"""
Migrate works/portfolio data from source database to local database
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from models.portfolio import Portfolio
from core.database import Base, engine
from core.storage import storage
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Source database configuration
SOURCE_DB_URL = "postgresql://postgres:6ClkKJ7uc4eWWi6OGMQjKyjEAhRTgjUnvU5t2Zi22l7MIsirdhCoNYT81IODMDiK@149.102.159.118:5432/postgres"

def migrate_works():
    """Migrate works data from source to local database"""
    
    local_session = None
    
    try:
        # Connect to source database
        logger.info("🔌 Connecting to source database...")
        source_engine = create_engine(SOURCE_DB_URL)
        
        # Create local database tables
        logger.info("📊 Creating portfolio tables in local database...")
        Base.metadata.create_all(engine)
        
        local_session = Session(engine)
        
        with source_engine.connect() as source_conn:
            # Migrate Works
            logger.info("\n🎨 Migrating works/portfolio items...")
            result = source_conn.execute(text("""
                SELECT id, title, description, image_path, alt_text, order_index, is_active, created_at, updated_at
                FROM works ORDER BY order_index, id
            """))
            works = result.fetchall()
            
            work_mapping = {}
            
            for work in works:
                (source_work_id, title, description, image_path, alt_text, 
                 order_index, is_active, created_at, updated_at) = work
                
                # Check if work already exists
                existing = local_session.query(Portfolio).filter(
                    Portfolio.title == title
                ).first()
                
                if existing:
                    logger.info(f"  - Work already exists: {title} (ID: {existing.id})")
                    work_mapping[source_work_id] = existing.id
                    continue
                
                # Process image URL using storage manager
                image_url = None
                if image_path:
                    # Clean up the image path
                    clean_path = image_path.lstrip('/')
                    image_url = storage.get_url(clean_path)
                
                try:
                    new_work = Portfolio(
                        title=title,
                        description=description,
                        image_url=image_url,
                        is_featured=False,  # Not in source data
                        is_active=is_active,
                        order_index=order_index or 0,
                        created_at=created_at,
                        updated_at=updated_at
                    )
                    local_session.add(new_work)
                    local_session.flush()
                    work_mapping[source_work_id] = new_work.id
                    logger.info(f"  ✓ Created work: {title} (ID: {new_work.id}, Image: {image_url})")
                except Exception as e:
                    logger.error(f"    Error creating work {title}: {str(e)}")
                    continue
            
            local_session.commit()
            logger.info(f"\n✅ Works migration completed successfully!")
            logger.info(f"  - Works migrated: {len(work_mapping)}")
        
    except Exception as e:
        logger.error(f"❌ Error during migration: {str(e)}")
        import traceback
        traceback.print_exc()
        if local_session:
            local_session.rollback()
    finally:
        if local_session:
            local_session.close()

if __name__ == "__main__":
    migrate_works()
