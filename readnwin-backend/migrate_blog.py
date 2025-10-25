#!/usr/bin/env python3
"""
Migrate blog data from source database to local database
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from models.blog import BlogPost
from models.user import User
from core.database import Base, engine
import logging
from datetime import datetime
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Source database configuration
SOURCE_DB_URL = "postgresql://postgres:6ClkKJ7uc4eWWi6OGMQjKyjEAhRTgjUnvU5t2Zi22l7MIsirdhCoNYT81IODMDiK@149.102.159.118:5432/postgres"

def generate_slug(title):
    """Generate slug from title"""
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

def migrate_blog():
    """Migrate blog data from source to local database"""
    
    local_session = None
    
    try:
        # Connect to source database
        logger.info("🔌 Connecting to source database...")
        source_engine = create_engine(SOURCE_DB_URL)
        
        # Create local database tables
        logger.info("📊 Creating blog tables in local database...")
        Base.metadata.create_all(engine)
        
        local_session = Session(engine)
        
        with source_engine.connect() as source_conn:
            # Migrate Blog Posts
            logger.info("\n📝 Migrating blog posts...")
            result = source_conn.execute(text("""
                SELECT id, title, slug, excerpt, content, author_id, author_name, status, 
                       featured, published_at, created_at, updated_at
                FROM blog_posts ORDER BY id
            """))
            posts = result.fetchall()
            
            post_mapping = {}
            
            for post in posts:
                (source_post_id, title, slug, excerpt, content, author_id, author_name, 
                 status, featured, published_at, created_at, updated_at) = post
                
                # Check if post already exists
                existing = local_session.query(BlogPost).filter(
                    BlogPost.slug == slug
                ).first()
                
                if existing:
                    logger.info(f"  - Post already exists: {title} (ID: {existing.id})")
                    post_mapping[source_post_id] = existing.id
                    continue
                
                # Check if author exists in local DB, otherwise use default
                author = local_session.query(User).filter(User.id == author_id).first()
                
                if not author:
                    # Create a default author if not found
                    logger.warning(f"    Author {author_id} ({author_name}) not found, using default user")
                    author = local_session.query(User).first()
                    if not author:
                        logger.error(f"    No users found in local database, skipping post {title}")
                        continue
                    author_id = author.id
                
                # Map status to is_published
                is_published = status == 'published' if status else False
                
                try:
                    new_post = BlogPost(
                        title=title,
                        slug=slug or generate_slug(title),
                        content=content,
                        excerpt=excerpt,
                        author_id=author_id,
                        is_published=is_published,
                        published_at=published_at if is_published else None,
                        created_at=created_at,
                        updated_at=updated_at
                    )
                    local_session.add(new_post)
                    local_session.flush()
                    post_mapping[source_post_id] = new_post.id
                    logger.info(f"  ✓ Created post: {title} (ID: {new_post.id}, Status: {status})")
                except Exception as e:
                    logger.error(f"    Error creating post {title}: {str(e)}")
                    continue
            
            local_session.commit()
            logger.info(f"\n✅ Blog migration completed successfully!")
            logger.info(f"  - Posts migrated: {len(post_mapping)}")
        
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
    migrate_blog()
