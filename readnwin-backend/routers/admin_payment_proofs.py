from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.user import User

router = APIRouter()

@router.get("/orders/{order_id}/payment-proofs")
def get_order_payment_proofs(
    order_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get payment proofs for an order"""
    check_admin_access(current_user)

    try:
        from models.payment import Payment
        
        payments = db.query(Payment).filter(
            Payment.order_id == order_id,
            Payment.proof_of_payment_url.isnot(None)
        ).all()
        
        proofs = []
        for payment in payments:
            if payment.proof_of_payment_url:
                filename = payment.proof_of_payment_url.split('/')[-1]
                
                proofs.append({
                    "id": payment.id,
                    "file_name": filename,
                    "file_path": payment.proof_of_payment_url,
                    "upload_date": payment.created_at.isoformat() if payment.created_at else None,
                    "status": "verified" if payment.status.value == "completed" else "pending",
                    "payment_method": payment.payment_method.value if hasattr(payment.payment_method, 'value') else str(payment.payment_method),
                    "amount": float(payment.amount),
                    "transaction_reference": payment.transaction_reference,
                    "admin_notes": payment.admin_notes
                })
        
        return {"success": True, "proofs": proofs, "total": len(proofs)}
        
    except Exception as e:
        print(f"Error fetching payment proofs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch payment proofs: {str(e)}")

@router.patch("/payments/{payment_id}/status")
def update_payment_proof_status(
    payment_id: int,
    status_data: dict,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update payment proof status"""
    check_admin_access(current_user)

    try:
        from models.payment import Payment, PaymentStatus
        
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        new_status = status_data.get("status")
        notes = status_data.get("notes")
        
        if new_status == "verified":
            payment.status = PaymentStatus.COMPLETED
        elif new_status == "rejected":
            payment.status = PaymentStatus.FAILED
        else:
            payment.status = PaymentStatus.AWAITING_APPROVAL
        
        if notes:
            payment.admin_notes = notes
        
        payment.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            "success": True,
            "message": f"Payment proof status updated to {new_status}",
            "payment_id": payment_id,
            "new_status": payment.status.value
        }
        
    except Exception as e:
        db.rollback()
        print(f"Error updating payment proof status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update payment proof status: {str(e)}")