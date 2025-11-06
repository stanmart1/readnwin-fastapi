"""
Migration: Add missing fields to blog_posts table
Run this script to add featured_image, featured, category, tags, and SEO fields
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from core.database import engine

def migrate():
    with engine.connect() as conn:
        # Add featured_image column
        try:
            conn.execute(text("ALTER TABLE blog_posts ADD COLUMN featured_image VARCHAR"))
            print("✓ Added featured_image column")
        except Exception as e:
            print(f"featured_image column may already exist: {e}")
        
        # Add featured column
        try:
            conn.execute(text("ALTER TABLE blog_posts ADD COLUMN featured BOOLEAN DEFAULT FALSE"))
            print("✓ Added featured column")
        except Exception as e:
            print(f"featured column may already exist: {e}")
        
        # Add category column
        try:
            conn.execute(text("ALTER TABLE blog_posts ADD COLUMN category VARCHAR DEFAULT 'general'"))
            print("✓ Added category column")
        except Exception as e:
            print(f"category column may already exist: {e}")
        
        # Add tags column (JSON)
        try:
            conn.execute(text("ALTER TABLE blog_posts ADD COLUMN tags JSON"))
            print("✓ Added tags column")
        except Exception as e:
            print(f"tags column may already exist: {e}")
        
        # Add seo_title column
        try:
            conn.execute(text("ALTER TABLE blog_posts ADD COLUMN seo_title VARCHAR"))
            print("✓ Added seo_title column")
        except Exception as e:
            print(f"seo_title column may already exist: {e}")
        
        # Add seo_description column
        try:
            conn.execute(text("ALTER TABLE blog_posts ADD COLUMN seo_description TEXT"))
            print("✓ Added seo_description column")
        except Exception as e:
            print(f"seo_description column may already exist: {e}")
        
        # Add seo_keywords column (JSON)
        try:
            conn.execute(text("ALTER TABLE blog_posts ADD COLUMN seo_keywords JSON"))
            print("✓ Added seo_keywords column")
        except Exception as e:
            print(f"seo_keywords column may already exist: {e}")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    migrate()
