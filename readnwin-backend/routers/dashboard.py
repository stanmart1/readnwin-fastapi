from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func, desc, and_, case
from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
from models.user_library import UserLibrary
from models.reading_session import ReadingSession
from models.reading_goal import ReadingGoal
from models.order import Order, OrderItem
from models.book import Book, Category
from models.notification import Notification
from models.review import Review
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel

class ReadingSessionRequest(BaseModel):
    bookId: str
    pageNumber: int
    action: Literal["start", "update", "end"]
    sessionId: Optional[int] = None
    wordsOnPage: Optional[int] = None
    timeSpentSeconds: Optional[float] = None
    deviceInfo: Optional[Dict[str, Any]] = None
    endPage: Optional[int] = None

class NotificationUpdateRequest(BaseModel):
    notificationIds: List[str]
    markAsRead: bool = True

router = APIRouter()

class DashboardStats(BaseModel):
    total_books: int
    total_books_read: int
    total_reading_time: float
    reading_streak: int
    books_reading: int
    books_unread: int
    recent_purchases: int
    unread_notifications: int

class RecentActivity(BaseModel):
    reading_sessions: List[Dict[str, Any]]
    purchases: List[Dict[str, Any]]
    achievements: List[Dict[str, Any]]

class DashboardData(BaseModel):
    user: Dict[str, Any]
    stats: DashboardStats
    recent_activity: RecentActivity
    goals: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]

def calculate_reading_streak(user_id: int, db: Session) -> int:
    """Calculate user's current reading streak"""
    sessions = db.query(ReadingSession).filter(
        ReadingSession.user_id == user_id
    ).order_by(desc(ReadingSession.created_at)).all()

    if not sessions:
        return 0

    streak = 0
    current_date = datetime.now(timezone.utc).date()

    # Group sessions by date
    session_dates = set()
    for session in sessions:
        session_dates.add(session.created_at.date())

    # Convert to sorted list (newest first)
    session_dates = sorted(session_dates, reverse=True)

    # Calculate streak
    for i, session_date in enumerate(session_dates):
        if i == 0:
            # First session - check if it's today or yesterday
            days_diff = (current_date - session_date).days
            if days_diff <= 1:
                streak = 1
                last_session_date = session_date
            else:
                break
        else:
            # Check if this session is consecutive with the previous one
            days_diff = (last_session_date - session_date).days
            if days_diff == 1:
                streak += 1
                last_session_date = session_date
            else:
                break

    return streak

