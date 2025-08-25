from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.faq import FAQ
from models.user import User
from pydantic import BaseModel
from typing import List, Dict, Any
import bleach

router = APIRouter()

class FAQResponse(BaseModel):
    id: int
    question: str
    answer: str
    category: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[FAQResponse])
def get_faqs(db: Session = Depends(get_db)):
    try:
        faqs = db.query(FAQ).filter(FAQ.is_active == True).order_by(FAQ.order_index).all()
        return faqs
    except Exception as e:
        print(f"Database error: {e}")
        return []

@router.get("/admin")
def get_admin_faqs(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get FAQs for admin management"""
    check_admin_access(current_user)
    
    try:
        faqs = db.query(FAQ).order_by(FAQ.order_index).all()
        return {
            "faqs": [
                {
                    "id": faq.id,
                    "question": faq.question,
                    "answer": faq.answer,
                    "category": faq.category or "general",
                    "is_active": faq.is_active,
                    "order_index": faq.order_index or 0
                }
                for faq in faqs
            ]
        }
    except Exception as e:
        print(f"Error fetching admin FAQs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch FAQs")

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
        # Sanitize all input data
        sanitized_data = sanitize_html_content(faq_data)
        
        # Delete existing FAQs
        db.query(FAQ).delete()
        
        # Add new FAQs
        for faq_item in sanitized_data.get('faqs', []):
            new_faq = FAQ(
                question=faq_item['question'],
                answer=faq_item['answer'],
                category=faq_item.get('category', 'general'),
                is_active=faq_item.get('is_active', True),
                order_index=faq_item.get('order_index', 0)
            )
            db.add(new_faq)
        
        db.commit()
        return {"message": "FAQs saved successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error saving admin FAQs: {e}")
        raise HTTPException(status_code=500, detail="Failed to save FAQs")