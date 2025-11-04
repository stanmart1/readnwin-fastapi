from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from pydantic import BaseModel
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.user_library import UserLibrary
from models.user import User
from models.book import Book

router = APIRouter(prefix="/admin", tags=["admin-library"])

class AssignBookRequest(BaseModel):
    user_id: int
    book_id: int
    format: str

@router.post("/user-library")
def assign_book_to_user(
    request: AssignBookRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """Assign a book to a user's library"""
    check_admin_access(current_user)
    
    # Check if user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if book exists
    book = db.query(Book).filter(Book.id == request.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Check if already assigned
    existing = db.query(UserLibrary).filter(
        UserLibrary.user_id == request.user_id,
        UserLibrary.book_id == request.book_id,
        UserLibrary.format == request.format
    ).first()
    
    if existing:
        return {"success": True, "message": "Book already in user's library", "assignment_id": existing.id}
    
    # Create new assignment
    assignment = UserLibrary(
        user_id=request.user_id,
        book_id=request.book_id,
        format=request.format,
        progress=0
    )
    
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    return {
        "success": True,
        "message": "Book assigned successfully",
        "assignment_id": assignment.id
    }

@router.get("/library-assignments")
def get_library_assignments(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """Get all user library assignments with filters"""
    try:
        check_admin_access(current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Admin access check failed: {str(e)}")
    
    try:
        query = db.query(UserLibrary).join(User).join(Book).options(
            joinedload(UserLibrary.user),
            joinedload(UserLibrary.book)
        )
        
        # Apply filters
        if user_id:
            query = query.filter(UserLibrary.user_id == user_id)
        
        if status:
            query = query.filter(UserLibrary.status == status)
        
        if search:
            query = query.filter(
                (User.first_name.ilike(f"%{search}%")) |
                (User.last_name.ilike(f"%{search}%")) |
                (User.email.ilike(f"%{search}%")) |
                (Book.title.ilike(f"%{search}%"))
            )
        
        # Get total count
        total = query.count()
        
        # Get paginated results
        assignments = query.offset(skip).limit(limit).all()
        
        # Format response
        result = []
        for assignment in assignments:
            try:
                result.append({
                    "id": assignment.id,
                    "user_id": assignment.user_id,
                    "user_name": f"{assignment.user.first_name or ''} {assignment.user.last_name or ''}".strip(),
                    "user_email": assignment.user.email if assignment.user else "N/A",
                    "book_id": assignment.book_id,
                    "book_title": assignment.book.title if assignment.book else "Unknown",
                    "book_author": assignment.book.author_name if assignment.book else "Unknown",
                    "format": assignment.format or "ebook",
                    "progress": assignment.progress or 0,
                    "status": assignment.status or "unread",
                    "assigned_at": assignment.created_at.isoformat() if assignment.created_at else None,
                    "last_read": assignment.last_read_at.isoformat() if assignment.last_read_at else None
                })
            except Exception as e:
                # Skip problematic assignments but log the error
                print(f"Error formatting assignment {assignment.id}: {str(e)}")
                continue
        
        return {
            "assignments": result,
            "total": total,
            "pagination": {
                "total": total,
                "pages": (total + limit - 1) // limit if limit > 0 else 0,
                "page": (skip // limit) + 1 if limit > 0 else 1,
                "limit": limit
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch library assignments: {str(e)}")

@router.get("/library-assignment/{assignment_id}/details")
def get_library_assignment_details(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """Get detailed reading information including notes and highlights"""
    check_admin_access(current_user)
    
    from models.reading import Highlight, Note
    
    assignment = db.query(UserLibrary).options(
        joinedload(UserLibrary.user),
        joinedload(UserLibrary.book)
    ).filter(UserLibrary.id == assignment_id).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Get highlights
    highlights = db.query(Highlight).filter(
        Highlight.user_id == assignment.user_id,
        Highlight.book_id == assignment.book_id
    ).order_by(Highlight.created_at.desc()).all()
    
    # Get notes
    notes = db.query(Note).filter(
        Note.user_id == assignment.user_id,
        Note.book_id == assignment.book_id
    ).order_by(Note.created_at.desc()).all()
    
    return {
        "assignment": {
            "id": assignment.id,
            "user_name": f"{assignment.user.first_name or ''} {assignment.user.last_name or ''}".strip(),
            "user_email": assignment.user.email,
            "book_title": assignment.book.title if assignment.book else "Unknown",
            "book_author": assignment.book.author_name if assignment.book else "Unknown",
            "format": assignment.format,
            "progress": assignment.progress or 0,
            "status": assignment.status,
            "last_read_at": assignment.last_read_at.isoformat() if assignment.last_read_at else None,
            "assigned_at": assignment.created_at.isoformat() if assignment.created_at else None
        },
        "highlights": [
            {
                "id": h.id,
                "text": h.text,
                "color": h.color,
                "context": h.context,
                "created_at": h.created_at.isoformat() if h.created_at else None
            } for h in highlights
        ],
        "notes": [
            {
                "id": n.id,
                "content": n.content,
                "highlight_id": n.highlight_id,
                "created_at": n.created_at.isoformat() if n.created_at else None,
                "updated_at": n.updated_at.isoformat() if n.updated_at else None
            } for n in notes
        ]
    }

@router.delete("/library-assignment/{assignment_id}")
def remove_library_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """Remove a library assignment"""
    check_admin_access(current_user)
    
    assignment = db.query(UserLibrary).filter(UserLibrary.id == assignment_id).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(assignment)
    db.commit()
    
    return {"success": True, "message": "Assignment removed successfully"}
