#!/usr/bin/env python3
"""
Initialize payment gateways in the database
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the parent directory to the path so we can import our modules
sys.path.append(str(Path(__file__).parent))

from core.database import SessionLocal
from models.payment_settings import PaymentGateway, PaymentSettings

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

def init_payment_gateways():
    """Initialize payment gateways in the database"""
    db = SessionLocal()
    
    try:
        # Check if gateways already exist
        existing_gateways = db.query(PaymentGateway).count()
        if existing_gateways > 0:
            print("Payment gateways already initialized")
            return
        
        # Initialize Flutterwave gateway
        flutterwave_keys = {}
        
        # Try to load from environment variables
        test_public = os.getenv("RAVE_TEST_PUBLIC_KEY")
        test_secret = os.getenv("RAVE_TEST_SECRET_KEY")
        live_public = os.getenv("RAVE_LIVE_PUBLIC_KEY")
        live_secret = os.getenv("RAVE_LIVE_SECRET_KEY")
        hash_key = os.getenv("RAVE_HASH")
        
        # Use test keys if available, otherwise live keys
        if test_public and test_secret:
            flutterwave_keys = {
                "publicKey": test_public,
                "secretKey": test_secret,
                "hash": hash_key or ""
            }
        elif live_public and live_secret:
            flutterwave_keys = {
                "publicKey": live_public,
                "secretKey": live_secret,
                "hash": hash_key or ""
            }
        
        flutterwave_gateway = PaymentGateway(
            id="flutterwave",
            name="Flutterwave",
            description="Leading payment technology company in Africa",
            icon="ri-global-line",
            enabled=bool(flutterwave_keys),
            test_mode=test_public is not None,
            api_keys=flutterwave_keys,
            supported_currencies=["NGN"],
            features=["Mobile Money", "Bank Transfers", "Credit Cards", "USSD", "QR Payments"],
            status="active" if flutterwave_keys else "inactive"
        )
        
        # Initialize Bank Transfer gateway
        bank_account = {
            "bankName": os.getenv("BANK_NAME", "Access Bank"),
            "accountNumber": os.getenv("BANK_ACCOUNT_NUMBER", "0101234567"),
            "accountName": os.getenv("BANK_ACCOUNT_NAME", "Lagsale Online Resources"),
            "accountType": os.getenv("BANK_ACCOUNT_TYPE", "Current"),
            "instructions": "Please include your order number as payment reference and upload proof of payment after transfer."
        }
        
        bank_transfer_gateway = PaymentGateway(
            id="bank_transfer",
            name="Bank Transfer",
            description="Direct bank transfer with proof of payment upload",
            icon="ri-bank-line",
            enabled=True,
            test_mode=False,
            api_keys={},
            bank_account=bank_account,
            supported_currencies=["NGN"],
            features=["Bank Transfers", "Proof of Payment", "Manual Verification"],
            status="active"
        )
        
        # Add gateways to database
        db.add(flutterwave_gateway)
        db.add(bank_transfer_gateway)
        
        # Initialize payment settings if not exists
        settings = db.query(PaymentSettings).first()
        if not settings:
            settings = PaymentSettings(
                default_gateway="flutterwave" if flutterwave_keys else "bank_transfer",
                currency="NGN",
                tax_rate=7.5,
                shipping_cost=500.0,
                free_shipping_threshold=5000.0,
                test_mode=test_public is not None
            )
            db.add(settings)
        
        db.commit()
        print("✅ Payment gateways initialized successfully")
        print(f"   - Flutterwave: {'Configured' if flutterwave_keys else 'Not configured'}")
        print(f"   - Bank Transfer: Configured")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error initializing payment gateways: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_payment_gateways()