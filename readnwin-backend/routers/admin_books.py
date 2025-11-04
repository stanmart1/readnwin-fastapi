from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import text
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from core.storage import storage
from core.validation import (
    BookValidationSchema, validate_file_security, sanitize_search_query,
    validate_pagination, validate_sort_params, BulkOperationSchema,
    validate_admin_permissions
)
from models.book import Book, Category
from models.user import User
from models.user_library import UserLibrary
from typing import Optional, List
from pydantic import BaseModel, validator, Field
import os
import uuid
import shutil
import hashlib
from decimal import Decimal
import logging
from pathlib import Path

# Import all related models for deletion
from models.order import OrderItem
from models.cart import Cart
from models.review import Review
from models.reading_session import ReadingSession

router = APIRouter(prefix="/admin", tags=["admin-books"])

def get_author_name(book, db):
    """Get author name from author_id or fallback to book.author"""
    if book.author_id:
        from models.author import Author
        author = db.query(Author).filter(Author.id == book.author_id).first()
        if author:
            return author.name
    return book.author or "Unknown Author"

class BulkDeleteRequest(BulkOperationSchema):
    pass

class BulkStatusRequest(BulkOperationSchema):
    status: str = Field(..., pattern=r'^(draft|published|pending|archived)$')

class BulkFeatureRequest(BulkOperationSchema):
    is_featured: bool

class AssignBookRequest(BaseModel):
    user_id: int
    book_id: int
    status: str = "available"  # available, reading, completed

class BulkAssignBookRequest(BaseModel):
    user_ids: List[int] = Field(..., min_items=1, max_items=100)
    book_id: int = Field(..., gt=0)
    status: str = Field(default="unread", pattern=r'^(unread|reading|completed)$')
    
    @validator('user_ids')
    def validate_user_ids(cls, v):
        if not v or len(v) == 0:
            raise ValueError('At least one user ID is required')
        if len(v) > 100:
            raise ValueError('Maximum 100 users allowed per assignment')
        # Remove duplicates and validate IDs
        unique_ids = list(set(v))
        for user_id in unique_ids:
            if not isinstance(user_id, int) or user_id <= 0:
                raise ValueError(f'Invalid user ID: {user_id}')
        return unique_ids

class BulkPriceUpdateRequest(BulkOperationSchema):
    price: float = Field(..., ge=0, le=999999.99)

class BulkActiveRequest(BulkOperationSchema):
    is_active: bool

class BookEditRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    price: Optional[float] = Field(None, ge=0, le=999999.99)
    status: Optional[str] = Field(None, pattern=r'^(draft|published|pending|archived)$')
    is_featured: Optional[bool] = None
    category_id: Optional[int] = Field(None, ge=1)
    author_id: Optional[int] = Field(None, ge=1)
    
    @validator('title')
    def validate_title(cls, v):
        if v is not None:
            import re
            sanitized = re.sub(r'[<>"\']', '', v.strip())
            if len(sanitized) < 1:
                raise ValueError('Title must contain valid characters')
            return sanitized
        return v
    
    @validator('description')
    def validate_description(cls, v):
        if v is not None:
            import re
            # Remove script tags and HTML
            sanitized = re.sub(r'<script[^>]*>.*?</script>', '', v, flags=re.IGNORECASE | re.DOTALL)
            sanitized = re.sub(r'<[^>]+>', '', sanitized)
            return sanitized.strip()
        return v

