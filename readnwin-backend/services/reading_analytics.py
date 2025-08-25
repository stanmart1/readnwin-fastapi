from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from models.reading_session import ReadingSession
from models.reading_goal import ReadingGoal
from models.user_library import UserLibrary
from models.book import Book
from models.user import User

class ReadingAnalyticsService:
    """Service class for reading analytics calculations"""
    
    @staticmethod
    def get_user_reading_stats(db: Session, user: User, days: int = 30) -> Dict[str, Any]:
        """Get comprehensive reading statistics for a user"""
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        # Get sessions in date range
        sessions = db.query(ReadingSession).filter(
            ReadingSession.user_id == user.id,
            ReadingSession.created_at >= start_date,
            ReadingSession.created_at <= end_date
        ).all()
        
        # Calculate basic stats
        total_sessions = len(sessions)
        total_reading_time = sum(session.duration or 0 for session in sessions)
        total_pages_read = sum(session.pages_read or 0 for session in sessions)
        
        # Get unique books read
        books_read = len(set(session.book_id for session in sessions))
        
        # Calculate averages
        avg_session_time = total_reading_time / total_sessions if total_sessions > 0 else 0
        avg_pages_per_session = total_pages_read / total_sessions if total_sessions > 0 else 0
        
        # Get reading days
        reading_days = len(set(session.created_at.date() for session in sessions))
        
        return {
            'total_sessions': total_sessions,
            'total_reading_time': total_reading_time,
            'total_pages_read': total_pages_read,
            'books_read': books_read,
            'avg_session_time': round(avg_session_time, 1),
            'avg_pages_per_session': round(avg_pages_per_session, 1),
            'reading_days': reading_days,
            'days_period': days
        }
    
    @staticmethod
    def get_monthly_activity(db: Session, user: User, months: int = 6) -> List[Dict[str, Any]]:
        """Get monthly reading activity for the past N months"""
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=months * 30)
        
        monthly_data = []
        current_date = start_date.replace(day=1)
        
        while current_date <= end_date:
            year = current_date.year
            month = current_date.month
            
            # Calculate monthly stats
            month_start = current_date
            if month == 12:
                month_end = current_date.replace(year=year + 1, month=1, day=1) - timedelta(days=1)
            else:
                month_end = current_date.replace(month=month + 1, day=1) - timedelta(days=1)
            
            month_sessions = db.query(ReadingSession).filter(
                ReadingSession.user_id == user.id,
                ReadingSession.created_at >= month_start,
                ReadingSession.created_at <= month_end
            ).all()
            
            books_read = len(set(session.book_id for session in month_sessions))
            total_pages_read = sum(session.pages_read or 0 for session in month_sessions)
            total_reading_time = sum(session.duration or 0 for session in month_sessions)
            days_read = len(set(session.created_at.date() for session in month_sessions))
            
            average_reading_time = total_reading_time / books_read if books_read > 0 else 0
            
            monthly_data.append({
                'year': year,
                'month': month,
                'month_name': current_date.strftime('%B'),
                'books_read': books_read,
                'total_pages_read': total_pages_read,
                'total_reading_time': total_reading_time,
                'average_reading_time': round(average_reading_time, 2),
                'days_read': days_read
            })
            
            # Move to next month
            if month == 12:
                current_date = current_date.replace(year=year + 1, month=1)
            else:
                current_date = current_date.replace(month=month + 1)
        
        return monthly_data
    
    @staticmethod
    def get_book_progress(db: Session, user: User) -> Dict[str, Any]:
        """Get user's book reading progress"""
        library_items = db.query(UserLibrary).filter(UserLibrary.user_id == user.id).all()
        
        total_books = len(library_items)
        completed_books = len([item for item in library_items if item.status == "completed"])
        in_progress_books = len([item for item in library_items if item.status == "reading"])
        
        return {
            'total_books': total_books,
            'completed_books': completed_books,
            'in_progress_books': in_progress_books,
            'books': library_items[:10]  # Latest 10 books
        }
    
    @staticmethod
    def get_reading_goals(db: Session, user: User) -> List[Dict[str, Any]]:
        """Get user's reading goals and progress"""
        active_goals = db.query(ReadingGoal).filter(
            ReadingGoal.user_id == user.id,
            ReadingGoal.completed == False
        ).all()
        
        goals_data = []
        for goal in active_goals:
            progress_percentage = (goal.current_value / goal.target_value * 100) if goal.target_value > 0 else 0
            goals_data.append({
                'id': goal.id,
                'type': goal.goal_type,
                'target': goal.target_value,
                'current': goal.current_value,
                'progress_percentage': min(100, progress_percentage),
                'start_date': goal.start_date.isoformat(),
                'end_date': goal.end_date.isoformat() if goal.end_date else None
            })
        
        return goals_data
    
    @staticmethod
    def create_reading_goal(db: Session, user: User, goal_type: str, target_value: int, end_date=None) -> ReadingGoal:
        """Create a new reading goal for user"""
        goal = ReadingGoal(
            user_id=user.id,
            goal_type=goal_type,
            target_value=target_value,
            current_value=0,
            end_date=end_date
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return goal
    
    @staticmethod
    def get_reading_streak(db: Session, user: User) -> int:
        """Calculate user's current reading streak"""
        today = datetime.now(timezone.utc).date()
        streak = 0
        current_date = today
        
        while True:
            has_reading = db.query(ReadingSession).filter(
                ReadingSession.user_id == user.id,
                func.date(ReadingSession.created_at) == current_date
            ).first() is not None
            
            if has_reading:
                streak += 1
                current_date -= timedelta(days=1)
            else:
                break
        
        return streak
    
    @staticmethod
    def get_recent_activity(db: Session, user: User, days: int = 7) -> List[ReadingSession]:
        """Get recent reading activity"""
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)
        
        sessions = db.query(ReadingSession).filter(
            ReadingSession.user_id == user.id,
            ReadingSession.created_at >= start_date
        ).order_by(desc(ReadingSession.created_at)).limit(10).all()
        
        return sessions
    
    @staticmethod
    def get_reading_insights(db: Session, user: User) -> List[str]:
        """Get personalized reading insights"""
        stats = ReadingAnalyticsService.get_user_reading_stats(db, user, 30)
        
        insights = []
        
        # Reading time insights
        if stats['total_reading_time'] > 0:
            avg_daily_time = stats['total_reading_time'] / stats['days_period']
            if avg_daily_time >= 30:
                insights.append("Great job! You're reading an average of 30+ minutes daily.")
            elif avg_daily_time >= 15:
                insights.append("Good progress! You're building a consistent reading habit.")
            else:
                insights.append("Try to read for at least 15 minutes daily to build a strong habit.")
        
        # Streak insights
        streak = ReadingAnalyticsService.get_reading_streak(db, user)
        if streak >= 7:
            insights.append(f"Amazing! You've been reading for {streak} consecutive days!")
        elif streak >= 3:
            insights.append(f"Keep it up! You're on a {streak}-day reading streak.")
        else:
            insights.append("Start building your reading streak today!")
        
        # Goal insights
        goals = ReadingAnalyticsService.get_reading_goals(db, user)
        if goals:
            for goal in goals:
                if goal['progress_percentage'] >= 100:
                    insights.append(f"Congratulations! You've completed your {goal['type']} goal!")
                elif goal['progress_percentage'] >= 75:
                    insights.append(f"You're {goal['progress_percentage']:.0f}% to your {goal['type']} goal!")
        
        return insights