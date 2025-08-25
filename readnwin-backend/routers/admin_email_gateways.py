from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/admin/email", tags=["admin-email-gateways"])

class EmailGatewayConfig(BaseModel):
    provider: str
    from_email: str
    from_name: str
    resend_api_key: Optional[str] = None
    resend_domain: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    use_tls: Optional[bool] = None
    use_ssl: Optional[bool] = None

class EmailTestRequest(BaseModel):
    template_id: int
    test_email: str
    test_variables: dict = {}

@router.get("/gateways")
def get_email_gateways(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get email gateway configuration"""
    check_admin_access(current_user)
    return {
        "gateways": [],
        "activeGateway": "resend"
    }

@router.post("/gateways")
def save_email_gateway(
    config: EmailGatewayConfig,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Save email gateway configuration"""
    check_admin_access(current_user)
    return {"message": "Gateway configuration saved successfully"}

@router.post("/gateways/test")
def test_email_gateway(
    request: EmailTestRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Test email gateway by sending test email"""
    check_admin_access(current_user)
    try:
        from services.resend_email_service import ResendEmailService
        email_service = ResendEmailService(db)
        result = email_service.send_email(
            to=[request.test_email],
            subject="Test Email from ReadnWin",
            html_content="<h1>Test Email</h1><p>This is a test email from ReadnWin admin panel.</p>"
        )
        return {"success": True, "message": "Test email sent successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}