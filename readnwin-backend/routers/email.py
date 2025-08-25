from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr

from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
from services.resend_email_service import get_resend_service

router = APIRouter(prefix="/email", tags=["email"])

class EmailRequest(BaseModel):
    to: List[EmailStr]
    subject: str
    html_content: str
    text_content: Optional[str] = None
    reply_to: Optional[EmailStr] = None

class WelcomeEmailRequest(BaseModel):
    to_email: EmailStr
    first_name: Optional[str] = "Reader"

class PasswordResetEmailRequest(BaseModel):
    to_email: EmailStr
    reset_token: str
    first_name: Optional[str] = "User"

class OrderConfirmationEmailRequest(BaseModel):
    to_email: EmailStr
    order_data: Dict[str, Any]
    first_name: Optional[str] = "Customer"

class ShippingNotificationEmailRequest(BaseModel):
    to_email: EmailStr
    tracking_data: Dict[str, Any]
    first_name: Optional[str] = "Customer"

@router.post("/send")
async def send_email(
    email_request: EmailRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Send a custom email"""
    
    def send_email_task():
        resend_service = get_resend_service(db)
        result = resend_service.send_email(
            to=email_request.to,
            subject=email_request.subject,
            html_content=email_request.html_content,
            text_content=email_request.text_content,
            reply_to=email_request.reply_to
        )
        print(f"Email send result: {result}")
    
    background_tasks.add_task(send_email_task)
    
    return {
        "message": "Email queued for sending",
        "recipients": len(email_request.to)
    }

@router.post("/welcome")
async def send_welcome_email(
    welcome_request: WelcomeEmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Send welcome email to new user"""
    
    def send_welcome_task():
        resend_service = get_resend_service(db)
        result = resend_service.send_welcome_email(
            to_email=welcome_request.to_email,
            first_name=welcome_request.first_name
        )
        print(f"Welcome email result: {result}")
    
    background_tasks.add_task(send_welcome_task)
    
    return {
        "message": "Welcome email queued for sending",
        "recipient": welcome_request.to_email
    }

@router.post("/password-reset")
async def send_password_reset_email(
    reset_request: PasswordResetEmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Send password reset email"""
    
    def send_reset_task():
        resend_service = get_resend_service(db)
        result = resend_service.send_password_reset_email(
            to_email=reset_request.to_email,
            reset_token=reset_request.reset_token,
            first_name=reset_request.first_name
        )
        print(f"Password reset email result: {result}")
    
    background_tasks.add_task(send_reset_task)
    
    return {
        "message": "Password reset email queued for sending",
        "recipient": reset_request.to_email
    }

@router.post("/order-confirmation")
async def send_order_confirmation_email(
    order_request: OrderConfirmationEmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Send order confirmation email"""
    
    def send_order_task():
        resend_service = get_resend_service(db)
        result = resend_service.send_order_confirmation_email(
            to_email=order_request.to_email,
            order_data=order_request.order_data,
            first_name=order_request.first_name
        )
        print(f"Order confirmation email result: {result}")
    
    background_tasks.add_task(send_order_task)
    
    return {
        "message": "Order confirmation email queued for sending",
        "recipient": order_request.to_email
    }

@router.post("/shipping-notification")
async def send_shipping_notification_email(
    shipping_request: ShippingNotificationEmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Send shipping notification email"""
    
    def send_shipping_task():
        resend_service = get_resend_service(db)
        result = resend_service.send_shipping_notification_email(
            to_email=shipping_request.to_email,
            tracking_data=shipping_request.tracking_data,
            first_name=shipping_request.first_name
        )
        print(f"Shipping notification email result: {result}")
    
    background_tasks.add_task(send_shipping_task)
    
    return {
        "message": "Shipping notification email queued for sending",
        "recipient": shipping_request.to_email
    }

@router.get("/test")
async def test_email_service(
    db: Session = Depends(get_db)
):
    """Test email service configuration"""
    
    try:
        from services.resend_email_service import ResendEmailService
        test_service = ResendEmailService()
        
        # Test with a simple email
        result = test_service.send_email(
            to=["test@example.com"],
            subject="ReadnWin Email Service Test",
            html_content="<p>This is a test email from ReadnWin email service.</p>"
        )
        
        return {
            "service_status": "configured" if test_service.api_key else "not_configured",
            "api_key_present": bool(test_service.api_key),
            "test_result": result
        }
    except Exception as e:
        return {
            "service_status": "error",
            "error": str(e)
        }