@router.get("/data", response_model=DashboardData)
async def get_dashboard_data(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard data for the current user"""
    try:
        # Optimized single query for library stats
        library_stats = db.query(
            func.count(UserLibrary.id).label('total_books'),
            func.sum(case((UserLibrary.status == 'completed', 1), else_=0)).label('completed_books'),
            func.sum(case((UserLibrary.status == 'reading', 1), else_=0)).label('reading_books'),
            func.sum(case((UserLibrary.status == 'unread', 1), else_=0)).label('unread_books')
        ).filter(UserLibrary.user_id == current_user.id).first()

        # Get library items with book details for recommendations
        library_items = db.query(UserLibrary).options(
            joinedload(UserLibrary.book).joinedload(Book.category)
        ).filter(UserLibrary.user_id == current_user.id).all()

        # Optimized reading sessions query with book details
        reading_sessions = db.query(ReadingSession).options(
            joinedload(ReadingSession.book)
        ).filter(
            ReadingSession.user_id == current_user.id
        ).order_by(desc(ReadingSession.created_at)).limit(10).all()

        # Get reading goals
        reading_goals = db.query(ReadingGoal).filter(
            ReadingGoal.user_id == current_user.id
        ).order_by(desc(ReadingGoal.created_at)).all()

        # Optimized purchases query with eager loading
        recent_purchases = db.query(Order).options(
            joinedload(Order.items).joinedload(OrderItem.book)
        ).filter(
            Order.user_id == current_user.id
        ).order_by(desc(Order.created_at)).limit(5).all()

        # Use optimized stats from single query
        total_books = library_stats.total_books or 0
        total_books_read = library_stats.completed_books or 0
        books_reading = library_stats.reading_books or 0
        books_unread = library_stats.unread_books or 0

        # Optimized single query for reading time and counts
        stats_query = db.query(
            func.coalesce(func.sum(ReadingSession.duration), 0).label('total_reading_time')
        ).filter(ReadingSession.user_id == current_user.id).first()
        
        total_reading_time = stats_query.total_reading_time or 0
        
        # Calculate reading streak
        reading_streak = calculate_reading_streak(current_user.id, db)

        # Separate queries to avoid cartesian product
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        recent_purchases_count = db.query(func.count(Order.id)).filter(
            Order.user_id == current_user.id,
            Order.created_at >= thirty_days_ago
        ).scalar() or 0
        
        unread_notifications = db.query(func.count(Notification.id)).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).scalar() or 0

        # Prepare recent activity data
        recent_reading_sessions = []
        for session in reading_sessions:
            recent_reading_sessions.append({
                "id": session.id,
                "book_title": session.book.title,
                "book_author": session.book.author,
                "duration": session.duration,
                "pages_read": session.pages_read,
                "progress": session.progress,
                "created_at": session.created_at.isoformat()
            })

        recent_purchase_data = []
        for purchase in recent_purchases:
            items = []
            for item in purchase.items:
                items.append({
                    "book_title": item.book.title,
                    "quantity": item.quantity,
                    "price": float(item.price)
                })

            recent_purchase_data.append({
                "id": purchase.id,
                "total_amount": float(purchase.total_amount),
                "status": purchase.status,
                "created_at": purchase.created_at.isoformat(),
                "items": items
            })

        # Get achievements from database only
        achievements = []
        try:
            from models.achievement import Achievement, UserAchievement
            user_achievements = db.query(UserAchievement).options(
                joinedload(UserAchievement.achievement)
            ).filter(
                UserAchievement.user_id == current_user.id
            ).order_by(desc(UserAchievement.earned_at)).limit(5).all()
            
            for ua in user_achievements:
                if ua.achievement:
                    achievements.append({
                        "type": ua.achievement.achievement_type,
                        "title": ua.achievement.name,
                        "description": ua.achievement.description,
                        "icon": ua.achievement.icon,
                        "earned_at": ua.earned_at.isoformat()
                    })
        except ImportError:
            # Achievement system not available
            pass

        # Prepare goals data with real-time progress calculation
        goals_data = []
        for goal in reading_goals:
            # Calculate current progress from database
            if goal.goal_type == "books":
                current_value = db.query(func.count(UserLibrary.id)).filter(
                    UserLibrary.user_id == current_user.id,
                    UserLibrary.status == "completed",
                    UserLibrary.updated_at >= goal.start_date,
                    UserLibrary.updated_at <= goal.end_date
                ).scalar() or 0
            elif goal.goal_type == "pages":
                current_value = db.query(func.coalesce(func.sum(ReadingSession.pages_read), 0)).filter(
                    ReadingSession.user_id == current_user.id,
                    ReadingSession.created_at >= goal.start_date,
                    ReadingSession.created_at <= goal.end_date
                ).scalar() or 0
            elif goal.goal_type == "minutes":
                total_minutes = db.query(func.coalesce(func.sum(ReadingSession.duration), 0)).filter(
                    ReadingSession.user_id == current_user.id,
                    ReadingSession.created_at >= goal.start_date,
                    ReadingSession.created_at <= goal.end_date
                ).scalar() or 0
                current_value = int(total_minutes)
            else:
                current_value = goal.current_value
            
            # Update goal with calculated value
            goal.current_value = current_value
            if current_value >= goal.target_value:
                goal.completed = True
            
            progress_percentage = (current_value / goal.target_value * 100) if goal.target_value > 0 else 0
            
            # Determine status
            now = datetime.now(timezone.utc)
            if goal.completed:
                status = "completed"
            elif now > goal.end_date:
                status = "expired"
            elif progress_percentage >= 75:
                status = "on_track"
            elif progress_percentage >= 50:
                status = "behind"
            else:
                status = "far_behind"
            
            goals_data.append({
                "id": goal.id,
                "goal_type": goal.goal_type,
                "target_value": goal.target_value,
                "current_value": current_value,
                "progress_percentage": round(progress_percentage, 2),
                "start_date": goal.start_date.isoformat(),
                "end_date": goal.end_date.isoformat(),
                "completed": goal.completed,
                "status": status
            })
        
        # Commit goal updates
        db.commit()

        # Generate book recommendations based on user's reading history
        recommendations = []

        # Get user's favorite categories
        favorite_categories = db.query(
            Category.name,
            func.count(ReadingSession.id).label('session_count')
        ).join(
            Book, Category.id == Book.category_id
        ).join(
            ReadingSession, Book.id == ReadingSession.book_id
        ).filter(
            ReadingSession.user_id == current_user.id
        ).group_by(Category.id, Category.name).order_by(desc('session_count')).limit(3).all()

        # Get unread books from favorite categories
        if favorite_categories:
            category_names = [cat.name for cat in favorite_categories]
            recommended_books = db.query(Book).join(Category).filter(
                and_(
                    Category.name.in_(category_names),
                    ~Book.id.in_(
                        db.query(UserLibrary.book_id).filter(
                            UserLibrary.user_id == current_user.id
                        )
                    )
                )
            ).limit(5).all()

            for book in recommended_books:
                recommendations.append({
                    "id": book.id,
                    "title": book.title,
                    "author": book.author,
                    "cover_image": book.cover_image,
                    "price": float(book.price),
                    "reason": f"Based on your interest in {book.category.name if book.category else 'this genre'}"
                })

        # Only show recommendations if user has reading history
        # No fallback to "popular" books without data

        return DashboardData(
            user={
                "id": current_user.id,
                "username": current_user.username,
                "email": current_user.email,
                "first_name": current_user.first_name,
                "last_name": current_user.last_name,
                "is_email_verified": current_user.is_email_verified,
                "member_since": current_user.created_at.isoformat()
            },
            stats=DashboardStats(
                total_books=total_books,
                total_books_read=total_books_read,
                total_reading_time=float(total_reading_time),
                reading_streak=reading_streak,
                books_reading=books_reading,
                books_unread=books_unread,
                recent_purchases=recent_purchases_count,
                unread_notifications=unread_notifications
            ),
            recent_activity=RecentActivity(
                reading_sessions=recent_reading_sessions,
                purchases=recent_purchase_data,
                achievements=achievements
            ),
            goals=goals_data,
            recommendations=recommendations
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dashboard data: {str(e)}"
        )

@router.post("/initialize")
async def initialize_dashboard(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Initialize dashboard data for a user (called by frontend after login)"""
    try:
        # Only create welcome notification, no default goals
        goals_created = False

        # Get library count
        library_count = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id
        ).count()

        # Create welcome notification if user is new
        if library_count == 0:
            welcome_notification = Notification(
                user_id=current_user.id,
                title="Welcome to ReadnWin!",
                message="Start your reading journey by exploring our book collection and adding books to your library.",
                type="welcome",
                priority="normal"
            )
            db.add(welcome_notification)

        db.commit()

        return {
            "message": "Dashboard initialized successfully",
            "user_id": current_user.id,
            "goals_created": goals_created,
            "library_count": library_count,
            "initialized_at": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error initializing dashboard: {str(e)}"
        )

