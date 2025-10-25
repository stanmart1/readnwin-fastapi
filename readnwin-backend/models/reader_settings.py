from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class ReaderSettings(Base):
    __tablename__ = "reader_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    font_size = Column(Float, default=1.0)
    font_family = Column(String, default="serif")  # serif, sans-serif, monospace
    theme = Column(String, default="light")  # light, dark, sepia
    line_spacing = Column(Float, default=1.6)
    page_width = Column(Integer, default=800)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")

class Bookmark(Base):
    __tablename__ = "bookmarks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    book_id = Column(Integer, ForeignKey("books.id"))
    page_number = Column(Integer)
    title = Column(String(255))
    note_text = Column(String, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    book = relationship("Book")
