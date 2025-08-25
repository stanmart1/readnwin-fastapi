from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum

from core.database import Base

class EmailTemplateType(str, Enum):
    WELCOME = "welcome"
    VERIFICATION = "verification"
    PASSWORD_RESET = "password_reset"
    ORDER_CONFIRMATION = "order_confirmation"
    SHIPPING_NOTIFICATION = "shipping_notification"
    NEWSLETTER = "newsletter"

class EmailGatewayProvider(str, Enum):
    RESEND = "resend"
    SENDGRID = "sendgrid"
    MAILGUN = "mailgun"
    SES = "ses"
    SMTP = "smtp"
    POSTMARK = "postmark"

class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, nullable=False, unique=True)
    subject = Column(String, nullable=False)
    html_content = Column(String, nullable=False)
    text_content = Column(String)
    description = Column(String)
    category = Column(String, default="general")
    variables = Column(String, default="{}")  # JSON string
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EmailGatewayConfig(Base):
    __tablename__ = "email_gateway_config"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String, nullable=False)  # resend, smtp, sendgrid, etc.
    api_key = Column(String)  # For API-based providers like Resend
    smtp_host = Column(String)
    smtp_port = Column(Integer)
    username = Column(String)
    password = Column(String)
    use_tls = Column(Boolean, default=True)
    use_ssl = Column(Boolean, default=False)
    from_email = Column(String, nullable=False)
    from_name = Column(String, nullable=False)
    domain = Column(String)  # For providers like Resend
    region = Column(String)  # For providers like AWS SES
    is_active = Column(Boolean, default=True)
    send_rate_limit = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
