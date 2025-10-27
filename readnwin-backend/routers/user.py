from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, and_, func
from datetime import datetime, timedelta
from core.database import get_db
from core.security import get_current_user_from_token
from core.storage import storage
from models.user import User
from models.order import Order, OrderItem
from models.user_library import UserLibrary
from models.book import Book, Category
from models.reading_session import ReadingSession
from models.reading_goal import ReadingGoal
from models.book import Book
from pydantic import BaseModel
from typing import List, Optional

class NotificationPreferences(BaseModel):
    email_notifications: bool = True
    new_releases: bool = True
    promotions: bool = False
    reading_reminders: bool = True

router = APIRouter()

class UserProfile(BaseModel):
    id: int
    email: str
    username: str
    first_name: Optional[str]
    last_name: Optional[str]
    is_email_verified: bool
    created_at: str
    last_login: Optional[str]

class LibraryBook(BaseModel):
    id: int
    title: str
    author: str
    cover_image: Optional[str]
    status: str
    progress: float
    last_read_at: Optional[str]
    purchase_date: Optional[str]
    format: str = "ebook"

class UserLibraryResponse(BaseModel):
    books: List[LibraryBook]
    total_books: int
    books_completed: int
    books_reading: int
    books_unread: int

class ReadingStats(BaseModel):
    total_reading_time: float
    books_completed: int
    reading_streak: int
    pages_read: int
    average_session_time: float
    favorite_genre: Optional[str]

