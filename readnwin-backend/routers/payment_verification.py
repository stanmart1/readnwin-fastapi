from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token
from models.cart import Cart
from models.order import Order
from models.user import User
from pydantic import BaseModel

router = APIRouter()

class PaymentVerificationRequest(BaseModel):
    order_id: int
    payment_reference: str
    status: str

@router.post("/verify")
def verify_payment(
    verification_data: PaymentVerificationRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Verify payment but DO NOT clear cart - use /payment/complete instead"""
    try:
        # Get the order
        order = db.query(Order).filter(
            Order.id == verification_data.order_id,
            Order.user_id == current_user.id
        ).first()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Update order status based on payment verification
        if verification_data.status == "successful":
            order.status = "paid"
            order.payment_reference = verification_data.payment_reference
            
            # DO NOT clear cart here - use /payment/complete endpoint instead
            db.commit()
            
            return {
                "message": "Payment verified successfully - use /payment/complete to finalize",
                "order_status": "paid",
                "requires_completion": True
            }
        else:
            order.status = "failed"
            db.commit()
            
            return {
                "message": "Payment verification failed",
                "order_status": "failed",
                "requires_completion": False
            }
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")