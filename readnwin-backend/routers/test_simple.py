from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.book import Category
from models.author import Author
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["test"])

class SimpleCategory(BaseModel):
    name: str

class SimpleAuthor(BaseModel):
    name: str

@router.post("/test-category")
def test_create_category(
    data: SimpleCategory,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Test category creation with minimal validation"""
    check_admin_access(current_user)
    
    category = Category(name=data.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return {"message": "Category created", "id": category.id}

@router.post("/test-author")
def test_create_author(
    data: SimpleAuthor,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Test author creation with minimal validation"""
    check_admin_access(current_user)
    
    author = Author(name=data.name)
    db.add(author)
    db.commit()
    db.refresh(author)
    
    return {"message": "Author created", "id": author.id}