from fastapi import APIRouter, Depends, HTTPException, Query, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_
from core.storage import storage
from core.database import get_db
from core.security import get_current_user_from_token
from models.book import Book, Category
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    description: Optional[str] = None
    price: float
    cover_image: Optional[str] = None
    category_id: Optional[int] = None
    isbn: Optional[str] = None
    is_featured: Optional[bool] = False

    class Config:
        from_attributes = True

@router.get("/")
def get_books(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    is_bestseller: Optional[bool] = None,
    is_new_release: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    format: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(Book).filter(Book.status == "published")
        
        if category_id:
            query = query.filter(Book.category_id == category_id)
        if search:
            query = query.filter(or_(Book.title.contains(search), Book.author.contains(search)))
        if featured is not None:
            query = query.filter(Book.is_featured == featured)
        if is_featured is not None:
            query = query.filter(Book.is_featured == is_featured)
        if is_bestseller is not None:
            query = query.filter(Book.is_bestseller == is_bestseller)
        if is_new_release is not None:
            query = query.filter(Book.is_new_release == is_new_release)
        if min_price is not None:
            query = query.filter(Book.price >= min_price)
        if max_price is not None:
            query = query.filter(Book.price <= max_price)
        if format is not None:
            query = query.filter(Book.format == format)
        
        total = query.count()
        books = query.offset((page - 1) * limit).limit(limit).all()
        
        # Format books for frontend
        formatted_books = []
        for book in books:
            category_name = "Uncategorised"
            if book.category_id:
                category = db.query(Category).filter(Category.id == book.category_id).first()
                if category:
                    category_name = category.name
            
            # Get author name from author_id
            author_name = "Unknown Author"
            if book.author_id:
                from models.author import Author
                author = db.query(Author).filter(Author.id == book.author_id).first()
                if author:
                    author_name = author.name
            elif book.author:
                author_name = book.author
            
            # Calculate rating and review count
            from models.review import Review
            reviews = db.query(Review).filter(Review.book_id == book.id).all()
            avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else 0
            review_count = len(reviews)
            
            formatted_books.append({
                "id": book.id,
                "title": book.title or "",
                "author": author_name,
                "author_name": author_name,
                "description": book.description or "",
                "price": float(book.price) if book.price else 0.0,
                "original_price": float(book.original_price) if book.original_price else None,
                "cover_image": book.cover_image or "",
                "cover_image_url": storage.get_url(book.cover_image) if book.cover_image and book.cover_image.strip() else None,
                "category_id": book.category_id or 0,
                "category_name": category_name,
                "isbn": book.isbn or "",
                "is_featured": book.is_featured or False,
                "is_bestseller": book.is_bestseller or False,
                "is_new_release": book.is_new_release or False,
                "rating": round(avg_rating, 1) if avg_rating > 0 else 0,
                "review_count": review_count,
                "format": book.format,
                "status": book.status or "published"
            })
        
        return {
            "books": formatted_books,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    except Exception as e:
        print(f"Database error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return {
            "books": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "pages": 0
        }

@router.get("/{book_id}")
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Get author name from author_id
    author_name = "Unknown Author"
    if book.author_id:
        from models.author import Author
        author = db.query(Author).filter(Author.id == book.author_id).first()
        if author:
            author_name = author.name
    elif book.author:
        author_name = book.author
    
    # Return enhanced book data for e-reader integration
    return {
        "book": {
            "id": book.id,
            "title": book.title,
            "author_name": author_name,
            "description": book.description,
            "price": float(book.price) if book.price else 0.0,
            "cover_image_url": storage.get_url(book.cover_image) if book.cover_image and book.cover_image.strip() else None,
            "category_id": book.category_id,
            "category_name": book.category.name if book.category else None,
            "isbn": book.isbn,
            "is_featured": book.is_featured,
            "format": book.format,
            "ebook_file_url": book.file_path,
            "pages": book.pages,
            "word_count": None,  # Add to model if needed
            "language": book.language,
            "publisher": book.publisher,
            "publication_date": book.publication_date.isoformat() if book.publication_date else None,
            "status": book.status
        }
    }

@router.get("/categories/", response_model=List[dict])
def get_categories(db: Session = Depends(get_db)):
    try:
        categories = db.query(Category).all()
        return [{"id": cat.id, "name": cat.name, "description": cat.description} for cat in categories]
    except Exception as e:
        print(f"Database error: {e}")
        return []

@router.get("/{book_id}/reviews")
def get_book_reviews(book_id: int, db: Session = Depends(get_db)):
    try:
        from models.review import Review
        reviews = db.query(Review).filter(Review.book_id == book_id).all()
        return {
            "reviews": [{
                "id": review.id,
                "rating": review.rating,
                "comment": review.comment,
                "user_name": review.user.first_name + " " + review.user.last_name if review.user else "Anonymous",
                "created_at": review.created_at.isoformat() if review.created_at else ""
            } for review in reviews],
            "total": len(reviews),
            "average_rating": sum(r.rating for r in reviews) / len(reviews) if reviews else 0
        }
    except Exception as e:
        print(f"Error loading reviews: {e}")
        return {"reviews": [], "total": 0, "average_rating": 0}

@router.post("/{book_id}/reviews")
def create_review(
    book_id: int,
    rating: int = Form(...),
    comment: str = Form(...),
    current_user = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a review - only allowed if user owns the book in their library"""
    try:
        # Check if user has this book in their library
        from models.user_library import UserLibrary
        library_entry = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == book_id
        ).first()
        
        if not library_entry:
            raise HTTPException(status_code=403, detail="You can only review books in your library")
        
        # Check if user already reviewed this book
        from models.review import Review
        existing_review = db.query(Review).filter(
            Review.user_id == current_user.id,
            Review.book_id == book_id
        ).first()
        
        if existing_review:
            raise HTTPException(status_code=400, detail="You have already reviewed this book")
        
        # Create new review
        review = Review(
            user_id=current_user.id,
            book_id=book_id,
            rating=rating,
            comment=comment
        )
        
        db.add(review)
        db.commit()
        db.refresh(review)
        
        return {"message": "Review created successfully", "review_id": review.id}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create review: {str(e)}")