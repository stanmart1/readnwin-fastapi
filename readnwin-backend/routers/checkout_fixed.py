from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token
from models.cart import Cart
from models.book import Book
from models.user import User
from models.order import Order, OrderItem
from models.payment import Payment, PaymentStatus, PaymentMethodType
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from decimal import Decimal
import uuid
from datetime import datetime, timedelta

router = APIRouter()

class CheckoutRequest(BaseModel):
    formData: Dict[str, Any]
    cartItems: List[Dict[str, Any]]
    total: float
    shippingMethod: Optional[Dict[str, Any]] = None

@router.post("/checkout-fixed")
async def create_order_fixed(
    checkout_data: CheckoutRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Fixed checkout endpoint with proper transaction handling"""
    
    # Start a new transaction
    try:
        # Get cart items
        cart_items = db.query(Cart).filter(Cart.user_id == current_user.id).all()
        if not cart_items:
            raise HTTPException(status_code=400, detail="Cart is empty")
        
        # Calculate total
        total_amount = Decimal('0')
        for item in cart_items:
            book = db.query(Book).filter(Book.id == item.book_id).first()
            if book:
                total_amount += book.price * item.quantity
        
        # Create order
        order_number = str(uuid.uuid4())[:8].upper()
        order = Order(
            user_id=current_user.id,
            order_number=order_number,
            total_amount=total_amount,
            status='pending',
            payment_method=checkout_data.formData.get('payment', {}).get('method', 'bank_transfer'),
            shipping_address=checkout_data.formData.get('shipping', {}),
            billing_address=checkout_data.formData.get('billing', {})
        )
        
        db.add(order)
        db.flush()  # Get order ID
        
        # Create order items
        for item in cart_items:
            book = db.query(Book).filter(Book.id == item.book_id).first()
            if book:
                order_item = OrderItem(
                    order_id=order.id,
                    book_id=item.book_id,
                    quantity=item.quantity,
                    price=book.price,
                    book_format=book.format or 'ebook',
                    book_title=book.title
                )
                db.add(order_item)
        
        db.flush()  # Ensure order items are created
        
        # Create payment record
        payment_method = checkout_data.formData.get('payment', {}).get('method', 'bank_transfer')
        
        if payment_method == 'bank_transfer':
            tx_ref = f'BT_{order.order_number}_{int(datetime.now().timestamp())}'
            payment = Payment(
                amount=order.total_amount,
                currency='NGN',
                payment_method=PaymentMethodType.BANK_TRANSFER,
                description=f'Bank transfer for order {order.order_number}',
                order_id=order.id,
                user_id=current_user.id,
                transaction_reference=tx_ref,
                status=PaymentStatus.AWAITING_APPROVAL
            )
            
            db.add(payment)
            db.flush()
            
            # Commit the entire transaction
            db.commit()
            
            return {
                "success": True,
                "paymentMethod": "bank_transfer",
                "order": {
                    "id": order.id,
                    "order_number": order.order_number,
                    "total_amount": float(order.total_amount)
                },
                "bankTransferDetails": {
                    "amount": float(order.total_amount),
                    "reference": payment.transaction_reference,
                    "expires_at": (datetime.now() + timedelta(hours=24)).isoformat(),
                    "bank_account": {
                        "bank_name": "Access Bank",
                        "account_number": "0101234567",
                        "account_name": "Lagsale Online Resources"
                    }
                },
                "bankTransferId": payment.id
            }
        
        else:
            raise HTTPException(status_code=400, detail="Only bank transfer supported in fixed endpoint")
            
    except Exception as e:
        db.rollback()
        import traceback
        print(f"❌ Checkout error: {str(e)}")
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Checkout failed: {str(e)}")