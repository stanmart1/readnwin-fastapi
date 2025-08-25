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

from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
from models.book import Book
from models.user_library import UserLibrary
from models.reading_session import ReadingSession

class EPUBContentRequest(BaseModel):
    fileUrl: str

class ProgressUpdateRequest(BaseModel):
    currentChapter: int
    totalChapters: int
    progress: float
    currentPosition: Optional[int] = 0
    wordsRead: Optional[int] = 0

router = APIRouter(prefix="/books", tags=["ereader"])

def sanitize_html_content(content: str) -> str:
    """Sanitize HTML content for safe rendering"""
    # Allow basic HTML tags for e-reader content
    allowed_tags = [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'div', 'span', 'a', 'img', 'table', 'tr', 'td', 'th'
    ]
    allowed_attributes = {
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'title', 'width', 'height'],
        'div': ['class', 'id'],
        'span': ['class', 'id']
    }
    
    # Basic sanitization - remove script tags and dangerous attributes
    content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'<style[^>]*>.*?</style>', '', content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r'on\w+="[^"]*"', '', content, flags=re.IGNORECASE)
    content = re.sub(r'javascript:', '', content, flags=re.IGNORECASE)
    
    return content

def convert_txt_to_html(file_path: str) -> Dict[str, Any]:
    """Convert TXT file to HTML format"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split into chapters based on common patterns
        chapters = []
        lines = content.split('\n')
        current_chapter = []
        chapter_count = 0
        
        for line in lines:
            line = line.strip()
            # Detect chapter breaks
            if (line.upper().startswith('CHAPTER') or 
                line.upper().startswith('PART') or 
                (len(line) < 50 and line.isupper() and len(line) > 5)):
                
                if current_chapter:
                    chapters.append({
                        'id': f'chapter_{chapter_count}',
                        'title': f'Chapter {chapter_count + 1}',
                        'content': '<p>' + '</p><p>'.join(current_chapter) + '</p>'
                    })
                    chapter_count += 1
                    current_chapter = []
                
                current_chapter.append(f'<h1>{line}</h1>')
            elif line:
                current_chapter.append(line)
        
        # Add final chapter
        if current_chapter:
            chapters.append({
                'id': f'chapter_{chapter_count}',
                'title': f'Chapter {chapter_count + 1}',
                'content': '<p>' + '</p><p>'.join(current_chapter) + '</p>'
            })
        
        return {
            'title': os.path.basename(file_path).replace('.txt', ''),
            'author': 'Unknown Author',
            'chapters': chapters,
            'currentChapter': 0,
            'totalChapters': len(chapters)
        }
    except Exception as e:
        raise ValueError(f"Failed to parse TXT: {str(e)}")

def convert_pdf_to_html(file_path: str) -> Dict[str, Any]:
    """Convert PDF to HTML format"""
    try:
        import PyPDF2
        
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            content = ""
            
            for page in reader.pages:
                content += page.extract_text() + "\n\n"
        
        # Split into chapters (every 10 pages or by content breaks)
        pages_per_chapter = 10
        total_pages = len(reader.pages)
        chapters = []
        
        for i in range(0, total_pages, pages_per_chapter):
            start_page = i
            end_page = min(i + pages_per_chapter, total_pages)
            
            chapter_content = ""
            for page_num in range(start_page, end_page):
                chapter_content += reader.pages[page_num].extract_text() + "\n\n"
            
            chapters.append({
                'id': f'chapter_{len(chapters)}',
                'title': f'Pages {start_page + 1}-{end_page}',
                'content': f'<p>{chapter_content.replace(chr(10), "</p><p>")}</p>'
            })
        
        return {
            'title': os.path.basename(file_path).replace('.pdf', ''),
            'author': 'Unknown Author',
            'chapters': chapters,
            'currentChapter': 0,
            'totalChapters': len(chapters)
        }
    except ImportError:
        raise ValueError("PyPDF2 not installed. Cannot process PDF files.")
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {str(e)}")

def parse_epub_content(file_path: str) -> Dict[str, Any]:
    """Parse EPUB file and extract content"""
    try:
        with zipfile.ZipFile(file_path, 'r') as epub_zip:
            # Find OPF file
            container_path = 'META-INF/container.xml'
            if container_path not in epub_zip.namelist():
                raise ValueError("Invalid EPUB: container.xml not found")
            
            container_content = epub_zip.read(container_path)
            container_root = ET.fromstring(container_content)
            
            # Get OPF file path
            opf_path = None
            for rootfile in container_root.findall('.//{urn:oasis:names:tc:opendocument:xmlns:container}rootfile'):
                if rootfile.get('media-type') == 'application/oebps-package+xml':
                    opf_path = rootfile.get('full-path')
                    break
            
            if not opf_path:
                raise ValueError("OPF file not found")
            
            # Parse OPF file
            opf_content = epub_zip.read(opf_path)
            opf_root = ET.fromstring(opf_content)
            
            # Extract metadata
            metadata = {}
            ns = {'dc': 'http://purl.org/dc/elements/1.1/', 'opf': 'http://www.idpf.org/2007/opf'}
            
            title_elem = opf_root.find('.//dc:title', ns)
            metadata['title'] = title_elem.text if title_elem is not None else "Unknown Title"
            
            creator_elem = opf_root.find('.//dc:creator', ns)
            metadata['author'] = creator_elem.text if creator_elem is not None else "Unknown Author"
            
            # Get spine order
            spine = opf_root.find('.//opf:spine', ns)
            if spine is None:
                raise ValueError("Spine not found in OPF")
            
            # Get manifest items
            manifest_items = {}
            manifest = opf_root.find('.//opf:manifest', ns)
            if manifest is not None:
                for item in manifest.findall('.//opf:item', ns):
                    item_id = item.get('id')
                    href = item.get('href')
                    if item_id and href:
                        manifest_items[item_id] = href
            
            # Extract chapters in spine order
            chapters = []
            opf_dir = os.path.dirname(opf_path)
            
            for itemref in spine.findall('.//opf:itemref', ns):
                idref = itemref.get('idref')
                if idref in manifest_items:
                    chapter_path = os.path.join(opf_dir, manifest_items[idref]).replace('\\', '/')
                    
                    if chapter_path in epub_zip.namelist():
                        try:
                            chapter_content = epub_zip.read(chapter_path).decode('utf-8')
                            
                            # Parse HTML content
                            chapter_root = ET.fromstring(f"<root>{chapter_content}</root>")
                            
                            # Extract title from h1, h2, or title tag
                            chapter_title = f"Chapter {len(chapters) + 1}"
                            for tag in ['h1', 'h2', 'title']:
                                title_elem = chapter_root.find(f'.//{tag}')
                                if title_elem is not None and title_elem.text:
                                    chapter_title = title_elem.text.strip()
                                    break
                            
                            # Clean up HTML content
                            clean_content = re.sub(r'<[^>]+>', '', chapter_content)
                            clean_content = re.sub(r'\s+', ' ', clean_content).strip()
                            
                            if clean_content:  # Only add non-empty chapters
                                # Sanitize HTML content
                                sanitized_content = sanitize_html_content(chapter_content)
                                chapters.append({
                                    'id': f"chapter_{len(chapters)}",
                                    'title': chapter_title,
                                    'content': sanitized_content,
                                    'rawContent': chapter_content  # Keep original for processing
                                })
                        except Exception as e:
                            print(f"Error processing chapter {chapter_path}: {e}")
                            continue
            
            return {
                'title': metadata['title'],
                'author': metadata['author'],
                'chapters': chapters,
                'currentChapter': 0,
                'totalChapters': len(chapters),
                'format': 'epub'
            }
            
    except Exception as e:
        raise ValueError(f"Failed to parse EPUB: {str(e)}")

def convert_book_to_html(file_path: str) -> Dict[str, Any]:
    """Universal book converter that detects format and converts to HTML"""
    if not os.path.exists(file_path):
        raise ValueError(f"File not found: {file_path}")
    
    # Detect file format
    file_ext = os.path.splitext(file_path)[1].lower()
    mime_type, _ = mimetypes.guess_type(file_path)
    
    print(f"Converting book: {file_path}, extension: {file_ext}, mime: {mime_type}")
    
    try:
        if file_ext == '.epub' or mime_type == 'application/epub+zip':
            return parse_epub_content(file_path)
        elif file_ext == '.txt' or mime_type == 'text/plain':
            return convert_txt_to_html(file_path)
        elif file_ext == '.pdf' or mime_type == 'application/pdf':
            return convert_pdf_to_html(file_path)
        else:
            # Try to read as text file
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                return {
                    'title': os.path.basename(file_path),
                    'author': 'Unknown Author',
                    'chapters': [{
                        'id': 'chapter_0',
                        'title': 'Full Content',
                        'content': f'<p>{content.replace(chr(10), "</p><p>")}</p>'
                    }],
                    'currentChapter': 0,
                    'totalChapters': 1,
                    'format': 'text'
                }
            except:
                raise ValueError(f"Unsupported file format: {file_ext}")
    
    except Exception as e:
        raise ValueError(f"Failed to convert book: {str(e)}")

@router.post("/{book_id}/epub-content")
async def get_epub_content(
    book_id: str,
    request: EPUBContentRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Parse and return EPUB content"""
    try:
        # Get current backend directory
        backend_dir = os.getcwd()
        
        # Validate book access
        book = db.query(Book).filter(Book.id == int(book_id)).first()
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        # Check if user has access to this book
        library_entry = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == int(book_id)
        ).first()
        
        if not library_entry:
            raise HTTPException(status_code=403, detail="Access denied to this book")
        
        # Try to convert actual book file to HTML
        book_content = None
        
        if book.file_path:
            # Handle different file path formats
            file_path = book.file_path
            
            # Use current working directory as backend directory
            backend_dir = os.getcwd()
            
            # Clean file path and try different combinations
            clean_path = file_path.replace('uploads/', '') if file_path.startswith('uploads/') else file_path
            
            possible_paths = [
                os.path.join(backend_dir, 'uploads', 'ebooks', clean_path),
                os.path.join(backend_dir, 'uploads', clean_path),
                os.path.join(backend_dir, file_path),
                file_path if os.path.isabs(file_path) else None
            ]
            
            # Filter out None values
            possible_paths = [p for p in possible_paths if p]
            
            for path in possible_paths:
                print(f"Trying path: {path}")
                if os.path.exists(path):
                    try:
                        book_content = convert_book_to_html(path)
                        print(f"Successfully converted book from {path}: {len(book_content.get('chapters', []))} chapters")
                        break
                    except Exception as e:
                        print(f"Failed to convert book file at {path}: {e}")
                        continue
            
            if not book_content:
                print(f"Book file not found at any of these paths: {possible_paths}")
                uploads_dir = '/Users/bibleway/Documents/readnwin-next/readnwin-backend/uploads'
                if os.path.exists(uploads_dir):
                    print(f"Files in uploads: {os.listdir(uploads_dir)}")
                    ebooks_dir = os.path.join(uploads_dir, 'ebooks')
                    if os.path.exists(ebooks_dir):
                        print(f"Files in ebooks: {os.listdir(ebooks_dir)}")
        
        # Ensure we have valid book content
        if not book_content or not book_content.get('chapters'):
            # Check if file exists at all
            file_missing = True
            if book.file_path:
                for path in possible_paths:
                    if os.path.exists(path):
                        file_missing = False
                        break
            
            if file_missing:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Book file not found. The ebook file may need to be re-uploaded. Expected path: {book.file_path}"
                )
            else:
                raise HTTPException(
                    status_code=422, 
                    detail=f"Book file exists but contains no readable content. File may be corrupted: {book.file_path}"
                )
        
        return {
            "success": True,
            "content": book_content
        }
        
    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to process EPUB content: {str(e)}"
        }

