from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime, timezone
import bleach
from core.path_validator import validate_path

from core.database import get_db
from core.security import get_current_user_from_token
from core.storage import storage
from models.user import User
from models.book import Book
from models.user_library import UserLibrary
from models.reading_session import ReadingSession

class ProgressUpdateRequest(BaseModel):
    progress: float
    currentPosition: Optional[int] = 0
    scrollPosition: Optional[int] = 0
    last_read_location: Optional[str] = None

class HighlightCreate(BaseModel):
    book_id: int
    text: str
    color: str
    start_offset: int
    end_offset: int
    context: Optional[str] = None

class NoteCreate(BaseModel):
    book_id: int
    content: str
    highlight_id: Optional[int] = None
    position: Optional[int] = None

router = APIRouter(prefix="/ereader", tags=["ereader"])

def sanitize_html_content(content: str) -> str:
    """Sanitize HTML content for safe rendering"""
    allowed_tags = [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'div', 'span', 'a', 'img', 'table', 'tr', 'td', 
        'th', 'thead', 'tbody', 'section', 'article', 'mark', 'pre', 'code'
    ]
    allowed_attrs = {
        'a': ['href', 'title', 'id'],
        'img': ['src', 'alt', 'title'],
        'div': ['class', 'id'],
        'span': ['class', 'id', 'data-*'],
        'p': ['class', 'id'],
        'mark': ['class', 'data-*']
    }
    
    return bleach.clean(content, tags=allowed_tags, attributes=allowed_attrs, strip=True)

@router.get("/{book_id}/content")
async def get_html_content(
    book_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get HTML ebook content"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    library_entry = db.query(UserLibrary).filter(
        UserLibrary.user_id == current_user.id,
        UserLibrary.book_id == book_id
    ).first()
    
    if not library_entry:
        raise HTTPException(status_code=403, detail="Access denied to this book")
    
    if not book.file_path:
        raise HTTPException(status_code=404, detail="Book file not found")
    
    # Get file path using storage manager
    file_path = storage.get_absolute_path(book.file_path)
    
    if not file_path:
        raise HTTPException(status_code=404, detail="Book file path not found")
    
    # Validate local file path
    safe_path = Path(file_path)
    if not safe_path.exists():
        raise HTTPException(status_code=404, detail="Book file not accessible")
    
    try:
        html_content = safe_path.read_text(encoding='utf-8')
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read book file")
    
    sanitized_content = sanitize_html_content(html_content)
    
    return {
        "success": True,
        "book_id": book.id,
        "title": book.title,
        "author": book.author,
        "content": sanitized_content,
        "progress": library_entry.progress or 0
    }

@router.post("/{book_id}/progress")
async def update_reading_progress(
    book_id: int,
    request: ProgressUpdateRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update reading progress"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    library_entry = db.query(UserLibrary).filter(
        UserLibrary.user_id == current_user.id,
        UserLibrary.book_id == book_id
    ).first()
    
    if not library_entry:
        library_entry = UserLibrary(
            user_id=current_user.id,
            book_id=book_id,
            status="reading",
            progress=request.progress / 100,
            last_read_location=request.last_read_location
        )
        db.add(library_entry)
    else:
        library_entry.progress = request.progress / 100
        library_entry.last_read_at = datetime.now(timezone.utc)
        if request.last_read_location:
            library_entry.last_read_location = request.last_read_location
        # Mark as completed at 98% (accounts for end pages like "About the Author")
        if request.progress >= 98:
            library_entry.status = "completed"
        elif request.progress > 0:
            library_entry.status = "reading"
    
    session = db.query(ReadingSession).filter(
        ReadingSession.user_id == current_user.id,
        ReadingSession.book_id == book_id
    ).order_by(ReadingSession.created_at.desc()).first()
    
    if not session:
        session = ReadingSession(
            user_id=current_user.id,
            book_id=book_id,
            progress=request.progress / 100,
            pages_read=int(request.progress),
            duration=0
        )
        db.add(session)
    else:
        session.progress = request.progress / 100
        session.pages_read = int(request.progress)
    
    db.commit()
    
    return {
        "success": True,
        "progress": request.progress,
        "status": library_entry.status,
        "last_read_location": library_entry.last_read_location
    }

