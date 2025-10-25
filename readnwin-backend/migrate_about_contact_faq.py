#!/usr/bin/env python3
"""
Migrate about, contact, and FAQ data from source database to local database
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from models.faq import FAQ, FAQCategory
from models.contact import Contact
from core.database import Base, engine
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Source database configuration
SOURCE_DB_URL = "postgresql://postgres:6ClkKJ7uc4eWWi6OGMQjKyjEAhRTgjUnvU5t2Zi22l7MIsirdhCoNYT81IODMDiK@149.102.159.118:5432/postgres"

def migrate_data():
    """Migrate about, contact, and FAQ data from source to local database"""
    
    local_session = None
    
    try:
        # Connect to source database
        logger.info("🔌 Connecting to source database...")
        source_engine = create_engine(SOURCE_DB_URL)
        
        # Create local database tables
        logger.info("📊 Creating tables in local database...")
        Base.metadata.create_all(engine)
        
        local_session = Session(engine)
        
        with source_engine.connect() as source_conn:
            # Migrate FAQ Categories
            logger.info("\n📂 Migrating FAQ categories...")
            result = source_conn.execute(text("""
                SELECT id, name, description FROM faq_categories ORDER BY id
            """))
            categories = result.fetchall()
            
            category_mapping = {}
            
            for category in categories:
                source_cat_id, name, description = category
                
                # Check if category already exists
                existing = local_session.query(FAQCategory).filter(
                    FAQCategory.name == name
                ).first()
                
                if existing:
                    logger.info(f"  - Category already exists: {name} (ID: {existing.id})")
                    category_mapping[source_cat_id] = existing.id
                    continue
                
                try:
                    new_category = FAQCategory(
                        name=name,
                        description=description,
                        is_active=True
                    )
                    local_session.add(new_category)
                    local_session.flush()
                    category_mapping[source_cat_id] = new_category.id
                    logger.info(f"  ✓ Created category: {name} (ID: {new_category.id})")
                except Exception as e:
                    logger.error(f"    Error creating category {name}: {str(e)}")
                    continue
            
            local_session.commit()
            
            # Migrate FAQs
            logger.info("\n❓ Migrating FAQs...")
            result = source_conn.execute(text("""
                SELECT id, question, answer, category FROM faqs ORDER BY id
            """))
            faqs = result.fetchall()
            
            faq_count = 0
            
            for faq in faqs:
                source_faq_id, question, answer, category = faq
                
                # Check if FAQ already exists
                existing = local_session.query(FAQ).filter(
                    FAQ.question == question
                ).first()
                
                if existing:
                    logger.info(f"  - FAQ already exists: {question[:50]}... (ID: {existing.id})")
                    continue
                
                try:
                    new_faq = FAQ(
                        question=question,
                        answer=answer,
                        category=category,
                        is_active=True,
                        order_index=source_faq_id
                    )
                    local_session.add(new_faq)
                    local_session.flush()
                    faq_count += 1
                    logger.info(f"  ✓ Created FAQ: {question[:50]}... (ID: {new_faq.id})")
                except Exception as e:
                    logger.error(f"    Error creating FAQ {question[:30]}...: {str(e)}")
                    continue
            
            local_session.commit()
            
            # Migrate Contact Submissions
            logger.info("\n💬 Migrating contact submissions...")
            result = source_conn.execute(text("""
                SELECT id, name, email, subject, message, created_at FROM contact_submissions ORDER BY id
            """))
            contacts = result.fetchall()
            
            contact_count = 0
            
            for contact in contacts:
                source_contact_id, name, email, subject, message, created_at = contact
                
                # Check if contact already exists
                existing = local_session.query(Contact).filter(
                    Contact.email == email,
                    Contact.subject == subject,
                    Contact.created_at == created_at
                ).first()
                
                if existing:
                    logger.info(f"  - Contact already exists: {name} ({email}) (ID: {existing.id})")
                    continue
                
                try:
                    new_contact = Contact(
                        name=name,
                        email=email,
                        subject=subject,
                        message=message,
                        is_resolved=False,
                        created_at=created_at
                    )
                    local_session.add(new_contact)
                    local_session.flush()
                    contact_count += 1
                    logger.info(f"  ✓ Created contact: {name} ({email}) (ID: {new_contact.id})")
                except Exception as e:
                    logger.error(f"    Error creating contact {name}: {str(e)}")
                    continue
            
            local_session.commit()
            
            logger.info(f"\n✅ Migration completed successfully!")
            logger.info(f"  - FAQ Categories migrated: {len(category_mapping)}")
            logger.info(f"  - FAQs migrated: {faq_count}")
            logger.info(f"  - Contact submissions migrated: {contact_count}")
        
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
    migrate_data()
