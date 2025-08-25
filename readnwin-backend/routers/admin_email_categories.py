from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.email_templates import AdminEmailTemplateCategory
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["admin-email-categories"])

class EmailCategoryCreate(BaseModel):
    name: str
    description: str
    color: str
    icon: str

@router.post("/email-categories")
def create_email_category(
    category_data: EmailCategoryCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Create a new email category"""
    check_admin_access(current_user)
    try:
        category = AdminEmailTemplateCategory(
            name=category_data.name,
            description=category_data.description,
            color=category_data.color,
            icon=category_data.icon
        )
        db.add(category)
        db.commit()
        return {"message": "Category created successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/email-categories/{category_id}")
def update_email_category(
    category_id: int,
    category_data: EmailCategoryCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Update an email category"""
    check_admin_access(current_user)
    try:
        category = db.query(AdminEmailTemplateCategory).filter(AdminEmailTemplateCategory.id == category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        category.name = category_data.name
        category.description = category_data.description
        category.color = category_data.color
        category.icon = category_data.icon
        
        db.commit()
        return {"message": "Category updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/email-categories/{category_id}")
def delete_email_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Delete an email category"""
    check_admin_access(current_user)
    try:
        category = db.query(AdminEmailTemplateCategory).filter(AdminEmailTemplateCategory.id == category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        db.delete(category)
        db.commit()
        return {"message": "Category deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))