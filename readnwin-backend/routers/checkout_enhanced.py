from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
from models.cart import Cart
from models.order import Order, OrderItem
from models.book import Book
from models.payment import Payment, PaymentStatus
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/checkout", tags=["checkout"])

class PaymentData(BaseModel):
    method: str
    gateway: str

class CheckoutRequest(BaseModel):
    payment: PaymentData
    shipping_address: Optional[Dict[str, Any]] = None
    billing_address: Optional[Dict[str, Any]] = None

@router.post("/")
async def create_order_and_payment(
    checkout_data: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """Create order and initiate payment"""
    try:
        # Get cart items
        cart_items = db.query(Cart).filter(Cart.user_id == current_user.id).all()
        if not cart_items:
            raise HTTPException(status_code=400, detail="Cart is empty")

        # Calculate total
        total_amount = 0
        for item in cart_items:
            book = db.query(Book).filter(Book.id == item.book_id).first()
            if book:
                total_amount += book.price * item.quantity

        # Create order
        order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        order = Order(
            order_number=order_number,
            user_id=current_user.id,
            total_amount=total_amount,
            status="pending"
        )
        db.add(order)
        db.flush()

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

        # Handle payment method
        payment_url = None
        bank_transfer_id = None
        
        if checkout_data.payment.method == "bank_transfer":
            # Create bank transfer payment record
            payment = Payment(
                amount=total_amount,
                currency="NGN",
                payment_method="bank_transfer",
                description=f"Bank transfer for order {order_number}",
                order_id=order.id,
                user_id=current_user.id,
                transaction_reference=f"BT_{order.id}_{int(datetime.now().timestamp())}",
                status=PaymentStatus.PENDING,
                expires_at=datetime.now() + timedelta(hours=24)
            )
            db.add(payment)
            db.flush()
            bank_transfer_id = payment.id

        elif checkout_data.payment.method == "flutterwave":
            # Create Flutterwave payment record
            payment = Payment(
                amount=total_amount,
                currency="NGN",
                payment_method="flutterwave",
                description=f"Flutterwave payment for order {order_number}",
                order_id=order.id,
                user_id=current_user.id,
                transaction_reference=f"FW_{order.id}_{int(datetime.now().timestamp())}",
                status=PaymentStatus.PENDING
            )
            db.add(payment)

        db.commit()

        return {
            "success": True,
            "order": {
                "id": order.id,
                "order_number": order_number,
                "total_amount": total_amount,
                "status": order.status,
                "payment_status": order.payment_status
            },
            "bankTransferId": bank_transfer_id,
            "paymentUrl": payment_url
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Checkout failed: {str(e)}")