from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime

from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
from models.payment import Payment, PaymentStatus
from models.order import Order, OrderItem
from models.cart import Cart
from models.book import Book
from models.user_library import UserLibrary
from pydantic import BaseModel

router = APIRouter(prefix="/payment", tags=["payment"])

class PaymentCompletionRequest(BaseModel):
    transaction_reference: str
    status: str
    verification_data: Dict[str, Any]

@router.post("/complete")
async def complete_payment(
    completion_data: PaymentCompletionRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Complete payment and clear cart only after successful verification"""
    try:
        # Find payment by transaction reference
        payment = db.query(Payment).filter(
            Payment.transaction_reference == completion_data.transaction_reference,
            Payment.user_id == current_user.id
        ).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Get associated order
        order = db.query(Order).filter(Order.id == payment.order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Update payment status based on verification
        if completion_data.status == "successful":
            payment.status = PaymentStatus.COMPLETED
            order.status = "paid"
            order.payment_status = "completed"
            
            # ONLY clear cart after successful payment
            cart_items_deleted = db.query(Cart).filter(Cart.user_id == current_user.id).delete()
            
            # Add eBooks to user library
            ebook_items = db.query(OrderItem).join(Book).filter(
                OrderItem.order_id == payment.order_id,
                Book.format.in_(["ebook", "both"])
            ).all()
            
            for item in ebook_items:
                existing = db.query(UserLibrary).filter(
                    UserLibrary.user_id == current_user.id,
                    UserLibrary.book_id == item.book_id
                ).first()
                
                if not existing:
                    library_item = UserLibrary(
                        user_id=current_user.id,
                        book_id=item.book_id,
                        status="unread",
                        added_at=datetime.utcnow()
                    )
                    db.add(library_item)
            
            db.commit()
            
            # Send order confirmation email
            try:
                from services.email_service import send_order_confirmation_email
                order_items = []
                for item in ebook_items:
                    order_items.append({
                        "title": item.book.title,
                        "price": float(item.price)
                    })
                
                order_data = {
                    "order_number": order.order_number,
                    "total_amount": float(order.total_amount),
                    "items": order_items
                }
                send_order_confirmation_email(
                    current_user.email,
                    order_data,
                    current_user.first_name or current_user.username,
                    db
                )
            except Exception as e:
                logger.warning(f"Failed to send order confirmation email: {e}")
            
            return {
                "success": True,
                "message": "Payment completed successfully",
                "order_id": order.id,
                "order_status": order.status,
                "cart_cleared": cart_items_deleted > 0,
                "ebooks_added": len(ebook_items)
            }
        
        else:
            payment.status = PaymentStatus.FAILED
            order.status = "failed"
            order.payment_status = "failed"
            
            db.commit()
            
            return {
                "success": False,
                "message": "Payment failed",
                "order_id": order.id,
                "order_status": order.status,
                "cart_cleared": False
            }
            
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment completion failed: {str(e)}"
        )

@router.post("/admin/complete/{payment_id}")
async def admin_complete_payment(
    payment_id: int,
    approval_status: str,
    admin_notes: str = "",
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Admin endpoint to complete bank transfer payments"""
    # Check admin permissions (implement your admin check logic)
    if not hasattr(current_user, 'is_admin') or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        order = db.query(Order).filter(Order.id == payment.order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if approval_status == "approved":
            payment.status = PaymentStatus.COMPLETED
            order.status = "paid"
            order.payment_status = "completed"
            
            # Clear user's cart ONLY after admin approval
            cart_items_deleted = db.query(Cart).filter(Cart.user_id == payment.user_id).delete()
            
            # Add eBooks to user library
            ebook_items = db.query(OrderItem).join(Book).filter(
                OrderItem.order_id == payment.order_id,
                Book.format.in_(["ebook", "both"])
            ).all()
            
            for item in ebook_items:
                existing = db.query(UserLibrary).filter(
                    UserLibrary.user_id == payment.user_id,
                    UserLibrary.book_id == item.book_id
                ).first()
                
                if not existing:
                    library_item = UserLibrary(
                        user_id=payment.user_id,
                        book_id=item.book_id,
                        status="unread",
                        added_at=datetime.utcnow()
                    )
                    db.add(library_item)
            
            db.commit()
            
            # Send order confirmation email
            try:
                from services.email_service import send_order_confirmation_email
                from models.user import User
                user = db.query(User).filter(User.id == payment.user_id).first()
                if user:
                    order_items = []
                    for item in ebook_items:
                        order_items.append({
                            "title": item.book.title,
                            "price": float(item.price)
                        })
                    
                    order_data = {
                        "order_number": order.order_number,
                        "total_amount": float(order.total_amount),
                        "items": order_items
                    }
                    send_order_confirmation_email(
                        user.email,
                        order_data,
                        user.first_name or user.username,
                        db
                    )
            except Exception as e:
                logger.warning(f"Failed to send order confirmation email: {e}")
            
            return {
                "success": True,
                "message": "Payment approved and completed",
                "payment_id": payment.id,
                "order_id": order.id,
                "cart_cleared": cart_items_deleted > 0,
                "ebooks_added": len(ebook_items)
            }
        
        else:
            payment.status = PaymentStatus.REJECTED
            order.status = "cancelled"
            order.payment_status = "failed"
            
            db.commit()
            
            return {
                "success": False,
                "message": "Payment rejected",
                "payment_id": payment.id,
                "order_id": order.id,
                "cart_cleared": False
            }
            
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Admin payment completion failed: {str(e)}"
        )