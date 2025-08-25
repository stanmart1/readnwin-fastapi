from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
from models.payment import Payment, PaymentStatus
from models.order import Order
from pydantic import BaseModel

router = APIRouter(prefix="/bank-transfer", tags=["bank-transfer"])

class BankTransferResponse(BaseModel):
    id: int
    transaction_reference: str
    amount: float
    currency: str
    status: str
    expires_at: str
    created_at: str

class BankAccountResponse(BaseModel):
    bank_name: str
    account_number: str
    account_name: str

class OrderResponse(BaseModel):
    order_number: str
    total_amount: float
    payment_status: str
    created_at: str

@router.get("/{order_id}")
async def get_bank_transfer_details(
    order_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get bank transfer payment details by order ID"""
    try:
        # Get payment record by order ID
        payment = db.query(Payment).filter(
            Payment.order_id == order_id,
            Payment.user_id == current_user.id,
            Payment.payment_method == "bank_transfer"
        ).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Bank transfer not found for this order")
        
        # Get order details
        order = db.query(Order).filter(Order.id == payment.order_id).first()
        
        # Bank transfer details
        bank_transfer = {
            "id": payment.id,
            "transaction_reference": payment.transaction_reference,
            "amount": float(payment.amount),
            "currency": payment.currency,
            "status": payment.status.value if hasattr(payment.status, 'value') else payment.status,
            "expires_at": None,
            "created_at": payment.created_at.isoformat() if payment.created_at else None
        }
        
        # Bank account details from environment
        import os
        bank_account = {
            "bank_name": os.getenv("BANK_NAME", "Access Bank"),
            "account_number": os.getenv("BANK_ACCOUNT_NUMBER", "0101234567"),
            "account_name": os.getenv("BANK_ACCOUNT_NAME", "Lagsale Online Resources")
        }
        
        # Order details
        order_data = None
        if order:
            order_data = {
                "order_number": order.order_number or f"ORD-{order.id}",
                "total_amount": float(order.total_amount) if order.total_amount else 0,
                "payment_status": payment.status.value if hasattr(payment.status, 'value') else str(payment.status),
                "created_at": order.created_at.isoformat() if order.created_at else None
            }
        
        # Get existing proofs (mock for now)
        proofs = []
        if payment.proof_of_payment_url:
            proofs = [{
                "id": payment.id,
                "file_name": "payment_proof.jpg",
                "upload_date": payment.created_at.isoformat() if payment.created_at else None,
                "is_verified": payment.status == PaymentStatus.COMPLETED
            }]
        
        return {
            "bankTransfer": bank_transfer,
            "bankAccount": bank_account,
            "order": order_data,
            "proofs": proofs
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch bank transfer details: {str(e)}"
        )

@router.post("/upload-proof/{order_id}")
async def upload_proof_of_payment(
    order_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Upload proof of payment for bank transfer"""
    try:
        # Get payment record by order ID
        payment = db.query(Payment).filter(
            Payment.order_id == order_id,
            Payment.user_id == current_user.id,
            Payment.payment_method == "bank_transfer"
        ).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Bank transfer payment not found")
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        # Validate file size (5MB max)
        if file.size and file.size > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large")
        
        # Create uploads directory if it doesn't exist
        import os
        upload_dir = "uploads/proofs"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        import uuid
        file_extension = file.filename.split('.')[-1] if file.filename else 'jpg'
        unique_filename = f"{uuid.uuid4()}_{payment.transaction_reference}.{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Update payment record with proof URL
        payment.proof_of_payment_url = f"/uploads/proofs/{unique_filename}"
        payment.status = PaymentStatus.AWAITING_APPROVAL
        
        db.commit()
        db.refresh(payment)
        
        return {
            "success": True,
            "message": "Proof of payment uploaded successfully",
            "file_url": payment.proof_of_payment_url,
            "payment_id": payment.id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload proof: {str(e)}"
        )

@router.post("/create")
async def create_bank_transfer_payment(
    order_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Create a bank transfer payment record"""
    try:
        # Get order
        order = db.query(Order).filter(
            Order.id == order_id,
            Order.user_id == current_user.id
        ).first()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Create payment record
        from models.payment import PaymentMethodType
        payment = Payment(
            amount=order.total_amount,
            currency="NGN",
            payment_method=PaymentMethodType.BANK_TRANSFER,
            description=f"Bank transfer for order {order.order_number or order.id}",
            order_id=order.id,
            user_id=current_user.id,
            transaction_reference=f"BT_{order.id}_{int(datetime.now().timestamp())}",
            status=PaymentStatus.PENDING
        )
        
        db.add(payment)
        db.commit()
        db.refresh(payment)
        
        return {
            "success": True,
            "bankTransferId": payment.id,
            "transactionReference": payment.transaction_reference,
            "amount": float(payment.amount),
            "expiresAt": None
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create bank transfer: {str(e)}"
        )