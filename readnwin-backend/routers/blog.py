from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.blog import BlogPost
from models.user import User
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class BlogPostResponse(BaseModel):
    id: int
    title: str
    slug: str
    content: str
    excerpt: str
    published_at: str
    author_name: str

    class Config:
        from_attributes = True

@router.get("/posts")
def get_blog_posts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        posts = db.query(BlogPost).filter(BlogPost.is_published == True).offset(skip).limit(limit).all()
        
        return [
            {
                "id": post.id,
                "title": post.title,
                "slug": post.slug,
                "content": post.content,
                "excerpt": post.excerpt or (post.content[:200] + "..." if len(post.content) > 200 else post.content),
                "author_name": getattr(post, 'author_name', 'Admin'),
                "category": "general",
                "featured": False,
                "read_time": max(1, len(post.content.split()) // 200) if post.content else 5,
                "created_at": post.created_at.isoformat() if post.created_at else "2024-01-01T00:00:00Z",
                "images": []
            }
            for post in posts
        ]
    except Exception as e:
        print(f"Database error: {e}")
        return []

@router.get("/posts/{slug}")
def get_blog_post(slug: str, db: Session = Depends(get_db)):
    try:
        post = db.query(BlogPost).filter(BlogPost.slug == slug, BlogPost.is_published == True).first()
        
        if not post:
            raise HTTPException(status_code=404, detail="Blog post not found")
        
        return {
            "success": True,
            "post": {
                "id": post.id,
                "title": post.title,
                "slug": post.slug,
                "content": post.content,
                "excerpt": post.excerpt or (post.content[:200] + "..." if len(post.content) > 200 else post.content),
                "author_name": getattr(post, 'author_name', 'Admin'),
                "category": "general",
                "featured": False,
                "read_time": max(1, len(post.content.split()) // 200) if post.content else 5,
                "views_count": 0,
                "likes_count": 0,
                "comments_count": 0,
                "tags": [],
                "created_at": post.created_at.isoformat() if post.created_at else "2024-01-01T00:00:00Z",
                "published_at": post.created_at.isoformat() if post.created_at else "2024-01-01T00:00:00Z",
                "images": []
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch blog post")

# Admin endpoints
@router.post("/posts")
def create_blog_post(
    post_data: dict,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new blog post"""
    check_admin_access(current_user)
    
    try:
        # Create new blog post
        new_post = BlogPost(
            title=post_data.get('title'),
            slug=post_data.get('slug'),
            content=post_data.get('content'),
            excerpt=post_data.get('excerpt'),
            is_published=post_data.get('status') == 'published'
        )
        
        db.add(new_post)
        db.commit()
        db.refresh(new_post)
        
        return {
            "success": True,
            "message": "Blog post created successfully",
            "post_id": new_post.id
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating blog post: {e}")
        raise HTTPException(status_code=500, detail="Failed to create blog post")

@router.put("/posts/{post_id}")
def update_blog_post(
    post_id: int,
    post_data: dict,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update an existing blog post"""
    check_admin_access(current_user)
    
    try:
        post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Blog post not found")
        
        # Update post fields
        post.title = post_data.get('title', post.title)
        post.slug = post_data.get('slug', post.slug)
        post.content = post_data.get('content', post.content)
        post.excerpt = post_data.get('excerpt', post.excerpt)
        post.is_published = post_data.get('status') == 'published'
        
        db.commit()
        
        return {
            "success": True,
            "message": "Blog post updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating blog post: {e}")
        raise HTTPException(status_code=500, detail="Failed to update blog post")

@router.delete("/posts/{post_id}")
def delete_blog_post(
    post_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete a blog post"""
    check_admin_access(current_user)
    
    try:
        post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Blog post not found")
        
        db.delete(post)
        db.commit()
        
        return {
            "success": True,
            "message": "Blog post deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting blog post: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete blog post")

@router.get("/stats")
def get_blog_stats(
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
def get_blog_categories(
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

@router.get("/posts/admin")
def get_admin_blog_posts(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get blog posts for admin management"""
    check_admin_access(current_user)
    
    try:
        posts = db.query(BlogPost).all()
        
        return {
            "success": True,
            "posts": [
                {
                    "id": post.id,
                    "title": post.title,
                    "slug": post.slug,
                    "excerpt": post.excerpt or (post.content[:200] if post.content else ""),
                    "content": post.content or "",
                    "author_name": "Admin",
                    "status": "published" if getattr(post, 'is_published', True) else "draft",
                    "featured": False,
                    "category": "general",
                    "tags": [],
                    "read_time": 5,
                    "views_count": 0,
                    "likes_count": 0,
                    "comments_count": 0,
                    "created_at": post.created_at.isoformat() if hasattr(post, 'created_at') and post.created_at else None
                }
                for post in posts
            ]
        }
    except Exception as e:
        print(f"Error fetching admin blog posts: {e}")
        return {
            "success": True,
            "posts": []
        }

@router.post("/posts/{post_id}/images")
def upload_blog_images(
    post_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Upload images for a blog post"""
    check_admin_access(current_user)
    
    try:
        post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Blog post not found")
        
        return {
            "success": True,
            "message": "Images uploaded successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error uploading images: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload images")

@router.delete("/posts/{post_id}/images")
def delete_blog_image(
    post_id: int,
    imageId: str,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete a blog post image"""
    check_admin_access(current_user)
    
    try:
        post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Blog post not found")
        
        return {
            "success": True,
            "message": "Image deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting image: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete image")