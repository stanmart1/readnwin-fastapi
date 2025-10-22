from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from core.database import get_db
from routers.rbac import require_permission
from models.user_library import UserLibrary
from models.user import User
from models.book import Book

router = APIRouter(prefix="/admin", tags=["admin-library"])

@router.get("/library-assignments")
async def get_library_assignments(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("manage_library"))
):
    """Get all user library assignments with filters"""
    
    query = db.query(UserLibrary).options(
        joinedload(UserLibrary.user),
        joinedload(UserLibrary.book)
    )
    
    # Apply filters
    if user_id:
        query = query.filter(UserLibrary.user_id == user_id)
    
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
            "status": "active",  # Default status
            "assigned_at": assignment.created_at.isoformat() if assignment.created_at else None,
            "last_read": assignment.updated_at.isoformat() if assignment.updated_at else None
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
async def remove_library_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_permission("manage_library"))
):
    """Remove a library assignment"""
    
    assignment = db.query(UserLibrary).filter(UserLibrary.id == assignment_id).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(assignment)
    db.commit()
    
    return {"success": True, "message": "Assignment removed successfully"}
