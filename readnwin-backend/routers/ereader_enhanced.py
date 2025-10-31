from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
import tempfile
import os
import re
import mimetypes
from datetime import datetime, timezone
import html
import json
from core.path_validator import validate_path

from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
from models.book import Book
from models.user_library import UserLibrary
from models.reading_session import ReadingSession
from models.reader_settings import ReaderSettings, Bookmark
from models.reading import Note, Highlight
from services.reading_analytics import ReadingAnalyticsService

# Pydantic models
class ReaderSettingsRequest(BaseModel):
    font_size: Optional[float] = None
    font_family: Optional[str] = None
    theme: Optional[str] = None
    line_spacing: Optional[float] = None
    page_width: Optional[int] = None

class BookmarkRequest(BaseModel):
    book_id: int
    page_number: int
    title: str
    note_text: Optional[str] = ""

class NoteRequest(BaseModel):
    book_id: int
    page_number: int
    content: str
    note_type: Optional[str] = "annotation"

class ProgressRequest(BaseModel):
    book_id: int
    current_page: int
    total_pages: int
    progress_percentage: float
    reading_time_minutes: Optional[int] = 0

class SessionEndRequest(BaseModel):
    session_id: int
    pages_read: Optional[int] = 0

router = APIRouter(prefix="/ereader", tags=["ereader-enhanced"])

def sanitize_html_content(content: str) -> str:
    """Sanitize HTML content for safe rendering"""
    # Remove script tags and dangerous attributes
    content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<style[^>]*>.*?</style>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'on\w+="[^"]*"', '', content, flags=re.IGNORECASE)
    content = re.sub(r'javascript:', '', content, flags=re.IGNORECASE)
    return content

def extract_epub_structure(epub_path: str) -> Dict[str, Any]:
    """Extract EPUB structure and content while preserving formatting"""
    try:
        with zipfile.ZipFile(epub_path, 'r') as epub_zip:
            # Read the container.xml to find the OPF file
            container_xml = epub_zip.read('META-INF/container.xml')
            container_tree = ET.fromstring(container_xml)
            
            # Find the OPF file path
            rootfile = container_tree.find('.//{*}rootfile')
            if rootfile is None:
                return {"error": "Could not find OPF file in EPUB"}
            
            opf_path = rootfile.get('full-path')
            opf_content = epub_zip.read(opf_path)
            opf_tree = ET.fromstring(opf_content)
            
            # Extract metadata
            metadata = {}
            meta_elements = opf_tree.find('.//{*}metadata')
            if meta_elements is not None:
                title_elem = meta_elements.find('.//{*}title')
                if title_elem is not None:
                    metadata['title'] = title_elem.text
                
                creator_elem = meta_elements.find('.//{*}creator')
                if creator_elem is not None:
                    metadata['creator'] = creator_elem.text
            
            # Extract chapters with their original HTML content
            chapters = []
            
            # Find all HTML files in the spine
            spine = opf_tree.find('.//{*}spine')
            if spine is not None:
                for itemref in spine.findall('.//{*}itemref'):
                    idref = itemref.get('idref')
                    if idref:
                        # Find the corresponding item in manifest
                        manifest = opf_tree.find('.//{*}manifest')
                        if manifest is not None:
                            item = manifest.find(f'.//{{*}}item[@id="{idref}"]')
                            if item is not None:
                                href = item.get('href')
                                if href:
                                    # Resolve relative path
                                    if '/' in opf_path:
                                        base_path = '/'.join(opf_path.split('/')[:-1]) + '/'
                                    else:
                                        base_path = ''
                                    
                                    file_path = base_path + href
                                    
                                    try:
                                        html_content = epub_zip.read(file_path).decode('utf-8')
                                        # Extract chapter title from HTML content
                                        chapter_title = extract_chapter_title(html_content)
                                        # Clean HTML content
                                        cleaned_html = clean_epub_html(html_content)
                                        if cleaned_html:
                                            chapters.append({
                                                'id': idref,
                                                'href': href,
                                                'title': chapter_title,
                                                'content': cleaned_html
                                            })
                                    except Exception as e:
                                        print(f"Error reading file {file_path}: {e}")
                                        continue
            
            return {
                'metadata': metadata,
                'chapters': chapters,
                'total_chapters': len(chapters)
            }
            
    except Exception as e:
        return {"error": f"Error extracting EPUB content: {str(e)}"}

