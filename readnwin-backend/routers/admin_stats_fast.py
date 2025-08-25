from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from models.user import User
from models.book import Book
from models.order import Order
from routers.auth import get_current_user_from_token
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/overview-fast")
def get_overview_stats_fast(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """
    Fast overview stats endpoint - only essential counts for immediate display.
    """
    try:
        # Check admin permissions
        if not current_user.role or current_user.role.name not in ["admin", "super_admin"]:
            raise HTTPException(status_code=403, detail="Admin access required")

        # Get basic counts with optimized queries
        total_users = db.query(User).count()
        total_books = db.query(Book).count()
        total_orders = db.query(Order).count()
        
        # Calculate total revenue from completed orders only
        total_revenue = db.query(Order).filter(
            Order.status == "completed"
        ).with_entities(
            db.func.coalesce(db.func.sum(Order.total_amount), 0)
        ).scalar() or 0

        return {
            "total_users": total_users,
            "total_books": total_books,
            "total_orders": total_orders,
            "total_revenue": float(total_revenue)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching fast overview stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch overview stats")