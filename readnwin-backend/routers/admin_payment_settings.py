from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.user import User
from models.payment_settings import PaymentSettings, PaymentGateway
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/admin", tags=["admin", "payment"])

class PaymentGatewayModel(BaseModel):
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

class PaymentSettingsModel(BaseModel):
    defaultGateway: str
    supportedGateways: List[str]
    currency: str
    taxRate: float
    shippingCost: float
    freeShippingThreshold: float
    webhookUrl: Optional[str] = ""
    testMode: bool

class PaymentSettingsResponse(BaseModel):
    gateways: List[PaymentGatewayModel]
    settings: PaymentSettingsModel

class PaymentSettingsRequest(BaseModel):
    gateways: List[PaymentGatewayModel]
    settings: PaymentSettingsModel

class GatewayRequest(BaseModel):
    gateway: PaymentGatewayModel

class TestConnectionRequest(BaseModel):
    gatewayId: str
    apiKeys: Dict[str, str]
    testMode: bool

@router.get("/payment-settings", response_model=PaymentSettingsResponse)
def get_admin_payment_settings(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get payment gateway settings for admin"""
    check_admin_access(current_user)
    
    try:
        # Get settings and gateways from database
        settings = db.query(PaymentSettings).first()
        gateways = db.query(PaymentGateway).all()
        
        # Format response
        gateway_list = []
        for g in gateways:
            gateway_list.append({
                "id": g.id,
                "name": g.name,
                "description": g.description,
                "icon": g.icon,
                "enabled": g.enabled,
                "testMode": g.test_mode,
                "apiKeys": g.api_keys or {},
                "bankAccount": g.bank_account,
                "supportedCurrencies": g.supported_currencies or [],
                "features": g.features or [],
                "status": g.status
            })
        
        return {
            "gateways": gateway_list,
            "settings": {
                "defaultGateway": settings.default_gateway if settings else "flutterwave",
                "supportedGateways": [g.id for g in gateways if g.enabled],
                "currency": settings.currency if settings else "NGN",
                "taxRate": settings.tax_rate if settings else 7.5,
                "shippingCost": settings.shipping_cost if settings else 500.0,
                "freeShippingThreshold": settings.free_shipping_threshold if settings else 5000.0,
                "webhookUrl": settings.webhook_url if settings and settings.webhook_url else "",
                "testMode": settings.test_mode if settings else False
            }
        }
    except Exception as e:
        print(f"Error fetching admin payment settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment settings")

@router.post("/payment-settings")
def save_admin_payment_settings(
    settings_data: PaymentSettingsRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Save payment gateway settings for admin"""
    check_admin_access(current_user)
    
    try:
        # Update settings in database
        settings = db.query(PaymentSettings).first()
        if settings:
            settings.default_gateway = settings_data.settings.defaultGateway
            settings.currency = settings_data.settings.currency
            settings.tax_rate = settings_data.settings.taxRate
            settings.shipping_cost = settings_data.settings.shippingCost
            settings.free_shipping_threshold = settings_data.settings.freeShippingThreshold
            settings.webhook_url = settings_data.settings.webhookUrl
            settings.test_mode = settings_data.settings.testMode
        
        # Update gateways in database
        for gateway_data in settings_data.gateways:
            gateway = db.query(PaymentGateway).filter(PaymentGateway.id == gateway_data.id).first()
            if gateway:
                gateway.enabled = gateway_data.enabled
                gateway.test_mode = gateway_data.testMode
                gateway.api_keys = gateway_data.apiKeys
                gateway.bank_account = gateway_data.bankAccount
                gateway.status = gateway_data.status
                
                # For Flutterwave, ensure proper key storage
                if gateway_data.id == "flutterwave" and gateway_data.apiKeys:
                    gateway.api_keys = {
                        "publicKey": gateway_data.apiKeys.get("publicKey", ""),
                        "secretKey": gateway_data.apiKeys.get("secretKey", ""),
                        "hash": gateway_data.apiKeys.get("hash", "")
                    }
        
        db.commit()
        return {"message": "Payment settings saved successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error saving admin payment settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to save payment settings")

@router.post("/payment-settings/gateway")
def save_gateway_settings(
    gateway_data: GatewayRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Save individual gateway settings"""
    check_admin_access(current_user)
    
    try:
        gateway = db.query(PaymentGateway).filter(PaymentGateway.id == gateway_data.gateway.id).first()
        if not gateway:
            raise HTTPException(status_code=404, detail="Gateway not found")
        
        # Update gateway settings
        gateway.enabled = gateway_data.gateway.enabled
        gateway.test_mode = gateway_data.gateway.testMode
        gateway.api_keys = gateway_data.gateway.apiKeys
        gateway.bank_account = gateway_data.gateway.bankAccount
        gateway.status = gateway_data.gateway.status
        
        # For Flutterwave, only store publicKey, secretKey, and hash
        if gateway_data.gateway.id == "flutterwave":
            api_keys = gateway_data.gateway.apiKeys
            gateway.api_keys = {
                "publicKey": api_keys.get("publicKey", ""),
                "secretKey": api_keys.get("secretKey", ""),
                "hash": api_keys.get("hash", "")
            }
        
        db.commit()
        return {"message": f"{gateway_data.gateway.name} settings saved successfully"}
    except Exception as e:
        db.rollback()
        print(f"Error saving gateway settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to save gateway settings")

@router.get("/payment-settings/flutterwave-env")
def get_flutterwave_from_env(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Load Flutterwave configuration from environment variables"""
    check_admin_access(current_user)
    
    try:
        # Get Flutterwave keys from environment
        public_key = os.getenv("RAVE_LIVE_PUBLIC_KEY", "")
        secret_key = os.getenv("RAVE_LIVE_SECRET_KEY", "")
        hash_key = os.getenv("RAVE_HASH", "")
        
        if not public_key or not secret_key or not hash_key:
            raise HTTPException(status_code=400, detail="Flutterwave environment variables not found")
        
        # Update the database with environment values
        gateway = db.query(PaymentGateway).filter(PaymentGateway.id == "flutterwave").first()
        if gateway:
            gateway.api_keys = {
                "publicKey": public_key,
                "secretKey": secret_key,
                "hash": hash_key
            }
            gateway.enabled = True
            gateway.status = "active"
            db.commit()
        
        return {
            "publicKey": public_key,
            "secretKey": secret_key,
            "hash": hash_key,
            "message": "Flutterwave configuration loaded from environment"
        }
    except Exception as e:
        print(f"Error loading Flutterwave from env: {e}")
        raise HTTPException(status_code=500, detail="Failed to load Flutterwave configuration")

@router.post("/payment-settings/test-connection")
def test_admin_gateway_connection(
    test_data: TestConnectionRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Test payment gateway connection for admin"""
    check_admin_access(current_user)
    
    try:
        gateway_id = test_data.gatewayId
        api_keys = test_data.apiKeys
        test_mode = test_data.testMode
        
        print(f"Testing connection for gateway: {gateway_id}")
        print(f"Test mode: {test_mode}")
        
        # Mock connection test logic
        if gateway_id == "flutterwave":
            # Validate Flutterwave keys format
            public_key = api_keys.get("publicKey", "")
            secret_key = api_keys.get("secretKey", "")
            hash_key = api_keys.get("hash", "")
            
            if not public_key.startswith("FLWPUBK-"):
                raise HTTPException(status_code=400, detail="Invalid Flutterwave public key format")
            
            if not secret_key.startswith("FLWSECK-"):
                raise HTTPException(status_code=400, detail="Invalid Flutterwave secret key format")
            
            if len(hash_key) < 20:
                raise HTTPException(status_code=400, detail="Hash key too short")
            
            return {
                "success": True,
                "message": "Flutterwave connection test successful",
                "gateway": gateway_id,
                "testMode": test_mode
            }
            
        elif gateway_id == "bank_transfer":
            return {
                "success": True,
                "message": "Bank transfer gateway is ready for manual processing",
                "gateway": gateway_id
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"Unknown gateway: {gateway_id}")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error testing admin gateway connection: {e}")
        raise HTTPException(status_code=500, detail=f"Connection test failed: {str(e)}")