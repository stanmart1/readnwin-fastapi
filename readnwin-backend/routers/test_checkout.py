from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
from models.order import Order
from models.payment import Payment, PaymentStatus, PaymentMethodType
from decimal import Decimal
import uuid
from datetime import datetime

router = APIRouter()

@router.post("/test-checkout")
async def test_checkout(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Minimal test checkout to isolate the issue"""
    try:
        print(f"🔍 Starting test checkout for user {current_user.id}")
        
        # Create minimal order
        order = Order(
            user_id=current_user.id,
            order_number=f"TEST-{uuid.uuid4().hex[:8].upper()}",
            total_amount=Decimal('100.00'),
            status='pending',
            payment_method='bank_transfer'
        )
        
        print(f"🔍 Adding order to session")
        db.add(order)
        db.flush()
        print(f"🔍 Order created with ID: {order.id}")
        
        # Create payment
        payment = Payment(
            amount=Decimal('100.00'),
            currency='NGN',
            payment_method=PaymentMethodType.BANK_TRANSFER,
            description=f'Test payment for order {order.order_number}',
            order_id=order.id,
            user_id=current_user.id,
            transaction_reference=f'TEST_{order.id}_{int(datetime.now().timestamp())}',
            status=PaymentStatus.PENDING
        )
        
        print(f"🔍 Adding payment to session")
        db.add(payment)
        db.flush()
        print(f"🔍 Payment created with ID: {payment.id}")
        
        print(f"🔍 Committing transaction")
        db.commit()
        print(f"🔍 Transaction committed successfully")
        
        return {
            "success": True,
            "order_id": order.id,
            "payment_id": payment.id,
            "message": "Test checkout successful"
        }
        
    except Exception as e:
        print(f"❌ Test checkout error: {str(e)}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Test checkout failed: {str(e)}")