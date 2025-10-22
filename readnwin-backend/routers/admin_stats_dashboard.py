from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.user import User
from models.book import Book
from models.order import Order
from models.contact import Contact
from models.reading_session import ReadingSession
from models.user_library import UserLibrary
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/admin/stats", tags=["admin", "stats"])

class StatsResponse(BaseModel):
    total_users: int
    total_books: int
    total_orders: int
    total_revenue: float
    pending_contacts: int
    active_users_today: int
    completed_orders: int
    new_users_this_month: int

class ReadingProgressResponse(BaseModel):
    total_readers: int
    active_readers: int
    books_read_today: int
    average_reading_time: float
    total_reading_sessions: int
    books_completed_this_month: int
    most_popular_book: Optional[str]
    total_pages_read: int

@router.get("/overview", response_model=StatsResponse)
def get_overview_stats(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get overview statistics"""
    check_admin_access(current_user)
    
    try:
        total_users = db.query(User).count()
        total_books = db.query(Book).count()
        total_orders = db.query(Order).count()
        total_revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0)).scalar() or 0
        pending_contacts = db.query(Contact).filter(Contact.status == "pending").count()
        
        today = datetime.utcnow().date()
        active_users_today = db.query(ReadingSession).filter(
            func.date(ReadingSession.created_at) == today
        ).distinct(ReadingSession.user_id).count()
        
        completed_orders = db.query(Order).filter(Order.status == "completed").count()
        
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_users_this_month = db.query(User).filter(User.created_at >= month_start).count()
        
        return StatsResponse(
            total_users=total_users,
            total_books=total_books,
            total_orders=total_orders,
            total_revenue=float(total_revenue),
            pending_contacts=pending_contacts,
            active_users_today=active_users_today,
            completed_orders=completed_orders,
            new_users_this_month=new_users_this_month
        )
    except Exception as e:
        print(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")

@router.get("/reading-progress", response_model=ReadingProgressResponse)
def get_reading_progress(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get reading progress statistics"""
    check_admin_access(current_user)
    
    try:
        total_readers = db.query(UserLibrary).distinct(UserLibrary.user_id).count()
        active_readers = db.query(UserLibrary).filter(
            UserLibrary.status == "reading"
        ).distinct(UserLibrary.user_id).count()
        
        today = datetime.utcnow().date()
        books_read_today = db.query(ReadingSession).filter(
            func.date(ReadingSession.created_at) == today
        ).distinct(ReadingSession.book_id).count()
        
        avg_time = db.query(func.avg(ReadingSession.duration)).scalar() or 0
        average_reading_time = float(avg_time) / 60 if avg_time else 0
        
        total_sessions = db.query(ReadingSession).count()
        
        month_start = datetime.utcnow().replace(day=1)
        books_completed = db.query(UserLibrary).filter(
            UserLibrary.status == "completed",
            UserLibrary.updated_at >= month_start
        ).count()
        
        popular_book = db.query(Book.title).join(ReadingSession).group_by(Book.title).order_by(
            func.count(ReadingSession.id).desc()
        ).first()
        
        total_pages = db.query(func.coalesce(func.sum(ReadingSession.pages_read), 0)).scalar() or 0
        
        return ReadingProgressResponse(
            total_readers=total_readers,
            active_readers=active_readers,
            books_read_today=books_read_today,
            average_reading_time=round(average_reading_time, 2),
            total_reading_sessions=total_sessions,
            books_completed_this_month=books_completed,
            most_popular_book=popular_book[0] if popular_book else None,
            total_pages_read=int(total_pages)
        )
    except Exception as e:
        print(f"Error fetching reading progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch reading progress")

@router.get("/monthly-trends")
def get_monthly_trends(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get monthly trends"""
    check_admin_access(current_user)
    
    try:
        trends = db.execute(text("""
            SELECT
                DATE_TRUNC('month', created_at) as month,
                COUNT(*) as orders,
                COALESCE(SUM(total_amount), 0) as revenue
            FROM orders
            WHERE created_at >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month
        """)).fetchall()
        
        return {
            "trends": [
                {
                    "month": row.month.strftime("%b %Y") if row.month else "",
                    "orders": row.orders,
                    "revenue": float(row.revenue)
                }
                for row in trends
            ]
        }
    except Exception as e:
        print(f"Error fetching monthly trends: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch monthly trends")

@router.get("/daily-activity")
def get_daily_activity(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get daily activity for last 7 days"""
    check_admin_access(current_user)
    
    try:
        activity = []
        for i in range(7):
            date = datetime.utcnow().date() - timedelta(days=6-i)
            
            active_users = db.query(ReadingSession).filter(
                func.date(ReadingSession.created_at) == date
            ).distinct(ReadingSession.user_id).count()
            
            orders = db.query(Order).filter(
                func.date(Order.created_at) == date
            ).count()
            
            activity.append({
                "day": date.strftime("%a"),
                "active": active_users,
                "orders": orders
            })
        
        return {"activity": activity}
    except Exception as e:
        print(f"Error fetching daily activity: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch daily activity")
