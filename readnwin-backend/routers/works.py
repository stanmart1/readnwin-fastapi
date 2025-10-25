from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.storage import storage
from models.portfolio import Portfolio
from typing import List, Dict, Any

router = APIRouter(prefix="/works", tags=["works"])

@router.get("")
def get_public_works(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get all active works for public display"""
    try:
        works = db.query(Portfolio).filter(
            Portfolio.is_active == True
        ).order_by(Portfolio.order_index).all()
        
        return {
            "success": True,
            "works": [
                {
                    "id": work.id,
                    "title": work.title,
                    "description": work.description or "",
                    "image_path": storage.get_url(work.image_url) if work.image_url else "",
                    "alt_text": work.title,
                    "category": getattr(work, 'category', None),
                    "order_index": work.order_index
                }
                for work in works
            ]
        }
    except Exception as e:
        return {
            "success": False,
            "works": [],
            "error": str(e)
        }
