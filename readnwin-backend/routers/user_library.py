from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from core.storage import storage
from core.database import get_db
from core.security import get_current_user_from_token
from models.user_library import UserLibrary
from models.book import Book
from models.order import Order, OrderItem
from models.payment import Payment, PaymentStatus
from models.reading_session import ReadingSession
from sqlalchemy import desc

router = APIRouter(prefix="/user", tags=["library"])

@router.get("/library")
async def get_user_library(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
) -> Dict[str, Any]:
    """Get user's digital library with enhanced details"""
    from sqlalchemy.orm import joinedload
    
    # Use inner join to ensure we only get library items with valid books
    library_items = db.query(UserLibrary).join(Book).options(
        joinedload(UserLibrary.book).joinedload(Book.category)
    ).filter(
        UserLibrary.user_id == current_user.id,
        Book.title.isnot(None),
        Book.title != ''
    ).all()
    
    # Log any orphaned entries for debugging
    orphaned_count = db.query(UserLibrary).outerjoin(Book).filter(
        UserLibrary.user_id == current_user.id,
        Book.id.is_(None)
    ).count()
    
    if orphaned_count > 0:
        print(f"⚠️ Found {orphaned_count} orphaned library entries for user {current_user.id}")
    
    valid_items = library_items
    
    enhanced_items = []
    for item in valid_items:
            
        # Get reading progress details
        latest_session = db.query(ReadingSession).filter(
            ReadingSession.user_id == current_user.id,
            ReadingSession.book_id == item.book_id
        ).order_by(desc(ReadingSession.created_at)).first()
        
        # Calculate progress details
        progress_pct = (item.progress or 0) * 100
        total_pages = item.book.pages or 300  # Default estimate
        current_page = int((progress_pct / 100) * total_pages)
        
        # Ensure author name is available
        author_name = item.book.author or "Unknown Author"
        
        # Detect file extension from file_path or ebook_file_url
        file_extension = None
        detected_format = item.book.format or "ebook"
        
        # Try to get file path from multiple sources
        file_path = item.book.file_path
        if not file_path and hasattr(item.book, 'ebook_file'):
            file_path = item.book.ebook_file
        
        # Get ebook_file_url for extraction
        ebook_url = storage.get_url(file_path) if file_path else None
        
        # Extract extension from file_path or URL
        if file_path:
            file_extension = file_path.split('.')[-1].lower()
        elif ebook_url:
            # Extract from URL
            file_extension = ebook_url.split('.')[-1].split('?')[0].lower()
        
        # Override format based on file extension
        if file_extension == 'epub':
            detected_format = 'epub'
        elif file_extension in ['html', 'htm']:
            detected_format = 'html'
        elif detected_format.lower() in ['epub', 'ebook']:
            # Default ebook format to epub
            detected_format = 'epub'
            file_extension = 'epub'
        
        enhanced_items.append({
            "id": item.id,
            "book_id": item.book_id,
            "title": item.book.title,
            "author": author_name,
            "cover_image": item.book.cover_image,
            "cover_image_url": storage.get_url(item.book.cover_image) if item.book.cover_image and item.book.cover_image.strip() else None,
            "description": item.book.description,
            "format": detected_format,
            "file_path": item.book.file_path,
            "file_extension": file_extension,
            "price": float(item.book.price) if item.book.price else 0,
            "rating": 0,
            "total_pages": total_pages,
            "book": {
                "id": item.book.id,
                "title": item.book.title,
                "author_name": author_name,
                "author": author_name,
                "cover_image": item.book.cover_image,
                "cover_image_url": storage.get_url(item.book.cover_image) if item.book.cover_image and item.book.cover_image.strip() else None,
                "price": float(item.book.price) if item.book.price else 0,
                "format": detected_format,
                "pages": total_pages,
                "file_path": item.book.file_path,
                "file_extension": file_extension,
                "ebook_file_url": storage.get_url(item.book.file_path) if item.book.file_path else None,
                "description": item.book.description,
                "category_name": item.book.category.name if item.book.category else None
            },
            "status": item.status,
            "progress": item.progress or 0,
            "last_read_location": item.last_read_location,
            "is_favorite": getattr(item, 'is_favorite', False),
            "purchase_date": item.created_at.isoformat() if item.created_at else None,
            "last_read_at": item.last_read_at.isoformat() if item.last_read_at else None,
            "readingProgress": {
                "progressPercentage": progress_pct,
                "currentPage": current_page,
                "totalPages": total_pages,
                "lastReadAt": item.last_read_at.isoformat() if item.last_read_at else None
            } if latest_session else None
        })
    
    return {"libraryItems": enhanced_items}

@router.post("/library/add-ebooks-from-order/{order_id}")
async def add_ebooks_to_library(
    order_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Add eBooks from completed order to user library"""
    # Verify order belongs to user and payment is completed
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if payment is completed
    payment = db.query(Payment).filter(
        Payment.order_id == order_id,
        Payment.status == PaymentStatus.COMPLETED
    ).first()
    
    if not payment:
        raise HTTPException(status_code=400, detail="Payment not completed")
    
    # Get eBooks from order items
    ebook_items = db.query(OrderItem).join(Book).filter(
        OrderItem.order_id == order_id,
        Book.format == "ebook"
    ).all()
    
    added_books = []
    for item in ebook_items:
        # Check if already in library
        existing = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == item.book_id
        ).first()
        
        if not existing:
            library_item = UserLibrary(
                user_id=current_user.id,
                book_id=item.book_id,
                status="unread"
            )
            db.add(library_item)
            added_books.append(item.book.title)
    
    db.commit()
    return {"message": f"Added {len(added_books)} eBooks to library", "books": added_books}

@router.put("/library/{book_id}/favorite")
async def toggle_favorite(
    book_id: int,
    is_favorite: bool,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Toggle favorite status for a book in user's library"""
    library_item = db.query(UserLibrary).filter(
        UserLibrary.user_id == current_user.id,
        UserLibrary.book_id == book_id
    ).first()
    
    if not library_item:
        raise HTTPException(status_code=404, detail="Book not found in library")
    
    # Add is_favorite field if it doesn't exist (would need migration)
    # For now, we'll store in a separate table or use status field
    library_item.status = "favorite" if is_favorite else "unread"
    db.commit()
    
    return {"success": True, "is_favorite": is_favorite}

@router.delete("/library/{library_item_id}")
async def remove_from_library(
    library_item_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Remove a book from user's library"""
    library_item = db.query(UserLibrary).filter(
        UserLibrary.id == library_item_id,
        UserLibrary.user_id == current_user.id
    ).first()
    
    if not library_item:
        raise HTTPException(status_code=404, detail="Book not found in your library")
    
    db.delete(library_item)
    db.commit()
    
    return {"success": True, "message": "Book removed from library"}

@router.delete("/library/cleanup-orphaned")
async def cleanup_orphaned_entries(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Remove orphaned library entries that reference non-existent books"""
    # Find orphaned entries
    orphaned_entries = db.query(UserLibrary).outerjoin(Book).filter(
        UserLibrary.user_id == current_user.id,
        Book.id.is_(None)
    ).all()
    
    if not orphaned_entries:
        return {"message": "No orphaned entries found", "cleaned_count": 0}
    
    # Delete orphaned entries
    orphaned_ids = [entry.id for entry in orphaned_entries]
    deleted_count = db.query(UserLibrary).filter(
        UserLibrary.id.in_(orphaned_ids)
    ).delete(synchronize_session=False)
    
    db.commit()
    
    return {
        "message": f"Cleaned up {deleted_count} orphaned library entries",
        "cleaned_count": deleted_count
    }