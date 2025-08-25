# type: ignore
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from datetime import datetime, timedelta
import logging

from core.database import get_db
from core.security import get_current_user_from_token
from models.reading_session import ReadingSession
from models.reading_goal import ReadingGoal
from models.user_library import UserLibrary
from models.book import Book

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["analytics"])

def _get_date_range(start_date: Optional[datetime], end_date: Optional[datetime], period: str) -> tuple[datetime, datetime]:
    """Calculate date range based on period"""
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        days_map = {"week": 7, "month": 30, "year": 365}
        days = days_map.get(period, 7)
        start_date = end_date - timedelta(days=days)
    return start_date, end_date

def _get_reading_sessions(db: Session, user_id: int, start_date: datetime, end_date: datetime) -> list:
    """Fetch reading sessions for date range"""
    try:
        return db.query(ReadingSession).filter(
            ReadingSession.user_id == user_id,
            ReadingSession.created_at >= start_date,
            ReadingSession.created_at <= end_date
        ).all()
    except Exception as e:
        logger.error(f"Database error fetching sessions: {str(e)}")
        return []

def _calculate_daily_stats(sessions: list, start_date: datetime, end_date: datetime) -> list:
    """Calculate daily reading statistics"""
    daily_stats = {}
    current_date = start_date.date()
    while current_date <= end_date.date():
        daily_stats[current_date.strftime('%a')] = {'pages': 0, 'hours': 0, 'books': 0}
        current_date += timedelta(days=1)

    for session in sessions:
        day_key = session.created_at.strftime('%a')
        if day_key in daily_stats:
            daily_stats[day_key]['pages'] += session.pages_read or 0
            daily_stats[day_key]['hours'] += (session.duration or 0) / 3600

    return [{
        'day': day,
        'pages': stats['pages'],
        'hours': round(stats['hours'], 1),
        'books': stats['books']
    } for day, stats in daily_stats.items()]

def _get_current_books(db: Session, user_id: int) -> list:
    """Get currently reading books with progress"""
    try:
        currently_reading = db.query(UserLibrary).join(Book).filter(
            UserLibrary.user_id == user_id,
            UserLibrary.status == 'reading'
        ).all()
    except Exception as e:
        logger.error(f"Database error fetching currently reading: {str(e)}")
        return []

    current_books = []
    for item in currently_reading:
        if item.book:
            progress = float(item.progress or 0)
            total_pages = 300  # Default estimated pages
            current_page = int((progress / 100) * total_pages) if progress > 0 else 0

            current_books.append({
                'title': item.book.title,
                'author': item.book.author,
                'progress': round(progress, 1),
                'cover': item.book.cover_image,
                'currentPage': current_page,
                'totalPages': total_pages,
                'lastReadAt': item.last_read_at.isoformat() if item.last_read_at else (item.updated_at.isoformat() if item.updated_at else '')
            })
    return current_books

