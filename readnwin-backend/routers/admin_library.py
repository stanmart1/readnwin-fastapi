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
    check_admin_access(current_user)
    
    query = db.query(UserLibrary).options(
        joinedload(UserLibrary.user),
        joinedload(UserLibrary.book)
    )
    
    # Apply filters
    if user_id:
        query = query.filter(UserLibrary.user_id == user_id)
    
    if status:
        query = query.filter(UserLibrary.status == status)
    
    if search:
        query = query.join(User).join(Book).filter(
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
        result.append({
            "id": assignment.id,
            "user_id": assignment.user_id,
            "user_name": f"{assignment.user.first_name} {assignment.user.last_name}",
            "user_email": assignment.user.email,
            "book_id": assignment.book_id,
            "book_title": assignment.book.title,
            "book_author": assignment.book.author_name,
            "format": assignment.format,
            "progress": assignment.progress or 0,
            "status": assignment.status or "unread",
            "assigned_at": assignment.created_at.isoformat() if assignment.created_at else None,
            "last_read": assignment.last_read_at.isoformat() if assignment.last_read_at else None
        })
    
    return {
        "assignments": result,
        "total": total,
        "pagination": {
            "total": total,
            "pages": (total + limit - 1) // limit,
            "page": (skip // limit) + 1,
            "limit": limit
        }
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