@router.post("/books")
async def create_book(
    # Required fields
    title: str = Form(..., min_length=1, max_length=200),
    author_id: str = Form(...),
    category_id: str = Form(...),
    price: str = Form(...),
    
    # Optional basic fields
    subtitle: Optional[str] = Form(None),
    isbn: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    short_description: Optional[str] = Form(None),
    language: str = Form("English"),
    pages: Optional[str] = Form(None),
    publication_date: Optional[str] = Form(None),
    publisher: Optional[str] = Form(None),
    
    # Book type and format
    book_type: str = Form("ebook"),  # 'physical', 'ebook', 'both'
    format: str = Form("ebook"),     # For backward compatibility
    
    # Pricing fields
    original_price: Optional[str] = Form(None),
    cost_price: Optional[str] = Form(None),
    
    # Physical book fields
    weight_grams: Optional[str] = Form(None),
    dimensions: Optional[str] = Form(None),  # JSON string
    shipping_class: Optional[str] = Form(None),
    
    # Inventory management
    stock_quantity: str = Form("0"),
    inventory_enabled: str = Form("false"),
    low_stock_threshold: str = Form("10"),
    
    # Status and features
    status: str = Form("published"),
    is_featured: str = Form("false"),
    is_bestseller: str = Form("false"),
    is_new_release: str = Form("false"),
    
    # SEO fields
    seo_title: Optional[str] = Form(None),
    seo_description: Optional[str] = Form(None),
    seo_keywords: Optional[str] = Form(None),
    
    # File uploads
    cover_image: Optional[UploadFile] = File(None),
    ebook_file: Optional[UploadFile] = File(None),
    sample_file: Optional[UploadFile] = File(None),
    
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new book with comprehensive field support"""
    validate_admin_permissions(current_user, "book_create")
    
    try:
        logging.info(f"Admin {current_user.id} creating book: {title[:50]}...")
        
        # Sanitize and validate input data
        title = title.strip()[:200]  # Limit length
        if not title:
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        
        # Validate and convert numeric fields with proper error handling
        try:
            price_decimal = Decimal(str(price))
            if price_decimal < 0 or price_decimal > 999999.99:
                raise ValueError("Price out of valid range")
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid price format")
        
        try:
            category_id_int = int(category_id)
            if category_id_int <= 0:
                raise ValueError("Invalid category ID")
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid category ID")
        
        try:
            author_id_int = int(author_id) if author_id and author_id.strip() else None
            if author_id_int is not None and author_id_int <= 0:
                raise ValueError("Invalid author ID")
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid author ID")
        
        try:
            stock_quantity_int = int(stock_quantity) if stock_quantity else 0
            if stock_quantity_int < 0:
                raise ValueError("Stock quantity cannot be negative")
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid stock quantity")
        
        try:
            pages_int = int(pages) if pages and str(pages).isdigit() else None
            if pages_int is not None and (pages_int <= 0 or pages_int > 10000):
                raise ValueError("Pages out of valid range")
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid page count")
        
        # Convert boolean strings
        inventory_enabled_bool = inventory_enabled.lower() == "true"
        is_featured_bool = is_featured.lower() == "true"
        is_bestseller_bool = is_bestseller.lower() == "true"
        is_new_release_bool = is_new_release.lower() == "true"
        
        # Handle optional pricing
        original_price_decimal = Decimal(original_price) if original_price else None
        cost_price_decimal = Decimal(cost_price) if cost_price else None
        weight_grams_int = int(weight_grams) if weight_grams else None
        low_stock_threshold_int = int(low_stock_threshold) if low_stock_threshold else 10
        
        # Secure file upload handling with validation
        cover_image_path = None
        ebook_file_path = None
        sample_file_path = None
        
        if cover_image and cover_image.filename:
            # Validate file size
            if cover_image.size > storage.MAX_IMAGE_SIZE:
                raise HTTPException(status_code=400, detail=f"Cover image too large (max {storage.MAX_IMAGE_SIZE // 1024 // 1024}MB)")
            cover_image_path = await storage.save_cover(cover_image)
            logging.info(f"Cover image uploaded: {cover_image_path}")
        
        if ebook_file and ebook_file.filename:
            # Validate file size
            if ebook_file.size > storage.MAX_BOOK_SIZE:
                raise HTTPException(status_code=400, detail=f"Book file too large (max {storage.MAX_BOOK_SIZE // 1024 // 1024}MB)")
            # Validate file format
            ext = Path(ebook_file.filename).suffix.lower()
            if ext not in storage.ALLOWED_BOOK_EXTENSIONS:
                raise HTTPException(status_code=400, detail=f"Invalid book format. Allowed: {', '.join(storage.ALLOWED_BOOK_EXTENSIONS)}")
            ebook_file_path = await storage.save_book(ebook_file)
            logging.info(f"Ebook file uploaded: {ebook_file_path}")
        
        if sample_file and sample_file.filename:
            # Validate file size
            if sample_file.size > storage.MAX_BOOK_SIZE:
                raise HTTPException(status_code=400, detail=f"Sample file too large (max {storage.MAX_BOOK_SIZE // 1024 // 1024}MB)")
            sample_file_path = await storage.save_sample(sample_file)
            logging.info(f"Sample file uploaded: {sample_file_path}")
        
        
        # Validate category exists
        category = db.query(Category).filter(Category.id == category_id_int).first()
        if not category:
            raise HTTPException(status_code=400, detail="Invalid category ID")
        
        # Get and validate author
        author_name = "Unknown Author"
        if author_id_int:
            from models.author import Author
            author = db.query(Author).filter(Author.id == author_id_int).first()
            if not author:
                raise HTTPException(status_code=400, detail="Invalid author ID")
            author_name = author.name
        
        # Sanitize text fields
        import re
        title = re.sub(r'[<>"\']', '', title)
        description = re.sub(r'<script[^>]*>.*?</script>', '', description or '', flags=re.IGNORECASE | re.DOTALL)
        description = re.sub(r'<[^>]+>', '', description) if description else None
        
        # Validate status
        if status not in ['draft', 'published', 'pending', 'archived']:
            status = 'draft'
        
        # Create book record with all fields
        book = Book(
            title=title,
            subtitle=subtitle,
            author=author_name,
            author_id=author_id_int,
            category_id=category_id_int,
            price=price_decimal,
            original_price=original_price_decimal,
            cost_price=cost_price_decimal,
            isbn=isbn,
            description=description,
            short_description=short_description,
            language=language,
            pages=pages_int,
            publication_date=None,
            publisher=publisher,
            format=book_type,
            stock_quantity=stock_quantity_int if inventory_enabled_bool else None,
            inventory_enabled=inventory_enabled_bool,
            low_stock_threshold=low_stock_threshold_int if inventory_enabled_bool else None,
            weight_grams=weight_grams_int,
            dimensions=dimensions,
            shipping_class=shipping_class,
            status=status,
            is_featured=is_featured_bool,
            is_bestseller=is_bestseller_bool,
            is_new_release=is_new_release_bool,
            seo_title=seo_title,
            seo_description=seo_description,
            seo_keywords=seo_keywords,
            cover_image=cover_image_path,
            file_path=ebook_file_path,
            sample_path=sample_file_path
        )
        
        db.add(book)
        db.commit()
        db.refresh(book)
        
        return {
            "message": "Book created successfully",
            "book_id": book.id,
            "book": {
                "id": book.id,
                "title": book.title,
                "subtitle": book.subtitle,
                "author": book.author,
                "price": float(book.price),
                "status": book.status,
                "is_featured": book.is_featured,
                "is_bestseller": book.is_bestseller,
                "is_new_release": book.is_new_release,
                "inventory_enabled": book.inventory_enabled,
                "stock_quantity": book.stock_quantity
            }
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        logging.error(f"Book creation validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid data format: {str(e)}")
    except Exception as e:
        db.rollback()
        logging.error(f"Book creation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create book due to server error")

@router.get("/books")
async def get_books(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    status: Optional[str] = None,
    category_id: Optional[int] = None,
    format: Optional[str] = None,
    is_featured: Optional[bool] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get paginated books for admin with enhanced filtering"""
    validate_admin_permissions(current_user, "book_read")
    
    # Validate and sanitize input parameters
    page, limit = validate_pagination(page, limit)
    sort_by, sort_order = validate_sort_params(sort_by, sort_order)
    
    if search:
        search = sanitize_search_query(search)
    
    if status and status not in ['draft', 'published', 'pending', 'archived']:
        status = None
    
    if format and format not in ['ebook', 'physical', 'both']:
        format = None
    
    if category_id is not None and category_id <= 0:
        category_id = None
    
    logging.info(f"Admin {current_user.id} fetching books - page: {page}, limit: {limit}")
    
    # Build secure query
    query = db.query(Book)
    
    if search:
        # Use parameterized query to prevent SQL injection
        query = query.filter(Book.title.ilike(f"%{search}%"))
    if status:
        query = query.filter(Book.status == status)
    if category_id:
        query = query.filter(Book.category_id == category_id)
    if format:
        query = query.filter(Book.format == format)
    if is_featured is not None:
        query = query.filter(Book.is_featured == is_featured)
    
    # Apply sorting with validated parameters
    if hasattr(Book, sort_by):
        if sort_order == 'asc':
            query = query.order_by(getattr(Book, sort_by).asc())
        else:
            query = query.order_by(getattr(Book, sort_by).desc())
    
    total = query.count()
    books = query.offset((page - 1) * limit).limit(limit).all()
    print(f"Found {total} books, returning {len(books)} books")
    
    # Format books for frontend
    formatted_books = []
    for book in books:
        # Get category name
        category_name = "Uncategorised"
        if book.category_id:
            category = db.query(Category).filter(Category.id == book.category_id).first()
            if category:
                category_name = category.name
        
        book_data = {
            "id": book.id,
            "title": book.title or "",
            "author_name": get_author_name(book, db),
            "category_name": category_name,
            "price": float(book.price),
            "status": book.status or "draft",
            "stock_quantity": book.stock_quantity or 0,
            "is_featured": book.is_featured or False,
            "is_active": book.is_active if hasattr(book, 'is_active') else True,
            "cover_image_url": storage.get_url(book.cover_image) if book.cover_image and book.cover_image.strip() else None,
            "format": book.format or "ebook",
            "created_at": book.created_at.isoformat() if book.created_at else "",
            "description": book.description or "",
            "isbn": book.isbn or ""
        }
        formatted_books.append(book_data)
    
    return {
        "books": formatted_books,
        "data": formatted_books,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    }

@router.put("/books/{book_id}")
async def update_book(
    book_id: int,
    # Same parameters as create_book but all optional
    title: Optional[str] = Form(None),
    subtitle: Optional[str] = Form(None),
    author_id: Optional[str] = Form(None),
    category_id: Optional[str] = Form(None),
    price: Optional[str] = Form(None),
    isbn: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    is_featured: Optional[str] = Form(None),
    cover_image: Optional[UploadFile] = File(None),
    ebook_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update an existing book"""
    check_admin_access(current_user)
    
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    try:
        # Update fields if provided
        if title is not None:
            book.title = title
        if subtitle is not None:
            book.subtitle = subtitle
        if author_id is not None:
            book.author_id = int(author_id) if author_id else None
        if category_id is not None:
            book.category_id = int(category_id)
        if price is not None:
            book.price = Decimal(price)
        if isbn is not None:
            book.isbn = isbn
        if description is not None:
            book.description = description
        if status is not None:
            book.status = status
        if is_featured is not None:
            book.is_featured = is_featured.lower() == "true"
        
        # Handle file updates with validation
        if cover_image and cover_image.filename:
            if cover_image.size > storage.MAX_IMAGE_SIZE:
                raise HTTPException(status_code=400, detail=f"Cover image too large (max {storage.MAX_IMAGE_SIZE // 1024 // 1024}MB)")
            # Delete old cover if exists
            if book.cover_image:
                storage.delete_file(book.cover_image)
            book.cover_image = await storage.save_cover(cover_image)
        
        if ebook_file and ebook_file.filename:
            if ebook_file.size > storage.MAX_BOOK_SIZE:
                raise HTTPException(status_code=400, detail=f"Book file too large (max {storage.MAX_BOOK_SIZE // 1024 // 1024}MB)")
            # Delete old file if exists
            if book.file_path:
                storage.delete_file(book.file_path)
            book.file_path = await storage.save_book(ebook_file)
        
        db.commit()
        db.refresh(book)
        
        return {
            "message": "Book updated successfully",
            "book": book
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update book: {str(e)}")

@router.delete("/books/{book_id}")
async def delete_book(
    book_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete book with comprehensive security checks"""
    validate_admin_permissions(current_user, "book_delete")
    
    # Validate book_id
    if book_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid book ID")
    
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    try:
        logging.info(f"Admin {current_user.id} attempting to delete book {book_id}: {book.title}")
        
        # Count related records for audit
        library_count = db.query(UserLibrary).filter(UserLibrary.book_id == book_id).count()
        order_count = db.query(OrderItem).filter(OrderItem.book_id == book_id).count()
        cart_count = db.query(Cart).filter(Cart.book_id == book_id).count()
        review_count = db.query(Review).filter(Review.book_id == book_id).count()
        session_count = db.query(ReadingSession).filter(ReadingSession.book_id == book_id).count()
        
        logging.info(f"Related records - Library: {library_count}, Orders: {order_count}, Cart: {cart_count}, Reviews: {review_count}, Sessions: {session_count}")
        
        # Security check: prevent deletion of books with active orders
        if order_count > 0:
            logging.warning(f"Attempted deletion of book {book_id} with active orders by admin {current_user.id}")
            raise HTTPException(status_code=400, detail="Cannot delete book with existing orders. Archive instead.")
        
        # Delete related records in correct order using parameterized queries
        deleted_sessions = db.query(ReadingSession).filter(ReadingSession.book_id == book_id).delete(synchronize_session=False)
        logging.info(f"Deleted {deleted_sessions} reading sessions")
        
        deleted_reviews = db.query(Review).filter(Review.book_id == book_id).delete(synchronize_session=False)
        logging.info(f"Deleted {deleted_reviews} reviews")
        
        deleted_cart = db.query(Cart).filter(Cart.book_id == book_id).delete(synchronize_session=False)
        logging.info(f"Deleted {deleted_cart} cart items")
        
        deleted_library = db.query(UserLibrary).filter(UserLibrary.book_id == book_id).delete(synchronize_session=False)
        logging.info(f"Deleted {deleted_library} library entries")
        
        # Only delete order items if explicitly allowed (usually not recommended)
        # deleted_orders = db.query(OrderItem).filter(OrderItem.book_id == book_id).delete(synchronize_session=False)
        # logging.info(f"Deleted {deleted_orders} order items")
        
        # Store file paths for cleanup
        files_to_delete = []
        if book.cover_image:
            files_to_delete.append(book.cover_image)
        if book.file_path:
            files_to_delete.append(book.file_path)
        if hasattr(book, 'sample_path') and book.sample_path:
            files_to_delete.append(book.sample_path)
        
        # Delete the book record
        db.delete(book)
        logging.info(f"Deleting book {book_id}")
        
        # Commit database changes
        db.commit()
        logging.info(f"Database transaction committed")
        
        # Clean up associated files securely
        for file_path in files_to_delete:
            try:
                if file_path and os.path.exists(file_path):
                    os.remove(file_path)
                    logging.info(f"Deleted file: {file_path}")
            except Exception as file_error:
                logging.error(f"Failed to delete file {file_path}: {file_error}")
        
        # Verify deletion
        deleted_book = db.query(Book).filter(Book.id == book_id).first()
        if deleted_book:
            logging.error(f"Book {book_id} still exists after deletion!")
            raise HTTPException(status_code=500, detail="Book deletion failed")
        
        logging.info(f"Book {book_id} successfully deleted by admin {current_user.id}")
        
        return {"message": "Book deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Book deletion error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete book due to server error")

@router.post("/books/bulk-delete")
async def bulk_delete_books(
    request: BulkDeleteRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Bulk delete books with security checks"""
    validate_admin_permissions(current_user, "book_bulk_delete")
    
    # Validate request
    if len(request.book_ids) > 50:  # Limit bulk operations
        raise HTTPException(status_code=400, detail="Too many books selected (max 50)")
    
    # Check if books exist and can be deleted
    books = db.query(Book).filter(Book.id.in_(request.book_ids)).all()
    if len(books) != len(request.book_ids):
        raise HTTPException(status_code=400, detail="Some books not found")
    
    # Check for books with orders (prevent deletion)
    books_with_orders = db.query(OrderItem.book_id).filter(OrderItem.book_id.in_(request.book_ids)).distinct().all()
    if books_with_orders:
        raise HTTPException(status_code=400, detail="Cannot delete books with existing orders")
    
    try:
        # Delete related records first
        db.query(ReadingSession).filter(ReadingSession.book_id.in_(request.book_ids)).delete(synchronize_session=False)
        db.query(Review).filter(Review.book_id.in_(request.book_ids)).delete(synchronize_session=False)
        db.query(Cart).filter(Cart.book_id.in_(request.book_ids)).delete(synchronize_session=False)
        db.query(UserLibrary).filter(UserLibrary.book_id.in_(request.book_ids)).delete(synchronize_session=False)
        
        # Delete books
        deleted_count = db.query(Book).filter(Book.id.in_(request.book_ids)).delete(synchronize_session=False)
        db.commit()
        
        logging.info(f"Admin {current_user.id} bulk deleted {deleted_count} books")
        return {"message": f"Deleted {deleted_count} books"}
        
    except Exception as e:
        db.rollback()
        logging.error(f"Bulk delete error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Bulk delete failed")

@router.post("/books/bulk-status")
async def bulk_update_status(
    request: BulkStatusRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Bulk update book status with validation"""
    validate_admin_permissions(current_user, "book_bulk_edit")
    
    # Validate request
    if len(request.book_ids) > 100:
        raise HTTPException(status_code=400, detail="Too many books selected (max 100)")
    
    # Verify books exist
    existing_count = db.query(Book).filter(Book.id.in_(request.book_ids)).count()
    if existing_count != len(request.book_ids):
        raise HTTPException(status_code=400, detail="Some books not found")
    
    try:
        updated_count = db.query(Book).filter(Book.id.in_(request.book_ids)).update(
            {"status": request.status}, synchronize_session=False
        )
        db.commit()
        
        logging.info(f"Admin {current_user.id} bulk updated status to {request.status} for {updated_count} books")
        return {"message": f"Updated status for {updated_count} books"}
        
    except Exception as e:
        db.rollback()
        logging.error(f"Bulk status update error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Bulk status update failed")

@router.post("/books/bulk-feature")
async def bulk_feature_books(
    request: BulkFeatureRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Bulk feature/unfeature books with validation"""
    validate_admin_permissions(current_user, "book_bulk_edit")
    
    # Validate request
    if len(request.book_ids) > 100:
        raise HTTPException(status_code=400, detail="Too many books selected (max 100)")
    
    # Verify books exist
    existing_count = db.query(Book).filter(Book.id.in_(request.book_ids)).count()
    if existing_count != len(request.book_ids):
        raise HTTPException(status_code=400, detail="Some books not found")
    
    try:
        updated_count = db.query(Book).filter(Book.id.in_(request.book_ids)).update(
            {"is_featured": request.is_featured}, synchronize_session=False
        )
        db.commit()
        
        action = "featured" if request.is_featured else "unfeatured"
        logging.info(f"Admin {current_user.id} bulk {action} {updated_count} books")
        return {"message": f"Updated featured status for {updated_count} books"}
        
    except Exception as e:
        db.rollback()
        logging.error(f"Bulk feature update error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Bulk feature update failed")

@router.get("/categories")
async def get_categories(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all categories"""
    check_admin_access(current_user)
    
    categories = db.query(Category).all()
    return categories

@router.get("/authors")
async def get_authors(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all authors"""
    check_admin_access(current_user)
    
    from models.author import Author
    from sqlalchemy import func
    authors = db.query(Author).all()
    return [
        {
            "id": author.id,
            "name": author.name,
            "email": author.email,
            "books_count": db.query(func.count(Book.id)).filter(Book.author_id == author.id).scalar() or 0,
            "status": "active" if author.is_active else "inactive"
        }
        for author in authors
    ]

@router.get("/books/{book_id}")
async def get_book(
    book_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get single book details"""
    check_admin_access(current_user)
    
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Get category name
    category_name = "Uncategorised"
    if book.category_id:
        category = db.query(Category).filter(Category.id == book.category_id).first()
        if category:
            category_name = category.name
    
    return {
        "id": book.id,
        "title": book.title,
        "author_id": book.author_id,
        "author_name": get_author_name(book, db),
        "category_id": book.category_id,
        "category_name": category_name,
        "price": float(book.price),
        "status": book.status,
        "stock_quantity": book.stock_quantity,
        "is_featured": book.is_featured,
        "is_active": book.is_active if hasattr(book, 'is_active') else True,
        "cover_image_url": storage.get_url(book.cover_image) if book.cover_image else None,
        "cover_image": book.cover_image,
        "file_path": book.file_path,
        "format": book.format,
        "description": book.description,
        "isbn": book.isbn,
        "language": book.language,
        "pages": book.pages,
        "publisher": book.publisher,
        "inventory_enabled": book.inventory_enabled if hasattr(book, 'inventory_enabled') else False,
        "created_at": book.created_at.isoformat() if book.created_at else ""
    }

@router.post("/books/{book_id}/assign")
async def bulk_assign_book_to_users(
    book_id: int,
    request: BulkAssignBookRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Bulk assign book to multiple users' libraries"""
    validate_admin_permissions(current_user, "book_assign")
    
    # Validate book_id from URL matches request
    if book_id != request.book_id:
        raise HTTPException(status_code=400, detail="Book ID mismatch")
    
    # Check if book exists and is digital
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Only allow assignment of digital books
    if book.format not in ['ebook', 'both']:
        raise HTTPException(status_code=400, detail="Only digital books can be assigned to user libraries")
    
    try:
        # Validate all users exist and are active
        users = db.query(User).filter(
            User.id.in_(request.user_ids),
            User.is_active == True
        ).all()
        
        if len(users) != len(request.user_ids):
            missing_users = set(request.user_ids) - {user.id for user in users}
            raise HTTPException(status_code=400, detail=f"Users not found or inactive: {list(missing_users)}")
        
        # Check for existing assignments
        existing_assignments = db.query(UserLibrary).filter(
            UserLibrary.book_id == book_id,
            UserLibrary.user_id.in_(request.user_ids)
        ).all()
        
        existing_user_ids = {assignment.user_id for assignment in existing_assignments}
        new_user_ids = [user_id for user_id in request.user_ids if user_id not in existing_user_ids]
        
        if not new_user_ids:
            raise HTTPException(status_code=400, detail="Book already assigned to all selected users")
        
        # Create new library entries
        new_assignments = []
        for user_id in new_user_ids:
            library_entry = UserLibrary(
                user_id=user_id,
                book_id=book_id,
                status=request.status,
                progress=0.0
            )
            new_assignments.append(library_entry)
        
        # Bulk insert
        db.add_all(new_assignments)
        db.commit()
        
        # Log the assignment
        logging.info(f"Admin {current_user.id} assigned book {book_id} to {len(new_assignments)} users")
        
        result_message = f"Book '{book.title}' assigned to {len(new_assignments)} user(s) successfully"
        if existing_user_ids:
            result_message += f" ({len(existing_user_ids)} users already had this book)"
        
        return {
            "message": result_message,
            "book_id": book_id,
            "book_title": book.title,
            "assigned_count": len(new_assignments),
            "already_assigned_count": len(existing_user_ids),
            "total_users": len(request.user_ids)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logging.error(f"Bulk book assignment error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to assign book to users")

@router.post("/books/assign-to-user")
async def assign_book_to_user(
    request: AssignBookRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Assign book to single user library (legacy endpoint)"""
    check_admin_access(current_user)
    
    # Check if book exists
    book = db.query(Book).filter(Book.id == request.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Check if user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if book already assigned
    existing = db.query(UserLibrary).filter(
        UserLibrary.user_id == request.user_id,
        UserLibrary.book_id == request.book_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Book already assigned to user")
    
    # Create library entry
    library_entry = UserLibrary(
        user_id=request.user_id,
        book_id=request.book_id,
        status=request.status,
        progress=0
    )
    
    db.add(library_entry)
    db.commit()
    
    return {"message": f"Book '{book.title}' assigned to user '{user.email}' successfully"}

@router.patch("/books/{book_id}/edit")
async def edit_book(
    book_id: int,
    request: BookEditRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Edit book details"""
    check_admin_access(current_user)
    
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Update fields if provided
    if request.title is not None:
        book.title = request.title
    if request.description is not None:
        book.description = request.description
    if request.price is not None:
        book.price = Decimal(str(request.price))
    if request.status is not None:
        book.status = request.status
    if request.is_featured is not None:
        book.is_featured = request.is_featured
    if request.category_id is not None:
        book.category_id = request.category_id
    if request.author_id is not None:
        book.author_id = request.author_id
    
    db.commit()
    db.refresh(book)
    
    return {
        "message": "Book updated successfully",
        "book": {
            "id": book.id,
            "title": book.title,
            "price": float(book.price),
            "status": book.status,
            "is_featured": book.is_featured
        }
    }

@router.patch("/books/{book_id}/price")
async def update_book_price(
    book_id: int,
    price: float,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update book price"""
    check_admin_access(current_user)
    
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    old_price = float(book.price)
    book.price = Decimal(str(price))
    
    db.commit()
    
    return {
        "message": "Book price updated successfully",
        "book_id": book.id,
        "old_price": old_price,
        "new_price": price
    }

@router.post("/books/bulk-price-update")
async def bulk_update_price(
    request: BulkPriceUpdateRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Bulk update book prices"""
    check_admin_access(current_user)
    
    updated_count = db.query(Book).filter(Book.id.in_(request.book_ids)).update(
        {"price": Decimal(str(request.price))}
    )
    db.commit()
    
    return {
        "message": f"Updated price for {updated_count} books",
        "updated_count": updated_count,
        "new_price": request.price
    }

@router.patch("/books/{book_id}/toggle-active")
async def toggle_book_active(
    book_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Toggle book active/inactive status"""
    check_admin_access(current_user)
    
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Toggle the active status
    new_status = not (book.is_active if hasattr(book, 'is_active') else True)
    book.is_active = new_status
    
    db.commit()
    db.refresh(book)
    
    return {
        "message": f"Book {'activated' if new_status else 'deactivated'} successfully",
        "book_id": book.id,
        "is_active": new_status
    }

@router.post("/books/bulk-active")
async def bulk_update_active(
    request: BulkActiveRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Bulk update book active status"""
    check_admin_access(current_user)
    
    updated_count = db.query(Book).filter(Book.id.in_(request.book_ids)).update(
        {"is_active": request.is_active}
    )
    db.commit()
    
    return {
        "message": f"{'Activated' if request.is_active else 'Deactivated'} {updated_count} books",
        "updated_count": updated_count,
        "is_active": request.is_active
    }