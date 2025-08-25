from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from core.database import Base

class SecurityLog(Base):
    __tablename__ = "security_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    event_type = Column(String, nullable=False)  # login_attempt, login_success, login_failed, logout, token_refresh, suspicious_activity
    ip_address = Column(String, nullable=False)
    user_agent = Column(Text)
    details = Column(Text)  # JSON string with additional details
    risk_level = Column(String, default="low")  # low, medium, high, critical
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True)
    ip_address = Column(String, nullable=False)
    success = Column(Boolean, default=False)
    failure_reason = Column(String)  # invalid_credentials, account_locked, rate_limited
    attempted_at = Column(DateTime(timezone=True), server_default=func.now())
    user_agent = Column(Text)