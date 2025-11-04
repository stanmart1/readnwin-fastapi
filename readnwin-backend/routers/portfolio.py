from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
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

@router.get("/", response_model=List[PortfolioResponse])
def get_portfolio_items(db: Session = Depends(get_db)):
    try:
        items = db.query(Portfolio).filter(Portfolio.is_active == True).order_by(Portfolio.order_index, Portfolio.created_at.desc()).all()
        return items
    except Exception as e:
        print(f"Database error: {e}")
        return []