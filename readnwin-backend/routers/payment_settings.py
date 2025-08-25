from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.user import User
from models.payment_settings import PaymentSettings
from models.payment_settings import PaymentGateway as PaymentGatewayModel
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(tags=["payment"])

class PaymentGatewaySchema(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    enabled: bool
    testMode: bool
    apiKeys: Dict[str, str]
    bankAccount: Optional[Dict[str, str]] = None
    supportedCurrencies: List[str]
    features: List[str]
    status: str

class PaymentSettingsSchema(BaseModel):
    defaultGateway: str
    supportedGateways: List[str]
    currency: str
    taxRate: float
    shippingCost: float
    freeShippingThreshold: float
    webhookUrl: str
    testMode: bool

class PaymentSettingsResponse(BaseModel):
    gateways: List[PaymentGatewaySchema]
    settings: PaymentSettingsSchema

class PaymentSettingsRequest(BaseModel):
    gateways: List[PaymentGatewaySchema]
    settings: PaymentSettingsSchema

class GatewayRequest(BaseModel):
    gateway: PaymentGatewaySchema

class TestConnectionRequest(BaseModel):
    gatewayId: str
    apiKeys: Dict[str, str]
    testMode: bool

def init_default_payment_data(db: Session):
    """Initialize default payment settings and gateways if they don't exist"""
    # Create default settings if not exists
    if not db.query(PaymentSettings).first():
        settings = PaymentSettings(
            default_gateway="flutterwave",
            currency="NGN",
            tax_rate=7.5,
            shipping_cost=500.0,
            free_shipping_threshold=5000.0,
            test_mode=False
        )
        db.add(settings)
    
    # Create default gateways if not exist
    if not db.query(PaymentGatewayModel).filter(PaymentGatewayModel.id == "flutterwave").first():
        flutterwave = PaymentGatewayModel(
            id="flutterwave",
            name="Flutterwave",
            description="Instant payment processing with multiple payment options",
            icon="ri-bank-card-line",
            enabled=True,
            test_mode=False,
            api_keys={
                "publicKey": os.getenv("RAVE_LIVE_PUBLIC_KEY") or os.getenv("RAVE_TEST_PUBLIC_KEY", ""),
                "secretKey": os.getenv("RAVE_LIVE_SECRET_KEY") or os.getenv("RAVE_TEST_SECRET_KEY", ""),
                "hash": os.getenv("RAVE_HASH", "")
            },
            supported_currencies=["NGN"],
            features=["Instant processing", "Multiple payment options", "Secure transactions", "Immediate confirmation"],
            status="active"
        )
        db.add(flutterwave)
    
    if not db.query(PaymentGatewayModel).filter(PaymentGatewayModel.id == "bank_transfer").first():
        bank_transfer = PaymentGatewayModel(
            id="bank_transfer",
            name="Bank Transfer",
            description="Direct bank transfer with proof of payment upload",
            icon="ri-bank-line",
            enabled=True,
            test_mode=False,
            bank_account={
                "bankName": "Zenith Bank",
                "accountNumber": "1015830730",
                "accountName": "LAGSALE ONLINE RESOURCES",
                "accountType": "Current",
                "instructions": "Please include your order number as payment reference"
            },
            supported_currencies=["NGN"],
            features=["No processing fees", "Manual verification", "1-2 business days"],
            status="active"
        )
        db.add(bank_transfer)
    
    db.commit()









@router.get("/payment-gateways")
def get_payment_gateways(
    db: Session = Depends(get_db)
):
    """Get available payment gateways - public endpoint"""
    
    try:
        init_default_payment_data(db)
        gateways = db.query(PaymentGatewayModel).filter(PaymentGatewayModel.enabled == True).all()
        
        gateway_list = []
        for g in gateways:
            gateway_data = {
                "id": g.id,
                "name": g.name,
                "description": g.description,
                "icon": g.icon,
                "enabled": g.enabled,
                "testMode": g.test_mode,
                "status": g.status,
                "features": g.features or [],
                "supportedCurrencies": g.supported_currencies or ["NGN"]
            }
            
            # Add bank account info for bank transfer
            if g.id == "bank_transfer" and g.bank_account:
                gateway_data["bankAccount"] = g.bank_account
                
            gateway_list.append(gateway_data)
        
        return {"gateways": gateway_list}
    except Exception as e:
        print(f"Error fetching payment gateways: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment gateways")