@router.get("/library")
async def get_user_library(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
) -> dict:
    """Get user's library with books and reading progress"""
    try:
        # Get user's library items with book details
        library_items = db.query(UserLibrary).options(
            joinedload(UserLibrary.book)
        ).filter(
            UserLibrary.user_id == current_user.id
        ).order_by(UserLibrary.created_at.desc()).all()

        library_books = []
        for item in library_items:
            if item.book:
                # Get latest reading session for progress
                latest_session = db.query(ReadingSession).filter(
                    ReadingSession.user_id == current_user.id,
                    ReadingSession.book_id == item.book_id
                ).order_by(ReadingSession.created_at.desc()).first()

                # Progress is stored as 0-1, convert to 0-100 for frontend
                progress = (item.progress or 0.0) * 100
                last_read_at = item.last_read_at.isoformat() if item.last_read_at else None
                if latest_session and item.book.pages:
                    # Calculate progress from reading session if available
                    session_progress = (latest_session.pages_read or 0) / item.book.pages * 100
                    progress = max(progress, session_progress)

                # Get author name from author_id
                author_name = "Unknown Author"
                if item.book.author_id:
                    from models.author import Author
                    author = db.query(Author).filter(Author.id == item.book.author_id).first()
                    if author:
                        author_name = author.name
                elif item.book.author:
                    author_name = item.book.author

                # Keep original format (ebook, physical, etc.)
                book_format = getattr(item.book, 'format', 'ebook')
                file_extension = None
                file_path = getattr(item.book, 'file_path', None)
                
                # Extract file extension only
                if file_path:
                    file_extension = file_path.split('.')[-1].lower()
                
                library_books.append({
                    "id": item.id,
                    "book_id": item.book_id,
                    "title": item.book.title,
                    "author": author_name,
                    "cover_image_url": storage.get_url(item.book.cover_image) if item.book.cover_image and item.book.cover_image.strip() else None,
                    "status": item.status or "unread",
                    "progress": min(progress, 100.0),
                    "last_read_location": item.last_read_location,
                    "last_read_at": last_read_at,
                    "purchase_date": item.created_at.isoformat() if item.created_at else None,
                    "format": book_format,
                    "file_extension": file_extension,
                    "file_path": file_path,
                    "price": float(item.book.price) if item.book.price else 0,
                    "description": item.book.description,
                    "rating": getattr(item.book, 'rating', 0),
                    "total_pages": getattr(item.book, 'pages', 0) or 0
                })
            else:
                # Handle case where book is missing - remove orphaned library entry
                print(f"Warning: UserLibrary item {item.id} has missing book {item.book_id}, removing...")
                db.delete(item)
                db.commit()

        # Calculate library stats
        total_books = len(library_books)
        books_completed = len([book for book in library_books if book["status"] == "completed"])
        books_reading = len([book for book in library_books if book["status"] == "reading"])
        books_unread = len([book for book in library_books if book["status"] == "unread"])

        return {
            "libraryItems": library_books,
            "stats": {
                "total_books": total_books,
                "books_completed": books_completed,
                "books_reading": books_reading,
                "books_unread": books_unread
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user library: {str(e)}"
        )

@router.get("/profile", response_model=UserProfile)
def get_user_profile(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get current user's profile information"""
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        is_email_verified=current_user.is_email_verified,
        created_at=current_user.created_at.isoformat(),
        last_login=current_user.last_login.isoformat() if current_user.last_login else None
    )



@router.get("/reading-stats", response_model=ReadingStats)
def get_reading_stats(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get user's reading statistics"""

    # Total reading time
    total_reading_time = db.query(
        func.coalesce(func.sum(ReadingSession.duration), 0)
    ).filter(ReadingSession.user_id == current_user.id).scalar()

    # Books completed
    books_completed = db.query(UserLibrary).filter(
        and_(
            UserLibrary.user_id == current_user.id,
            UserLibrary.status == "completed"
        )
    ).count()

    # Calculate reading streak (consecutive days with reading sessions)
    reading_streak = calculate_reading_streak(current_user.id, db)

    # Total pages read
    pages_read = db.query(
        func.coalesce(func.sum(ReadingSession.pages_read), 0)
    ).filter(ReadingSession.user_id == current_user.id).scalar()

    # Average session time
    avg_session_time = db.query(
        func.avg(ReadingSession.duration)
    ).filter(ReadingSession.user_id == current_user.id).scalar() or 0.0

    # Favorite genre (most read category)
    favorite_genre_query = db.query(
        Category.name.label('category_name'),
        func.count(ReadingSession.id).label('session_count')
    ).join(
        Book, Category.id == Book.category_id
    ).join(
        ReadingSession, Book.id == ReadingSession.book_id
    ).filter(
        ReadingSession.user_id == current_user.id
    ).group_by(Category.name).order_by(desc('session_count')).first()

    favorite_genre = favorite_genre_query[0] if favorite_genre_query else None

    return ReadingStats(
        total_reading_time=float(total_reading_time),
        books_completed=books_completed,
        reading_streak=reading_streak,
        pages_read=int(pages_read),
        average_session_time=float(avg_session_time),
        favorite_genre=favorite_genre
    )

@router.put("/library/{book_id}/status")
def update_reading_status(
    book_id: int,
    status: str,
    progress: Optional[float] = None,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update reading status for a book in user's library"""

    # Validate status
    valid_statuses = ["unread", "reading", "completed"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    # Validate progress
    if progress is not None and (progress < 0 or progress > 100):
        raise HTTPException(
            status_code=400,
            detail="Progress must be between 0 and 100"
        )

    # Find the library item
    library_item = db.query(UserLibrary).filter(
        and_(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == book_id
        )
    ).first()

    if not library_item:
        raise HTTPException(status_code=404, detail="Book not found in your library")

    # Update status and progress
    library_item.status = status
    if progress is not None:
        library_item.progress = progress

    # Set progress to 100 if completed
    if status == "completed":
        library_item.progress = 100.0

    # Update last read time
    library_item.last_read_at = datetime.utcnow()

    db.commit()

    return {
        "message": "Reading status updated successfully",
        "book_id": book_id,
        "status": status,
        "progress": library_item.progress
    }

@router.get("/reading-sessions")
def get_reading_sessions(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get user's recent reading sessions"""

    sessions = db.query(ReadingSession).options(
        joinedload(ReadingSession.book)
    ).filter(
        ReadingSession.user_id == current_user.id
    ).order_by(desc(ReadingSession.created_at)).offset(offset).limit(limit).all()

    return [
        {
            "id": session.id,
            "book_title": session.book.title,
            "duration": session.duration,
            "pages_read": session.pages_read,
            "progress": session.progress,
            "created_at": session.created_at.isoformat()
        }
        for session in sessions
    ]

# Reading goals endpoint moved to dedicated /reading-goals router

@router.post("/library/{book_id}/download")
def download_book(
    book_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get download URL for a book in user's library"""
    
    # Check if user owns the book
    library_item = db.query(UserLibrary).filter(
        and_(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == book_id
        )
    ).first()
    
    if not library_item:
        raise HTTPException(status_code=404, detail="Book not found in your library")
    
    # Get book details
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Return download URL (assuming book has ebook_file_url)
    download_url = getattr(book, 'ebook_file_url', None)
    if not download_url:
        raise HTTPException(status_code=404, detail="Download not available for this book")
    
    return {
        "downloadUrl": download_url,
        "bookTitle": book.title,
        "format": getattr(book, 'format', 'ebook')
    }

def calculate_reading_streak(user_id: int, db: Session) -> int:
    """Calculate user's current reading streak"""

    # Get all reading sessions for the user, ordered by date
    sessions = db.query(ReadingSession).filter(
        ReadingSession.user_id == user_id
    ).order_by(desc(ReadingSession.created_at)).all()

    if not sessions:
        return 0

    streak = 0
    current_date = datetime.utcnow().date()
    last_session_date = None

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

@router.get("/notification-preferences")
def get_notification_preferences(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get user's notification preferences"""
    # For now, return default preferences
    # In production, store in user_preferences table
    return {
        "email_notifications": True,
        "new_releases": True,
        "promotions": False,
        "reading_reminders": True
    }

@router.put("/notification-preferences")
def update_notification_preferences(
    preferences: NotificationPreferences,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update user's notification preferences"""
    # For now, just return success
    # In production, save to user_preferences table
    return {
        "message": "Notification preferences updated successfully",
        "preferences": preferences.dict()
    }