def clean_epub_html(html_content: str) -> str:
    """Clean EPUB HTML while preserving structure"""
    # Remove XML declarations and processing instructions
    html_content = re.sub(r'<\?xml[^>]*\?>', '', html_content)
    html_content = re.sub(r'<!DOCTYPE[^>]*>', '', html_content)
    
    # Remove script and style tags and their content
    html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove external CSS links
    html_content = re.sub(r'<link[^>]*rel=["\']stylesheet["\'][^>]*>', '', html_content)
    
    # Remove meta tags
    html_content = re.sub(r'<meta[^>]*>', '', html_content)
    
    # Remove head section
    html_content = re.sub(r'<head[^>]*>.*?</head>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    
    # Clean up body tag
    html_content = re.sub(r'<body[^>]*>', '<div class="epub-chapter">', html_content)
    html_content = re.sub(r'</body>', '</div>', html_content)
    
    # Remove html and body tags if they exist
    html_content = re.sub(r'<html[^>]*>', '', html_content)
    html_content = re.sub(r'</html>', '', html_content)
    
    # Handle image URLs - remove or replace with placeholder
    html_content = re.sub(r'<img[^>]*src=["\'][^"\']*\.(png|jpg|jpeg|gif|svg)["\'][^>]*>', '', html_content)
    
    # Normalize whitespace but preserve line breaks
    html_content = re.sub(r'\s+', ' ', html_content)
    html_content = re.sub(r'>\s+<', '><', html_content)
    
    return html_content.strip()

def extract_chapter_title(html_content: str) -> str:
    """Extract chapter title from HTML content"""
    try:
        # Look for heading tags
        heading_patterns = [
            r'<h1[^>]*>(.*?)</h1>',
            r'<h2[^>]*>(.*?)</h2>',
            r'<h3[^>]*>(.*?)</h3>',
            r'<h4[^>]*>(.*?)</h4>',
            r'<h5[^>]*>(.*?)</h5>',
            r'<h6[^>]*>(.*?)</h6>',
            r'<title[^>]*>(.*?)</title>'
        ]
        
        for pattern in heading_patterns:
            match = re.search(pattern, html_content, re.IGNORECASE | re.DOTALL)
            if match:
                title = match.group(1).strip()
                # Clean the title
                title = re.sub(r'<[^>]*>', '', title)  # Remove any remaining HTML tags
                title = re.sub(r'\s+', ' ', title)  # Normalize whitespace
                if title and len(title) > 0:
                    return title
        
        return "Chapter"
        
    except Exception as e:
        print(f"Error extracting chapter title: {e}")
        return "Chapter"

@router.get("/settings")
async def get_reader_settings(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get user's reader settings"""
    try:
        settings = db.query(ReaderSettings).filter(ReaderSettings.user_id == current_user.id).first()
        
        if not settings:
            # Create default settings
            settings = ReaderSettings(
                user_id=current_user.id,
                font_size=1.0,
                font_family="serif",
                theme="light",
                line_spacing=1.6,
                page_width=800
            )
            db.add(settings)
            db.commit()
            db.refresh(settings)
        
        return {
            "success": True,
            "data": {
                "font_size": settings.font_size,
                "font_family": settings.font_family,
                "theme": settings.theme,
                "line_spacing": settings.line_spacing,
                "page_width": settings.page_width
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get settings: {str(e)}")

@router.post("/settings")
async def update_reader_settings(
    request: ReaderSettingsRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update user's reader settings"""
    try:
        settings = db.query(ReaderSettings).filter(ReaderSettings.user_id == current_user.id).first()
        
        if not settings:
            settings = ReaderSettings(user_id=current_user.id)
            db.add(settings)
        
        # Update settings
        if request.font_size is not None:
            settings.font_size = request.font_size
        if request.font_family is not None:
            settings.font_family = request.font_family
        if request.theme is not None:
            settings.theme = request.theme
        if request.line_spacing is not None:
            settings.line_spacing = request.line_spacing
        if request.page_width is not None:
            settings.page_width = request.page_width
        
        db.commit()
        db.refresh(settings)
        
        return {
            "success": True,
            "message": "Settings updated successfully",
            "data": {
                "font_size": settings.font_size,
                "font_family": settings.font_family,
                "theme": settings.theme,
                "line_spacing": settings.line_spacing,
                "page_width": settings.page_width
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")

@router.post("/progress")
async def update_reading_progress(
    request: ProgressRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update reading progress for a book"""
    try:
        # Validate book exists and user has access
        book = db.query(Book).filter(Book.id == request.book_id).first()
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        library_entry = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == request.book_id
        ).first()
        
        if not library_entry:
            raise HTTPException(status_code=403, detail="Access denied to this book")
        
        # Update progress
        library_entry.current_page = request.current_page
        library_entry.total_pages = request.total_pages
        library_entry.progress = request.progress_percentage / 100
        library_entry.reading_time_minutes = request.reading_time_minutes
        library_entry.last_read_at = datetime.now(timezone.utc)
        
        # Update status based on progress
        if request.progress_percentage >= 100:
            library_entry.status = "completed"
        elif request.progress_percentage > 0:
            library_entry.status = "reading"
        
        db.commit()
        
        return {
            "success": True,
            "message": "Progress updated successfully",
            "data": {
                "current_page": library_entry.current_page,
                "total_pages": library_entry.total_pages,
                "progress_percentage": library_entry.progress * 100,
                "reading_time_minutes": library_entry.reading_time_minutes,
                "last_read_at": library_entry.last_read_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update progress: {str(e)}")

@router.get("/progress/{book_id}")
async def get_reading_progress(
    book_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get reading progress for a book"""
    try:
        library_entry = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == book_id
        ).first()
        
        if not library_entry:
            return {
                "success": True,
                "data": {
                    "current_page": 1,
                    "total_pages": 1,
                    "progress_percentage": 0,
                    "reading_time_minutes": 0,
                    "last_read_at": None
                }
            }
        
        return {
            "success": True,
            "data": {
                "current_page": library_entry.current_page or 1,
                "total_pages": library_entry.total_pages or 1,
                "progress_percentage": (library_entry.progress or 0) * 100,
                "reading_time_minutes": library_entry.reading_time_minutes or 0,
                "last_read_at": library_entry.last_read_at.isoformat() if library_entry.last_read_at else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get progress: {str(e)}")

@router.post("/bookmarks")
async def create_bookmark(
    request: BookmarkRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new bookmark"""
    try:
        # Validate book access
        library_entry = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == request.book_id
        ).first()
        
        if not library_entry:
            raise HTTPException(status_code=403, detail="Access denied to this book")
        
        # Create bookmark
        bookmark = Bookmark(
            user_id=current_user.id,
            book_id=request.book_id,
            page_number=request.page_number,
            title=request.title,
            note_text=request.note_text
        )
        
        db.add(bookmark)
        db.commit()
        db.refresh(bookmark)
        
        return {
            "success": True,
            "message": "Bookmark created successfully",
            "data": {
                "id": bookmark.id,
                "page_number": bookmark.page_number,
                "title": bookmark.title,
                "note_text": bookmark.note_text,
                "created_at": bookmark.created_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create bookmark: {str(e)}")

@router.get("/bookmarks/{book_id}")
async def get_bookmarks(
    book_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get bookmarks for a book"""
    try:
        # Validate book access
        library_entry = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == book_id
        ).first()
        
        if not library_entry:
            raise HTTPException(status_code=403, detail="Access denied to this book")
        
        bookmarks = db.query(Bookmark).filter(
            Bookmark.user_id == current_user.id,
            Bookmark.book_id == book_id
        ).order_by(Bookmark.page_number).all()
        
        return {
            "success": True,
            "bookmarks": [
                {
                    "id": bookmark.id,
                    "page_number": bookmark.page_number,
                    "title": bookmark.title,
                    "note_text": bookmark.note_text,
                    "created_at": bookmark.created_at.isoformat()
                }
                for bookmark in bookmarks
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get bookmarks: {str(e)}")

@router.post("/notes")
async def create_note(
    request: NoteRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new note"""
    try:
        # Validate book access
        library_entry = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == request.book_id
        ).first()
        
        if not library_entry:
            raise HTTPException(status_code=403, detail="Access denied to this book")
        
        # Create note
        note = Note(
            user_id=current_user.id,
            book_id=request.book_id,
            page_number=request.page_number,
            content=request.content,
            note_type=request.note_type
        )
        
        db.add(note)
        db.commit()
        db.refresh(note)
        
        return {
            "success": True,
            "message": "Note created successfully",
            "data": {
                "id": note.id,
                "page_number": note.page_number,
                "content": note.content,
                "note_type": note.note_type,
                "created_at": note.created_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create note: {str(e)}")

@router.get("/notes/{book_id}")
async def get_notes(
    book_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get notes for a book"""
    try:
        # Validate book access
        library_entry = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == book_id
        ).first()
        
        if not library_entry:
            raise HTTPException(status_code=403, detail="Access denied to this book")
        
        notes = db.query(Note).filter(
            Note.user_id == current_user.id,
            Note.book_id == book_id
        ).order_by(Note.page_number, Note.created_at.desc()).all()
        
        return {
            "success": True,
            "notes": [
                {
                    "id": note.id,
                    "page_number": note.page_number,
                    "content": note.content,
                    "note_type": note.note_type,
                    "is_private": note.is_private,
                    "created_at": note.created_at.isoformat()
                }
                for note in notes
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get notes: {str(e)}")

@router.delete("/notes/{note_id}")
async def delete_note(
    note_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete a note"""
    try:
        note = db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == current_user.id
        ).first()
        
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        
        db.delete(note)
        db.commit()
        
        return {
            "success": True,
            "message": "Note deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete note: {str(e)}")

@router.post("/session/end")
async def end_reading_session(
    request: SessionEndRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """End a reading session"""
    try:
        session = db.query(ReadingSession).filter(
            ReadingSession.id == request.session_id,
            ReadingSession.user_id == current_user.id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Reading session not found")
        
        # Update session with end data
        session.pages_read = request.pages_read
        session.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        
        return {
            "success": True,
            "message": "Reading session ended successfully",
            "data": {
                "session_id": session.id,
                "pages_read": session.pages_read,
                "duration": session.duration
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")

@router.get("/file/{book_id}")
async def get_book_content(
    book_id: int,
    format: Optional[str] = None,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get book file content with EPUB parsing support"""
    try:
        # Validate book access
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
        
        # Validate and get safe file path
        file_path_clean = book.file_path.replace('uploads/', '') if book.file_path.startswith('uploads/') else book.file_path
        safe_path = validate_path("./uploads/ebooks", file_path_clean)
        
        if not safe_path or not safe_path.exists():
            raise HTTPException(status_code=404, detail="Book file not found on server")
        
        file_path = str(safe_path)
        
        file_ext = os.path.splitext(file_path)[1].lower()
        
        # For EPUB files with text format request, extract structure
        if file_ext == '.epub' and format == 'text':
            epub_structure = extract_epub_structure(file_path)
            if 'error' in epub_structure:
                raise HTTPException(status_code=500, detail=epub_structure['error'])
            
            return {
                "success": True,
                "content": epub_structure
            }
        
        # For other formats or direct file access
        raise HTTPException(status_code=501, detail="Direct file serving not implemented in this endpoint")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get book content: {str(e)}")

@router.get("/analytics")
async def get_reading_analytics(
    days: int = 30,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get comprehensive reading analytics"""
    try:
        # Get reading statistics
        stats = ReadingAnalyticsService.get_user_reading_stats(db, current_user, days)
        
        # Get monthly activity for charts
        monthly_data = ReadingAnalyticsService.get_monthly_activity(db, current_user, 6)
        
        # Get book progress
        book_progress = ReadingAnalyticsService.get_book_progress(db, current_user)
        
        # Get reading goals
        goals = ReadingAnalyticsService.get_reading_goals(db, current_user)
        
        # Get reading streak
        streak = ReadingAnalyticsService.get_reading_streak(db, current_user)
        
        # Get recent activity
        recent_activity = ReadingAnalyticsService.get_recent_activity(db, current_user, 7)
        
        # Get personalized insights
        insights = ReadingAnalyticsService.get_reading_insights(db, current_user)
        
        return {
            "success": True,
            "data": {
                "stats": stats,
                "monthly_activity": monthly_data,
                "book_progress": {
                    "total_books": book_progress["total_books"],
                    "completed_books": book_progress["completed_books"],
                    "in_progress_books": book_progress["in_progress_books"]
                },
                "goals": goals,
                "reading_streak": streak,
                "recent_activity": [
                    {
                        "id": session.id,
                        "book_id": session.book_id,
                        "duration": session.duration,
                        "pages_read": session.pages_read,
                        "created_at": session.created_at.isoformat()
                    }
                    for session in recent_activity
                ],
                "insights": insights
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")

@router.post("/goals")
async def create_reading_goal(
    goal_type: str,
    target_value: int,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new reading goal"""
    try:
        end_date_obj = None
        if end_date:
            end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        goal = ReadingAnalyticsService.create_reading_goal(
            db, current_user, goal_type, target_value, end_date_obj
        )
        
        return {
            "success": True,
            "message": "Reading goal created successfully",
            "data": {
                "id": goal.id,
                "goal_type": goal.goal_type,
                "target_value": goal.target_value,
                "current_value": goal.current_value
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create goal: {str(e)}")