@router.get("/activity")
async def get_activity_feed(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0)
):
    """Get user's activity feed with recent actions"""
    try:
        activities = []

        # Get recent reading sessions
        recent_sessions = db.query(ReadingSession).options(
            joinedload(ReadingSession.book)
        ).filter(
            ReadingSession.user_id == current_user.id
        ).order_by(desc(ReadingSession.created_at)).limit(10).all()

        for session in recent_sessions:
            if session.book and session.book.title and session.created_at:
                activities.append({
                    "id": f"session_{session.id}",
                    "activity_type": "reading_session",
                    "type": "reading_session",
                    "title": f"Read {session.book.title}",
                    "description": f"Read for {session.duration or 0:.1f} minutes, {session.pages_read or 0} pages",
                    "timestamp": session.created_at.isoformat(),
                    "created_at": session.created_at.isoformat(),
                    "data": {
                        "book_title": session.book.title,
                        "duration": session.duration or 0,
                        "pages_read": session.pages_read or 0
                    }
                })

        # Get recent book completions
        recent_completions = db.query(UserLibrary).options(
            joinedload(UserLibrary.book)
        ).filter(
            and_(
                UserLibrary.user_id == current_user.id,
                UserLibrary.status == "completed"
            )
        ).order_by(desc(UserLibrary.updated_at)).limit(5).all()

        for completion in recent_completions:
            if completion.book and completion.book.title and completion.updated_at:
                activities.append({
                    "id": f"completion_{completion.id}",
                    "activity_type": "completed",
                    "type": "book_completed",
                    "title": f"Completed {completion.book.title}",
                    "description": f"Finished reading this book",
                    "timestamp": completion.updated_at.isoformat(),
                    "created_at": completion.updated_at.isoformat(),
                    "data": {
                        "book_title": completion.book.title,
                        "book_author": completion.book.author or "Unknown Author"
                    }
                })

        # Get recent purchases
        recent_purchases = db.query(Order).options(
            joinedload(Order.items).joinedload(OrderItem.book)
        ).filter(
            Order.user_id == current_user.id
        ).order_by(desc(Order.created_at)).limit(5).all()

        for purchase in recent_purchases:
            if purchase.created_at and purchase.items:
                book_titles = [item.book.title for item in purchase.items if item.book and item.book.title]
                if book_titles:  # Only add if there are valid book titles
                    activities.append({
                        "id": f"purchase_{purchase.id}",
                        "activity_type": "purchase",
                        "type": "purchase",
                        "title": f"Purchased {len(book_titles)} book(s)",
                        "description": f"Added {', '.join(book_titles[:2])}{'...' if len(book_titles) > 2 else ''} to library",
                        "timestamp": purchase.created_at.isoformat(),
                        "created_at": purchase.created_at.isoformat(),
                        "data": {
                            "order_id": purchase.id,
                            "order_number": purchase.order_number or f"#{purchase.id}",
                            "total_amount": float(purchase.total_amount or 0),
                            "books": book_titles
                        }
                    })

        # Sort all activities by timestamp
        activities.sort(key=lambda x: x["timestamp"], reverse=True)

        # Apply pagination
        paginated_activities = activities[offset:offset + limit]

        return {
            "activities": paginated_activities,
            "total": len(activities),
            "has_more": len(activities) > offset + limit
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching activity feed: {str(e)}"
        )

