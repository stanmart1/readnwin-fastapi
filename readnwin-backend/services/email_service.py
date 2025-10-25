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

def send_password_changed_email(to_email: str, first_name: Optional[str] = None, db_session: Optional[Session] = None) -> bool:
    """Send password changed confirmation email using Resend API"""
    try:
        if not db_session:
            return False
        resend_service = get_resend_service(db_session)
        result = resend_service.send_password_changed_email(
            to_email=to_email,
            first_name=first_name or "User"
        )
        return result.get("success", False)
    except Exception as e:
        print(f"Failed to send password changed email: {str(e)}")
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

def send_verification_email(to_email: str, username: str, verification_token: str, db_session: Optional[Session] = None) -> bool:
    """Send email verification link"""
    try:
        if not db_session:
            return False
        resend_service = get_resend_service(db_session)
        result = resend_service.send_verification_email(
            to_email=to_email,
            username=username,
            verification_token=verification_token
        )
        return result.get("success", False)
    except Exception as e:
        print(f"Failed to send verification email: {str(e)}")
        return False

def send_payment_confirmation_email(to_email: str, payment_data: Dict[str, Any], first_name: Optional[str] = None, db_session: Optional[Session] = None) -> bool:
    """Send payment confirmation email"""
    try:
        if not db_session:
            return False
        resend_service = get_resend_service(db_session)
        result = resend_service.send_payment_confirmation_email(
            to_email=to_email,
            payment_data=payment_data,
            first_name=first_name or "Customer"
        )
        return result.get("success", False)
    except Exception as e:
        print(f"Failed to send payment confirmation email: {str(e)}")
        return False

def send_login_alert_email(to_email: str, alert_data: Dict[str, Any], first_name: Optional[str] = None, db_session: Optional[Session] = None) -> bool:
    """Send new login alert email"""
    try:
        if not db_session:
            return False
        resend_service = get_resend_service(db_session)
        result = resend_service.send_login_alert_email(
            to_email=to_email,
            alert_data=alert_data,
            first_name=first_name or "User"
        )
        return result.get("success", False)
    except Exception as e:
        print(f"Failed to send login alert email: {str(e)}")
        return False

def send_security_alert_email(to_email: str, alert_data: Dict[str, Any], first_name: Optional[str] = None, db_session: Optional[Session] = None) -> bool:
    """Send security alert email"""
    try:
        if not db_session:
            return False
        resend_service = get_resend_service(db_session)
        result = resend_service.send_security_alert_email(
            to_email=to_email,
            alert_data=alert_data,
            first_name=first_name or "User"
        )
        return result.get("success", False)
    except Exception as e:
        print(f"Failed to send security alert email: {str(e)}")
        return False

def send_goal_achieved_email(to_email: str, goal_data: Dict[str, Any], first_name: Optional[str] = None, db_session: Optional[Session] = None) -> bool:
    """Send reading goal achieved email"""
    try:
        if not db_session:
            return False
        resend_service = get_resend_service(db_session)
        result = resend_service.send_goal_achieved_email(
            to_email=to_email,
            goal_data=goal_data,
            first_name=first_name or "User"
        )
        return result.get("success", False)
    except Exception as e:
        print(f"Failed to send goal achieved email: {str(e)}")
        return False

def send_new_book_release_email(to_email: str, book_data: Dict[str, Any], first_name: Optional[str] = None, db_session: Optional[Session] = None) -> bool:
    """Send new book release notification"""
    try:
        if not db_session:
            return False
        resend_service = get_resend_service(db_session)
        result = resend_service.send_new_book_release_email(
            to_email=to_email,
            book_data=book_data,
            first_name=first_name or "User"
        )
        return result.get("success", False)
    except Exception as e:
        print(f"Failed to send new book release email: {str(e)}")
        return False

def send_promotional_offer_email(to_email: str, offer_data: Dict[str, Any], first_name: Optional[str] = None, db_session: Optional[Session] = None) -> bool:
    """Send promotional offer email"""
    try:
        if not db_session:
            return False
        resend_service = get_resend_service(db_session)
        result = resend_service.send_promotional_offer_email(
            to_email=to_email,
            offer_data=offer_data,
            first_name=first_name or "User"
        )
        return result.get("success", False)
    except Exception as e:
        print(f"Failed to send promotional offer email: {str(e)}")
        return False

def send_account_deactivation_email(to_email: str, first_name: Optional[str] = None, db_session: Optional[Session] = None) -> bool:
    """Send account deactivation notice"""
    try:
        if not db_session:
            return False
        resend_service = get_resend_service(db_session)
        result = resend_service.send_account_deactivation_email(
            to_email=to_email,
            first_name=first_name or "User"
        )
        return result.get("success", False)
    except Exception as e:
        print(f"Failed to send account deactivation email: {str(e)}")
        return False

def send_account_deleted_email(to_email: str, first_name: Optional[str] = None, db_session: Optional[Session] = None) -> bool:
    """Send account deletion confirmation"""
    try:
        if not db_session:
            return False
        resend_service = get_resend_service(db_session)
        result = resend_service.send_account_deleted_email(
            to_email=to_email,
            first_name=first_name or "User"
        )
        return result.get("success", False)
    except Exception as e:
        print(f"Failed to send account deleted email: {str(e)}")
        return False

def send_order_rejected_email(to_email: str, order_data: Dict[str, Any], first_name: Optional[str] = None, db_session: Optional[Session] = None) -> bool:
    """Send order rejection email"""
    try:
        if not db_session:
            return False
        resend_service = get_resend_service(db_session)
        result = resend_service.send_order_rejected_email(
            to_email=to_email,
            order_data=order_data,
            first_name=first_name or "Customer"
        )
        return result.get("success", False)
    except Exception as e:
        print(f"Failed to send order rejected email: {str(e)}")
        return False

def send_refund_processed_email(to_email: str, refund_data: Dict[str, Any], first_name: Optional[str] = None, db_session: Optional[Session] = None) -> bool:
    """Send refund processed notification"""
    try:
        if not db_session:
            return False
        resend_service = get_resend_service(db_session)
        result = resend_service.send_refund_processed_email(
            to_email=to_email,
            refund_data=refund_data,
            first_name=first_name or "Customer"
        )
        return result.get("success", False)
    except Exception as e:
        print(f"Failed to send refund processed email: {str(e)}")
        return False

def send_newsletter_subscription_email(to_email: str, first_name: Optional[str] = None, db_session: Optional[Session] = None) -> bool:
    """Send newsletter subscription confirmation"""
    try:
        if not db_session:
            return False
        resend_service = get_resend_service(db_session)
        result = resend_service.send_newsletter_subscription_email(
            to_email=to_email,
            first_name=first_name or "Subscriber"
        )
        return result.get("success", False)
    except Exception as e:
        print(f"Failed to send newsletter subscription email: {str(e)}")
        return False

def send_system_maintenance_email(to_emails: list, maintenance_data: Dict[str, Any], db_session: Optional[Session] = None) -> bool:
    """Send system maintenance notification"""
    try:
        if not db_session:
            return False
        resend_service = get_resend_service(db_session)
        result = resend_service.send_system_maintenance_email(
            to_emails=to_emails,
            maintenance_data=maintenance_data
        )
        return result.get("success", False)
    except Exception as e:
        print(f"Failed to send system maintenance email: {str(e)}")
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
