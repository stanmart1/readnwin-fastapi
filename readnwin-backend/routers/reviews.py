from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token
from core.storage import storage
from models.review import Review
from models.user import User
from models.book import Book
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class ReviewResponse(BaseModel):
    id: int
    rating: int
    title: str
    review_text: str
    is_verified_purchase: bool
    is_helpful_count: int
    created_at: str
    first_name: str
    last_name: str
    book_title: str
    book_cover: str
    book_author: str

    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    book_id: int
    rating: int
    title: Optional[str] = None
    review_text: str

@router.get("/book/{book_id}")
def get_book_reviews(book_id: int, db: Session = Depends(get_db)):
    """Get all reviews for a specific book"""
    try:
        reviews = db.query(Review).join(User).filter(
            Review.book_id == book_id
        ).order_by(Review.created_at.desc()).all()
        
        return [
            {
                "id": review.id,
                "rating": review.rating,
                "title": review.title or "",
                "review_text": review.review_text or review.comment or "",
                "is_verified_purchase": review.is_verified_purchase or False,
                "is_helpful_count": review.is_helpful_count or 0,
                "created_at": str(review.created_at),
                "user_name": f"{review.user.first_name or 'Anonymous'} {review.user.last_name or ''}".strip()
            }
            for review in reviews
        ]
    except Exception as e:
        print(f"Error fetching book reviews: {e}")
        return []

@router.get("/featured", response_model=List[ReviewResponse])
def get_featured_reviews(limit: int = 10, db: Session = Depends(get_db)):
    try:
        reviews = db.query(Review).join(User).join(Book).filter(
            Review.is_featured == True
        ).order_by(Review.created_at.desc()).limit(limit).all()
        
        return [
            ReviewResponse(
                id=review.id,
                rating=review.rating,
                title=review.title or "Great Book!",
                review_text=review.review_text or review.comment or "Excellent reading experience.",
                is_verified_purchase=review.is_verified_purchase or False,
                is_helpful_count=review.is_helpful_count or 0,
                created_at=str(review.created_at),
                first_name=review.user.first_name or "Reader",
                last_name=review.user.last_name or "",
                book_title=review.book.title,
                book_cover=storage.get_url(review.book.cover_image) if review.book.cover_image else None,
                book_author=review.book.author
            )
            for review in reviews
        ]
    except Exception as e:
        print(f"Database error: {e}")
        return []

@router.post("/")
def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new book review"""
    try:
        # Check if book exists
        book = db.query(Book).filter(Book.id == review_data.book_id).first()
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        # Check if user already reviewed this book
        existing_review = db.query(Review).filter(
            Review.user_id == current_user.id,
            Review.book_id == review_data.book_id
        ).first()
        
        if existing_review:
            raise HTTPException(status_code=400, detail="You have already reviewed this book")
        
        # Create new review
        review = Review(
            user_id=current_user.id,
            book_id=review_data.book_id,
            rating=review_data.rating,
            title=review_data.title,
            review_text=review_data.review_text,
            created_at=datetime.utcnow(),
            is_verified_purchase=True  # Assume verified since it's from user library
        )
        
        db.add(review)
        db.commit()
        db.refresh(review)
        
        return {
            "message": "Review created successfully",
            "review_id": review.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating review: {e}")
        raise HTTPException(status_code=500, detail="Failed to create review")