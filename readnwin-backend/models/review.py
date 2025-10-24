from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    title = Column(String)
    review_text = Column(Text)
    comment = Column(Text)
    is_verified_purchase = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    is_helpful_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="reviews")
    book = relationship("Book", back_populates="reviews")