from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from sqlalchemy.sql import func
from core.database import Base

class EmailGateway(Base):
    __tablename__ = "email_gateways"
    
    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String(50), nullable=False)  # resend, smtp
    is_active = Column(Boolean, default=False)
    from_email = Column(String(255))
    from_name = Column(String(255))
    
    # Resend specific
    resend_api_key = Column(Text)
    resend_domain = Column(String(255))
    
    # SMTP specific
    smtp_host = Column(String(255))
    smtp_port = Column(Integer)
    smtp_username = Column(String(255))
    smtp_password = Column(Text)
    smtp_secure = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())