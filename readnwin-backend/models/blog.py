from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class BlogPost(Base):
    __tablename__ = "blog_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    content = Column(Text)
    excerpt = Column(Text)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    featured_image = Column(String)
    featured = Column(Boolean, default=False)
    category = Column(String, default="general")
    tags = Column(JSON, default=list)
    seo_title = Column(String)
    seo_description = Column(Text)
    seo_keywords = Column(JSON, default=list)
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    author = relationship("User")