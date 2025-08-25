from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

class TimeMetrics(BaseModel):
    total_time: int  # in seconds
    average_session_time: int
    longest_session: int
    shortest_session: int
    peak_reading_hours: List[int]

class PageMetrics(BaseModel):
    total_pages: int
    average_pages_per_session: float
    reading_speed_wpm: float
    completion_rate: float

class ReadingAnalyticsResponse(BaseModel):
    time_metrics: TimeMetrics
    page_metrics: PageMetrics
    books_started: int
    books_completed: int
    favorite_genres: List[Dict[str, Any]]
    reading_streak: int
    period_start: datetime
    period_end: datetime

class UserEngagementMetrics(BaseModel):
    total_users_active: int
    new_users: int
    returning_users: int
    average_session_duration: float
    engagement_rate: float
    retention_rate: float
    user_segments: Dict[str, int]

class TimeframeStats(BaseModel):
    timeframe: str
    total_reading_time: int
    unique_readers: int
    books_accessed: int
    average_completion_rate: float
    popular_reading_times: List[Dict[str, Any]]

class DetailedReadingStats(BaseModel):
    user_id: Optional[int]
    book_id: Optional[int]
    reading_patterns: Dict[str, Any]
    comprehension_metrics: Dict[str, float]
    focus_scores: List[float]
    session_details: List[Dict[str, Any]]
    annotations_count: int
    bookmarks_count: int

class AnalyticsReport(BaseModel):
    report_type: str
    generated_at: datetime
    period_start: datetime
    period_end: datetime
    metrics: Dict[str, Any]
    summary: str
    recommendations: List[str]
    charts_data: Dict[str, Any]
