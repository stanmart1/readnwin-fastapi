from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.book import Category
from models.author import Author
from pydantic import BaseModel, validator
from typing import Optional

router = APIRouter(prefix="/admin", tags=["admin-authors-categories"])

# Pydantic models
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class AuthorCreate(BaseModel):
    name: str
    email: Optional[str] = ""
    bio: Optional[str] = ""
    website: Optional[str] = ""
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Author name is required')
        if len(v.strip()) < 2:
            raise ValueError('Author name must be at least 2 characters')
        if len(v.strip()) > 255:
            raise ValueError('Author name must be less than 255 characters')
        return v.strip()

@router.post("/categories-new")
async def create_category(
    category_data: CategoryCreate,
    current_user = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create new category"""
    check_admin_access(current_user)
    try:
        existing = db.query(Category).filter(Category.name == category_data.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Category already exists")
        
        category = Category(
            name=category_data.name,
            description=category_data.description
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        
        return {"message": "Category created successfully", "id": category.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/authors-new")
async def create_author(
    author_data: AuthorCreate,
    current_user = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create new author"""
    check_admin_access(current_user)
    try:
        if author_data.email:
            existing = db.query(Author).filter(Author.email == author_data.email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Author with this email already exists")
        
        author = Author(
            name=author_data.name,
            email=author_data.email,
            bio=author_data.bio,
            website=author_data.website
        )
        db.add(author)
        db.commit()
        db.refresh(author)
        
        return {"message": "Author created successfully", "id": author.id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Author creation error (authors-new): {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create author: {str(e)}")

@router.post("/authors")
async def create_author_simple(
    author_data: AuthorCreate,
    current_user = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create new author - simple endpoint for book upload"""
    check_admin_access(current_user)
    try:
        # Validate author name
        if not author_data.name or not author_data.name.strip():
            raise HTTPException(status_code=400, detail="Author name is required")
        
        clean_name = author_data.name.strip()
        if len(clean_name) < 2:
            raise HTTPException(status_code=400, detail="Author name must be at least 2 characters")
        
        # Check for existing author by name (case insensitive)
        existing = db.query(Author).filter(Author.name.ilike(clean_name)).first()
        if existing:
            return {"message": "Author already exists", "author": {"id": existing.id, "name": existing.name}}
        
        # Create new author
        author = Author(
            name=clean_name,
            email=author_data.email.strip() if author_data.email else None,
            bio=author_data.bio.strip() if author_data.bio else None
        )
        db.add(author)
        db.commit()
        db.refresh(author)
        
        return {
            "message": "Author created successfully", 
            "author": {
                "id": author.id,
                "name": author.name
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Author creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create author: {str(e)}")

@router.get("/categories-new")
def get_categories(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get all categories"""
    check_admin_access(current_user)
    try:
        categories = db.query(Category).all()
        return [
            {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "book_count": 0,  # Simplified to avoid relationship issues
                "created_at": cat.created_at.isoformat() if cat.created_at else None
            }
            for cat in categories
        ]
    except Exception as e:
        print(f"Error in get_categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/authors-new")
def get_authors(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get all authors"""
    check_admin_access(current_user)
    try:
        authors = db.query(Author).all()
        return [
            {
                "id": author.id,
                "name": author.name,
                "email": author.email,
                "bio": author.bio,
                "website": author.website,
                "is_active": author.is_active,
                "books_count": 0,
                "status": "active",  # Added missing status field
                "created_at": author.created_at.isoformat() if author.created_at else None
            }
            for author in authors
        ]
    except Exception as e:
        print(f"Error in get_authors: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/categories-new/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Delete category"""
    check_admin_access(current_user)
    try:
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        if category.books:
            raise HTTPException(status_code=400, detail="Cannot delete category with books")
        
        db.delete(category)
        db.commit()
        return {"message": "Category deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/authors-new/{author_id}")
def delete_author(
    author_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Delete author"""
    check_admin_access(current_user)
    try:
        author = db.query(Author).filter(Author.id == author_id).first()
        if not author:
            raise HTTPException(status_code=404, detail="Author not found")
        
        db.delete(author)
        db.commit()
        return {"message": "Author deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))