@router.post("/{book_id}/progress")
async def update_reading_progress(
    book_id: str,
    request: ProgressUpdateRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update reading progress for a book"""
    try:
        book_id_int = int(book_id)
        
        # Validate book exists
        book = db.query(Book).filter(Book.id == book_id_int).first()
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        # Update or create library entry
        library_entry = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == book_id_int
        ).first()
        
        if not library_entry:
            library_entry = UserLibrary(
                user_id=current_user.id,
                book_id=book_id_int,
                status="reading",
                progress=request.progress / 100
            )
            db.add(library_entry)
        else:
            library_entry.progress = request.progress / 100
            library_entry.last_read_at = datetime.now(timezone.utc)
            if request.progress >= 100:
                library_entry.status = "completed"
            elif request.progress > 0:
                library_entry.status = "reading"
        
        # Create or update reading session
        session = db.query(ReadingSession).filter(
            ReadingSession.user_id == current_user.id,
            ReadingSession.book_id == book_id_int
        ).order_by(ReadingSession.created_at.desc()).first()
        
        if not session:
            session = ReadingSession(
                user_id=current_user.id,
                book_id=book_id_int,
                progress=request.progress / 100,
                pages_read=request.currentChapter + 1,
                duration=0
            )
            db.add(session)
        else:
            session.progress = request.progress / 100
            session.pages_read = request.currentChapter + 1
            session.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        
        return {
            "success": True,
            "progress": request.progress,
            "currentChapter": request.currentChapter
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update progress: {str(e)}"
        )

@router.get("/{book_id}/progress")
async def get_reading_progress(
    book_id: str,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get reading progress for a book"""
    try:
        book_id_int = int(book_id)
        
        # Get library entry
        library_entry = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == book_id_int
        ).first()
        
        if not library_entry:
            return {
                "currentPage": 0,
                "totalPages": 100,
                "progress": 0.0,
                "lastReadAt": None
            }
        
        # Get latest reading session
        session = db.query(ReadingSession).filter(
            ReadingSession.user_id == current_user.id,
            ReadingSession.book_id == book_id_int
        ).order_by(ReadingSession.created_at.desc()).first()
        
        return {
            "currentPage": session.pages_read if session else 0,
            "totalPages": 100,
            "progress": (library_entry.progress or 0) * 100,
            "lastReadAt": library_entry.last_read_at.isoformat() if library_entry.last_read_at else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get progress: {str(e)}"
        )

