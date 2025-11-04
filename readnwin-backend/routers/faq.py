from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.faq import FAQ, FAQCategory
from models.user import User
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import bleach

router = APIRouter()

class FAQResponse(BaseModel):
    id: int
    question: str
    answer: str
    category: str

    class Config:
        from_attributes = True

@router.get("")
@router.get("/")
def get_faqs(db: Session = Depends(get_db)):
    try:
        # First check all FAQs to debug
        all_faqs = db.query(FAQ).all()
        print(f"Total FAQs in database: {len(all_faqs)}")
        for faq in all_faqs:
            print(f"FAQ {faq.id}: is_active={faq.is_active}, question='{faq.question[:50]}...'")
        
        # Get active FAQs
        faqs = db.query(FAQ).filter(FAQ.is_active == True).order_by(FAQ.priority.desc(), FAQ.order_index).all()
        print(f"Active FAQs found: {len(faqs)}")
        
        return {
            "success": True,
            "data": {
                "faqs": [
                    {
                        "id": faq.id,
                        "question": faq.question,
                        "answer": faq.answer,
                        "category": faq.category or "general",
                        "priority": faq.priority or 0,
                        "is_active": faq.is_active,
                        "is_featured": faq.is_featured or False,
                        "view_count": faq.view_count or 0,
                        "created_at": faq.created_at.isoformat() if faq.created_at else None
                    }
                    for faq in faqs
                ],
                "total": len(faqs)
            }
        }
    except Exception as e:
        print(f"Database error: {e}")
        return {"success": False, "data": {"faqs": [], "total": 0}}