@router.post("/reading-sessions")
async def handle_reading_session(
    request: ReadingSessionRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Handle reading session actions (start, update, end)"""
    try:
        book_id = int(request.bookId)
        
        # Validate book exists and user has access
        book = db.query(Book).filter(Book.id == book_id).first()
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        library_entry = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == book_id
        ).first()
        
        if not library_entry:
            raise HTTPException(status_code=403, detail="Access denied to this book")
        
        if request.action == "start":
            # Create new reading session
            session = ReadingSession(
                user_id=current_user.id,
                book_id=book_id,
                duration=0,
                pages_read=request.pageNumber,
                progress=0
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            
            return {
                "success": True,
                "sessionId": session.id,
                "action": "started"
            }
            
        elif request.action == "update":
            # Update existing session
            if request.sessionId:
                session = db.query(ReadingSession).filter(
                    ReadingSession.id == request.sessionId,
                    ReadingSession.user_id == current_user.id
                ).first()
                
                if session:
                    if request.timeSpentSeconds:
                        session.duration += request.timeSpentSeconds / 60  # Convert to minutes
                    if request.wordsOnPage:
                        session.words_read = (session.words_read or 0) + request.wordsOnPage
                    session.pages_read = request.pageNumber
                    session.updated_at = datetime.now(timezone.utc)
                    
                    db.commit()
                    
                    return {
                        "success": True,
                        "sessionId": session.id,
                        "action": "updated"
                    }
            
            return {"success": False, "error": "Session not found"}
            
        elif request.action == "end":
            # End reading session
            if request.sessionId:
                session = db.query(ReadingSession).filter(
                    ReadingSession.id == request.sessionId,
                    ReadingSession.user_id == current_user.id
                ).first()
                
                if session:
                    session.pages_read = request.endPage or request.pageNumber
                    session.updated_at = datetime.now(timezone.utc)
                    
                    # Update library entry progress
                    if library_entry:
                        library_entry.last_read_at = datetime.now(timezone.utc)
                        if session.pages_read > 0:
                            library_entry.status = "reading"
                    
                    db.commit()
                    
                    return {
                        "success": True,
                        "sessionId": session.id,
                        "action": "ended",
                        "totalDuration": session.duration,
                        "pagesRead": session.pages_read
                    }
            
            return {"success": False, "error": "Session not found"}
        
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error handling reading session: {str(e)}"
        )

@router.get("/notifications")
async def get_user_notifications(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=50)
):
    """Get user's notifications for dashboard - only real database data"""
    try:
        # Get notifications from database only
        db_notifications = db.query(Notification).filter(
            Notification.user_id == current_user.id
        ).order_by(desc(Notification.created_at)).limit(limit).all()
        
        notifications_list = []
        
        # Add only database notifications with strict validation
        for notif in db_notifications:
            if notif.created_at and notif.title and notif.message:
                notifications_list.append({
                    "id": str(notif.id),
                    "type": notif.type,
                    "title": notif.title,
                    "message": notif.message,
                    "date": notif.created_at.isoformat(),
                    "priority": notif.priority,
                    "is_read": notif.is_read
                })
        
        # Count unread notifications
        unread_count = db.query(func.count(Notification.id)).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).scalar() or 0
        
        return {
            "notifications": notifications_list,
            "unreadCount": unread_count
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching notifications: {str(e)}"
        )

