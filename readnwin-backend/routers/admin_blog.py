from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.user import User
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/admin/blog", tags=["admin", "blog"])

@router.get("/posts")
def get_admin_blog_posts(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get blog posts for admin management"""
    check_admin_access(current_user)
    
    try:
        return {
            "success": True,
            "posts": []
        }
    except Exception as e:
        print(f"Error fetching admin blog posts: {e}")
        return {
            "success": True,
            "posts": []
        }

@router.get("/stats")
def get_admin_blog_stats(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get blog statistics for admin"""
    check_admin_access(current_user)
    
    try:
        return {
            "success": True,
            "stats": {
                "total_posts": 0,
                "published_posts": 0,
                "draft_posts": 0,
                "total_views": 0,
                "total_likes": 0,
                "total_comments": 0,
                "by_category": {}
            }
        }
    except Exception as e:
        print(f"Error fetching blog stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch blog statistics")

@router.get("/categories")
def get_admin_blog_categories(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get blog categories for admin"""
    check_admin_access(current_user)
    
    try:
        categories = [
            {"name": "general", "slug": "general", "description": "General posts", "color": "#6B7280", "icon": "ri-book-open-line", "is_active": True},
            {"name": "technology", "slug": "technology", "description": "Technology posts", "color": "#3B82F6", "icon": "ri-computer-line", "is_active": True},
            {"name": "books", "slug": "books", "description": "Book reviews and recommendations", "color": "#10B981", "icon": "ri-book-line", "is_active": True}
        ]
        
        return {
            "success": True,
            "categories": categories
        }
    except Exception as e:
        print(f"Error fetching blog categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch blog categories")