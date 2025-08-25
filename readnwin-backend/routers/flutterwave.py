from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
from models.payment_settings import PaymentGateway
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import requests

router = APIRouter(prefix="/flutterwave", tags=["flutterwave"])

class FlutterwaveInitializeRequest(BaseModel):
    amount: float
    currency: str
    email: str
    phone_number: Optional[str] = None
    tx_ref: str
    customizations: Optional[Dict[str, str]] = None
    meta: Optional[Dict[str, Any]] = None

class FlutterwaveInlineRequest(FlutterwaveInitializeRequest):
    pass

@router.post("/initialize")
async def initialize_payment(
    payment_data: FlutterwaveInlineRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """Initialize Flutterwave payment and get redirect URL"""
    try:
        # Get Flutterwave configuration from database
        gateway = db.query(PaymentGateway).filter(PaymentGateway.id == "flutterwave").first()
        
        if not gateway or not gateway.enabled:
            raise HTTPException(status_code=500, detail="Flutterwave gateway not configured or disabled")
        
        if not gateway.api_keys or not gateway.api_keys.get("secretKey"):
            raise HTTPException(status_code=500, detail="Flutterwave secret key not configured")
        
        secret_key = gateway.api_keys["secretKey"]

        # Prepare payment data for Flutterwave API
        payload = {
            "tx_ref": payment_data.tx_ref,
            "amount": payment_data.amount,
            "currency": payment_data.currency,
            "redirect_url": f"{os.getenv('NEXT_PUBLIC_API_URL', 'http://localhost:3000')}/payment/callback",
            "payment_options": "card,mobilemoney,ussd,banktransfer",
            "customer": {
                "email": payment_data.email,
                "phone_number": payment_data.phone_number or "",
                "name": f"{current_user.first_name} {current_user.last_name}"
            },
            "customizations": {
                "title": "ReadnWin Payment",
                "description": f"Payment for order {payment_data.tx_ref}",
                "logo": f"{os.getenv('NEXT_PUBLIC_API_URL', 'http://localhost:3000')}/logo.png"
            },
            "meta": payment_data.meta or {}
        }

        headers = {
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json"
        }

        # Make request to Flutterwave API
        response = requests.post(
            "https://api.flutterwave.com/v3/payments",
            json=payload,
            headers=headers
        )

        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                return {
                    "success": True,
                    "payment_url": data["data"]["link"]
                }
            else:
                raise HTTPException(status_code=400, detail=data.get("message", "Payment initialization failed"))
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to initialize payment")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize payment: {str(e)}")

@router.post("/inline")
async def create_inline_payment(
    payment_data: FlutterwaveInlineRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token)
):
    """Create inline payment data for Flutterwave JavaScript SDK"""
    try:
        # Get Flutterwave configuration from database
        gateway = db.query(PaymentGateway).filter(PaymentGateway.id == "flutterwave").first()
        
        if not gateway or not gateway.enabled:
            raise HTTPException(status_code=500, detail="Flutterwave gateway not configured or disabled")
        
        if not gateway.api_keys or not gateway.api_keys.get("publicKey"):
            raise HTTPException(status_code=500, detail="Flutterwave public key not configured")
        
        public_key = gateway.api_keys["publicKey"]

        # Return payment data for inline JavaScript SDK
        inline_data = {
            "public_key": public_key,
            "tx_ref": payment_data.tx_ref,
            "amount": payment_data.amount,
            "currency": payment_data.currency,
            "payment_options": "card,mobilemoney,ussd,banktransfer",
            "customer": {
                "email": payment_data.email,
                "phone_number": payment_data.phone_number or "",
                "name": f"{current_user.first_name} {current_user.last_name}"
            },
            "customizations": {
                "title": "ReadnWin Payment",
                "description": f"Payment for order {payment_data.tx_ref}",
                "logo": f"{os.getenv('NEXT_PUBLIC_API_URL', 'http://localhost:3000')}/logo.png"
            },
            "meta": payment_data.meta or {}
        }

        return {
            "success": True,
            "paymentData": inline_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create inline payment: {str(e)}")