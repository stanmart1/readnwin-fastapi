from pydantic import BaseModel, constr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ReadingSessionBase(BaseModel):
    book_id: int
    current_page: int
    total_pages: int
    reading_time: int  # in seconds
    completion_percentage: float

class ReadingSessionCreate(ReadingSessionBase):
    pass

class ReadingSessionUpdate(BaseModel):
    current_page: Optional[int]
    reading_time: Optional[int]
    completion_percentage: Optional[float]

class ReadingSessionResponse(ReadingSessionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GoalType(str, Enum):
    BOOKS_READ = "books_read"
    READING_TIME = "reading_time"
    PAGES_READ = "pages_read"

class ReadingGoalBase(BaseModel):
    goal_type: GoalType
    target_value: int
    start_date: datetime
    end_date: datetime
    description: Optional[str]

class ReadingGoalCreate(ReadingGoalBase):
    pass

class ReadingGoalResponse(ReadingGoalBase):
    id: int
    user_id: int
    current_value: int
    completion_percentage: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TextToSpeechRequest(BaseModel):
    text: str
    language: str = "en"
    voice_id: Optional[str]
    speed: Optional[float] = 1.0

class ProgressSync(BaseModel):
    current_page: int
    reading_time: int
    completion_percentage: float
    last_sync: datetime
    device_id: str
