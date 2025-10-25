from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.book import Category
from models.author import Author
from models.order import Order, OrderItem
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
    avatar_url: Optional[str] = ""
    status: Optional[str] = "active"
    
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
            bio=author_data.bio.strip() if author_data.bio else None,
            avatar_url=author_data.avatar_url.strip() if author_data.avatar_url else None,
            is_active=author_data.status == 'active' if author_data.status else True
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

@router.get("/authors")
def get_authors(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get all authors with pagination and filters"""
    check_admin_access(current_user)
    try:
        from models.book import Book
        
        # Query authors from Author table with book counts
        query = db.query(Author)
        
        # Apply filters
        if search:
            query = query.filter(
                (Author.name.ilike(f"%{search}%")) | 
                (Author.email.ilike(f"%{search}%"))
            )
        
        if status:
            is_active = status == 'active'
            query = query.filter(Author.is_active == is_active)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        authors = query.offset((page - 1) * limit).limit(limit).all()
        
        # Build response with book and sales data
        authors_data = []
        for author in authors:
            # Count books by author_id
            book_count = db.query(func.count(Book.id)).filter(Book.author_id == author.id).scalar() or 0
            
            # Get sales statistics
            sales_stats = db.query(
                func.count(OrderItem.id).label('total_sales'),
                func.sum(OrderItem.price * OrderItem.quantity).label('total_revenue')
            ).join(Order).join(Book).filter(
                Book.author_id == author.id,
                Order.status == 'completed'
            ).first()
            
            authors_data.append({
                "id": author.id,
                "name": author.name,
                "email": author.email,
                "books_count": book_count,
                "status": "active" if author.is_active else "inactive",
                "created_at": author.created_at.isoformat() if author.created_at else None,
                "total_sales": sales_stats.total_sales or 0 if sales_stats else 0,
                "revenue": float(sales_stats.total_revenue or 0) if sales_stats else 0
            })
        
        return {
            "authors": authors_data,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }
    except Exception as e:
        print(f"Error in get_authors: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/authors-new")
def get_authors_simple(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get all authors - simple list for dropdowns"""
    check_admin_access(current_user)
    try:
        authors = db.query(Author).filter(Author.is_active == True).all()
        return [
            {
                "id": author.id,
                "name": author.name,
                "email": author.email,
                "bio": author.bio,
                "website": author.website,
                "is_active": author.is_active,
                "books_count": 0,
                "status": "active",
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

@router.put("/authors/{author_id}")
async def update_author(
    author_id: int,
    author_data: AuthorCreate,
    current_user = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update author"""
    check_admin_access(current_user)
    try:
        author = db.query(Author).filter(Author.id == author_id).first()
        if not author:
            raise HTTPException(status_code=404, detail="Author not found")
        
        # Check email uniqueness if changed
        if author_data.email and author_data.email != author.email:
            existing = db.query(Author).filter(
                Author.email == author_data.email,
                Author.id != author_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Author with this email already exists")
        
        # Update fields
        author.name = author_data.name
        author.email = author_data.email if author_data.email else None
        author.bio = author_data.bio if author_data.bio else None
        author.website = author_data.website if author_data.website else None
        author.avatar_url = author_data.avatar_url if author_data.avatar_url else None
        author.is_active = author_data.status == 'active' if author_data.status else True
        
        db.commit()
        db.refresh(author)
        
        return {"message": "Author updated successfully", "id": author.id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/authors/{author_id}")
def delete_author_by_id(
    author_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Delete author by ID"""
    check_admin_access(current_user)
    try:
        author = db.query(Author).filter(Author.id == author_id).first()
        if not author:
            raise HTTPException(status_code=404, detail="Author not found")
        
        # Check if author has books
        from models.book import Book
        book_count = db.query(func.count(Book.id)).filter(Book.author_id == author_id).scalar()
        if book_count > 0:
            raise HTTPException(status_code=400, detail=f"Cannot delete author with {book_count} books")
        
        db.delete(author)
        db.commit()
        return {"message": "Author deleted successfully"}
    except HTTPException:
        raise
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