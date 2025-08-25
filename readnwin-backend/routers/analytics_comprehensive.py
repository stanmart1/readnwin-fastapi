from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
from models.reading_session import ReadingSession
from models.reading_goal import ReadingGoal
from models.user_library import UserLibrary
from models.book import Book

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/comprehensive")
async def get_comprehensive_analytics(
    period: str = Query("week", description="week, month, year"),
    book_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get comprehensive reading analytics for ReadingAnalyticsDashboard"""
    try:
        # Date range calculation
        end_date = datetime.utcnow()
        days_map = {"week": 7, "month": 30, "year": 365}
        start_date = end_date - timedelta(days=days_map.get(period, 7))

        # Base query for sessions
        sessions_query = db.query(ReadingSession).filter(
            ReadingSession.user_id == current_user.id,
            ReadingSession.created_at >= start_date
        )
        
        if book_id:
            sessions_query = sessions_query.filter(ReadingSession.book_id == book_id)

        sessions = sessions_query.order_by(desc(ReadingSession.created_at)).all()

        # Reading sessions with book details
        session_details = []
        for session in sessions:
            book = db.query(Book).filter(Book.id == session.book_id).first()
            if book:
                session_details.append({
                    "id": session.id,
                    "book_title": book.title,
                    "book_author": book.author,
                    "duration": float(session.duration or 0),
                    "pages_read": session.pages_read or 0,
                    "progress": float(session.progress or 0),
                    "reading_time_minutes": float(session.duration or 0),
                    "session_start": session.created_at.isoformat(),
                    "session_end": session.updated_at.isoformat() if session.updated_at else session.created_at.isoformat(),
                    "reading_speed_wpm": (session.pages_read or 0) * 250 / max(session.duration or 1, 1) * 60,  # Estimate
                    "pages_tracked": session.pages_read or 0,
                    "avg_speed_wpm": (session.pages_read or 0) * 250 / max(session.duration or 1, 1) * 60,
                    "total_reading_time": float(session.duration or 0)
                })

        # Speed trends (daily aggregation)
        speed_trends = []
        current_date = start_date.date()
        while current_date <= end_date.date():
            day_sessions = [s for s in sessions if s.created_at.date() == current_date]
            if day_sessions:
                total_pages = sum(s.pages_read or 0 for s in day_sessions)
                total_time = sum(s.duration or 0 for s in day_sessions)
                avg_speed = total_pages * 250 / max(total_time, 1) * 60 if total_time > 0 else 0
                
                speed_trends.append({
                    "date": current_date.isoformat(),
                    "avg_speed": round(avg_speed, 1),
                    "sessions_count": len(day_sessions),
                    "hours_read": round(total_time / 60, 2)
                })
            current_date += timedelta(days=1)

        # Overall stats
        total_books_read = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.status == "completed"
        ).count()

        total_sessions = len(sessions)
        total_reading_time = sum(s.duration or 0 for s in sessions)
        total_pages = sum(s.pages_read or 0 for s in sessions)
        
        overall_stats = {
            "books_read": total_books_read,
            "total_sessions": total_sessions,
            "overall_avg_speed": total_pages * 250 / max(total_reading_time, 1) * 60 if total_reading_time > 0 else 0,
            "total_reading_time": total_reading_time,
            "reading_days": len(set(s.created_at.date() for s in sessions)),
            "avg_pages_per_session": total_pages / max(total_sessions, 1)
        }

        # Reading goals
        goals = db.query(ReadingGoal).filter(
            ReadingGoal.user_id == current_user.id
        ).all()

        goals_data = []
        for goal in goals:
            progress_pct = (goal.current_value / goal.target_value * 100) if goal.target_value > 0 else 0
            goals_data.append({
                "goal_type": goal.goal_type,
                "target_value": goal.target_value,
                "current_value": goal.current_value,
                "progress_percentage": min(progress_pct, 100)
            })

        # Recent activity
        recent_activity = []
        for session in sessions[:10]:
            book = db.query(Book).filter(Book.id == session.book_id).first()
            if book:
                recent_activity.append({
                    "type": "session",
                    "timestamp": session.created_at.isoformat(),
                    "book_title": book.title,
                    "value": session.pages_read or 0,
                    "unit": "pages"
                })

        return {
            "sessions": session_details,
            "speedTrends": speed_trends,
            "overallStats": overall_stats,
            "goals": goals_data,
            "recentActivity": recent_activity
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch comprehensive analytics: {str(e)}")