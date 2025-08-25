from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, DateTime
from sqlalchemy.sql import func
from core.database import Base

class AboutContent(Base):
    __tablename__ = "about_content"
    
    id = Column(Integer, primary_key=True, index=True)
    section = Column(String(50), nullable=False, unique=True)  # hero, mission, values, etc.
    content = Column(JSON, nullable=False)  # Store section-specific content as JSON
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())