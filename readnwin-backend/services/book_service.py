"""
Book Service - Business logic for book operations
Extracted from routers/admin_books.py for better organization
"""
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
import os
from pathlib import Path

from models.book import Book, Category
from models.author import Author
from core.secure_upload import get_file_hash
from core.path_validator import sanitize_filename


class BookService:
    """Service class for book-related business logic"""
    
    @staticmethod
    def validate_book_data(
        title: str,
        price: float,
        category_id: int,
        author_id: Optional[int] = None,
        isbn: Optional[str] = None
    ) -> Dict[str, Any]:
        """Validate book data before creation/update"""
        if not title or len(title.strip()) < 1:
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        
        if price < 0 or price > 999999.99:
            raise HTTPException(status_code=400, detail="Invalid price")
        
        if isbn:
            # Remove hyphens and spaces
            isbn_clean = isbn.replace('-', '').replace(' ', '')
            if not (len(isbn_clean) == 10 or len(isbn_clean) == 13):
                raise HTTPException(status_code=400, detail="Invalid ISBN format")
        
        return {
            "title": title.strip(),
            "price": price,
            "category_id": category_id,
            "author_id": author_id,
            "isbn": isbn
        }
    
    @staticmethod
    def validate_file(
        file: UploadFile,
        file_type: str,
        max_size: int = 50 * 1024 * 1024
    ) -> bytes:
        """Validate uploaded file"""
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Read file content
        content = file.file.read()
        
        # Check file size
        if len(content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Max size: {max_size / 1024 / 1024}MB"
            )
        
        # Reset file pointer
        file.file.seek(0)
        
        return content
    
    @staticmethod
    def generate_secure_filename(content: bytes, original_filename: str) -> str:
        """Generate secure filename using hash"""
        file_hash = get_file_hash(content)[:16]
        safe_name = sanitize_filename(original_filename)
        extension = Path(safe_name).suffix
        return f"{file_hash}_{safe_name}"
    
    @staticmethod
    def save_file(content: bytes, file_path: str) -> None:
        """Save file to disk securely"""
        from core.path_validator import validate_path
        
        # Validate path
        safe_path = validate_path("./uploads", file_path.replace('./uploads/', ''))
        if not safe_path:
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        # Create directory if not exists
        safe_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write file
        safe_path.write_bytes(content)
    
    @staticmethod
    def create_book(
        db: Session,
        book_data: Dict[str, Any],
        cover_path: Optional[str] = None,
        ebook_path: Optional[str] = None
    ) -> Book:
        """Create new book record"""
        book = Book(
            title=book_data["title"],
            price=book_data["price"],
            category_id=book_data["category_id"],
            author_id=book_data.get("author_id"),
            isbn=book_data.get("isbn"),
            description=book_data.get("description"),
            cover_image=cover_path,
            file_path=ebook_path,
            status=book_data.get("status", "draft"),
            format=book_data.get("format", "ebook"),
            is_featured=book_data.get("is_featured", False),
            is_bestseller=book_data.get("is_bestseller", False),
            is_new_release=book_data.get("is_new_release", False)
        )
        
        db.add(book)
        db.commit()
        db.refresh(book)
        
        return book
    
    @staticmethod
    def update_book(
        db: Session,
        book: Book,
        update_data: Dict[str, Any]
    ) -> Book:
        """Update existing book"""
        for key, value in update_data.items():
            if hasattr(book, key) and value is not None:
                setattr(book, key, value)
        
        db.commit()
        db.refresh(book)
        
        return book
    
    @staticmethod
    def delete_book(db: Session, book: Book) -> None:
        """Delete book and associated files"""
        # Delete files if they exist
        if book.cover_image and os.path.exists(book.cover_image):
            os.remove(book.cover_image)
        
        if book.file_path and os.path.exists(book.file_path):
            os.remove(book.file_path)
        
        # Delete from database
        db.delete(book)
        db.commit()
    
    @staticmethod
    def get_book_with_relations(db: Session, book_id: int) -> Optional[Book]:
        """Get book with author and category"""
        return db.query(Book).filter(Book.id == book_id).first()
    
    @staticmethod
    def check_isbn_exists(db: Session, isbn: str, exclude_id: Optional[int] = None) -> bool:
        """Check if ISBN already exists"""
        query = db.query(Book).filter(Book.isbn == isbn)
        
        if exclude_id:
            query = query.filter(Book.id != exclude_id)
        
        return query.first() is not None
    
    @staticmethod
    def get_books_by_category(
        db: Session,
        category_id: int,
        limit: int = 10
    ) -> List[Book]:
        """Get books by category"""
        return db.query(Book).filter(
            Book.category_id == category_id,
            Book.status == "published"
        ).limit(limit).all()
    
    @staticmethod
    def get_featured_books(db: Session, limit: int = 8) -> List[Book]:
        """Get featured books"""
        return db.query(Book).filter(
            Book.is_featured == True,
            Book.status == "published"
        ).limit(limit).all()
    
    @staticmethod
    def search_books(
        db: Session,
        query: str,
        limit: int = 20
    ) -> List[Book]:
        """Search books by title or author"""
        search_term = f"%{query}%"
        return db.query(Book).filter(
            (Book.title.ilike(search_term)) |
            (Book.description.ilike(search_term))
        ).limit(limit).all()
