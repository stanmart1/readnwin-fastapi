from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

from core.database import get_db
from core.security import get_current_user_from_token
from models.reading_session import ReadingSession
from models.reading_goal import ReadingGoal
from models.user_library import UserLibrary
from models.book import Book

# Define schemas directly in the router for now
class ReadingSessionCreate(BaseModel):
    book_id: int
    duration: float = 0.0
    pages_read: int = 0
    progress: float = 0.0

class ReadingSessionUpdate(BaseModel):
    duration: Optional[float] = None
    pages_read: Optional[int] = None
    progress: Optional[float] = None

class ReadingSessionResponse(BaseModel):
    id: int
    book_id: int
    duration: float
    pages_read: int
    progress: float
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class ReadingGoalCreate(BaseModel):
    goal_type: str  # books, pages, minutes
    target_value: int
    end_date: datetime

class ReadingGoalResponse(BaseModel):
    id: int
    goal_type: str
    target_value: int
    current_value: int
    start_date: datetime
    end_date: datetime
    completed: bool

    class Config:
        from_attributes = True

class TextToSpeechRequest(BaseModel):
    text: str
    voice: Optional[str] = "default"
    speed: Optional[float] = 1.0

class ProgressSync(BaseModel):
    current_page: int
    total_pages: Optional[int] = None
    completion: Optional[float] = None
    reading_time: Optional[float] = None

router = APIRouter(prefix="/reading", tags=["reading"])