@router.get("/admin")
def get_admin_faqs(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get FAQs for admin management"""
    check_admin_access(current_user)
    
    try:
        faqs = db.query(FAQ).order_by(FAQ.priority.desc(), FAQ.order_index).all()
        return {
            "success": True,
            "data": {
                "faqs": [
                    {
                        "id": faq.id,
                        "question": faq.question,
                        "answer": faq.answer,
                        "category": faq.category or "general",
                        "priority": faq.priority or 0,
                        "is_active": faq.is_active,
                        "is_featured": faq.is_featured or False,
                        "view_count": faq.view_count or 0,
                        "created_at": faq.created_at.isoformat() if faq.created_at else None,
                        "updated_at": faq.updated_at.isoformat() if faq.updated_at else None
                    }
                    for faq in faqs
                ],
                "total": len(faqs)
            }
        }
    except Exception as e:
        print(f"Error fetching admin FAQs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch FAQs")

@router.post("/")
def create_faq(
    faq_data: Dict[str, Any],
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create new FAQ"""
    check_admin_access(current_user)
    
    try:
        new_faq = FAQ(
            question=faq_data['question'],
            answer=faq_data['answer'],
            category=faq_data.get('category', 'general'),
            priority=faq_data.get('priority', 0),
            is_active=faq_data.get('is_active', True),
            is_featured=faq_data.get('is_featured', False),
            order_index=faq_data.get('order_index', 0)
        )
        db.add(new_faq)
        db.commit()
        db.refresh(new_faq)
        return {"success": True, "data": {"id": new_faq.id}}
    except Exception as e:
        db.rollback()
        print(f"Error creating FAQ: {e}")
        raise HTTPException(status_code=500, detail="Failed to create FAQ")

@router.put("/{faq_id}")
def update_faq(
    faq_id: int,
    faq_data: Dict[str, Any],
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update FAQ"""
    check_admin_access(current_user)
    
    try:
        faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
        if not faq:
            raise HTTPException(status_code=404, detail="FAQ not found")
        
        if 'question' in faq_data:
            faq.question = faq_data['question']
        if 'answer' in faq_data:
            faq.answer = faq_data['answer']
        if 'category' in faq_data:
            faq.category = faq_data['category']
        if 'priority' in faq_data:
            faq.priority = faq_data['priority']
        if 'is_active' in faq_data:
            faq.is_active = faq_data['is_active']
        if 'is_featured' in faq_data:
            faq.is_featured = faq_data['is_featured']
        
        db.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating FAQ: {e}")
        raise HTTPException(status_code=500, detail="Failed to update FAQ")

@router.delete("/{faq_id}")
def delete_faq(
    faq_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete FAQ"""
    check_admin_access(current_user)
    
    try:
        faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
        if not faq:
            raise HTTPException(status_code=404, detail="FAQ not found")
        
        db.delete(faq)
        db.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting FAQ: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete FAQ")

@router.post("/bulk-delete")
def bulk_delete_faqs(
    data: Dict[str, List[int]],
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Bulk delete FAQs"""
    check_admin_access(current_user)
    
    try:
        ids = data.get('ids', [])
        db.query(FAQ).filter(FAQ.id.in_(ids)).delete(synchronize_session=False)
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        print(f"Error bulk deleting FAQs: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete FAQs")

@router.post("/bulk-update")
def bulk_update_faqs(
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Bulk update FAQs"""
    check_admin_access(current_user)
    
    try:
        ids = data.get('ids', [])
        updates = data.get('updates', {})
        
        faqs = db.query(FAQ).filter(FAQ.id.in_(ids)).all()
        for faq in faqs:
            for key, value in updates.items():
                if hasattr(faq, key):
                    setattr(faq, key, value)
        
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        print(f"Error bulk updating FAQs: {e}")
        raise HTTPException(status_code=500, detail="Failed to update FAQs")

# Category endpoints
@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """Get all FAQ categories"""
    try:
        categories = db.query(FAQCategory).filter(FAQCategory.is_active == True).all()
        return {
            "success": True,
            "data": [
                {
                    "id": cat.id,
                    "name": cat.name,
                    "description": cat.description,
                    "icon": cat.icon,
                    "color": cat.color,
                    "is_active": cat.is_active,
                    "created_at": cat.created_at.isoformat() if cat.created_at else None
                }
                for cat in categories
            ]
        }
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return {"success": False, "data": []}

@router.post("/categories")
def create_category(
    category_data: Dict[str, Any],
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create new FAQ category"""
    check_admin_access(current_user)
    
    try:
        new_category = FAQCategory(
            name=category_data['name'],
            description=category_data.get('description'),
            icon=category_data.get('icon'),
            color=category_data.get('color'),
            is_active=category_data.get('is_active', True)
        )
        db.add(new_category)
        db.commit()
        db.refresh(new_category)
        return {"success": True, "data": {"id": new_category.id}}
    except Exception as e:
        db.rollback()
        print(f"Error creating category: {e}")
        raise HTTPException(status_code=500, detail="Failed to create category")

@router.put("/categories/{category_id}")
def update_category(
    category_id: int,
    category_data: Dict[str, Any],
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update FAQ category"""
    check_admin_access(current_user)
    
    try:
        category = db.query(FAQCategory).filter(FAQCategory.id == category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        if 'name' in category_data:
            category.name = category_data['name']
        if 'description' in category_data:
            category.description = category_data['description']
        if 'icon' in category_data:
            category.icon = category_data['icon']
        if 'color' in category_data:
            category.color = category_data['color']
        if 'is_active' in category_data:
            category.is_active = category_data['is_active']
        
        db.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating category: {e}")
        raise HTTPException(status_code=500, detail="Failed to update category")

def sanitize_html_content(content):
    """Sanitize HTML content to prevent XSS"""
    if isinstance(content, str):
        allowed_tags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u']
        allowed_attributes = {}
        return bleach.clean(content, tags=allowed_tags, attributes=allowed_attributes, strip=True)
    elif isinstance(content, dict):
        return {k: sanitize_html_content(v) for k, v in content.items()}
    elif isinstance(content, list):
        return [sanitize_html_content(item) for item in content]
    return content

@router.put("/admin")
def save_admin_faqs(
    faq_data: Dict[str, Any],
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Save FAQs from admin"""
    check_admin_access(current_user)
    
    try:
        sanitized_data = sanitize_html_content(faq_data)
        db.query(FAQ).delete()
        
        for faq_item in sanitized_data.get('faqs', []):
            new_faq = FAQ(
                question=faq_item['question'],
                answer=faq_item['answer'],
                category=faq_item.get('category', 'general'),
                priority=faq_item.get('priority', 0),
                is_active=faq_item.get('is_active', True),
                is_featured=faq_item.get('is_featured', False),
                order_index=faq_item.get('order_index', 0)
            )
            db.add(new_faq)
        
        db.commit()
        return {"message": "FAQs saved successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error saving admin FAQs: {e}")
        raise HTTPException(status_code=500, detail="Failed to save FAQs")

@router.post("/activate-all")
def activate_all_faqs(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Activate all FAQs - useful for fixing inactive FAQs"""
    check_admin_access(current_user)
    
    try:
        updated_count = db.query(FAQ).update({FAQ.is_active: True})
        db.commit()
        return {"success": True, "message": f"Activated {updated_count} FAQs"}
    except Exception as e:
        db.rollback()
        print(f"Error activating FAQs: {e}")
        raise HTTPException(status_code=500, detail="Failed to activate FAQs")