from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.testimonial import Testimonial
from models.user import User
from typing import List, Dict, Any
from pydantic import BaseModel

router = APIRouter(prefix="/testimonials", tags=["testimonials"])

class TestimonialResponse(BaseModel):
    id: int
    name: str
    role: str
    content: str
    rating: int
    avatar: str
    is_featured: bool
    created_at: str

@router.get("")
def get_testimonials(
    limit: int = 10,
    featured_only: bool = True,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get testimonials for public display"""
    try:
        query = db.query(Testimonial).filter(Testimonial.is_active == True)
        
        if featured_only:
            query = query.filter(Testimonial.is_featured == True)
        
        testimonials = query.order_by(Testimonial.order_index).limit(limit).all()
        
        return {
            "success": True,
            "testimonials": [
                {
                    "id": t.id,
                    "name": t.name,
                    "role": t.role or "Reader",
                    "content": t.content,
                    "rating": t.rating or 5,
                    "avatar": t.avatar_url or "",
                    "image": t.image_url or "",
                    "is_featured": t.is_featured,
                    "created_at": t.created_at.isoformat() if t.created_at else ""
                }
                for t in testimonials
            ]
        }
    except Exception as e:
        return {
            "success": False,
            "testimonials": [],
            "error": str(e)
        }

@router.get("/admin")
def get_admin_testimonials(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all testimonials for admin management"""
    check_admin_access(current_user)
    
    try:
        testimonials = db.query(Testimonial).order_by(Testimonial.order_index).all()
        
        return {
            "success": True,
            "testimonials": [
                {
                    "id": t.id,
                    "name": t.name,
                    "role": t.role,
                    "content": t.content,
                    "rating": t.rating,
                    "avatar_url": t.avatar_url,
                    "image_url": t.image_url,
                    "is_featured": t.is_featured,
                    "is_active": t.is_active,
                    "order_index": t.order_index,
                    "created_at": t.created_at.isoformat() if t.created_at else "",
                    "updated_at": t.updated_at.isoformat() if t.updated_at else ""
                }
                for t in testimonials
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
