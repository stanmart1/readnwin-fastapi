from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.user import User
from models.user_library import UserLibrary
from models.reading_session import ReadingSession
from models.order import Order
from models.review import Review
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin/users", tags=["admin", "users"])

@router.get("/{user_id}/analytics")
async def get_user_analytics(
    user_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get analytics for a specific user"""
    check_admin_access(current_user)
    
    try:
        # Check if user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Books read (completed)
        books_read = db.query(UserLibrary).filter(
            and_(
                UserLibrary.user_id == user_id,
                UserLibrary.status == "completed"
            )
        ).count()
        
        # Total reading hours
        total_seconds = db.query(
            func.coalesce(func.sum(ReadingSession.duration), 0)
        ).filter(ReadingSession.user_id == user_id).scalar() or 0
        reading_hours = round(total_seconds / 3600, 1)
        
        # Calculate reading streak
        sessions = db.query(ReadingSession).filter(
            ReadingSession.user_id == user_id
        ).order_by(desc(ReadingSession.created_at)).all()
        
        streak = 0
        if sessions:
            current_date = datetime.utcnow().date()
            for session in sessions:
                session_date = session.created_at.date()
                if session_date == current_date or session_date == current_date - timedelta(days=streak):
                    if session_date == current_date - timedelta(days=streak):
                        streak += 1
                    current_date = session_date
                else:
                    break
        
        # Average rating
        avg_rating = db.query(
            func.coalesce(func.avg(Review.rating), 0)
        ).filter(Review.user_id == user_id).scalar() or 0
        avg_rating = round(float(avg_rating), 1)
        
        # Progress data (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        daily_sessions = db.query(ReadingSession).filter(
            and_(
                ReadingSession.user_id == user_id,
                ReadingSession.created_at >= week_ago
            )
        ).all()
        
        progress_data = []
        for i in range(7):
            date = (datetime.utcnow() - timedelta(days=6-i)).strftime('%a')
            day_start = datetime.utcnow() - timedelta(days=6-i)
            day_end = day_start + timedelta(days=1)
            
            pages = sum(
                s.pages_read or 0 
                for s in daily_sessions 
                if day_start <= s.created_at < day_end
            )
            
            progress_data.append({
                "date": date,
                "pages": pages
            })
        
        # Recent books
        recent_books = db.query(UserLibrary).filter(
            UserLibrary.user_id == user_id
        ).order_by(desc(UserLibrary.updated_at)).limit(5).all()
        
        recent_books_data = []
        for item in recent_books:
            if item.book:
                recent_books_data.append({
                    "title": item.book.title,
                    "author": item.book.author,
                    "progress": float(item.progress or 0)
                })
        
        return {
            "success": True,
            "analytics": {
                "booksRead": books_read,
                "readingHours": reading_hours,
                "streak": streak,
                "avgRating": avg_rating,
                "progressData": progress_data,
                "recentBooks": recent_books_data
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching user analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")
