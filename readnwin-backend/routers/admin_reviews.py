from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from core.storage import storage
from models.user import User
from models.review import Review
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/admin/reviews", tags=["admin", "reviews"])

class ReviewUpdateRequest(BaseModel):
    reviewId: int
    status: Optional[str] = None
    adminNotes: Optional[str] = None

class ReviewFeatureRequest(BaseModel):
    reviewId: int
    isFeatured: bool

@router.get("/stats")
def get_review_stats(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get review statistics"""
    check_admin_access(current_user)
    
    try:
        total = db.query(Review).count()
        # Since Review model doesn't have status/featured fields, use simplified stats
        verified = db.query(Review).filter(Review.is_verified_purchase == True).count()
        unverified = total - verified
        
        avg_rating = db.query(func.avg(Review.rating)).scalar() or 0.0
        
        return {
            "stats": {
                "total": total,
                "pending": 0,  # Not implemented in current model
                "approved": total,  # All reviews are considered approved
                "rejected": 0,  # Not implemented in current model
                "featured": 0,  # Not implemented in current model
                "verified": verified,
                "unverified": unverified,
                "averageRating": round(float(avg_rating), 1)
            }
        }
    except Exception as e:
        print(f"Error fetching review stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch review statistics")

@router.get("")
def get_reviews(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get reviews with pagination and filtering"""
    check_admin_access(current_user)
    
    try:
        from models.book import Book
        
        query = db.query(Review).join(User).join(Book)
        
        if status and status != 'all':
            if status == 'verified':
                query = query.filter(Review.is_verified_purchase == True)
            elif status == 'unverified':
                query = query.filter(Review.is_verified_purchase == False)
            elif status == 'featured':
                query = query.filter(Review.is_featured == True)
        
        if search:
            query = query.filter(Review.review_text.contains(search))
        
        total = query.count()
        offset = (page - 1) * limit
        reviews = query.offset(offset).limit(limit).all()
        
        return {
            "reviews": [
                {
                    "id": review.id,
                    "book_id": review.book_id,
                    "user_id": review.user_id,
                    "first_name": review.user.first_name or "User",
                    "last_name": review.user.last_name or "",
                    "user_email": review.user.email,
                    "rating": review.rating,
                    "title": review.title or "",
                    "review_text": review.review_text or review.comment or "",
                    "is_verified_purchase": review.is_verified_purchase,
                    "is_helpful_count": review.is_helpful_count,
                    "status": "approved",
                    "is_featured": review.is_featured,
                    "created_at": review.created_at.isoformat(),
                    "updated_at": None,
                    "book_title": review.book.title,
                    "book_cover": storage.get_url(review.book.cover_image) if review.book.cover_image else None,
                    "book_author": review.book.author
                }
                for review in reviews
            ],
            "pages": (total + limit - 1) // limit,
            "total": total
        }
    except Exception as e:
        print(f"Error fetching reviews: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch reviews")

@router.patch("")
def update_review_status(
    request: ReviewUpdateRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update review status (placeholder - status not implemented in current model)"""
    check_admin_access(current_user)
    
    try:
        review = db.query(Review).filter(Review.id == request.reviewId).first()
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        # Status field doesn't exist in current model, so just return success
        return {"message": "Review status update not implemented in current model"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating review: {e}")
        raise HTTPException(status_code=500, detail="Failed to update review")

@router.patch("/feature")
def update_review_feature(
    request: ReviewFeatureRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update review featured status"""
    check_admin_access(current_user)
    
    try:
        review = db.query(Review).filter(Review.id == request.reviewId).first()
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        review.is_featured = request.isFeatured
        db.commit()
        
        return {"message": "Review featured status updated successfully", "is_featured": request.isFeatured}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating review feature: {e}")
        raise HTTPException(status_code=500, detail="Failed to update review feature status")

@router.get("/analytics")
def get_review_analytics(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get review analytics for reports"""
    check_admin_access(current_user)
    
    try:
        # Get rating distribution
        rating_counts = {
            5: db.query(Review).filter(Review.rating == 5).count(),
            4: db.query(Review).filter(Review.rating == 4).count(),
            3: db.query(Review).filter(Review.rating == 3).count(),
            2: db.query(Review).filter(Review.rating == 2).count(),
            1: db.query(Review).filter(Review.rating == 1).count()
        }
        
        total_reviews = sum(rating_counts.values())
        
        return {
            "five_star": rating_counts[5],
            "four_star": rating_counts[4],
            "three_star": rating_counts[3],
            "two_star": rating_counts[2],
            "one_star": rating_counts[1],
            "total_reviews": total_reviews,
            "average_rating": db.query(func.avg(Review.rating)).scalar() or 0.0
        }
    except Exception as e:
        print(f"Error fetching review analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch review analytics")

@router.delete("")
def delete_review(
    id: int = Query(...),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete a review"""
    check_admin_access(current_user)
    
    try:
        review = db.query(Review).filter(Review.id == id).first()
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        db.delete(review)
        db.commit()
        return {"message": "Review deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting review: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete review")