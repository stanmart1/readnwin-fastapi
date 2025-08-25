from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime

from core.database import Base
from schemas.reading import GoalType

class ReadingSession(Base):
    __tablename__ = "reading_sessions"

    id = Column(Integer, primary_key=True, index=True)
    current_page = Column(Integer, nullable=False)
    total_pages = Column(Integer, nullable=False)
    reading_time = Column(Integer, default=0)  # in seconds
    completion_percentage = Column(Float, default=0.0)
    
    # Foreign Keys
    book_id = Column(Integer, ForeignKey("books.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    book = relationship("Book", back_populates="reading_sessions")
    user = relationship("User", back_populates="reading_sessions")

class ReadingGoal(Base):
    __tablename__ = "reading_goals"

    id = Column(Integer, primary_key=True, index=True)
    goal_type = Column(SQLEnum(GoalType), nullable=False)
    target_value = Column(Integer, nullable=False)
    current_value = Column(Integer, default=0)
    completion_percentage = Column(Float, default=0.0)
    description = Column(String, nullable=True)
    
    # Time period
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"))

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="reading_goals")
