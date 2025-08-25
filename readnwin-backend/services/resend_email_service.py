import os
import requests
import json
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from sqlalchemy.orm import Session

load_dotenv()

class ResendEmailService:
    def __init__(self, db_session: Optional[Session] = None):
        self.db_session = db_session
        self.base_url = "https://api.resend.com"
        
        # Get configuration from database or fallback to environment
        self.api_key = self._get_api_key()
        self.from_email = self._get_from_email()
        
        if not self.api_key:
            raise ValueError("No Resend API key found in database or environment variables")
    
    def _get_api_key(self) -> str:
        """Get API key from database or environment"""
        if self.db_session:
            try:
                from models.email import EmailGatewayConfig
                config = self.db_session.query(EmailGatewayConfig).filter(
                    EmailGatewayConfig.provider == "resend",
                    EmailGatewayConfig.is_active == True
                ).first()
                if config and config.api_key:
                    return config.api_key
            except Exception as e:
                print(f"Error getting API key from database: {e}")
        
        # Fallback to environment variable
        return os.getenv("RESEND_API_KEY", "")
    
    def _get_from_email(self) -> str:
        """Get from email from database or default"""
        if self.db_session:
            try:
                from models.email import EmailGatewayConfig
                config = self.db_session.query(EmailGatewayConfig).filter(
                    EmailGatewayConfig.provider == "resend",
                    EmailGatewayConfig.is_active == True
                ).first()
                if config and config.from_email:
                    return f"{config.from_name} <{config.from_email}>"
            except Exception as e:
                print(f"Error getting from email from database: {e}")
        
        # Fallback to default
        return "ReadnWin <noreply@readnwin.com>"
    
    def _get_base_url(self) -> str:
        """Get frontend base URL from configuration"""
        from core.config import settings
        return settings.frontend_url
    
    def send_email(
        self,
        to: List[str],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        reply_to: Optional[str] = None,
        attachments: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Send email using Resend API"""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "from": from_email or self.from_email,
            "to": to,
            "subject": subject,
            "html": html_content
        }
        
        if text_content:
            payload["text"] = text_content
        
        if reply_to:
            payload["reply_to"] = reply_to
            
        if attachments:
            payload["attachments"] = attachments
        
        try:
            response = requests.post(
                f"{self.base_url}/emails",
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "data": response.json(),
                    "message": "Email sent successfully"
                }
            else:
                return {
                    "success": False,
                    "error": response.json(),
                    "message": f"Failed to send email: {response.status_code}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to send email due to network error"
            }
    
    def get_template_by_function_slug(self, function_slug: str) -> Optional[Dict[str, Any]]:
        """Get email template from database by function slug using assignments"""
        if not self.db_session:
            return None
            
        from models.email_templates import AdminEmailFunction, AdminEmailFunctionAssignment, AdminEmailTemplate
        
        # Get the active assignment for this function
        assignment = self.db_session.query(AdminEmailFunctionAssignment).join(
            AdminEmailFunction
        ).join(
            AdminEmailTemplate
        ).filter(
            AdminEmailFunction.slug == function_slug,
            AdminEmailFunction.is_active == True,
            AdminEmailFunctionAssignment.is_active == True,
            AdminEmailTemplate.is_active == True
        ).order_by(AdminEmailFunctionAssignment.priority.asc()).first()
        
        if assignment and assignment.email_template:
            template = assignment.email_template
            return {
                "subject": template.subject,
                "html_content": template.html_content,
                "text_content": template.text_content,
                "variables": template.variables or {}
            }
        return None
    
    def render_template(self, template_content: str, variables: Dict[str, Any]) -> str:
        """Replace template variables with actual values"""
        if not template_content:
            return ""
        
        content = template_content
        for key, value in variables.items():
            # Support both {{variable}} and {variable} formats
            placeholder_double = f"{{{{{key}}}}}"
            placeholder_single = f"{{{key}}}"
            content = content.replace(placeholder_double, str(value))
            content = content.replace(placeholder_single, str(value))
        return content
    
    def send_shipping_notification_email(self, to_email: str, tracking_data: Dict, first_name: str = "Customer") -> Dict[str, Any]:
        """Send shipping notification email using database template"""
        template = self.get_template_by_function_slug("shipping_notification")
        
        if not template:
            return {
                "success": False,
                "error": "Shipping notification email template not found",
                "message": "Function 'shipping_notification' not configured in admin dashboard"
            }
        
        variables = {
            "userName": first_name,
            "trackingNumber": tracking_data.get('tracking_number', 'N/A'),
            "estimatedDelivery": tracking_data.get('estimated_delivery', 'N/A'),
            "first_name": first_name,
            "customer_name": first_name,
            "order_number": tracking_data.get('order_number', 'N/A'),
            "tracking_url": tracking_data.get('tracking_url', '#'),
            "site_url": self._get_base_url()
        }
        
        html_content = self.render_template(template["html_content"], variables)
        subject = self.render_template(template["subject"], variables)
        
        return self.send_email(
            to=[to_email],
            subject=subject,
            html_content=html_content,
            text_content=self.render_template(template["text_content"], variables) if template["text_content"] else None
        )
    
    def send_welcome_email(self, to_email: str, first_name: str = "Reader") -> Dict[str, Any]:
        """Send welcome email using database template"""
        template = self.get_template_by_function_slug("user_registration")
        
        if not template:
            return {
                "success": False,
                "error": "User registration email template not found",
                "message": "Function 'user_registration' not configured in admin dashboard"
            }
        
        variables = {
            "userName": first_name,
            "userEmail": to_email,
            "verificationUrl": f"{self._get_base_url()}/verify-email",
            "first_name": first_name,
            "user_name": first_name,
            "site_url": self._get_base_url(),
            "books_url": f"{self._get_base_url()}/books"
        }
        
        html_content = self.render_template(template["html_content"], variables)
        subject = self.render_template(template["subject"], variables)
        
        return self.send_email(
            to=[to_email],
            subject=subject,
            html_content=html_content,
            text_content=self.render_template(template["text_content"], variables) if template["text_content"] else None
        )
    
    def send_password_reset_email(self, to_email: str, reset_token: str, first_name: str = "User") -> Dict[str, Any]:
        """Send password reset email using database template"""
        template = self.get_template_by_function_slug("password_reset")
        
        if not template:
            return {
                "success": False,
                "error": "Password reset email template not found",
                "message": "Function 'password_reset' not configured in admin dashboard"
            }
        
        variables = {
            "userName": first_name,
            "resetUrl": f"{self._get_base_url()}/reset-password?token={reset_token}",
            "resetToken": reset_token,
            "first_name": first_name,
            "user_name": first_name,
            "reset_token": reset_token,
            "reset_url": f"{self._get_base_url()}/reset-password?token={reset_token}",
            "site_url": self._get_base_url()
        }
        
        html_content = self.render_template(template["html_content"], variables)
        subject = self.render_template(template["subject"], variables)
        
        return self.send_email(
            to=[to_email],
            subject=subject,
            html_content=html_content,
            text_content=self.render_template(template["text_content"], variables) if template["text_content"] else None
        )
    
    def send_order_confirmation_email(self, to_email: str, order_data: Dict, first_name: str = "Customer") -> Dict[str, Any]:
        """Send order confirmation email using database template"""
        template = self.get_template_by_function_slug("order_confirmation")
        
        if not template:
            return {
                "success": False,
                "error": "Order confirmation email template not found",
                "message": "Function 'order_confirmation' not configured in admin dashboard"
            }
        
        variables = {
            "userName": first_name,
            "orderNumber": order_data.get('order_number', 'N/A'),
            "orderTotal": f"₦{order_data.get('total_amount', 0):,.2f}",
            "first_name": first_name,
            "customer_name": first_name,
            "order_number": order_data.get('order_number', 'N/A'),
            "total_amount": f"₦{order_data.get('total_amount', 0):,.2f}",
            "payment_method": order_data.get('payment_method', 'N/A').title(),
            "order_status": order_data.get('status', 'Pending').title(),
            "site_url": self._get_base_url()
        }
        
        html_content = self.render_template(template["html_content"], variables)
        subject = self.render_template(template["subject"], variables)
        
        return self.send_email(
            to=[to_email],
            subject=subject,
            html_content=html_content,
            text_content=self.render_template(template["text_content"], variables) if template["text_content"] else None
        )

    def send_email_by_function(self, function_slug: str, to_email: str, variables: dict = None) -> dict:
        """Send email using template from database"""
        try:
            template = self.get_template_by_function_slug(function_slug)
            
            if not template:
                return {
                    "success": False,
                    "error": f"No template found for function: {function_slug}"
                }
            
            # Prepare variables
            template_variables = variables or {}
            
            # Render template content
            html_content = self.render_template(template["html_content"], template_variables)
            subject = self.render_template(template["subject"], template_variables)
            text_content = None
            if template.get("text_content"):
                text_content = self.render_template(template["text_content"], template_variables)
            
            # Send email
            return self.send_email(
                to=[to_email],
                subject=subject,
                html_content=html_content,
                text_content=text_content
            )
            
        except Exception as e:
            return {"success": False, "error": str(e)}

def get_resend_service(db_session: Session) -> ResendEmailService:
    """Get ResendEmailService instance with database session"""
    return ResendEmailService(db_session=db_session)