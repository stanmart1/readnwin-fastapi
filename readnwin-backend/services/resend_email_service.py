import resend
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from core.config import settings
from core.template_manager import get_template_manager

logger = logging.getLogger(__name__)

class ResendEmailService:
    
    def __init__(self, db: Session):
        self.db = db
        self.template_manager = get_template_manager(db_session=db)
        # Load API key from database or environment
        self._load_api_key()
        self._load_from_email()
    
    def _load_api_key(self):
        """Load Resend API key from database"""
        try:
            from sqlalchemy import text
            result = self.db.execute(text(
                "SELECT api_key FROM email_gateway_config WHERE provider = 'resend' AND is_active = true LIMIT 1"
            )).fetchone()
            if result and result[0]:
                resend.api_key = result[0]
                return
        except Exception as e:
            logger.warning(f"Could not load Resend API key from database: {e}")
        
        # Fallback to environment variable if exists
        import os
        env_key = os.getenv('RESEND_API_KEY', '')
        if env_key:
            resend.api_key = env_key
    
    def _load_from_email(self):
        """Load from email and name from database"""
        try:
            from sqlalchemy import text
            result = self.db.execute(text(
                "SELECT from_email, from_name FROM email_gateway_config WHERE provider = 'resend' AND is_active = true LIMIT 1"
            )).fetchone()
            if result:
                self.from_email = result[0] or "noreply@readnwin.com"
                self.from_name = result[1] or "ReadnWin"
            else:
                self.from_email = "noreply@readnwin.com"
                self.from_name = "ReadnWin"
        except Exception as e:
            logger.warning(f"Could not load from email from database: {e}")
            self.from_email = "noreply@readnwin.com"
            self.from_name = "ReadnWin"
    
    def _get_from_address(self) -> str:
        """Get formatted from address"""
        return f"{self.from_name} <{self.from_email}>"
    
    def send_email(self, to: list, subject: str, html_content: str, from_email: str = None) -> Dict[str, Any]:
        """Send a generic email with pre-rendered HTML"""
        try:
            if not from_email:
                from_email = self._get_from_address()
            
            params = {
                "from": from_email,
                "to": to,
                "subject": subject,
                "html": html_content
            }
            
            email = resend.Emails.send(params)
            logger.info(f"Email sent successfully to {to}")
            return {"success": True, "id": email.get("id")}
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def send_welcome_email(self, to_email: str, first_name: str = "Reader") -> Dict[str, Any]:
        """Send welcome email to new user"""
        try:
            html_content = self.template_manager.render_welcome_email(
                username=first_name,
                app_url=settings.frontend_url
            )
            
            return self.send_email(
                to=[to_email],
                subject="Welcome to ReadnWin!",
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_password_reset_email(self, to_email: str, reset_token: str, first_name: str = "User") -> Dict[str, Any]:
        """Send password reset email"""
        try:
            reset_url = f"{settings.frontend_url}/reset-password?token={reset_token}"
            html_content = self.template_manager.render_password_reset(
                username=first_name,
                reset_url=reset_url
            )
            
            return self.send_email(
                to=[to_email],
                subject="Reset Your Password - ReadnWin",
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send password reset email to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_password_changed_email(self, to_email: str, first_name: str = "User") -> Dict[str, Any]:
        """Send password changed confirmation email"""
        try:
            # Using password reset template for now (same format)
            html_content = self.template_manager.render_password_reset(
                username=first_name,
                reset_url=f"{settings.frontend_url}/dashboard"
            )
            
            return self.send_email(
                to=[to_email],
                subject="Password Changed Successfully - ReadnWin",
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send password changed email to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_verification_email(self, to_email: str, username: str, verification_token: str) -> Dict[str, Any]:
        """Send email verification link"""
        try:
            verification_url = f"{settings.frontend_url}/verify-email?token={verification_token}"
            html_content = self.template_manager.render_email_verification(
                username=username,
                verification_url=verification_url
            )
            
            return self.send_email(
                to=[to_email],
                subject="Verify Your Email - ReadnWin",
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send verification email to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_order_confirmation_email(self, to_email: str, order_data: Dict[str, Any], first_name: str = "Customer") -> Dict[str, Any]:
        """Send order confirmation email"""
        try:
            order_number = order_data.get("order_number", "N/A")
            total_amount = order_data.get("total_amount", 0)
            items = order_data.get("items", [])
            order_id = order_data.get("order_id", "N/A")
            order_date = order_data.get("order_date", datetime.now().strftime("%Y-%m-%d %H:%M"))
            
            html_content = self.template_manager.render_order_confirmation(
                username=first_name,
                order_id=order_id or order_number,
                order_date=order_date,
                total_amount=total_amount,
                items=items,
                app_url=settings.frontend_url
            )
            
            return self.send_email(
                to=[to_email],
                subject=f"Order Confirmation #{order_number} - ReadnWin",
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send order confirmation to {to_email}: {e}")
            return {"success": False, "error": str(e)}

    def send_payment_confirmation_email(self, to_email: str, payment_data: Dict[str, Any], first_name: str = "Customer") -> Dict[str, Any]:
        """Send payment confirmation email"""
        try:
            transaction_id = payment_data.get("transaction_id", "N/A")
            amount = payment_data.get("amount", 0)
            payment_method = payment_data.get("payment_method", "Unknown")
            payment_date = payment_data.get("payment_date", datetime.now().strftime("%Y-%m-%d %H:%M"))
            order_url = f"{settings.frontend_url}/orders"
            
            html_content = self.template_manager.render_payment_confirmation(
                username=first_name,
                transaction_id=transaction_id,
                amount=amount,
                payment_method=payment_method,
                payment_date=payment_date,
                order_url=order_url
            )
            
            return self.send_email(
                to=[to_email],
                subject="Payment Confirmed - ReadnWin",
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send payment confirmation to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_login_alert_email(self, to_email: str, alert_data: Dict[str, Any], first_name: str = "User") -> Dict[str, Any]:
        """Send new login alert email"""
        try:
            html_content = self.template_manager.render_login_alert(
                username=first_name,
                login_time=alert_data.get("login_time", datetime.now().strftime("%Y-%m-%d %H:%M")),
                login_location=alert_data.get("login_location", "Unknown"),
                device_info=alert_data.get("device_info", "Unknown"),
                ip_address=alert_data.get("ip_address", "Unknown"),
                secure_account_url=f"{settings.frontend_url}/security"
            )
            
            return self.send_email(
                to=[to_email],
                subject="New Login Detected - ReadnWin",
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send login alert to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_security_alert_email(self, to_email: str, alert_data: Dict[str, Any], first_name: str = "User") -> Dict[str, Any]:
        """Send security alert email"""
        try:
            html_content = self.template_manager.render_security_alert(
                username=first_name,
                alert_type=alert_data.get("alert_type", "Security Alert"),
                alert_description=alert_data.get("alert_description", ""),
                alert_time=alert_data.get("alert_time", datetime.now().strftime("%Y-%m-%d %H:%M")),
                alert_location=alert_data.get("alert_location", "Unknown"),
                secure_account_url=f"{settings.frontend_url}/security"
            )
            
            return self.send_email(
                to=[to_email],
                subject="Security Alert - ReadnWin",
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send security alert to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_goal_achieved_email(self, to_email: str, goal_data: Dict[str, Any], first_name: str = "User") -> Dict[str, Any]:
        """Send reading goal achieved email"""
        try:
            html_content = self.template_manager.render_goal_achieved(
                username=first_name,
                goal_title=goal_data.get("goal_title", "Reading Goal"),
                goal_value=goal_data.get("goal_value", "0"),
                goal_unit=goal_data.get("goal_unit", "books"),
                completion_date=goal_data.get("completion_date", datetime.now().strftime("%B %d, %Y")),
                app_url=settings.frontend_url
            )
            
            return self.send_email(
                to=[to_email],
                subject="Goal Achieved - ReadnWin",
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send goal achieved email to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_new_book_release_email(self, to_email: str, book_data: Dict[str, Any], first_name: str = "User") -> Dict[str, Any]:
        """Send new book release notification email"""
        try:
            html_content = self.template_manager.render_new_book_release(
                username=first_name,
                book_title=book_data.get("book_title", "New Book"),
                book_author=book_data.get("book_author", "Author"),
                book_description=book_data.get("book_description", ""),
                book_category=book_data.get("book_category", "Fiction"),
                book_price=book_data.get("book_price", 0),
                book_url=f"{settings.frontend_url}/book/{book_data.get('book_id', '')}",
                unsubscribe_url=f"{settings.frontend_url}/preferences"
            )
            
            return self.send_email(
                to=[to_email],
                subject=f"New Book: {book_data.get('book_title', 'New Release')} - ReadnWin",
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send new book release email to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_promotional_offer_email(self, to_email: str, offer_data: Dict[str, Any], first_name: str = "User") -> Dict[str, Any]:
        """Send promotional offer email"""
        try:
            html_content = self.template_manager.render_promotional_offer(
                username=first_name,
                offer_title=offer_data.get("offer_title", "Special Offer"),
                offer_description=offer_data.get("offer_description", ""),
                discount_percentage=int(offer_data.get("discount_percentage", 0)),
                promo_code=offer_data.get("promo_code", ""),
                expiry_date=offer_data.get("expiry_date", ""),
                shop_url=f"{settings.frontend_url}/books"
            )
            
            return self.send_email(
                to=[to_email],
                subject=f"{offer_data.get('discount_percentage', 0)}% Off - ReadnWin",
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send promotional offer email to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_account_deactivation_email(self, to_email: str, first_name: str = "User") -> Dict[str, Any]:
        """Send account deactivation notice"""
        try:
            html_content = self.template_manager.render_account_deactivation(
                username=first_name,
                reactivation_url=f"{settings.frontend_url}/reactivate"
            )
            
            return self.send_email(
                to=[to_email],
                subject="Account Deactivated - ReadnWin",
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send account deactivation email to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_account_deleted_email(self, to_email: str, first_name: str = "User") -> Dict[str, Any]:
        """Send account deletion confirmation"""
        try:
            html_content = self.template_manager.render_account_deleted(
                username=first_name
            )
            
            return self.send_email(
                to=[to_email],
                subject="Account Deleted - ReadnWin",
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send account deleted email to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_order_rejected_email(self, to_email: str, order_data: Dict[str, Any], first_name: str = "Customer") -> Dict[str, Any]:
        """Send order rejection email"""
        try:
            html_content = self.template_manager.render_order_rejected(
                username=first_name,
                order_id=order_data.get("order_id", "N/A"),
                rejection_reason=order_data.get("rejection_reason", "Order could not be processed"),
                support_url=f"{settings.frontend_url}/support"
            )
            
            return self.send_email(
                to=[to_email],
                subject="Order Rejected - ReadnWin",
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send order rejected email to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_refund_processed_email(self, to_email: str, refund_data: Dict[str, Any], first_name: str = "Customer") -> Dict[str, Any]:
        """Send refund processed notification"""
        try:
            html_content = self.template_manager.render_refund_processed(
                username=first_name,
                order_id=refund_data.get("order_id", "N/A"),
                refund_amount=refund_data.get("refund_amount", 0),
                refund_date=refund_data.get("refund_date", datetime.now().strftime("%Y-%m-%d")),
                account_url=f"{settings.frontend_url}/account"
            )
            
            return self.send_email(
                to=[to_email],
                subject="Refund Processed - ReadnWin",
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send refund processed email to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_newsletter_subscription_email(self, to_email: str, first_name: str = "Subscriber") -> Dict[str, Any]:
        """Send newsletter subscription confirmation"""
        try:
            html_content = self.template_manager.render_newsletter_subscription(
                username=first_name,
                unsubscribe_url=f"{settings.frontend_url}/unsubscribe"
            )
            
            return self.send_email(
                to=[to_email],
                subject="Subscribed to Newsletter - ReadnWin",
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send newsletter subscription email to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_system_maintenance_email(self, to_emails: list, maintenance_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send system maintenance notification"""
        try:
            html_content = self.template_manager.render_system_maintenance(
                maintenance_title=maintenance_data.get("maintenance_title", "System Maintenance"),
                maintenance_message=maintenance_data.get("maintenance_message", ""),
                start_time=maintenance_data.get("start_time", ""),
                estimated_duration=maintenance_data.get("estimated_duration", "1 hour"),
                support_url=f"{settings.frontend_url}/support"
            )
            
            return self.send_email(
                to=to_emails,
                subject="Scheduled Maintenance - ReadnWin",
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send system maintenance email: {e}")
            return {"success": False, "error": str(e)}


def get_resend_service(db: Session) -> ResendEmailService:
    """Get Resend email service instance"""
    return ResendEmailService(db)
