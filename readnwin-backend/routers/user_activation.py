from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User

router = APIRouter(prefix="/user", tags=["user"])

@router.post("/activate")
async def activate_user_account(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Activate user account for testing purposes"""
    try:
        current_user.is_active = True
        db.commit()
        return {"message": "Account activated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to activate account: {str(e)}")

@router.get("/status")
async def get_user_status(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get current user status"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "is_active": current_user.is_active,
        "is_admin": current_user.has_admin_access,
        "role": current_user.role.name if current_user.role else None
    }