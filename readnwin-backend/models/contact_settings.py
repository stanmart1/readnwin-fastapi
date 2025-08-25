from sqlalchemy import Column, Integer, String, Text, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from core.database import Base

class ContactMethod(Base):
    __tablename__ = "contact_methods"
    
    id = Column(String, primary_key=True)
    icon = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    contact = Column(String, nullable=False)
    action = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ContactFAQ(Base):
    __tablename__ = "contact_faqs"
    
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class OfficeInfo(Base):
    __tablename__ = "office_info"
    
    id = Column(Integer, primary_key=True, index=True)
    address = Column(Text, nullable=False)
    hours = Column(String, nullable=False)
    parking = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ContactSubject(Base):
    __tablename__ = "contact_subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())