@router.get("/")
async def get_reading_overview(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get reading overview for the user"""
    try:
        # Get user's library with book details
        library_items = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id
        ).all()
        
        # Get recent reading sessions
        recent_sessions = db.query(ReadingSession).filter(
            ReadingSession.user_id == current_user.id
        ).order_by(ReadingSession.created_at.desc()).limit(5).all()
        
        # Get reading goals
        goals = db.query(ReadingGoal).filter(
            ReadingGoal.user_id == current_user.id,
            ReadingGoal.completed == False
        ).all()
        
        return {
            "library_count": len(library_items),
            "currently_reading": len([item for item in library_items if item.status == "reading"]),
            "completed_books": len([item for item in library_items if item.status == "completed"]),
            "recent_sessions": len(recent_sessions),
            "active_goals": len(goals),
            "total_reading_time": sum(session.duration for session in recent_sessions),
            "message": "Reading overview retrieved successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching reading overview: {str(e)}"
        )

@router.get("/sessions")
async def get_reading_progress(
    book_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get reading progress for a book or all books"""
    try:
        if book_id:
            # Get progress for specific book
            library_entry = db.query(UserLibrary).filter(
                UserLibrary.user_id == current_user.id,
                UserLibrary.book_id == book_id
            ).first()

            if not library_entry:
                # Create library entry if it doesn't exist
                library_entry = UserLibrary(
                    user_id=current_user.id,
                    book_id=book_id,
                    status="unread",
                    progress=0.0
                )
                db.add(library_entry)
                db.commit()
                db.refresh(library_entry)

            # Get latest reading session
            latest_session = db.query(ReadingSession).filter(
                ReadingSession.user_id == current_user.id,
                ReadingSession.book_id == book_id
            ).order_by(ReadingSession.created_at.desc()).first()

            return {
                "currentPage": int(library_entry.progress * 100) if library_entry.progress else 0,
                "totalPages": 100,  # Default, should be from book metadata
                "completion": library_entry.progress or 0.0,
                "lastReadAt": library_entry.last_read_at.isoformat() if library_entry.last_read_at else None,
                "readingTime": latest_session.duration if latest_session else 0.0,
                "status": library_entry.status
            }
        else:
            # Get all reading sessions for user
            sessions = db.query(ReadingSession).filter(
                ReadingSession.user_id == current_user.id
            ).order_by(ReadingSession.created_at.desc()).all()

            return [
                {
                    "id": session.id,
                    "book_id": session.book_id,
                    "duration": session.duration,
                    "pages_read": session.pages_read,
                    "progress": session.progress,
                    "created_at": session.created_at.isoformat(),
                    "updated_at": session.updated_at.isoformat() if session.updated_at else None
                }
                for session in sessions
            ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching reading progress: {str(e)}"
        )

@router.post("/sessions", response_model=ReadingSessionResponse)
async def create_reading_session(
    session: ReadingSessionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Create a new reading session"""
    try:
        new_session = ReadingSession(
            user_id=current_user.id,
            book_id=session.book_id,
            duration=session.duration,
            pages_read=session.pages_read,
            progress=session.progress
        )

        db.add(new_session)
        db.commit()
        db.refresh(new_session)

        # Update user library progress
        library_entry = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == session.book_id
        ).first()

        if library_entry:
            library_entry.progress = session.progress
            library_entry.last_read_at = datetime.utcnow()
            if session.progress >= 1.0:
                library_entry.status = "completed"
            elif session.progress > 0:
                library_entry.status = "reading"
            db.commit()

        return new_session
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating reading session: {str(e)}"
        )

@router.put("/sessions/{session_id}/progress")
async def update_reading_progress(
    session_id: int,
    progress: ProgressSync,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Update reading progress for a session"""
    try:
        session = db.query(ReadingSession).filter(
            ReadingSession.id == session_id,
            ReadingSession.user_id == current_user.id
        ).first()

        if not session:
            raise HTTPException(status_code=404, detail="Reading session not found")

        # Update session
        if progress.completion is not None:
            session.progress = progress.completion
        if progress.reading_time is not None:
            session.duration = progress.reading_time

        session.updated_at = datetime.utcnow()

        # Update library entry
        library_entry = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == session.book_id
        ).first()

        if library_entry:
            if progress.completion is not None:
                library_entry.progress = progress.completion
            library_entry.last_read_at = datetime.utcnow()
            if library_entry.progress >= 1.0:
                library_entry.status = "completed"
            elif library_entry.progress > 0:
                library_entry.status = "reading"

        db.commit()
        db.refresh(session)

        return {
            "id": session.id,
            "book_id": session.book_id,
            "duration": session.duration,
            "pages_read": session.pages_read,
            "progress": session.progress,
            "created_at": session.created_at.isoformat(),
            "updated_at": session.updated_at.isoformat() if session.updated_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating reading progress: {str(e)}"
        )

@router.post("/text-to-speech")
async def convert_text_to_speech(
    request: TextToSpeechRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Convert text to speech"""
    try:
        # In a real implementation, you would integrate with a TTS service
        # For now, return a mock response
        return {
            "message": "Text-to-speech conversion initiated",
            "text_length": len(request.text),
            "voice": request.voice,
            "speed": request.speed,
            "audio_url": f"/audio/tts_{current_user.id}_{datetime.utcnow().timestamp()}.mp3"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error converting text to speech: {str(e)}"
        )

@router.post("/goals", response_model=ReadingGoalResponse)
async def create_reading_goal(
    goal: ReadingGoalCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Create a new reading goal"""
    try:
        new_goal = ReadingGoal(
            user_id=current_user.id,
            goal_type=goal.goal_type,
            target_value=goal.target_value,
            current_value=0,
            start_date=datetime.utcnow(),
            end_date=goal.end_date,
            completed=False
        )

        db.add(new_goal)
        db.commit()
        db.refresh(new_goal)

        return new_goal
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating reading goal: {str(e)}"
        )

@router.get("/goals")
async def get_reading_goals(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get all reading goals for a user"""
    try:
        goals = db.query(ReadingGoal).filter(
            ReadingGoal.user_id == current_user.id
        ).order_by(ReadingGoal.created_at.desc()).all()

        # Format goals with progress percentage calculation
        formatted_goals = []
        for goal in goals:
            progress_percentage = (goal.current_value / goal.target_value * 100) if goal.target_value > 0 else 0
            formatted_goals.append({
                "id": goal.id,
                "goal_type": goal.goal_type,
                "target_value": goal.target_value,
                "current_value": goal.current_value,
                "progress_percentage": min(progress_percentage, 100),
                "start_date": goal.start_date.strftime("%Y-%m-%d") if goal.start_date else "",
                "end_date": goal.end_date.strftime("%Y-%m-%d") if goal.end_date else "",
                "completed": goal.completed
            })

        return {"goals": formatted_goals}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching reading goals: {str(e)}"
        )

@router.delete("/goals/{goal_id}")
async def delete_reading_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Delete a reading goal"""
    try:
        goal = db.query(ReadingGoal).filter(
            ReadingGoal.id == goal_id,
            ReadingGoal.user_id == current_user.id
        ).first()

        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reading goal not found"
            )

        db.delete(goal)
        db.commit()

        return {"message": "Reading goal deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting reading goal: {str(e)}"
        )

@router.get("/stats")
async def get_reading_statistics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get reading statistics for a user"""
    try:
        # Set default date range if not provided
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date.replace(day=1)  # Start of current month

        # Get reading sessions in date range
        sessions = db.query(ReadingSession).filter(
            ReadingSession.user_id == current_user.id,
            ReadingSession.created_at >= start_date,
            ReadingSession.created_at <= end_date
        ).all()

        # Calculate statistics
        total_reading_time = sum(session.duration for session in sessions)
        total_pages_read = sum(session.pages_read for session in sessions)
        books_read = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.status == "completed",
            UserLibrary.last_read_at >= start_date,
            UserLibrary.last_read_at <= end_date
        ).count()

        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "stats": {
                "total_reading_time": total_reading_time,
                "total_pages_read": total_pages_read,
                "books_completed": books_read,
                "reading_sessions": len(sessions),
                "average_session_duration": total_reading_time / len(sessions) if sessions else 0
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching reading statistics: {str(e)}"
        )