@router.get("/{book_id}/annotations")
async def get_book_annotations(
    book_id: str,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get annotations (highlights, notes, bookmarks) for a book"""
    try:
        return {
            "highlights": [],
            "notes": [],
            "bookmarks": [],
            "success": True
        }
    except Exception as e:
        return {
            "highlights": [],
            "notes": [],
            "bookmarks": [],
            "success": False,
            "error": str(e)
        }

class AnnotationRequest(BaseModel):
    type: str  # highlight, note, bookmark
    content: str
    position: int
    selectedText: Optional[str] = None
    color: Optional[str] = "yellow"
    chapter: Optional[int] = None
    startOffset: Optional[int] = None
    endOffset: Optional[int] = None
    xpath: Optional[str] = None

class HighlightRequest(BaseModel):
    selectedText: str
    startOffset: int
    endOffset: int
    color: str = "yellow"
    chapter: int
    xpath: Optional[str] = None

class NoteRequest(BaseModel):
    content: str
    position: int
    selectedText: Optional[str] = None
    chapter: int
    category: Optional[str] = None
    xpath: Optional[str] = None

class ReadingSessionRequest(BaseModel):
    startTime: datetime
    endTime: Optional[datetime] = None
    wordsRead: int = 0
    pagesRead: int = 0

@router.post("/{book_id}/highlights")
async def create_highlight(
    book_id: str,
    highlight: HighlightRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new highlight"""
    try:
        book_id_int = int(book_id)
        
        library_entry = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == book_id_int
        ).first()
        
        if not library_entry:
            raise HTTPException(status_code=403, detail="Access denied to this book")
        
        highlight_id = f"highlight_{int(datetime.utcnow().timestamp())}"
        
        return {
            "success": True,
            "highlight_id": highlight_id,
            "selectedText": highlight.selectedText,
            "color": highlight.color,
            "chapter": highlight.chapter,
            "created_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create highlight: {str(e)}")