@router.put("/notifications")
async def update_notifications(
    request: NotificationUpdateRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update notification read status"""
    try:
        if not request.notificationIds:
            raise HTTPException(status_code=400, detail="No notification IDs provided")
            
        # Convert string IDs to integers
        try:
            notification_ids = [int(id_str) for id_str in request.notificationIds]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid notification ID format")
        
        updated_count = db.query(Notification).filter(
            and_(
                Notification.id.in_(notification_ids),
                Notification.user_id == current_user.id
            )
        ).update({"is_read": request.markAsRead}, synchronize_session=False)
        
        db.commit()
        
        return {
            "message": "Notifications updated successfully",
            "updated_count": updated_count
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating notifications: {str(e)}"
        )

@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for welcome header"""
    try:
        # Separate queries to avoid join ambiguity
        library_stats = db.query(
            func.count(UserLibrary.id).label('total_books'),
            func.sum(case((UserLibrary.status == 'completed', 1), else_=0)).label('completed_books'),
            func.sum(case((UserLibrary.status == 'reading', 1), else_=0)).label('currently_reading'),
            func.avg(UserLibrary.progress).label('avg_progress')
        ).filter(UserLibrary.user_id == current_user.id).first()
        
        reading_stats = db.query(
            func.coalesce(func.sum(ReadingSession.pages_read), 0).label('total_pages'),
            func.coalesce(func.sum(ReadingSession.duration), 0).label('total_duration')
        ).filter(ReadingSession.user_id == current_user.id).first()
        
        goal_stats = db.query(
            func.count(ReadingGoal.id).label('total_goals'),
            func.sum(case((ReadingGoal.completed == True, 1), else_=0)).label('completed_goals')
        ).filter(ReadingGoal.user_id == current_user.id).first()
        
        # Extract values with defaults
        total_books = library_stats.total_books or 0
        completed_books = library_stats.completed_books or 0
        currently_reading = library_stats.currently_reading or 0
        avg_progress = float(library_stats.avg_progress or 0)
        total_pages_read = int(reading_stats.total_pages or 0) if reading_stats else 0
        total_hours = float(reading_stats.total_duration or 0) / 60 if reading_stats else 0
        total_goals = goal_stats.total_goals or 0 if goal_stats else 0
        completed_goals = goal_stats.completed_goals or 0 if goal_stats else 0
        
        # Calculate reading streak
        reading_streak = calculate_reading_streak(current_user.id, db)
        
        # Recent purchases count (optimized)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        recent_purchases = db.query(func.count(Order.id)).filter(
            Order.user_id == current_user.id,
            Order.created_at >= thirty_days_ago
        ).scalar() or 0
        
        return {
            "stats": {
                "booksRead": completed_books,
                "completedBooks": completed_books,
                "currentlyReading": currently_reading,
                "totalBooks": total_books,
                "totalPagesRead": total_pages_read,
                "totalHours": round(total_hours, 1),
                "streak": reading_streak,
                "avgProgress": round(avg_progress, 1),
                "favoriteBooks": 0,  # Simplified for now
                "recentPurchases": recent_purchases,
                "totalGoals": total_goals,
                "completedGoals": completed_goals,
                "avgGoalProgress": round((completed_goals / total_goals * 100) if total_goals > 0 else 0, 1)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dashboard stats: {str(e)}"
        )

@router.get("/achievements")
async def get_dashboard_achievements(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get user achievements for dashboard"""
    try:
        from models.achievement import Achievement, UserAchievement
        
        # Get all available achievements
        all_achievements = db.query(Achievement).all()
        
        # Get user's earned achievements
        user_achievements = db.query(UserAchievement).filter(
            UserAchievement.user_id == current_user.id
        ).all()
        
        earned_achievement_ids = {ua.achievement_id for ua in user_achievements}
        
        # Get user stats for achievement checking
        completed_books = db.query(UserLibrary).filter(
            and_(
                UserLibrary.user_id == current_user.id,
                UserLibrary.status == "completed"
            )
        ).count()
        
        total_sessions = db.query(ReadingSession).filter(
            ReadingSession.user_id == current_user.id
        ).count()
        
        total_pages = db.query(
            func.coalesce(func.sum(ReadingSession.pages_read), 0)
        ).filter(ReadingSession.user_id == current_user.id).scalar()
        
        # Check and award new achievements
        user_stats = {
            "books_read": completed_books,
            "reading_sessions": total_sessions,
            "pages_read": int(total_pages or 0)
        }
        
        for achievement in all_achievements:
            if achievement.id not in earned_achievement_ids:
                should_award = False
                
                if achievement.achievement_type == "books_read" and user_stats["books_read"] >= achievement.requirement_value:
                    should_award = True
                elif achievement.achievement_type == "reading_sessions" and user_stats["reading_sessions"] >= achievement.requirement_value:
                    should_award = True
                elif achievement.achievement_type == "pages_read" and user_stats["pages_read"] >= achievement.requirement_value:
                    should_award = True
                
                if should_award:
                    new_user_achievement = UserAchievement(
                        user_id=current_user.id,
                        achievement_id=achievement.id
                    )
                    db.add(new_user_achievement)
                    earned_achievement_ids.add(achievement.id)
        
        db.commit()
        
        # Format achievements for response
        achievements = []
        for achievement in all_achievements:
            earned_at = None
            if achievement.id in earned_achievement_ids:
                user_achievement = next(
                    (ua for ua in user_achievements if ua.achievement_id == achievement.id),
                    None
                )
                earned_at = user_achievement.earned_at.isoformat() if user_achievement else datetime.now(timezone.utc).isoformat()
            
            achievements.append({
                "id": achievement.id,
                "achievement_type": achievement.achievement_type,
                "title": achievement.name,
                "description": achievement.description,
                "icon": achievement.icon,
                "earned_at": earned_at
            })
        
        return {
            "achievements": achievements
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching achievements: {str(e)}"
        )

@router.get("/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get a quick summary of user's dashboard stats"""
    try:
        # Optimized single query for all summary stats
        summary_stats = db.query(
            func.count(UserLibrary.id).label('library_count'),
            func.sum(case((UserLibrary.status == 'completed', 1), else_=0)).label('completed_books'),
            func.count(ReadingGoal.id).filter(
                and_(
                    ReadingGoal.completed == False,
                    ReadingGoal.end_date >= datetime.now(timezone.utc)
                )
            ).label('active_goals'),
            func.count(Notification.id).filter(Notification.is_read == False).label('unread_notifications')
        ).outerjoin(
            ReadingGoal, ReadingGoal.user_id == current_user.id
        ).outerjoin(
            Notification, Notification.user_id == current_user.id
        ).filter(UserLibrary.user_id == current_user.id).first()
        
        library_count = summary_stats.library_count or 0
        completed_books = summary_stats.completed_books or 0
        active_goals = summary_stats.active_goals or 0
        unread_notifications = summary_stats.unread_notifications or 0

        return {
            "library_count": library_count,
            "completed_books": completed_books,
            "active_goals": active_goals,
            "unread_notifications": unread_notifications,
            "completion_rate": round((completed_books / library_count * 100) if library_count > 0 else 0, 1)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dashboard summary: {str(e)}"
        )

# Additional endpoints from enhanced routers
@router.get("/library")
async def get_dashboard_library(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get user's library for dashboard library section"""
    try:
        library_items = db.query(UserLibrary).options(
            joinedload(UserLibrary.book)
        ).filter(UserLibrary.user_id == current_user.id).all()
        
        library_data = []
        for item in library_items:
            library_data.append({
                "id": item.id,
                "book_id": item.book_id,
                "title": item.book.title if item.book else "Unknown",
                "author": item.book.author if item.book else "Unknown",
                "cover_image": item.book.cover_image if item.book else None,
                "status": item.status,
                "progress": item.progress or 0,
                "added_at": item.added_at.isoformat() if item.added_at else None,
                "last_read_at": item.last_read_at.isoformat() if item.last_read_at else None
            })
        
        return {"library": library_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reading-progress")
async def get_reading_progress(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get reading progress data for dashboard"""
    try:
        # Get currently reading books
        currently_reading = db.query(UserLibrary).options(
            joinedload(UserLibrary.book)
        ).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.status == 'reading'
        ).all()
        
        progress_data = []
        for item in currently_reading:
            progress_data.append({
                "book_id": item.book_id,
                "title": item.book.title if item.book else "Unknown",
                "author": item.book.author if item.book else "Unknown",
                "cover_image": item.book.cover_image if item.book else None,
                "progress": item.progress or 0,
                "last_read_at": item.last_read_at.isoformat() if item.last_read_at else None
            })
        
        return {"reading_progress": progress_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics")
async def get_dashboard_analytics(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get reading analytics for user dashboard - synced with e-reader data"""
    try:
        # Get reading sessions from e-reader usage
        sessions = db.query(ReadingSession).options(
            joinedload(ReadingSession.book)
        ).filter(
            ReadingSession.user_id == current_user.id
        ).order_by(ReadingSession.created_at.desc()).all()
        
        # Calculate monthly data from actual reading sessions
        monthly_data = []
        current_date = datetime.now(timezone.utc)
        
        for i in range(6):  # Last 6 months
            month_start = (current_date.replace(day=1) - timedelta(days=i*30)).replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            month_sessions = [s for s in sessions if month_start <= s.created_at <= month_end]
            total_hours = sum(s.duration or 0 for s in month_sessions) / 60  # Convert to hours
            books_read = len(set(s.book_id for s in month_sessions if s.progress and s.progress >= 1.0))
            
            monthly_data.append({
                "month": month_start.strftime("%b"),
                "books": books_read,
                "hours": round(total_hours, 1)
            })
        
        monthly_data.reverse()  # Show oldest to newest
        
        # Calculate genre distribution from user's library
        genre_data = []
        library_books = db.query(UserLibrary).options(
            joinedload(UserLibrary.book).joinedload(Book.category)
        ).filter(UserLibrary.user_id == current_user.id).all()
        
        genre_counts = {}
        total_books = len(library_books)
        
        for item in library_books:
            if item.book and item.book.category:
                genre_name = item.book.category.name
                genre_counts[genre_name] = genre_counts.get(genre_name, 0) + 1
        
        for genre, count in genre_counts.items():
            percentage = round((count / total_books * 100), 1) if total_books > 0 else 0
            genre_data.append({
                "name": genre,
                "count": count,
                "percentage": percentage
            })
        
        # Calculate overall stats from reading sessions
        total_reading_time = sum(s.duration or 0 for s in sessions) / 60  # Hours
        reading_days = len(set(s.created_at.date() for s in sessions))
        completed_books = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.status == "completed"
        ).count()
        
        # Calculate average pages per book from sessions
        total_pages = sum(s.pages_read or 0 for s in sessions)
        avg_pages_per_book = round(total_pages / max(completed_books, 1))
        
        return {
            "analytics": {
                "monthlyData": monthly_data,
                "genreData": genre_data,
                "stats": {
                    "totalHours": round(total_reading_time, 1),
                    "readingDays": reading_days,
                    "totalBooks": completed_books,
                    "avgPagesPerBook": avg_pages_per_book
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching analytics: {str(e)}")

@router.get("/quick-actions")
async def get_quick_actions(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get quick actions data for dashboard"""
    try:
        # Get recently read books for continue reading
        recent_books = db.query(UserLibrary).options(
            joinedload(UserLibrary.book)
        ).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.status == 'reading'
        ).order_by(UserLibrary.last_read_at.desc().nulls_last()).limit(3).all()
        
        continue_reading = []
        for item in recent_books:
            continue_reading.append({
                "book_id": item.book_id,
                "title": item.book.title if item.book else "Unknown",
                "progress": item.progress or 0
            })
        
        return {
            "quick_actions": {
                "continue_reading": continue_reading,
                "browse_books_url": "/books",
                "my_library_url": "/dashboard?tab=library"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
