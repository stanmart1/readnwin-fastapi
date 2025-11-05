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
        
        # Bank account details from PaymentGateway system settings
        from models.payment_settings import PaymentGateway
        gateway = db.query(PaymentGateway).filter(PaymentGateway.id == "bank_transfer").first()
        
        bank_account_data = gateway.bank_account if gateway and gateway.bank_account else {}
        bank_account = {
            "bank_name": bank_account_data.get("bank_name", "Access Bank"),
            "account_number": bank_account_data.get("account_number", "0101234567"),
            "account_name": bank_account_data.get("account_name", "Lagsale Online Resources")
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
    """Upload proof of payment for bank transfer and create payment record"""
    try:
        # Get order
        order = db.query(Order).filter(
            Order.id == order_id,
            Order.user_id == current_user.id
        ).first()
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Check if payment already exists
        payment = db.query(Payment).filter(
            Payment.order_id == order_id,
            Payment.user_id == current_user.id,
            Payment.payment_method == "bank_transfer"
        ).first()
        
        if payment:
            raise HTTPException(status_code=400, detail="Payment proof already uploaded for this order")
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPG, PNG, GIF, PDF")
        
        # Validate file size (5MB max)
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size: 5MB")
        
        # Reset file pointer for storage manager
        await file.seek(0)
        
        # Save proof file using StorageManager
        from core.storage import storage
        file_path = await storage.save_image(file, subfolder='proofs')
        
        # Create payment record NOW with proof (store raw path, not URL)
        from models.payment import PaymentMethodType
        payment = Payment(
            amount=order.total_amount,
            currency='NGN',
            payment_method=PaymentMethodType.BANK_TRANSFER,
            description=f'Bank transfer for order {order.order_number}',
            order_id=order.id,
            user_id=current_user.id,
            transaction_reference=f'BT_{order.order_number}_{int(datetime.now().timestamp())}',
            status=PaymentStatus.AWAITING_APPROVAL,
            proof_of_payment_url=file_path
        )
        
        db.add(payment)
        db.commit()
        db.refresh(payment)
        
        return {
            "success": True,
            "message": "Proof of payment uploaded successfully",
            "file_url": payment.proof_of_payment_url,
            "payment_id": payment.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload proof: {str(e)}"
        )

@router.post("/approve/{order_id}")
async def approve_bank_transfer(
    order_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Admin endpoint to approve bank transfer payment"""
    from core.security import check_admin_access
    from models.user_library import UserLibrary
    from models.book import Book
    from models.cart import Cart
    from datetime import datetime
    
    check_admin_access(current_user)
    
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        payment = db.query(Payment).filter(Payment.order_id == order_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        if payment.payment_method != "bank_transfer":
            raise HTTPException(status_code=400, detail="Not a bank transfer payment")
        
        if payment.status == "completed":
            raise HTTPException(status_code=400, detail="Payment already approved")
        
        payment.status = "completed"
        payment.updated_at = datetime.utcnow()
        order.status = "completed"
        order.updated_at = datetime.utcnow()
        
        # Clear user's cart
        db.query(Cart).filter(Cart.user_id == order.user_id).delete()
        
        ebook_items = db.query(OrderItem).join(Book).filter(
            OrderItem.order_id == order_id,
            Book.format.in_(["ebook", "both"])
        ).all()
        
        for item in ebook_items:
            existing = db.query(UserLibrary).filter(
                UserLibrary.user_id == order.user_id,
                UserLibrary.book_id == item.book_id
            ).first()
            
            if not existing:
                library_item = UserLibrary(
                    user_id=order.user_id,
                    book_id=item.book_id,
                    status="unread",
                    added_at=datetime.utcnow()
                )
                db.add(library_item)
        
        db.commit()
        
        return {"message": "Bank transfer approved", "ebooks_added": len(ebook_items)}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reject/{order_id}")
async def reject_bank_transfer(
    order_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Admin endpoint to reject bank transfer payment"""
    from core.security import check_admin_access
    from datetime import datetime
    
    check_admin_access(current_user)
    
    try:
        payment = db.query(Payment).filter(Payment.order_id == order_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        payment.status = "failed"
        payment.updated_at = datetime.utcnow()
        
        order = db.query(Order).filter(Order.id == order_id).first()
        if order:
            order.status = "cancelled"
            order.updated_at = datetime.utcnow()
        
        db.commit()
        return {"message": "Bank transfer rejected"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

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