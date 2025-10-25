#!/usr/bin/env python3
"""
Migrate books and categories from source database to target database
"""
import psycopg2
from datetime import datetime
import sys
sys.path.insert(0, '/Users/techclub/Documents/python-projects/readnwin-fastapi/readnwin-backend')

from core.database import SessionLocal
from models.book import Book, Category
from models.author import Author

# Source database credentials
SOURCE_HOST = "149.102.159.118"
SOURCE_DB = "postgres"
SOURCE_USER = "postgres"
SOURCE_PASSWORD = "6ClkKJ7uc4eWWi6OGMQjKyjEAhRTgjUnvU5t2Zi22l7MIsirdhCoNYT81IODMDiK"
SOURCE_PORT = 5432

def migrate_authors():
    """Migrate authors from source to target"""
    print("🔄 Migrating authors...")
    
    try:
        # Connect to source
        source_conn = psycopg2.connect(
            host=SOURCE_HOST,
            database=SOURCE_DB,
            user=SOURCE_USER,
            password=SOURCE_PASSWORD,
            port=SOURCE_PORT
        )
        source_cursor = source_conn.cursor()
        
        # Get target session
        target_db = SessionLocal()
        
        # Fetch all authors
        source_cursor.execute("""
            SELECT id, name, email, bio, avatar_url, website_url, status, created_at
            FROM authors
            ORDER BY id
        """)
        
        authors = source_cursor.fetchall()
        migrated = 0
        
        for author_id, name, email, bio, avatar_url, website_url, status, created_at in authors:
            try:
                # Check if author already exists
                existing = target_db.query(Author).filter(Author.id == author_id).first()
                if existing:
                    print(f"  ⏭️  Author {author_id} already exists, skipping")
                    continue
                
                # Create new author
                author = Author(
                    id=author_id,
                    name=name,
                    email=email,
                    bio=bio or "",
                    created_at=created_at
                )
                target_db.add(author)
                target_db.commit()
                print(f"  ✅ Migrated author: {name}")
                migrated += 1
            except Exception as e:
                target_db.rollback()
                print(f"  ❌ Error migrating author {author_id}: {e}")
        
        source_cursor.close()
        source_conn.close()
        target_db.close()
        
        print(f"✅ Authors migrated: {migrated}")
        return migrated
        
    except Exception as e:
        print(f"❌ Error migrating authors: {e}")
        return 0

def migrate_categories():
    """Migrate categories from source to target"""
    print("🔄 Migrating categories...")
    
    try:
        # Connect to source
        source_conn = psycopg2.connect(
            host=SOURCE_HOST,
            database=SOURCE_DB,
            user=SOURCE_USER,
            password=SOURCE_PASSWORD,
            port=SOURCE_PORT
        )
        source_cursor = source_conn.cursor()
        
        # Get target session
        target_db = SessionLocal()
        
        # Fetch all categories
        source_cursor.execute("""
            SELECT id, name, slug, description, is_active, sort_order, created_at
            FROM categories
            ORDER BY id
        """)
        
        categories = source_cursor.fetchall()
        migrated = 0
        
        for cat_id, name, slug, description, is_active, sort_order, created_at in categories:
            try:
                # Check if category already exists
                existing = target_db.query(Category).filter(Category.id == cat_id).first()
                if existing:
                    print(f"  ⏭️  Category {cat_id} already exists, skipping")
                    continue
                
                # Create new category
                category = Category(
                    id=cat_id,
                    name=name,
                    description=description,
                    status="active" if is_active else "inactive",
                    created_at=created_at
                )
                target_db.add(category)
                target_db.commit()
                print(f"  ✅ Migrated category: {name}")
                migrated += 1
            except Exception as e:
                target_db.rollback()
                print(f"  ❌ Error migrating category {cat_id}: {e}")
        
        source_cursor.close()
        source_conn.close()
        target_db.close()
        
        print(f"✅ Categories migrated: {migrated}")
        return migrated
        
    except Exception as e:
        print(f"❌ Error migrating categories: {e}")
        return 0

def migrate_books():
    """Migrate books from source to target"""
    print("\n🔄 Migrating books...")
    
    try:
        # Connect to source
        source_conn = psycopg2.connect(
            host=SOURCE_HOST,
            database=SOURCE_DB,
            user=SOURCE_USER,
            password=SOURCE_PASSWORD,
            port=SOURCE_PORT
        )
        source_cursor = source_conn.cursor()
        
        # Get target session
        target_db = SessionLocal()
        
        # Fetch all books
        source_cursor.execute("""
            SELECT id, title, subtitle, author_id, category_id, isbn, description, 
                   short_description, cover_image_url, sample_pdf_url, ebook_file_url,
                   format, language, pages, publication_date, publisher, price, 
                   original_price, cost_price, weight_grams, stock_quantity, 
                   low_stock_threshold, is_featured, is_bestseller, is_new_release, 
                   status, seo_title, seo_description, seo_keywords, created_at, updated_at,
                   inventory_enabled, shipping_class
            FROM books
            ORDER BY id
        """)
        
        books = source_cursor.fetchall()
        migrated = 0
        
        for book_data in books:
            try:
                book_id = book_data[0]
                
                # Check if book already exists
                existing = target_db.query(Book).filter(Book.id == book_id).first()
                if existing:
                    print(f"  ⏭️  Book {book_id} already exists, skipping")
                    continue
                
                # Create new book
                book = Book(
                    id=book_id,
                    title=book_data[1],
                    subtitle=book_data[2],
                    author="Unknown",  # Will be populated from author_id
                    category_id=book_data[4],
                    isbn=book_data[5],
                    description=book_data[6],
                    short_description=book_data[7],
                    cover_image=book_data[8],
                    sample_path=book_data[9],
                    file_path=book_data[10],
                    format=book_data[11] or "ebook",
                    language=book_data[12] or "English",
                    pages=book_data[13],
                    publication_date=book_data[14],
                    publisher=book_data[15],
                    price=book_data[16],
                    original_price=book_data[17],
                    cost_price=book_data[18],
                    weight_grams=book_data[19],
                    stock_quantity=book_data[20],
                    low_stock_threshold=book_data[21],
                    is_featured=book_data[22],
                    is_bestseller=book_data[23],
                    is_new_release=book_data[24],
                    status=book_data[25] or "published",
                    seo_title=book_data[26],
                    seo_description=book_data[27],
                    seo_keywords=book_data[28],
                    created_at=book_data[29],
                    updated_at=book_data[30],
                    inventory_enabled=book_data[31],
                    shipping_class=book_data[32],
                    author_id=book_data[3],  # Store original author_id
                    is_active=True
                )
                target_db.add(book)
                target_db.commit()
                print(f"  ✅ Migrated book: {book.title}")
                migrated += 1
            except Exception as e:
                target_db.rollback()
                print(f"  ❌ Error migrating book {book_id}: {e}")
        
        source_cursor.close()
        source_conn.close()
        target_db.close()
        
        print(f"✅ Books migrated: {migrated}")
        return migrated
        
    except Exception as e:
        print(f"❌ Error migrating books: {e}")
        return 0

if __name__ == "__main__":
    print("=" * 50)
    print("📚 Books & Categories & Authors Migration")
    print("=" * 50)
    
    author_count = migrate_authors()
    cat_count = migrate_categories()
    book_count = migrate_books()
    
    print("\n" + "=" * 50)
    print(f"✅ Migration complete!")
    print(f"   Authors: {author_count}")
    print(f"   Categories: {cat_count}")
    print(f"   Books: {book_count}")
    print("=" * 50)