@router.get("/{book_id}/highlights")
async def get_highlights(
    book_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all highlights for a book"""
    from models.reading import Highlight
    
    highlights = db.query(Highlight).filter(
        Highlight.user_id == current_user.id,
        Highlight.book_id == book_id
    ).order_by(Highlight.created_at.desc()).all()
    
    return {
        "highlights": [
            {
                "id": h.id,
                "text": h.text,
                "color": h.color,
                "start_offset": h.start_offset,
                "end_offset": h.end_offset,
                "context": h.context,
                "created_at": h.created_at.isoformat()
            }
            for h in highlights
        ]
    }

@router.post("/{book_id}/highlights")
async def create_highlight(
    book_id: int,
    highlight: HighlightCreate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new highlight"""
    from models.reading import Highlight
    
    new_highlight = Highlight(
        user_id=current_user.id,
        book_id=book_id,
        text=highlight.text,
        color=highlight.color,
        start_offset=highlight.start_offset,
        end_offset=highlight.end_offset,
        context=highlight.context
    )
    db.add(new_highlight)
    db.commit()
    db.refresh(new_highlight)
    
    return {
        "success": True,
        "highlight": {
            "id": new_highlight.id,
            "text": new_highlight.text,
            "color": new_highlight.color,
            "created_at": new_highlight.created_at.isoformat()
        }
    }

@router.delete("/{book_id}/highlights/{highlight_id}")
async def delete_highlight(
    book_id: int,
    highlight_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete a highlight"""
    from models.reading import Highlight
    
    highlight = db.query(Highlight).filter(
        Highlight.id == highlight_id,
        Highlight.user_id == current_user.id,
        Highlight.book_id == book_id
    ).first()
    
    if not highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")
    
    db.delete(highlight)
    db.commit()
    
    return {"success": True}

@router.get("/{book_id}/notes")
async def get_notes(
    book_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all notes for a book"""
    from models.reading import Note
    
    notes = db.query(Note).filter(
        Note.user_id == current_user.id,
        Note.book_id == book_id
    ).order_by(Note.created_at.desc()).all()
    
    return {
        "notes": [
            {
                "id": n.id,
                "content": n.content,
                "highlight_id": n.highlight_id,
                "position": n.position,
                "created_at": n.created_at.isoformat(),
                "updated_at": n.updated_at.isoformat() if n.updated_at else None
            }
            for n in notes
        ]
    }

@router.post("/{book_id}/notes")
async def create_note(
    book_id: int,
    note: NoteCreate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new note"""
    from models.reading import Note
    
    new_note = Note(
        user_id=current_user.id,
        book_id=book_id,
        content=note.content,
        highlight_id=note.highlight_id,
        position=note.position
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    
    return {
        "success": True,
        "note": {
            "id": new_note.id,
            "content": new_note.content,
            "created_at": new_note.created_at.isoformat()
        }
    }

@router.put("/{book_id}/notes/{note_id}")
async def update_note(
    book_id: int,
    note_id: int,
    content: str,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update a note"""
    from models.reading import Note
    
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id,
        Note.book_id == book_id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    note.content = content
    note.updated_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"success": True}

@router.delete("/{book_id}/notes/{note_id}")
async def delete_note(
    book_id: int,
    note_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete a note"""
    from models.reading import Note
    
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == current_user.id,
        Note.book_id == book_id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
    
    return {"success": True}

@router.get("/book/{book_id}/file")
async def get_book_file(
    book_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Serve EPUB file for reading"""
    # Check if user has access to this book
    library_entry = db.query(UserLibrary).filter(
        UserLibrary.user_id == current_user.id,
        UserLibrary.book_id == book_id
    ).first()
    
    if not library_entry:
        raise HTTPException(status_code=403, detail="Access denied to this book")
    
    # Get book
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if not book.file_path:
        raise HTTPException(status_code=404, detail="Book file not found")
    
    # Check if file is EPUB format
    if not book.file_path.lower().endswith('.epub'):
        raise HTTPException(status_code=400, detail="Only EPUB format books can be read in the e-reader")
    
    # Get file path using storage manager
    file_path = storage.get_absolute_path(book.file_path)
    
    if not file_path:
        raise HTTPException(status_code=404, detail="Book file path not found")
    
    # Validate local file path
    safe_path = Path(file_path)
    if not safe_path.exists():
        raise HTTPException(status_code=404, detail="Book file not accessible")
    
    # Serve the file
    return FileResponse(
        path=str(safe_path),
        media_type='application/epub+zip',
        filename=f"{book.title}.epub"
    )
