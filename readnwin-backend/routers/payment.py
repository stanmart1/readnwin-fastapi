from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from core.database import get_db
from core.security import get_current_user_from_token
from models.payment import Payment, PaymentStatus
from schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    PaymentVerification,
    PaymentStatusUpdate,
    BankTransferRequest,
    BankTransferWithProof,
    AdminPaymentApproval
)

router = APIRouter(prefix="/payment", tags=["payment"])

@router.post("/verify", response_model=PaymentResponse)
async def verify_payment(
    verification: PaymentVerification,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Verify a payment transaction"""
    payment = db.query(Payment).filter(
        Payment.transaction_reference == verification.transaction_reference,
        Payment.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Update payment status based on verification
    if verification.verification_data.get("status") == "successful":
        payment.status = PaymentStatus.COMPLETED
        
        # For Flutterwave payments: Auto-add eBooks to library and clear cart
        from models.order import OrderItem
        from models.book import Book
        from models.user_library import UserLibrary
        from models.cart import Cart
        
        # Add ebooks to library
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
                    status="unread"
                )
                db.add(library_item)
        
        # Clear user's cart after successful Flutterwave payment
        db.query(Cart).filter(Cart.user_id == current_user.id).delete()
        
    elif verification.verification_data.get("status") == "cancelled":
        payment.status = PaymentStatus.FAILED
        # Do NOT clear cart for cancelled payments - items remain for retry
    else:
        payment.status = PaymentStatus.FAILED
    
    db.commit()
    db.refresh(payment)
    return payment

@router.post("/bank-transfer", response_model=PaymentResponse)
async def process_bank_transfer(
    transfer: BankTransferWithProof,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Process a bank transfer payment with proof of payment"""
    from models.order import Order
    
    # Validate order exists and belongs to user
    order = db.query(Order).filter(
        Order.id == transfer.order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Create payment record with proof of payment
    payment = Payment(
        amount=transfer.amount,
        currency=transfer.currency,
        payment_method=transfer.payment_method,
        description=transfer.description,
        order_id=transfer.order_id,
        user_id=current_user.id,
        transaction_reference=f"BT_{order.id}_{int(datetime.now().timestamp())}",
        status=PaymentStatus.AWAITING_APPROVAL,
        proof_of_payment_url=transfer.proof_of_payment_url
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    # Send order confirmation email
    from services.resend_email_service import ResendEmailService
    email_service = ResendEmailService(db)
    await email_service.send_order_confirmation_email(
        current_user.email,
        current_user.first_name or current_user.username,
        order.order_number,
        f"₦{transfer.amount:,.2f}"
    )
    
    return payment

@router.get("/gateways")
async def get_payment_gateways(
    db: Session = Depends(get_db)
) -> dict:
    """Get available payment gateways"""
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    gateways = [
        {
            "id": "flutterwave",
            "name": "Flutterwave",
            "description": "Pay with card, bank transfer, or mobile money",
            "icon": "credit-card",
            "enabled": bool(os.getenv("RAVE_LIVE_SECRET_KEY")),
            "testMode": False,
            "supportedCurrencies": ["NGN"],
            "features": ["card", "bank_transfer", "mobile_money"],
            "status": "active" if os.getenv("RAVE_LIVE_SECRET_KEY") else "inactive"
        },
        {
            "id": "bank_transfer",
            "name": "Bank Transfer",
            "description": "Pay via bank transfer with proof upload",
            "icon": "bank",
            "enabled": True,
            "testMode": False,
            "supportedCurrencies": ["NGN"],
            "features": ["manual_verification"],
            "status": "active"
        }
    ]
    
    return {"gateways": gateways}

@router.get("/flutterwave/inline")
async def get_flutterwave_config(
    db: Session = Depends(get_db)
) -> dict:
    """Get Flutterwave configuration for inline payments"""
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    public_key = os.getenv("RAVE_LIVE_PUBLIC_KEY") or os.getenv("RAVE_TEST_PUBLIC_KEY")
    
    if not public_key:
        raise HTTPException(status_code=500, detail="Flutterwave configuration missing")
    
    return {
        "public_key": public_key,
        "currency": "NGN",
        "payment_options": "card,mobilemoney,ussd,banktransfer"
    }

@router.get("/status/{payment_id}", response_model=PaymentResponse)
async def check_payment_status(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Check the status of a payment"""
    if payment_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid payment ID")
    
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return payment

@router.post("/methods/validate", response_model=dict)
async def validate_payment_method(
    method_details: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Validate a payment method"""
    method_type = method_details.get("type")
    
    if method_type == "bank_transfer":
        account_number = method_details.get("account_number")
        bank_code = method_details.get("bank_code")
        
        if not account_number or not bank_code:
            return {"valid": False, "message": "Account number and bank code required"}
        
        if len(account_number) != 10 or not account_number.isdigit():
            return {"valid": False, "message": "Invalid account number format"}
        
        return {"valid": True, "message": "Payment method validated"}
    
    elif method_type == "card":
        return {"valid": True, "message": "Card validation handled by payment gateway"}
    
    return {"valid": False, "message": "Unsupported payment method"}

@router.get("/awaiting-approval", response_model=List[PaymentResponse])
async def get_pending_payments(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Get list of payments awaiting approval"""
    payments = db.query(Payment).filter(
        Payment.user_id == current_user.id,
        Payment.status == PaymentStatus.AWAITING_APPROVAL
    ).order_by(Payment.created_at.desc()).all()
    
    return payments

@router.post("/admin/approve", response_model=PaymentResponse)
async def admin_approve_payment(
    approval: AdminPaymentApproval,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_from_token)
):
    """Admin endpoint to approve/reject bank transfer payments"""
    # Check if user is admin (you may need to adjust this based on your auth system)
    if not hasattr(current_user, 'is_admin') or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    payment = db.query(Payment).filter(Payment.id == approval.payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    payment.status = approval.status
    payment.admin_notes = approval.admin_notes
    
    # If approved, clear cart and add eBooks to library
    if approval.status == PaymentStatus.COMPLETED:
        from services.resend_email_service import ResendEmailService
        from models.user import User
        from models.order import OrderItem
        from models.book import Book
        from models.user_library import UserLibrary
        from models.cart import Cart
        
        # Clear user's cart
        db.query(Cart).filter(Cart.user_id == payment.user_id).delete()
        
        # Add eBooks to user library for approved bank transfer payments
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
                    status="unread"
                )
                db.add(library_item)
    
    db.commit()
    db.refresh(payment)
    return payment
