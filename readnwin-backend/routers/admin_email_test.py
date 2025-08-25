from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from services.resend_email_service import ResendEmailService
from models.user import User
from pydantic import BaseModel

router = APIRouter()

class EmailTestRequest(BaseModel):
    function_slug: str
    to_email: str
    variables: dict = {}

@router.post("/test")
def test_email_template(
    request: EmailTestRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Test email template by sending a test email"""
    check_admin_access(current_user)
    
    try:
        email_service = ResendEmailService(db)
        result = email_service.send_email_by_function(
            request.function_slug,
            request.to_email,
            request.variables
        )
        
        # Check if the email service returned an error
        if not result.get("success", False):
            error_detail = result.get("error", "Unknown error")
            if isinstance(error_detail, dict) and "error" in error_detail:
                # Extract Resend API error message
                resend_error = error_detail.get("error", "Unknown Resend error")
                return {
                    "success": False, 
                    "error": f"Email delivery failed: {resend_error}",
                    "details": error_detail
                }
            return {
                "success": False, 
                "error": f"Email delivery failed: {error_detail}"
            }
        
        return {
            "success": True, 
            "message": "Test email sent successfully!",
            "result": result
        }
    except Exception as e:
        return {"success": False, "error": f"Server error: {str(e)}"}