@router.post("/{book_id}/notes")
async def create_note(
    book_id: str,
    note: NoteRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new note"""
    try:
        book_id_int = int(book_id)
        
        library_entry = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == book_id_int
        ).first()
        
        if not library_entry:
            raise HTTPException(status_code=403, detail="Access denied to this book")
        
        note_id = f"note_{int(datetime.utcnow().timestamp())}"
        
        return {
            "success": True,
            "note_id": note_id,
            "content": note.content,
            "chapter": note.chapter,
            "category": note.category,
            "created_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create note: {str(e)}")

@router.post("/{book_id}/annotations")
async def create_annotation(
    book_id: str,
    annotation: AnnotationRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new annotation"""
    try:
        book_id_int = int(book_id)
        
        # Validate book access
        library_entry = db.query(UserLibrary).filter(
            UserLibrary.user_id == current_user.id,
            UserLibrary.book_id == book_id_int
        ).first()
        
        if not library_entry:
            raise HTTPException(status_code=403, detail="Access denied to this book")
        
        return {
            "success": True,
            "annotation_id": f"annotation_{int(datetime.utcnow().timestamp())}",
            "type": annotation.type,
            "content": annotation.content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create annotation: {str(e)}")

@router.delete("/{book_id}/annotations/{annotation_id}")
async def delete_annotation(
    book_id: str,
    annotation_id: str,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete an annotation"""
    return {"success": True}

@router.post("/{book_id}/reading-session")
async def create_reading_session(
    book_id: str,
    session: ReadingSessionRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create or update reading session"""
    try:
        book_id_int = int(book_id)
        
        # Create reading session
        reading_session = ReadingSession(
            user_id=current_user.id,
            book_id=book_id_int,
            duration=0,
            pages_read=session.pagesRead,
            words_read=session.wordsRead
        )
        
        db.add(reading_session)
        db.commit()
        
        return {
            "success": True,
            "session_id": reading_session.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")

@router.get("/{book_id}/debug")
async def debug_book_file(
    book_id: str,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Debug book file path and existence"""
    try:
        book = db.query(Book).filter(Book.id == int(book_id)).first()
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        file_info = {
            "book_id": book.id,
            "title": book.title,
            "file_path": book.file_path,
            "file_exists": False,
            "checked_paths": []
        }
        
        if book.file_path:
            possible_paths = [
                book.file_path,
                os.path.join('uploads', book.file_path),
                os.path.join('readnwin-backend', 'uploads', book.file_path),
                os.path.join('/Users/bibleway/Documents/readnwin-next/readnwin-backend/uploads', book.file_path.replace('uploads/', ''))
            ]
            
            for path in possible_paths:
                exists = os.path.exists(path)
                file_info["checked_paths"].append({"path": path, "exists": exists})
                if exists:
                    file_info["file_exists"] = True
                    file_info["working_path"] = path
        
        return file_info
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Debug failed: {str(e)}")

@router.get("/{book_id}/analytics")
async def get_reading_analytics(
    book_id: str,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get reading analytics for a book"""
    try:
        book_id_int = int(book_id)
        
        sessions = db.query(ReadingSession).filter(
            ReadingSession.user_id == current_user.id,
            ReadingSession.book_id == book_id_int
        ).all()
        
        if not sessions:
            return {
                "totalReadingTime": 0,
                "averageSessionTime": 0,
                "totalSessions": 0,
                "readingStreak": 0,
                "pagesRead": 0,
                "progress": 0
            }
        
        total_time = sum(s.duration or 0 for s in sessions)
        total_pages = sum(s.pages_read or 0 for s in sessions)
        avg_session = total_time / len(sessions) if sessions else 0
        
        # Calculate reading streak
        session_dates = sorted(set(s.created_at.date() for s in sessions), reverse=True)
        streak = 0
        if session_dates:
            current_date = datetime.utcnow().date()
            for i, date in enumerate(session_dates):
                if i == 0 and (current_date - date).days <= 1:
                    streak = 1
                elif i > 0 and (session_dates[i-1] - date).days == 1:
                    streak += 1
                else:
                    break
        
        return {
            "totalReadingTime": total_time,
            "averageSessionTime": avg_session,
            "totalSessions": len(sessions),
            "readingStreak": streak,
            "pagesRead": total_pages,
            "progress": sessions[-1].progress * 100 if sessions else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")

@router.get("/{book_id}/reading-sessions")
async def get_reading_sessions(
    book_id: str,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get reading sessions for a book"""
    try:
        book_id_int = int(book_id)
        
        sessions = db.query(ReadingSession).filter(
            ReadingSession.user_id == current_user.id,
            ReadingSession.book_id == book_id_int
        ).order_by(ReadingSession.created_at.desc()).limit(10).all()
        
        return {
            "sessions": [
                {
                    "id": session.id,
                    "duration": session.duration,
                    "pages_read": session.pages_read,
                    "words_read": session.words_read,
                    "created_at": session.created_at.isoformat()
                }
                for session in sessions
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sessions: {str(e)}")