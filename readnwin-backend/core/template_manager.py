"""
Email Template Manager - Loads and renders email templates from the templates/emails directory
"""
import os
from pathlib import Path
from typing import Optional
from jinja2 import Environment, FileSystemLoader, TemplateNotFound
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)


class TemplateManager:
    """Manages email template loading and rendering"""
    
    def __init__(self, db_session: Optional[Session] = None):
        """Initialize Jinja2 environment
        
        Args:
            db_session: Optional database session for loading templates from DB
        """
        self.db_session = db_session
        
        # Get the templates directory path
        backend_dir = Path(__file__).parent.parent
        templates_dir = backend_dir / "templates"
        
        # Create Jinja2 environment
        self.env = Environment(
            loader=FileSystemLoader(str(templates_dir)),
            autoescape=True,
            trim_blocks=True,
            lstrip_blocks=True
        )
    
    def render(self, template_name: str, context: dict, use_db: bool = True) -> str:
        """
        Render a template with the given context
        
        Args:
            template_name: Path to template relative to templates/ (e.g., 'emails/welcome.html')
            context: Dictionary of variables to pass to template
            use_db: Whether to try loading from database first
        
        Returns:
            Rendered HTML string
        
        Raises:
            TemplateNotFound: If template doesn't exist
        """
        try:
            # Try to load from database first if session available
            if use_db and self.db_session:
                html_content = self._get_template_from_db(template_name)
                if html_content:
                    # Render the database template content with sandboxed environment
                    from jinja2 import Environment, BaseLoader
                    from jinja2.sandbox import SandboxedEnvironment
                    
                    # Use sandboxed environment for security
                    sandbox_env = SandboxedEnvironment(
                        loader=BaseLoader(),
                        autoescape=True
                    )
                    template = sandbox_env.from_string(html_content)
                    return template.render(context)
            
            # Fallback to filesystem template
            template = self.env.get_template(template_name)
            return template.render(context)
        except TemplateNotFound:
            logger.error(f"Template not found: {template_name}")
            raise
        except Exception as e:
            logger.error(f"Error rendering template {template_name}: {str(e)}")
            raise
    
    def _get_template_from_db(self, template_name: str) -> str:
        """Get template content from database
        
        Args:
            template_name: Path like 'emails/welcome.html'
        
        Returns:
            Template HTML content or None if not found
        """
        try:
            from models.email_templates import AdminEmailTemplate
            
            # Validate template name to prevent path traversal
            if '..' in template_name or template_name.startswith('/'):
                logger.warning(f"Invalid template name: {template_name}")
                return None
            
            # Extract slug from template name (e.g., 'emails/welcome.html' -> 'welcome')
            slug = Path(template_name).stem
            
            template = self.db_session.query(AdminEmailTemplate).filter(
                AdminEmailTemplate.slug == slug,
                AdminEmailTemplate.is_active == True
            ).first()
            
            if template:
                return template.html_content
        except Exception as e:
            logger.debug(f"Could not load template from database: {e}")
        
        return None
    
    def render_welcome_email(self, username: str, app_url: str) -> str:
        """Render welcome email template"""
        context = {
            "username": username,
            "app_url": app_url
        }
        return self.render("emails/welcome.html", context)
    
    def render_email_verification(self, username: str, verification_url: str) -> str:
        """Render email verification template"""
        context = {
            "username": username,
            "verification_url": verification_url
        }
        return self.render("emails/email_verification.html", context)
    
    def render_password_reset(self, username: str, reset_url: str) -> str:
        """Render password reset template"""
        context = {
            "username": username,
            "reset_url": reset_url
        }
        return self.render("emails/password_reset.html", context)
    
    def render_password_changed(self, username: str) -> str:
        """Render password changed confirmation template"""
        context = {
            "username": username
        }
        return self.render("emails/password_changed.html", context)
    
    def render_order_confirmation(self, username: str, order_id: str, order_date: str, 
                                 total_amount: float, items: list, app_url: str) -> str:
        """Render order confirmation template"""
        context = {
            "username": username,
            "order_id": order_id,
            "order_date": order_date,
            "total_amount": total_amount,
            "items": items,
            "app_url": app_url
        }
        return self.render("emails/order_confirmation.html", context)
    
    def render_payment_confirmation(self, username: str, transaction_id: str, 
                                   amount: float, payment_method: str, payment_date: str,
                                   order_url: str) -> str:
        """Render payment confirmation template"""
        context = {
            "username": username,
            "transaction_id": transaction_id,
            "amount": amount,
            "payment_method": payment_method,
            "payment_date": payment_date,
            "order_url": order_url
        }
        return self.render("emails/payment_confirmation.html", context)
    
    def render_login_alert(self, username: str, login_time: str, login_location: str, 
                          device_info: str, ip_address: str, secure_account_url: str) -> str:
        """Render new login alert template"""
        context = {
            "username": username,
            "login_time": login_time,
            "login_location": login_location,
            "device_info": device_info,
            "ip_address": ip_address,
            "secure_account_url": secure_account_url
        }
        return self.render("emails/login_alert.html", context)
    
    def render_security_alert(self, username: str, alert_type: str, alert_description: str,
                             alert_time: str, alert_location: str, secure_account_url: str) -> str:
        """Render security alert template"""
        context = {
            "username": username,
            "alert_type": alert_type,
            "alert_description": alert_description,
            "alert_time": alert_time,
            "alert_location": alert_location,
            "secure_account_url": secure_account_url
        }
        return self.render("emails/security_alert.html", context)
    
    def render_goal_achieved(self, username: str, goal_title: str, goal_value: str, 
                            goal_unit: str, completion_date: str, app_url: str) -> str:
        """Render goal achieved template"""
        context = {
            "username": username,
            "goal_title": goal_title,
            "goal_value": goal_value,
            "goal_unit": goal_unit,
            "completion_date": completion_date,
            "app_url": app_url
        }
        return self.render("emails/goal_achieved.html", context)
    
    def render_new_book_release(self, username: str, book_title: str, book_author: str,
                               book_description: str, book_category: str, book_price: float,
                               book_url: str, unsubscribe_url: str) -> str:
        """Render new book release notification template"""
        context = {
            "username": username,
            "book_title": book_title,
            "book_author": book_author,
            "book_description": book_description,
            "book_category": book_category,
            "book_price": book_price,
            "book_url": book_url,
            "unsubscribe_url": unsubscribe_url
        }
        return self.render("emails/new_book_release.html", context)
    
    def render_promotional_offer(self, username: str, offer_title: str, offer_description: str,
                                discount_percentage: int, promo_code: str, expiry_date: str,
                                shop_url: str) -> str:
        """Render promotional offer template"""
        context = {
            "username": username,
            "offer_title": offer_title,
            "offer_description": offer_description,
            "discount_percentage": discount_percentage,
            "promo_code": promo_code,
            "expiry_date": expiry_date,
            "shop_url": shop_url
        }
        return self.render("emails/promotional_offer.html", context)
    
    def render_account_deactivation(self, username: str, reactivation_url: str) -> str:
        """Render account deactivation template"""
        context = {
            "username": username,
            "reactivation_url": reactivation_url
        }
        return self.render("emails/account_deactivation.html", context)
    
    def render_account_deleted(self, username: str) -> str:
        """Render account deleted template"""
        context = {
            "username": username
        }
        return self.render("emails/account_deleted.html", context)
    
    def render_order_rejected(self, username: str, order_id: str, rejection_reason: str,
                             support_url: str) -> str:
        """Render order rejected template"""
        context = {
            "username": username,
            "order_id": order_id,
            "rejection_reason": rejection_reason,
            "support_url": support_url
        }
        return self.render("emails/order_rejected.html", context)
    
    def render_refund_processed(self, username: str, order_id: str, refund_amount: float,
                               refund_date: str, account_url: str) -> str:
        """Render refund processed template"""
        context = {
            "username": username,
            "order_id": order_id,
            "refund_amount": refund_amount,
            "refund_date": refund_date,
            "account_url": account_url
        }
        return self.render("emails/refund_processed.html", context)
    
    def render_newsletter_subscription(self, username: str, unsubscribe_url: str) -> str:
        """Render newsletter subscription confirmation template"""
        context = {
            "username": username,
            "unsubscribe_url": unsubscribe_url
        }
        return self.render("emails/newsletter_subscription.html", context)
    
    def render_system_maintenance(self, maintenance_title: str, maintenance_message: str,
                                 start_time: str, estimated_duration: str, support_url: str) -> str:
        """Render system maintenance notification template"""
        context = {
            "maintenance_title": maintenance_title,
            "maintenance_message": maintenance_message,
            "start_time": start_time,
            "estimated_duration": estimated_duration,
            "support_url": support_url
        }
        return self.render("emails/system_maintenance.html", context)


def get_template_manager(db_session: Optional[Session] = None) -> TemplateManager:
    """Get template manager instance with optional database session
    
    Args:
        db_session: Optional database session for loading templates from DB
        
    Returns:
        TemplateManager instance
    """
    return TemplateManager(db_session=db_session)
