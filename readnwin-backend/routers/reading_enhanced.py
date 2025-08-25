from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
from models.reading_session import ReadingSession
from models.book import Book

router = APIRouter(prefix="/reading", tags=["reading"])

@router.get("/sessions")
async def get_reading_sessions(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get all reading sessions for the current user"""
    sessions = db.query(ReadingSession).filter(
        ReadingSession.user_id == current_user.id
    ).all()
    
    return [
        {
            "id": session.id,
            "bookId": session.book_id,
            "progress": session.progress,
            "lastRead": session.last_read.isoformat() if session.last_read else None,
            "completed": session.completed,
            "totalMinutes": session.duration_minutes
        }
        for session in sessions
    ]

@router.post("/sessions/{book_id}")
async def create_reading_session(
    book_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Create a new reading session for a book"""
    # Check if book exists
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    # Check if session already exists
    existing_session = db.query(ReadingSession).filter(
        ReadingSession.user_id == current_user.id,
        ReadingSession.book_id == book_id,
        ReadingSession.completed == False
    ).first()
    
    if existing_session:
        return {
            "id": existing_session.id,
            "bookId": existing_session.book_id,
            "progress": existing_session.progress,
            "lastRead": existing_session.last_read.isoformat() if existing_session.last_read else None
        }
    
    # Create new session
    new_session = ReadingSession(
        user_id=current_user.id,
        book_id=book_id,
        progress=0,
        started_at=datetime.utcnow()
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    return {
        "id": new_session.id,
        "bookId": new_session.book_id,
        "progress": new_session.progress,
        "lastRead": new_session.last_read.isoformat() if new_session.last_read else None
    }

@router.put("/sessions/{session_id}/progress")
async def update_reading_progress(
    session_id: int,
    progress: float,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Update reading progress for a session"""
    session = db.query(ReadingSession).filter(
        ReadingSession.id == session_id,
        ReadingSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reading session not found"
        )
    
    # Calculate time spent
    now = datetime.utcnow()
    if session.last_read:
        minutes_diff = (now - session.last_read).total_seconds() / 60
        if minutes_diff > 0:
            session.duration_minutes = (session.duration_minutes or 0) + minutes_diff
    
    session.progress = progress
    session.last_read = now
    
    # Check if completed
    if progress >= 100:
        session.completed = True
        session.completed_at = now
    
    db.commit()
    db.refresh(session)
    
    return {
        "id": session.id,
        "bookId": session.book_id,
        "progress": session.progress,
        "lastRead": session.last_read.isoformat(),
        "completed": session.completed,
        "totalMinutes": session.duration_minutes
    }

@router.get("/text-to-speech/{book_id}")
async def convert_text_to_speech(
    book_id: int,
    page: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Convert book text to speech audio"""
    # Here you would integrate with a text-to-speech service
    # For now, we'll return a placeholder
    return {
        "audioUrl": f"/api/audio/book/{book_id}/page/{page}.mp3",
        "duration": 300,  # 5 minutes in seconds
        "format": "mp3"
    }
