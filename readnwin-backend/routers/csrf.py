from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token
from services.security_service import SecurityService
from core.response_models import success_response
from models.user import User

router = APIRouter()

@router.get("/csrf-token")
async def get_csrf_token(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Generate CSRF token for authenticated user"""
    csrf_token = SecurityService.generate_csrf_token()
    return success_response(
        data={"csrf_token": csrf_token},
        message="CSRF token generated successfully"
    )