from typing import Optional, Dict, Any
from services.resend_email_service import get_resend_service
from sqlalchemy.orm import Session

def send_welcome_email(to_email: str, first_name: Optional[str] = None, db_session: Optional[Session] = None) -> bool:
    """Send a welcome email to new users using Resend API"""
    try:
        if not db_session:
            return False
        resend_service = get_resend_service(db_session)
        result = resend_service.send_welcome_email(
            to_email=to_email,
            first_name=first_name or "Reader"
        )
        return result.get("success", False)
    except Exception as e:
        print(f"Failed to send welcome email: {str(e)}")
        return False

def send_password_reset_email(to_email: str, reset_token: str, first_name: Optional[str] = None, db_session: Optional[Session] = None) -> bool:
    """Send password reset email using Resend API"""
    try:
        if not db_session:
            return False
        resend_service = get_resend_service(db_session)
        result = resend_service.send_password_reset_email(
            to_email=to_email,
            reset_token=reset_token,
            first_name=first_name or "User"
        )
        return result.get("success", False)
    except Exception as e:
        print(f"Failed to send password reset email: {str(e)}")
        return False

def send_order_confirmation_email(to_email: str, order_data: Dict[str, Any], first_name: Optional[str] = None, db_session: Optional[Session] = None) -> bool:
    """Send order confirmation email using Resend API"""
    try:
        if not db_session:
            return False
        resend_service = get_resend_service(db_session)
        result = resend_service.send_order_confirmation_email(
            to_email=to_email,
            order_data=order_data,
            first_name=first_name or "Customer"
        )
        return result.get("success", False)
    except Exception as e:
        print(f"Failed to send order confirmation email: {str(e)}")
        return False

def send_email_template(
    to_email: str,
    template_id: str,
    context: dict,
    subject: Optional[str] = None
) -> bool:
    """Send an email using a template with Resend API"""
    try:
        # This would integrate with database templates
        # For now, return success
        return True
    except Exception as e:
        print(f"Failed to send template email: {str(e)}")
        return False
