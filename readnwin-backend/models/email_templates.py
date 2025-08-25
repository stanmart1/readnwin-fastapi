from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base

class AdminEmailTemplate(Base):
    __tablename__ = "email_templates"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    subject = Column(String(500), nullable=False)
    html_content = Column(Text, nullable=False)
    text_content = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, default="general")
    variables = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    assignments = relationship("AdminEmailFunctionAssignment", back_populates="email_template", cascade="all, delete-orphan")

class AdminEmailFunction(Base):
    __tablename__ = "email_functions"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, default="general")
    required_variables = Column(JSON, nullable=False, default=list)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    assignments = relationship("AdminEmailFunctionAssignment", back_populates="email_function", cascade="all, delete-orphan")

class AdminEmailFunctionAssignment(Base):
    __tablename__ = "email_function_assignments"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    function_id = Column(Integer, ForeignKey("email_functions.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("email_templates.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    priority = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    email_function = relationship("AdminEmailFunction", back_populates="assignments")
    email_template = relationship("AdminEmailTemplate", back_populates="assignments")

class AdminEmailTemplateCategory(Base):
    __tablename__ = "email_template_categories"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=False, default="#6B7280")  # Hex color
    icon = Column(String(100), nullable=False, default="ri-mail-line")
    created_at = Column(DateTime, default=datetime.utcnow)