@router.get("/reading")
async def get_reading_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    period: Optional[str] = Query("week", description="week, month, year"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get detailed reading analytics for current user"""
    try:
        start_date, end_date = _get_date_range(start_date, end_date, period)
        sessions = _get_reading_sessions(db, current_user.id, start_date, end_date)
        
        # Calculate metrics
        total_duration = sum(session.duration or 0 for session in sessions)
        session_count = len(sessions)
        avg_session_time = total_duration / session_count if session_count > 0 else 0
        
        weekly_data = _calculate_daily_stats(sessions, start_date, end_date)
        current_books = _get_current_books(db, current_user.id)
        
        # Get active goals count
        goals_count = db.query(ReadingGoal).filter(
            ReadingGoal.user_id == current_user.id,
            ReadingGoal.end_date >= datetime.now()
        ).count()

        return {
            "weeklyData": weekly_data,
            "currentlyReading": current_books,
            "stats": {
                "totalSessions": session_count,
                "totalDuration": round(float(total_duration) / 3600, 1),
                "averageSessionTime": round(float(avg_session_time) / 60, 1),
                "totalPages": sum(session.pages_read or 0 for session in sessions),
                "booksStarted": len(current_books),
                "activeGoals": goals_count
            }
        }

    except Exception as e:
        logger.error(f"Error fetching reading analytics: {str(e)}", exc_info=True)
        return {
            "weeklyData": [],
            "currentlyReading": [],
            "stats": {"totalSessions": 0, "totalDuration": 0, "averageSessionTime": 0, "totalPages": 0, "booksStarted": 0, "activeGoals": 0}
        }

@router.get("/engagement")
async def get_user_engagement(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get user engagement metrics"""
    try:
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        # Calculate engagement metrics
        total_sessions = db.query(ReadingSession).filter(
            ReadingSession.user_id == current_user.id,
            ReadingSession.created_at >= start_date,
            ReadingSession.created_at <= end_date
        ).count()

        avg_session_duration = db.query(func.avg(ReadingSession.duration)).filter(
            ReadingSession.user_id == current_user.id,
            ReadingSession.created_at >= start_date,
            ReadingSession.created_at <= end_date
        ).scalar()
        avg_session_duration = float(avg_session_duration) if avg_session_duration else 0.0

        # Days with reading activity
        active_days = db.query(func.distinct(func.date(ReadingSession.created_at))).filter(
            ReadingSession.user_id == current_user.id,
            ReadingSession.created_at >= start_date,
            ReadingSession.created_at <= end_date
        ).count()

        total_days = (end_date - start_date).days + 1
        engagement_rate = (active_days / total_days * 100) if total_days > 0 else 0

        return {
            "totalSessions": total_sessions,
            "averageSessionDuration": round(avg_session_duration / 60, 1) if avg_session_duration else 0,
            "activeDays": active_days,
            "totalDays": total_days,
            "engagementRate": round(float(engagement_rate), 1),
            "readingStreak": active_days  # Simplified calculation
        }

    except Exception as e:
        logger.error(f"Error fetching engagement metrics: {str(e)}", exc_info=True)
        db.rollback()
        return {
            "totalSessions": 0,
            "averageSessionDuration": 0,
            "activeDays": 0,
            "totalDays": 0,
            "engagementRate": 0,
            "readingStreak": 0
        }

@router.get("/reading/detailed")
async def get_detailed_reading_stats(
    book_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get detailed reading statistics"""
    try:
        query = db.query(ReadingSession).filter(ReadingSession.user_id == current_user.id)

        if book_id:
            query = query.filter(ReadingSession.book_id == book_id)

        sessions = query.order_by(desc(ReadingSession.created_at)).all()

        session_details = []
        for session in sessions:
            session_details.append({
                "id": session.id,
                "bookId": session.book_id,
                "duration": float(session.duration or 0),  # type: ignore
                "pagesRead": session.pages_read or 0,  # type: ignore
                "progress": float(session.progress or 0),  # type: ignore
                "createdAt": session.created_at.isoformat(),
                "readingSpeed": (float(session.pages_read or 0) / (float(session.duration or 0) / 3600)) if (session.duration or 0) > 0 and (session.pages_read or 0) > 0 else 0  # type: ignore
            })

        total_reading_time = sum(float(session.duration or 0) for session in sessions)  # type: ignore
        total_pages = sum(session.pages_read or 0 for session in sessions)
        avg_reading_speed = (total_pages / (total_reading_time / 3600)) if total_reading_time > 0 and total_pages > 0 else 0

        return {
            "sessionDetails": session_details,
            "totalReadingTime": round(total_reading_time / 3600, 2),
            "totalPages": total_pages,
            "averageReadingSpeed": round(float(avg_reading_speed), 1),  # type: ignore
            "sessionCount": len(sessions)
        }

    except Exception as e:
        logger.error(f"Error fetching detailed reading stats: {str(e)}", exc_info=True)
        db.rollback()
        return {
            "sessionDetails": [],
            "totalReadingTime": 0,
            "totalPages": 0,
            "averageReadingSpeed": 0,
            "sessionCount": 0
        }
