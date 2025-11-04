from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from core.storage import storage
from models.portfolio import Portfolio
from pydantic import BaseModel
from typing import List

router = APIRouter()

class PortfolioResponse(BaseModel):
    id: int
    title: str
    description: str
    image_url: str
    project_url: str
    is_featured: bool
    is_active: bool
    order_index: int

    class Config:
        from_attributes = True

@router.get("/")
def get_portfolio_items(db: Session = Depends(get_db)):
    try:
        items = db.query(Portfolio).filter(Portfolio.is_active == True).order_by(Portfolio.order_index, Portfolio.created_at.desc()).all()
        return [
            {
                "id": item.id,
                "title": item.title,
                "description": item.description,
                "image_url": storage.get_url(item.image_url) if item.image_url else "",
                "project_url": item.project_url,
                "is_featured": item.is_featured,
                "is_active": item.is_active,
                "order_index": item.order_index
            }
            for item in items
        ]
    except Exception as e:
        print(f"Database error: {e}")
        return []