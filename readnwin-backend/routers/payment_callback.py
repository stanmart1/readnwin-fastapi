from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from core.database import get_db
from models.payment import Payment, PaymentStatus
from models.order import Order
from models.cart import Cart
from models.book import Book
from models.user_library import UserLibrary
from models.payment_settings import PaymentGateway
import requests
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payment", tags=["payment"])

@router.get("/callback")
async def payment_callback(
    request: Request,
    status: str = None,
    tx_ref: str = None,
    transaction_id: str = None,
    db: Session = Depends(get_db)
):
    """Handle Flutterwave payment callback"""
    try:
        logger.info(f"Payment callback received: status={status}, tx_ref={tx_ref}, transaction_id={transaction_id}")
        
        if not tx_ref:
            raise HTTPException(status_code=400, detail="Missing transaction reference")
        
        # Find payment by transaction reference
        payment = db.query(Payment).filter(Payment.transaction_reference == tx_ref).first()
        if not payment:
            logger.error(f"Payment not found for tx_ref: {tx_ref}")
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Get Flutterwave settings
        gateway = db.query(PaymentGateway).filter(PaymentGateway.id == "flutterwave").first()
        if not gateway or not gateway.enabled:
            raise HTTPException(status_code=400, detail="Flutterwave gateway not configured")
        
        secret_key = gateway.api_keys.get('secretKey') or gateway.api_keys.get('secret_key')
        
        # Verify transaction with Flutterwave
        if transaction_id:
            verify_url = f"https://api.flutterwave.com/v3/transactions/{transaction_id}/verify"
            headers = {"Authorization": f"Bearer {secret_key}"}
            
            response = requests.get(verify_url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("status") == "success" and data.get("data", {}).get("status") == "successful":
                    # Payment successful
                    payment.status = PaymentStatus.COMPLETED
                    
                    # Update order
                    order = db.query(Order).filter(Order.id == payment.order_id).first()
                    if order:
                        order.status = "paid"
                        
                        # Clear user's cart
                        db.query(Cart).filter(Cart.user_id == payment.user_id).delete()
                        
                        # Add digital books to library
                        from models.order import OrderItem
                        ebook_items = db.query(OrderItem).join(Book).filter(
                            OrderItem.order_id == order.id,
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
                                    status="unread"
                                )
                                db.add(library_item)
                        
                        db.commit()
                        logger.info(f"Payment completed successfully for order {order.order_number}")
                        
                        # Send payment confirmation email
                        try:
                            from services.email_service import send_payment_confirmation_email
                            from models.user import User
                            user = db.query(User).filter(User.id == payment.user_id).first()
                            if user:
                                send_payment_confirmation_email(
                                    to_email=user.email,
                                    payment_data={
                                        "transaction_id": payment.transaction_reference,
                                        "amount": float(payment.amount),
                                        "payment_method": payment.payment_method.value if hasattr(payment.payment_method, 'value') else str(payment.payment_method),
                                        "payment_date": payment.created_at.strftime("%Y-%m-%d %H:%M") if payment.created_at else None
                                    },
                                    first_name=user.first_name or user.username,
                                    db_session=db
                                )
                        except Exception as e:
                            logger.warning(f"Failed to send payment confirmation email: {e}")
                        
                        # Redirect to success page
                        return RedirectResponse(url=f"{settings.frontend_url}/order-confirmation/{order.order_number}?status=success")
                else:
                    # Payment failed
                    payment.status = PaymentStatus.FAILED
                    order = db.query(Order).filter(Order.id == payment.order_id).first()
                    if order:
                        order.status = "failed"
                    db.commit()
                    
                    from core.config import settings
                    from fastapi.responses import RedirectResponse
                    return RedirectResponse(url=f"{settings.frontend_url}/payment-failed?status=failed&order={order.order_number if order else ''}&message=Payment verification failed")
        
        # If no transaction_id, just redirect based on status
        from core.config import settings
        from fastapi.responses import RedirectResponse
        if status == "successful":
            order = db.query(Order).filter(Order.id == payment.order_id).first()
            return RedirectResponse(url=f"{settings.frontend_url}/order-confirmation/{order.order_number if order else payment.order_id}?status=pending")
        else:
            order = db.query(Order).filter(Order.id == payment.order_id).first()
            return RedirectResponse(url=f"{settings.frontend_url}/payment-failed?status=cancelled&order={order.order_number if order else ''}")
            
    except Exception as e:
        logger.error(f"Payment callback error: {str(e)}")
        from core.config import settings
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=f"{settings.frontend_url}/payment-failed?status=error&message={str(e)}")
