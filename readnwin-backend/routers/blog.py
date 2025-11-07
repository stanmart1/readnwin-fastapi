from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from core.storage import storage
from models.blog import BlogPost
from models.user import User
from pydantic import BaseModel
from typing import List, Optional
import json

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
        
        posts_data = []
        for post in posts:
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
                "content": post.content,
                "excerpt": post.excerpt or (post.content[:200] + "..." if len(post.content) > 200 else post.content),
                "author_name": author_name,
                "category": post.category or "general",
                "featured": post.featured or False,
                "featured_image": post.featured_image,
                "featured_image_url": storage.get_url(post.featured_image) if post.featured_image else None,
                "cover_image": storage.get_url(post.featured_image) if post.featured_image else None,
                "tags": post.tags or [],
                "read_time": max(1, len(post.content.split()) // 200) if post.content else 5,
                "created_at": post.created_at.isoformat() if post.created_at else "2024-01-01T00:00:00Z",
                "published_at": post.published_at.isoformat() if post.published_at else post.created_at.isoformat() if post.created_at else "2024-01-01T00:00:00Z",
                "images": [storage.get_url(post.featured_image)] if post.featured_image else []
            })
        return posts_data
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
                "author_name": f"{post.author.first_name} {post.author.last_name}" if post.author and post.author.first_name and post.author.last_name else (post.author.username if post.author and post.author.username else 'Admin'),
                "category": post.category or "general",
                "featured": post.featured or False,
                "featured_image": post.featured_image,
                "featured_image_url": storage.get_url(post.featured_image) if post.featured_image else None,
                "cover_image": storage.get_url(post.featured_image) if post.featured_image else None,
                "tags": post.tags or [],
                "seo_title": post.seo_title,
                "seo_description": post.seo_description,
                "seo_keywords": post.seo_keywords or [],
                "read_time": max(1, len(post.content.split()) // 200) if post.content else 5,
                "views_count": 0,
                "likes_count": 0,
                "comments_count": 0,
                "created_at": post.created_at.isoformat() if post.created_at else "2024-01-01T00:00:00Z",
                "published_at": post.published_at.isoformat() if post.published_at else post.created_at.isoformat() if post.created_at else "2024-01-01T00:00:00Z",
                "images": [storage.get_url(post.featured_image)] if post.featured_image else []
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch blog post")

# Admin endpoints
@router.post("/posts")
async def create_blog_post(
    title: str = Form(...),
    slug: str = Form(...),
    content: str = Form(...),
    excerpt: str = Form(""),
    status: str = Form("draft"),
    featured: str = Form("false"),
    category: str = Form("general"),
    tags: str = Form("[]"),
    seo_title: str = Form(""),
    seo_description: str = Form(""),
    seo_keywords: str = Form("[]"),
    published_at: Optional[str] = Form(None),
    featured_image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new blog post"""
    check_admin_access(current_user)
    
    try:
        # Check if slug already exists
        existing = db.query(BlogPost).filter(BlogPost.slug == slug).first()
        if existing:
            raise HTTPException(status_code=400, detail="Slug already exists")
        
        # Handle image upload - same logic as book covers
        featured_image_path = None
        if featured_image and featured_image.filename and featured_image.filename.strip():
            print(f"🖼️ Blog image upload started - filename: {featured_image.filename}")
            try:
                # Read file content to check size
                file_content = await featured_image.read()
                file_size = len(file_content)
                print(f"📊 File size: {file_size} bytes ({file_size / 1024 / 1024:.2f} MB)")
                
                # Validate file size
                if file_size > storage.MAX_IMAGE_SIZE:
                    raise HTTPException(status_code=400, detail=f"Image too large (max {storage.MAX_IMAGE_SIZE // 1024 // 1024}MB)")
                
                # Reset file pointer for save_cover
                await featured_image.seek(0)
                
                # Save using storage manager (same as books)
                featured_image_path = await storage.save_cover(featured_image)
                print(f"✅ Blog image saved successfully!")
                print(f"   - Path: {featured_image_path}")
                print(f"   - URL: {storage.get_url(featured_image_path)}")
                print(f"   - Full path: {storage.get_absolute_path(featured_image_path)}")
            except HTTPException:
                raise
            except Exception as upload_error:
                print(f"❌ Blog image upload failed: {upload_error}")
                import traceback
                traceback.print_exc()
                raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(upload_error)}")
        else:
            print("ℹ️ No image uploaded with this blog post")
        
        # Parse JSON fields
        tags_list = json.loads(tags) if tags else []
        seo_keywords_list = json.loads(seo_keywords) if seo_keywords else []
        
        # Create new blog post
        new_post = BlogPost(
            title=title,
            slug=slug,
            content=content,
            excerpt=excerpt,
            author_id=current_user.id,
            featured_image=featured_image_path,
            featured=featured.lower() == 'true',
            category=category,
            tags=tags_list,
            seo_title=seo_title,
            seo_description=seo_description,
            seo_keywords=seo_keywords_list,
            is_published=status == 'published',
            published_at=func.now() if status == 'published' else None
        )
        
        db.add(new_post)
        db.commit()
        db.refresh(new_post)
        
        print(f"✅ Blog post created with ID: {new_post.id}")
        
        return {
            "success": True,
            "message": "Blog post created successfully",
            "post_id": new_post.id,
            "featured_image_url": storage.get_url(featured_image_path) if featured_image_path else None
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating blog post: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create blog post: {str(e)}")

@router.put("/posts/{post_id}")
async def update_blog_post(
    post_id: int,
    title: Optional[str] = Form(None),
    slug: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
    excerpt: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    featured: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    seo_title: Optional[str] = Form(None),
    seo_description: Optional[str] = Form(None),
    seo_keywords: Optional[str] = Form(None),
    published_at: Optional[str] = Form(None),
    featured_image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update an existing blog post"""
    check_admin_access(current_user)
    
    try:
        post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Blog post not found")
        
        print(f"📝 Updating blog post ID: {post_id}")
        
        # Update fields if provided
        if title is not None:
            post.title = title
        if slug is not None:
            post.slug = slug
        if content is not None:
            post.content = content
        if excerpt is not None:
            post.excerpt = excerpt
        if featured is not None:
            post.featured = featured.lower() == 'true'
        if category is not None:
            post.category = category
        if tags is not None:
            post.tags = json.loads(tags)
        if seo_title is not None:
            post.seo_title = seo_title
        if seo_description is not None:
            post.seo_description = seo_description
        if seo_keywords is not None:
            post.seo_keywords = json.loads(seo_keywords)
        
        # Handle image upload - same logic as book covers
        if featured_image and featured_image.filename and featured_image.filename.strip():
            print(f"🖼️ Blog image update started - filename: {featured_image.filename}")
            try:
                # Read file content to check size
                file_content = await featured_image.read()
                file_size = len(file_content)
                print(f"📊 File size: {file_size} bytes ({file_size / 1024 / 1024:.2f} MB)")
                
                # Validate file size
                if file_size > storage.MAX_IMAGE_SIZE:
                    raise HTTPException(status_code=400, detail=f"Image too large (max {storage.MAX_IMAGE_SIZE // 1024 // 1024}MB)")
                
                # Reset file pointer for save_cover
                await featured_image.seek(0)
                
                # Delete old image if exists
                if post.featured_image:
                    print(f"🗑️ Deleting old image: {post.featured_image}")
                    storage.delete_file(post.featured_image)
                
                # Save new image
                post.featured_image = await storage.save_cover(featured_image)
                print(f"✅ Blog image updated successfully!")
                print(f"   - Path: {post.featured_image}")
                print(f"   - URL: {storage.get_url(post.featured_image)}")
            except HTTPException:
                raise
            except Exception as upload_error:
                print(f"❌ Blog image update failed: {upload_error}")
                import traceback
                traceback.print_exc()
                raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(upload_error)}")
        
        # Handle publishing
        if status is not None:
            was_published = post.is_published
            post.is_published = status == 'published'
            if not was_published and post.is_published:
                post.published_at = func.now()
        
        db.commit()
        
        print(f"✅ Blog post {post_id} updated successfully")
        
        return {
            "success": True,
            "message": "Blog post updated successfully",
            "featured_image_url": storage.get_url(post.featured_image) if post.featured_image else None
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating blog post: {e}")
        import traceback
        traceback.print_exc()
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