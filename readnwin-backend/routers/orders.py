from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func, desc, and_
from core.database import get_db
from core.security import verify_token, get_current_user_from_token
from models.order import Order, OrderItem
from models.cart import Cart
from models.book import Book
from models.user import User
from models.payment import Payment
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from decimal import Decimal
from datetime import datetime, timedelta

router = APIRouter()

class CreateOrder(BaseModel):
    shipping_address: str
    payment_method: str

class OrderResponse(BaseModel):
    id: int
    total_amount: float
    status: str
    shipping_address: str
    payment_method: str
    created_at: str
    items: List[dict]

@router.post("/")
def create_order(order_data: CreateOrder, token: str = Depends(verify_token), db: Session = Depends(get_db)):
    user_id = int(token.get("sub"))
    
    cart_items = db.query(Cart).join(Book).filter(Cart.user_id == user_id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    total_amount = sum(item.quantity * item.book.price for item in cart_items)
    
    order = Order(
        user_id=user_id,
        total_amount=total_amount,
        shipping_address=order_data.shipping_address,
        payment_method=order_data.payment_method,
        status="pending"
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    for cart_item in cart_items:
        order_item = OrderItem(
            order_id=order.id,
            book_id=cart_item.book_id,
            quantity=cart_item.quantity,
            price=cart_item.book.price
        )
        db.add(order_item)
    
    db.query(Cart).filter(Cart.user_id == user_id).delete()
    db.commit()
    
    # Send order confirmation email
    try:
        from services.resend_email_service import ResendEmailService
        from models.user import User
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            email_service = ResendEmailService(db)
            order_data = {
                'order_number': f'ORD-{order.id:06d}',
                'total_amount': float(total_amount),
                'payment_method': order_data.payment_method,
                'status': order.status
            }
            result = email_service.send_order_confirmation_email(
                user.email,
                order_data,
                user.first_name or user.username
            )
            if result.get('success'):
                print(f"✅ Order confirmation email sent to {user.email}")
            else:
                print(f"❌ Failed to send order confirmation email: {result.get('error')}")
    except Exception as e:
        print(f"❌ Failed to send order confirmation email: {str(e)}")
        # Don't fail order creation if email fails
    
    return {"order_id": order.id, "message": "Order created successfully"}

@router.get("/user")
def get_user_orders(current_user: User = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    try:
        orders = db.query(Order).options(
            joinedload(Order.items).joinedload(OrderItem.book),
            joinedload(Order.payments)
        ).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()
        
        result = []
        for order in orders:
            items = [
                {
                    "id": item.id,
                    "book_title": item.book.title if item.book else "Unknown Book",
                    "book_format": getattr(item, 'book_format', 'ebook'),
                    "cover_image": item.book.cover_image if item.book else None,
                    "quantity": item.quantity,
                    "price": float(item.price)
                }
                for item in order.items
            ]
            
            # Get payment information
            payment_info = None
            if order.payments:
                latest_payment = order.payments[-1]  # Get the latest payment
                payment_info = {
                    "id": latest_payment.id,
                    "status": latest_payment.status.value if latest_payment.status else "pending",
                    "method": latest_payment.payment_method.value if latest_payment.payment_method else "unknown",
                    "proof_of_payment_url": latest_payment.proof_of_payment_url,
                    "transaction_reference": latest_payment.transaction_reference,
                    "created_at": latest_payment.created_at.isoformat() if latest_payment.created_at else ""
                }
            
            result.append({
                "id": order.id,
                "order_number": getattr(order, 'order_number', f"ORD-{order.id:06d}"),
                "total_amount": float(order.total_amount),
                "status": order.status or "pending",
                "payment_status": payment_info["status"] if payment_info else "pending",
                "shipping_address": getattr(order, 'shipping_address', {}),
                "payment_method": getattr(order, 'payment_method', 'unknown'),
                "created_at": order.created_at.isoformat() if order.created_at else "",
                "item_count": len(items),
                "tracking_number": getattr(order, 'tracking_number', None),
                "payment_info": payment_info,
                "items": items
            })
        
        return {"orders": result}
    except Exception as e:
        print(f"Error fetching user orders: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch orders")

@router.get("/{order_id}")
def get_order_details(order_id: int, token: str = Depends(verify_token), db: Session = Depends(get_db)):
    try:
        user_id = int(token.get("sub"))
        order = db.query(Order).filter(Order.id == order_id, Order.user_id == user_id).first()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        items = [
            {
                "book_title": item.book.title,
                "book_author": getattr(item.book, 'author', 'Unknown'),
                "quantity": item.quantity,
                "price": float(item.price),
                "total": float(item.price * item.quantity)
            }
            for item in order.items
        ]
        
        return {
            "id": order.id,
            "order_number": f"ORD-{order.id:06d}",
            "total_amount": float(order.total_amount),
            "status": order.status,
            "shipping_address": order.shipping_address,
            "payment_method": order.payment_method,
            "created_at": order.created_at.isoformat() if order.created_at else "",
            "tracking_number": getattr(order, 'tracking_number', None),
            "items": items
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching order details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch order details")