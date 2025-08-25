from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
from models.user_library import UserLibrary
from models.reading_session import ReadingSession
from models.reading_goal import ReadingGoal
from models.order import Order
from models.notification import Notification
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin/stats", tags=["admin", "stats"])

@router.get("/overview")
async def get_user_stats_overview(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get user statistics overview for dashboard"""
    try:
        # Library stats
        library_items = db.query(UserLibrary).filter(UserLibrary.user_id == current_user.id).all()
        total_books = len(library_items)
        completed_books = len([item for item in library_items if item.status == "completed"])
        reading_books = len([item for item in library_items if item.status == "reading"])
        
        # Reading time
        total_reading_time = db.query(
            func.coalesce(func.sum(ReadingSession.duration), 0)
        ).filter(ReadingSession.user_id == current_user.id).scalar()
        
        # Recent activity
        recent_sessions = db.query(ReadingSession).filter(
            ReadingSession.user_id == current_user.id
        ).order_by(desc(ReadingSession.created_at)).limit(5).all()
        
        # Goals
        active_goals = db.query(ReadingGoal).filter(
            and_(
                ReadingGoal.user_id == current_user.id,
                ReadingGoal.completed == False,
                ReadingGoal.end_date >= datetime.utcnow()
            )
        ).count()
        
        # Recent purchases
        recent_purchases = db.query(Order).filter(
            and_(
                Order.user_id == current_user.id,
                Order.created_at >= datetime.utcnow() - timedelta(days=30)
            )
        ).count()
        
        # Unread notifications
        unread_notifications = db.query(Notification).filter(
            and_(
                Notification.user_id == current_user.id,
                Notification.is_read == False
            )
        ).count()
        
        return {
            "totalBooks": total_books,
            "completedBooks": completed_books,
            "readingBooks": reading_books,
            "totalReadingTime": float(total_reading_time or 0),
            "activeGoals": active_goals,
            "recentPurchases": recent_purchases,
            "unreadNotifications": unread_notifications,
            "recentActivity": [
                {
                    "id": session.id,
                    "type": "reading_session",
                    "bookId": session.book_id,
                    "duration": session.duration,
                    "pagesRead": session.pages_read,
                    "createdAt": session.created_at.isoformat()
                }
                for session in recent_sessions
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user stats: {str(e)}")

@router.get("/reading-progress")
async def get_reading_progress_stats(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get reading progress statistics"""
    try:
        # Get reading sessions from last 7 days
        week_ago = datetime.utcnow() - timedelta(days=7)
        sessions = db.query(ReadingSession).filter(
            and_(
                ReadingSession.user_id == current_user.id,
                ReadingSession.created_at >= week_ago
            )
        ).all()
        
        # Calculate daily stats
        daily_stats = {}
        for i in range(7):
            date = (datetime.utcnow() - timedelta(days=i)).strftime('%a')
            daily_stats[date] = {'pages': 0, 'hours': 0, 'books': 0}
        
        for session in sessions:
            day = session.created_at.strftime('%a')
            if day in daily_stats:
                daily_stats[day]['pages'] += session.pages_read or 0
                daily_stats[day]['hours'] += (session.duration or 0) / 3600
        
        weekly_data = [
            {
                'day': day,
                'pages': stats['pages'],
                'hours': round(stats['hours'], 1),
                'books': stats['books']
            }
            for day, stats in daily_stats.items()
        ]
        
        # Currently reading books with real page data
        currently_reading = db.query(UserLibrary).join(Book).filter(
            and_(
                UserLibrary.user_id == current_user.id,
                UserLibrary.status == "reading"
            )
        ).all()
        
        current_books = []
        for item in currently_reading:
            if item.book:
                progress = float(item.progress or 0)
                # Get actual page count from book or estimate from content
                total_pages = getattr(item.book, 'total_pages', None) or 250  # Default estimate
                current_page = int((progress / 100) * total_pages) if progress > 0 else 0
                
                current_books.append({
                    'title': item.book.title,
                    'author': item.book.author,
                    'progress': progress,
                    'cover': item.book.cover_image,
                    'currentPage': current_page,
                    'totalPages': total_pages,
                    'lastReadAt': item.last_read_at.isoformat() if item.last_read_at else item.updated_at.isoformat() if item.updated_at else ''
                })
        
        return {
            "weeklyData": weekly_data,
            "currentlyReading": current_books,
            "totalSessions": len(sessions),
            "totalPages": sum(session.pages_read or 0 for session in sessions),
            "totalHours": round(sum(session.duration or 0 for session in sessions) / 3600, 1)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reading progress: {str(e)}")