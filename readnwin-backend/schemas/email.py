from pydantic import BaseModel, EmailStr, HttpUrl, validator
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class EmailTemplateType(str, Enum):
    WELCOME = "welcome"
    ORDER_CONFIRMATION = "order_confirmation"
    PASSWORD_RESET = "password_reset"
    EMAIL_VERIFICATION = "email_verification"
    ORDER_SHIPPING = "order_shipping"
    READING_GOAL_ACHIEVED = "reading_goal_achieved"

class EmailGatewayProvider(str, Enum):
    SMTP = "smtp"
    SENDGRID = "sendgrid"
    MAILGUN = "mailgun"
    SES = "ses"

class EmailTemplateBase(BaseModel):
    name: str
    subject: str
    template_type: EmailTemplateType
    body_html: str
    body_text: Optional[str]
    variables: Dict[str, str]
    is_active: bool = True

class EmailTemplateCreate(EmailTemplateBase):
    pass

class EmailTemplateUpdate(EmailTemplateBase):
    pass

class EmailTemplateResponse(EmailTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EmailGatewayConfigBase(BaseModel):
    provider: EmailGatewayProvider
    settings: Dict[str, Any]
    is_active: bool = True
    send_rate_limit: Optional[int]

class EmailGatewayConfigCreate(EmailGatewayConfigBase):
    pass

class EmailGatewayConfigResponse(EmailGatewayConfigBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EmailTestRequest(BaseModel):
    template_id: int
    recipient_email: EmailStr
    test_variables: Optional[Dict[str, Any]]
