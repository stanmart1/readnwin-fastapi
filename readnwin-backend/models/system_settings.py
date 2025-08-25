from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, Float
from sqlalchemy.sql import func
from core.database import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    data_type = Column(String(50), nullable=False, default="string")  # string, integer, boolean, json, float
    category = Column(String(100), nullable=False, default="general")
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False)  # Can be accessed by non-admin users
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())