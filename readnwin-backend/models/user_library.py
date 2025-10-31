from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class UserLibrary(Base):
    __tablename__ = "user_library"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    book_id = Column(Integer, ForeignKey("books.id"), index=True)
    format = Column(String, default="ebook")  # ebook, physical, hybrid
    status = Column(String, default="unread", index=True)  # unread, reading, completed
    progress = Column(Float, default=0.0)
    last_read_location = Column(Text, nullable=True)  # EPUB CFI location
    last_read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="library_items")
    book = relationship("Book", back_populates="library_entries")
