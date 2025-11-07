from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from core.storage import storage
from models.user import User
from models.blog import BlogPost
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/admin/blog", tags=["admin", "blog"])

@router.get("/posts")
def get_admin_blog_posts(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get blog posts for admin management"""
    check_admin_access(current_user)
    
    try:
        query = db.query(BlogPost)
        
        # Apply filters
        if status:
            is_published = status == 'published'
            query = query.filter(BlogPost.is_published == is_published)
        
        if category:
            query = query.filter(BlogPost.category == category)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (BlogPost.title.ilike(search_term)) |
                (BlogPost.content.ilike(search_term))
            )
        
        posts = query.all()
        
        posts_data = []
        for post in posts:
            # Get author name from first_name and last_name
            author_name = 'Admin'
            if post.author:
                if post.author.first_name and post.author.last_name:
                    author_name = f"{post.author.first_name} {post.author.last_name}"
                elif post.author.first_name:
                    author_name = post.author.first_name
                elif post.author.username:
                    author_name = post.author.username
            
            posts_data.append({
                "id": post.id,
                "title": post.title,
                "slug": post.slug,
                "excerpt": post.excerpt,
                "content": post.content,
                "author_id": post.author_id,
                "author_name": author_name,
                "status": "published" if post.is_published else "draft",
                "featured": post.featured or False,
                "featured_image": post.featured_image,
                "featured_image_url": storage.get_url(post.featured_image) if post.featured_image else None,
                "category": post.category or "general",
                "tags": post.tags or [],
                "seo_title": post.seo_title,
                "seo_description": post.seo_description,
                "seo_keywords": post.seo_keywords or [],
                "read_time": max(1, len(post.content.split()) // 200) if post.content else 5,
                "views_count": 0,
                "likes_count": 0,
                "comments_count": 0,
                "published_at": post.published_at.isoformat() if post.published_at else None,
                "created_at": post.created_at.isoformat() if post.created_at else None,
                "updated_at": post.updated_at.isoformat() if post.updated_at else None
            })
        
        return {
            "success": True,
            "posts": posts_data
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
        total_posts = db.query(BlogPost).count()
        published_posts = db.query(BlogPost).filter(BlogPost.is_published == True).count()
        draft_posts = total_posts - published_posts
        
        return {
            "success": True,
            "stats": {
                "total_posts": total_posts,
                "published_posts": published_posts,
                "draft_posts": draft_posts,
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

@router.delete("/{post_id}")
def delete_blog_post(
    post_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete a blog post"""
    check_admin_access(current_user)
    
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    db.delete(post)
    db.commit()
    
    return {"success": True, "message": "Blog post deleted successfully"}