from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func, desc
from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
from models.reading_goal import ReadingGoal
from models.user_library import UserLibrary
from models.reading_session import ReadingSession
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, validator

class ReadingGoalCreate(BaseModel):
    goal_type: str  # books, pages, minutes
    target_value: int
    start_date: datetime
    end_date: datetime

    @validator('goal_type')
    def validate_goal_type(cls, v):
        if v not in ['books', 'pages', 'minutes', 'streak']:
            raise ValueError('goal_type must be one of: books, pages, minutes, streak')
        return v

    @validator('target_value')
    def validate_target_value(cls, v):
        if v <= 0:
            raise ValueError('target_value must be greater than 0')
        return v

    @validator('end_date')
    def validate_end_date(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v

class ReadingGoalUpdate(BaseModel):
    goal_type: Optional[str] = None
    target_value: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    current_value: Optional[int] = None
    completed: Optional[bool] = None

    @validator('goal_type')
    def validate_goal_type(cls, v):
        if v is not None and v not in ['books', 'pages', 'minutes', 'streak']:
            raise ValueError('goal_type must be one of: books, pages, minutes, streak')
        return v

    @validator('target_value')
    def validate_target_value(cls, v):
        if v is not None and v <= 0:
            raise ValueError('target_value must be greater than 0')
        return v

class ReadingGoalResponse(BaseModel):
    id: int
    goal_type: str
    target_value: int
    current_value: int
    progress_percentage: float
    start_date: datetime
    end_date: datetime
    completed: bool
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

router = APIRouter()

def calculate_current_value(user_id: int, goal: ReadingGoal, db: Session) -> int:
    """Calculate current progress for a reading goal"""
    if goal.goal_type == "books":
        # Count completed books within goal period
        return db.query(func.count(UserLibrary.id)).filter(
            UserLibrary.user_id == user_id,
            UserLibrary.status == "completed",
            UserLibrary.updated_at >= goal.start_date,
            UserLibrary.updated_at <= goal.end_date
        ).scalar() or 0
    
    elif goal.goal_type == "pages":
        # Sum pages read within goal period
        return db.query(func.coalesce(func.sum(ReadingSession.pages_read), 0)).filter(
            ReadingSession.user_id == user_id,
            ReadingSession.created_at >= goal.start_date,
            ReadingSession.created_at <= goal.end_date
        ).scalar() or 0
    
    elif goal.goal_type == "minutes":
        # Sum reading time within goal period
        total_minutes = db.query(func.coalesce(func.sum(ReadingSession.duration), 0)).filter(
            ReadingSession.user_id == user_id,
            ReadingSession.created_at >= goal.start_date,
            ReadingSession.created_at <= goal.end_date
        ).scalar() or 0
        return int(total_minutes)
    
    elif goal.goal_type == "streak":
        # Calculate reading streak (consecutive days with reading activity)
        sessions = db.query(ReadingSession).filter(
            ReadingSession.user_id == user_id,
            ReadingSession.created_at >= goal.start_date,
            ReadingSession.created_at <= goal.end_date
        ).order_by(desc(ReadingSession.created_at)).all()
        
        if not sessions:
            return 0
        
        # Get unique reading dates
        reading_dates = sorted(set(s.created_at.date() for s in sessions), reverse=True)
        
        if not reading_dates:
            return 0
        
        # Calculate streak from most recent date
        from datetime import timedelta
        streak = 1
        for i in range(len(reading_dates) - 1):
            if (reading_dates[i] - reading_dates[i + 1]).days == 1:
                streak += 1
            else:
                break
        
        return streak
    
    return 0

def update_goal_progress(goal: ReadingGoal, db: Session):
    """Update goal progress and completion status"""
    current_value = calculate_current_value(goal.user_id, goal, db)
    goal.current_value = current_value
    
    # Check if goal is completed
    if current_value >= goal.target_value:
        goal.completed = True
    
    goal.updated_at = datetime.now(timezone.utc)

@router.get("/", response_model=List[ReadingGoalResponse])
async def get_reading_goals(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all reading goals for the current user"""
    try:
        goals = db.query(ReadingGoal).filter(
            ReadingGoal.user_id == current_user.id
        ).order_by(desc(ReadingGoal.created_at)).all()
        
        goal_responses = []
        for goal in goals:
            # Update progress before returning
            update_goal_progress(goal, db)
            
            progress_percentage = (goal.current_value / goal.target_value * 100) if goal.target_value > 0 else 0
            
            # Determine status
            now = datetime.now(timezone.utc)
            if goal.completed:
                status = "completed"
            elif now > goal.end_date:
                status = "expired"
            elif progress_percentage >= 75:
                status = "on_track"
            elif progress_percentage >= 50:
                status = "behind"
            else:
                status = "far_behind"
            
            goal_responses.append(ReadingGoalResponse(
                id=goal.id,
                goal_type=goal.goal_type,
                target_value=goal.target_value,
                current_value=goal.current_value,
                progress_percentage=round(progress_percentage, 2),
                start_date=goal.start_date,
                end_date=goal.end_date,
                completed=goal.completed,
                status=status,
                created_at=goal.created_at,
                updated_at=goal.updated_at
            ))
        
        db.commit()
        return goal_responses
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching reading goals: {str(e)}"
        )

@router.post("/", response_model=ReadingGoalResponse)
async def create_reading_goal(
    goal_data: ReadingGoalCreate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new reading goal"""
    try:
        # Check for overlapping goals of the same type
        existing_goal = db.query(ReadingGoal).filter(
            ReadingGoal.user_id == current_user.id,
            ReadingGoal.goal_type == goal_data.goal_type,
            ReadingGoal.start_date <= goal_data.end_date,
            ReadingGoal.end_date >= goal_data.start_date
        ).first()
        
        if existing_goal:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You already have a {goal_data.goal_type} goal for this time period"
            )
        
        new_goal = ReadingGoal(
            user_id=current_user.id,
            goal_type=goal_data.goal_type,
            target_value=goal_data.target_value,
            current_value=0,
            start_date=goal_data.start_date,
            end_date=goal_data.end_date,
            completed=False
        )
        
        db.add(new_goal)
        db.commit()
        db.refresh(new_goal)
        
        # Calculate initial progress
        update_goal_progress(new_goal, db)
        db.commit()
        
        progress_percentage = (new_goal.current_value / new_goal.target_value * 100) if new_goal.target_value > 0 else 0
        
        return ReadingGoalResponse(
            id=new_goal.id,
            goal_type=new_goal.goal_type,
            target_value=new_goal.target_value,
            current_value=new_goal.current_value,
            progress_percentage=round(progress_percentage, 2),
            start_date=new_goal.start_date,
            end_date=new_goal.end_date,
            completed=new_goal.completed,
            status="active",
            created_at=new_goal.created_at,
            updated_at=new_goal.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating reading goal: {str(e)}"
        )

@router.get("/{goal_id}", response_model=ReadingGoalResponse)
async def get_reading_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get a specific reading goal"""
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
        
        # Update progress
        update_goal_progress(goal, db)
        db.commit()
        
        progress_percentage = (goal.current_value / goal.target_value * 100) if goal.target_value > 0 else 0
        
        # Determine status
        now = datetime.now(timezone.utc)
        if goal.completed:
            status = "completed"
        elif now > goal.end_date:
            status = "expired"
        elif progress_percentage >= 75:
            status = "on_track"
        elif progress_percentage >= 50:
            status = "behind"
        else:
            status = "far_behind"
        
        return ReadingGoalResponse(
            id=goal.id,
            goal_type=goal.goal_type,
            target_value=goal.target_value,
            current_value=goal.current_value,
            progress_percentage=round(progress_percentage, 2),
            start_date=goal.start_date,
            end_date=goal.end_date,
            completed=goal.completed,
            status=status,
            created_at=goal.created_at,
            updated_at=goal.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching reading goal: {str(e)}"
        )

@router.put("/{goal_id}", response_model=ReadingGoalResponse)
async def update_reading_goal(
    goal_id: int,
    goal_data: ReadingGoalUpdate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update a reading goal"""
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
        
        # Update fields if provided
        if goal_data.goal_type is not None:
            goal.goal_type = goal_data.goal_type
        if goal_data.target_value is not None:
            goal.target_value = goal_data.target_value
        if goal_data.start_date is not None:
            goal.start_date = goal_data.start_date
        if goal_data.end_date is not None:
            goal.end_date = goal_data.end_date
        if goal_data.current_value is not None:
            goal.current_value = goal_data.current_value
        if goal_data.completed is not None:
            goal.completed = goal_data.completed
        
        goal.updated_at = datetime.now(timezone.utc)
        
        # Recalculate progress if goal type or dates changed
        if goal_data.goal_type is not None or goal_data.start_date is not None or goal_data.end_date is not None:
            update_goal_progress(goal, db)
        
        db.commit()
        db.refresh(goal)
        
        progress_percentage = (goal.current_value / goal.target_value * 100) if goal.target_value > 0 else 0
        
        # Determine status
        now = datetime.now(timezone.utc)
        if goal.completed:
            status = "completed"
        elif now > goal.end_date:
            status = "expired"
        elif progress_percentage >= 75:
            status = "on_track"
        elif progress_percentage >= 50:
            status = "behind"
        else:
            status = "far_behind"
        
        return ReadingGoalResponse(
            id=goal.id,
            goal_type=goal.goal_type,
            target_value=goal.target_value,
            current_value=goal.current_value,
            progress_percentage=round(progress_percentage, 2),
            start_date=goal.start_date,
            end_date=goal.end_date,
            completed=goal.completed,
            status=status,
            created_at=goal.created_at,
            updated_at=goal.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating reading goal: {str(e)}"
        )

@router.delete("/{goal_id}")
async def delete_reading_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
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
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting reading goal: {str(e)}"
        )

@router.post("/{goal_id}/refresh")
async def refresh_goal_progress(
    goal_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Manually refresh goal progress calculation"""
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
        
        old_value = goal.current_value
        update_goal_progress(goal, db)
        db.commit()
        
        return {
            "message": "Goal progress refreshed",
            "old_value": old_value,
            "new_value": goal.current_value,
            "completed": goal.completed
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error refreshing goal progress: {str(e)}"
        )