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
        query = db.query(UserLibrary).outerjoin(User).outerjoin(Book).options(
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
        
        # Get reader counts per book
        from sqlalchemy import func
        reader_counts = dict(
            db.query(
                UserLibrary.book_id,
                func.count(func.distinct(UserLibrary.user_id))
            ).filter(UserLibrary.status == 'reading')
            .group_by(UserLibrary.book_id)
            .all()
        )
        
        # Format response
        result = []
        for assignment in assignments:
            try:
                result.append({
                    "id": assignment.id,
                    "user_id": assignment.user_id,
                    "user_name": f"{assignment.user.first_name or ''} {assignment.user.last_name or ''}".strip() if assignment.user else "Unknown",
                    "user_email": assignment.user.email if assignment.user else "N/A",
                    "book_id": assignment.book_id,
                    "book_title": assignment.book.title if assignment.book else "Unknown",
                    "book_author": assignment.book.author if assignment.book else "Unknown",
                    "format": assignment.format or "ebook",
                    "progress": assignment.progress or 0,
                    "status": assignment.status or "unread",
                    "assigned_at": assignment.created_at.isoformat() if assignment.created_at else None,
                    "last_read": assignment.last_read_at.isoformat() if assignment.last_read_at else None,
                    "active_readers": reader_counts.get(assignment.book_id, 0)
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
            "book_author": assignment.book.author if assignment.book else "Unknown",
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

class BulkAssignRequest(BaseModel):
    user_ids: list[int]
    book_id: int
    format: str

@router.post("/bulk-assign")
def bulk_assign_book(
    request: BulkAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """Bulk assign a book to multiple users"""
    check_admin_access(current_user)
    
    # Check if book exists
    book = db.query(Book).filter(Book.id == request.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    assigned_count = 0
    skipped_count = 0
    
    for user_id in request.user_ids:
        # Check if user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            skipped_count += 1
            continue
        
        # Check if already assigned
        existing = db.query(UserLibrary).filter(
            UserLibrary.user_id == user_id,
            UserLibrary.book_id == request.book_id,
            UserLibrary.format == request.format
        ).first()
        
        if existing:
            skipped_count += 1
            continue
        
        # Create new assignment
        assignment = UserLibrary(
            user_id=user_id,
            book_id=request.book_id,
            format=request.format,
            progress=0
        )
        db.add(assignment)
        assigned_count += 1
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Book assigned to {assigned_count} users",
        "assigned_count": assigned_count,
        "skipped_count": skipped_count
    }

@router.get("/library-stats")
def get_library_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """Get library statistics"""
    check_admin_access(current_user)
    
    from sqlalchemy import func, distinct
    
    # Total assignments (only valid ones with book_id and user_id)
    total_assignments = db.query(func.count(UserLibrary.id)).filter(
        UserLibrary.book_id.isnot(None),
        UserLibrary.user_id.isnot(None)
    ).scalar() or 0
    
    # Active readers (users with reading status)
    active_readers = db.query(func.count(distinct(UserLibrary.user_id))).filter(
        UserLibrary.status == 'reading',
        UserLibrary.book_id.isnot(None),
        UserLibrary.user_id.isnot(None)
    ).scalar() or 0
    
    # Completion rate
    completed = db.query(func.count(UserLibrary.id)).filter(
        UserLibrary.status == 'completed',
        UserLibrary.book_id.isnot(None),
        UserLibrary.user_id.isnot(None)
    ).scalar() or 0
    completion_rate = round((completed / total_assignments * 100) if total_assignments > 0 else 0, 1)
    
    # Average progress
    avg_progress = db.query(func.avg(UserLibrary.progress)).filter(
        UserLibrary.book_id.isnot(None),
        UserLibrary.user_id.isnot(None)
    ).scalar() or 0
    avg_progress = round(float(avg_progress), 1)
    
    return {
        "total_assignments": total_assignments,
        "active_readers": active_readers,
        "completion_rate": completion_rate,
        "avg_progress": avg_progress
    }

@router.get("/library-assignment/{assignment_id}/analytics")
def get_assignment_analytics(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """Get reading analytics and goals for an assignment"""
    check_admin_access(current_user)
    
    from models.reading_session import ReadingSession
    from models.reading_goal import ReadingGoal
    from sqlalchemy import func
    from datetime import timedelta
    
    assignment = db.query(UserLibrary).filter(UserLibrary.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Get reading sessions
    sessions = db.query(ReadingSession).filter(
        ReadingSession.user_id == assignment.user_id,
        ReadingSession.book_id == assignment.book_id
    ).all()
    
    # Calculate analytics
    total_sessions = len(sessions)
    total_minutes = int(sum(s.duration or 0 for s in sessions))
    total_hours = total_minutes // 60
    remaining_minutes = total_minutes % 60
    total_reading_time = f"{total_hours}h {remaining_minutes}m" if total_hours > 0 else f"{remaining_minutes}m"
    
    avg_session_minutes = total_minutes // total_sessions if total_sessions > 0 else 0
    avg_session_time = f"{avg_session_minutes}m"
    
    # Calculate reading streak
    reading_streak = 0
    if sessions:
        from datetime import datetime, date
        session_dates = sorted(set(s.created_at.date() for s in sessions if s.created_at), reverse=True)
        if session_dates:
            today = date.today()
            if session_dates[0] >= today - timedelta(days=1):
                reading_streak = 1
                for i in range(len(session_dates) - 1):
                    if (session_dates[i] - session_dates[i + 1]).days == 1:
                        reading_streak += 1
                    else:
                        break
    
    # Get reading goals
    goals = db.query(ReadingGoal).filter(
        ReadingGoal.user_id == assignment.user_id
    ).all()
    
    goals_data = []
    for goal in goals:
        # Determine status
        if goal.completed:
            status = 'completed'
        elif goal.current_value > 0:
            status = 'in_progress'
        else:
            status = 'not_started'
        
        # Create title and description based on goal type
        goal_type_labels = {
            'books': 'Books',
            'pages': 'Pages',
            'minutes': 'Minutes'
        }
        title = f"Read {goal.target_value} {goal_type_labels.get(goal.goal_type, goal.goal_type)}"
        description = f"Goal to read {goal.target_value} {goal.goal_type}"
        
        goals_data.append({
            "id": goal.id,
            "title": title,
            "description": description,
            "goal_type": goal.goal_type,
            "target_value": goal.target_value,
            "current_value": goal.current_value or 0,
            "status": status,
            "start_date": goal.start_date.isoformat() if goal.start_date else None,
            "target_date": goal.end_date.isoformat() if goal.end_date else None
        })
    
    return {
        "total_reading_time": total_reading_time,
        "total_sessions": total_sessions,
        "avg_session_time": avg_session_time,
        "reading_streak": reading_streak,
        "goals": goals_data
    }
