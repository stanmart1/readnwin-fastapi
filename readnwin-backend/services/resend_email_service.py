import resend
import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from core.config import settings

logger = logging.getLogger(__name__)

# Configure Resend API Key from environment
resend.api_key = settings.resend_api_key

class ResendEmailService:
    
    def __init__(self, db: Session):
        self.db = db
    
    def send_welcome_email(self, to_email: str, first_name: str = "Reader") -> Dict[str, Any]:
        """Send welcome email to new user"""
        try:
            params = {
                "from": "ReadnWin <onboarding@resend.dev>",
                "to": [to_email],
                "subject": "Welcome to ReadnWin!",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to ReadnWin, {first_name}!</h2>
                    <p>Thank you for joining our e-book platform.</p>
                    <p>You can now:</p>
                    <ul>
                        <li>Browse our collection of books</li>
                        <li>Purchase and read e-books</li>
                        <li>Track your reading progress</li>
                        <li>Highlight and take notes</li>
                    </ul>
                    <p>Happy reading!</p>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">
                        This is an automated message from ReadnWin.
                    </p>
                </div>
                """
            }
            
            email = resend.Emails.send(params)
            logger.info(f"Welcome email sent to {to_email}")
            return {"success": True, "id": email.get("id")}
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_password_reset_email(self, to_email: str, reset_token: str, first_name: str = "User") -> Dict[str, Any]:
        """Send password reset email"""
        try:
            reset_url = f"{settings.frontend_url}/reset-password?token={reset_token}"
            
            params = {
                "from": "ReadnWin <onboarding@resend.dev>",
                "to": [to_email],
                "subject": "Reset Your Password - ReadnWin",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>Hi {first_name},</p>
                    <p>You requested to reset your password for your ReadnWin account.</p>
                    <p>Click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_url}" 
                           style="background-color: #007bff; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #007bff;">{reset_url}</p>
                    <p style="color: #d9534f; margin-top: 20px;">
                        <strong>This link will expire in 1 hour.</strong>
                    </p>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">
                        If you didn't request this, please ignore this email.
                    </p>
                </div>
                """
            }
            
            email = resend.Emails.send(params)
            logger.info(f"Password reset email sent to {to_email}")
            return {"success": True, "id": email.get("id")}
            
        except Exception as e:
            logger.error(f"Failed to send password reset email to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_verification_email(self, to_email: str, username: str, verification_token: str) -> Dict[str, Any]:
        """Send email verification link"""
        try:
            verification_url = f"{settings.frontend_url}/verify-email?token={verification_token}"
            
            params = {
                "from": "ReadnWin <onboarding@resend.dev>",
                "to": [to_email],
                "subject": "Verify Your Email - ReadnWin",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Verify Your Email Address</h2>
                    <p>Hi {username},</p>
                    <p>Thank you for registering with ReadnWin! Please verify your email address to activate your account.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{verification_url}" 
                           style="background-color: #28a745; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Verify Email
                        </a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #007bff;">{verification_url}</p>
                    <p style="color: #d9534f; margin-top: 20px;">
                        <strong>This link will expire in 24 hours.</strong>
                    </p>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">
                        If you didn't create this account, please ignore this email.
                    </p>
                </div>
                """
            }
            
            email = resend.Emails.send(params)
            logger.info(f"Verification email sent to {to_email}")
            return {"success": True, "id": email.get("id")}
            
        except Exception as e:
            logger.error(f"Failed to send verification email to {to_email}: {e}")
            return {"success": False, "error": str(e)}
    
    def send_order_confirmation_email(self, to_email: str, order_data: Dict[str, Any], first_name: str = "Customer") -> Dict[str, Any]:
        """Send order confirmation email"""
        try:
            order_number = order_data.get("order_number", "N/A")
            total_amount = order_data.get("total_amount", 0)
            items = order_data.get("items", [])
            
            items_html = "".join([
                f"<li>{item.get('title', 'Unknown')} - ${item.get('price', 0):.2f}</li>"
                for item in items
            ])
            
            params = {
                "from": "ReadnWin <onboarding@resend.dev>",
                "to": [to_email],
                "subject": f"Order Confirmation #{order_number} - ReadnWin",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Order Confirmation</h2>
                    <p>Hi {first_name},</p>
                    <p>Thank you for your purchase!</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Order Number:</strong> {order_number}</p>
                        <p><strong>Total:</strong> ${total_amount:.2f}</p>
                    </div>
                    <h3>Items:</h3>
                    <ul>{items_html}</ul>
                    <p>Your e-books are now available in your library!</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{settings.frontend_url}/library" 
                           style="background-color: #007bff; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            View Library
                        </a>
                    </div>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">
                        Thank you for choosing ReadnWin!
                    </p>
                </div>
                """
            }
            
            email = resend.Emails.send(params)
            logger.info(f"Order confirmation sent to {to_email}")
            return {"success": True, "id": email.get("id")}
            
        except Exception as e:
            logger.error(f"Failed to send order confirmation to {to_email}: {e}")
            return {"success": False, "error": str(e)}

def get_resend_service(db: Session) -> ResendEmailService:
    """Get Resend email service instance"""
    return ResendEmailService(db)
