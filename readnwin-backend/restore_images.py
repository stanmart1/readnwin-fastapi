#!/usr/bin/env python3
"""
Script to restore original image extensions from WebP files
"""
import os
import sys
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from core.storage import storage

# Set environment to production to use correct storage paths
os.environ["ENVIRONMENT"] = "production"

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:MCHQ6bEKrXypYnHbXXNxsF3IYpdX1XDOKpSkPeNdcZUjYDNQfUz7ewuHweMhIeWX@149.102.159.118:54391/postgres")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def restore_images():
    """Restore original image extensions"""
    db = SessionLocal()
    
    try:
        # Get all image paths from portfolio table
        result = db.execute(text("SELECT id, image_url FROM portfolio WHERE image_url IS NOT NULL"))
        portfolio_images = result.fetchall()
        
        print(f"Found {len(portfolio_images)} portfolio images to check")
        
        for row in portfolio_images:
            image_id, image_url = row
            if not image_url:
                continue
                
            # Get the expected original file path
            original_path = storage.get_file_path(image_url)
            webp_path = original_path.with_suffix('.webp')
            
            print(f"Checking: {image_url}")
            print(f"  Original path: {original_path}")
            print(f"  WebP path: {webp_path}")
            
            # If original doesn't exist but webp does, rename webp to original
            if not original_path.exists() and webp_path.exists():
                try:
                    webp_path.rename(original_path)
                    print(f"  ✅ Restored: {webp_path.name} -> {original_path.name}")
                except Exception as e:
                    print(f"  ❌ Failed to restore {webp_path}: {e}")
            elif original_path.exists():
                print(f"  ✅ Already exists: {original_path.name}")
            else:
                print(f"  ⚠️  Neither original nor webp exists")
            
            print()
        
        # Also check covers directory
        print("\nChecking covers directory...")
        result = db.execute(text("SELECT id, cover_image FROM books WHERE cover_image IS NOT NULL"))
        book_covers = result.fetchall()
        
        for row in book_covers:
            book_id, cover_image = row
            if not cover_image:
                continue
                
            original_path = storage.get_file_path(cover_image)
            webp_path = original_path.with_suffix('.webp')
            
            if not original_path.exists() and webp_path.exists():
                try:
                    webp_path.rename(original_path)
                    print(f"✅ Restored cover: {webp_path.name} -> {original_path.name}")
                except Exception as e:
                    print(f"❌ Failed to restore cover {webp_path}: {e}")
        
        print("\nImage restoration complete!")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    restore_images()