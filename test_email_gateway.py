#!/usr/bin/env python3
"""
Test script to verify email gateway configuration is working properly
"""

import sys
import os
from dotenv import load_dotenv

sys.path.append('/Users/bibleway/Documents/readnwin-next/readnwin-backend')

# Load environment variables
load_dotenv('/Users/bibleway/Documents/readnwin-next/readnwin-backend/.env')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.email import EmailGatewayConfig
from services.resend_email_service import ResendEmailService

# Database connection from .env
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_NAME = os.getenv('DB_NAME')

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
print(f"Connecting to database: {DB_HOST}:{DB_PORT}/{DB_NAME}")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_email_gateway():
    """Test email gateway configuration"""
    db = SessionLocal()
    
    try:
        # Check if Resend gateway exists in database
        resend_config = db.query(EmailGatewayConfig).filter(
            EmailGatewayConfig.provider == "resend"
        ).first()
        
        if resend_config:
            print(f"✅ Resend gateway found in database:")
            print(f"   - Provider: {resend_config.provider}")
            print(f"   - From Email: {resend_config.from_email}")
            print(f"   - From Name: {resend_config.from_name}")
            print(f"   - Domain: {resend_config.domain}")
            print(f"   - Is Active: {resend_config.is_active}")
            print(f"   - API Key: {'***' + resend_config.api_key[-4:] if resend_config.api_key and len(resend_config.api_key) > 4 else 'Not set'}")
        else:
            print("❌ No Resend gateway configuration found in database")
            return
        
        # Test ResendEmailService initialization
        try:
            email_service = ResendEmailService(db_session=db)
            print("✅ ResendEmailService initialized successfully")
            print(f"   - API Key loaded: {'Yes' if email_service.api_key else 'No'}")
            print(f"   - From Email: {email_service.from_email}")
        except Exception as e:
            print(f"❌ Failed to initialize ResendEmailService: {e}")
            
    except Exception as e:
        print(f"❌ Database error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_email_gateway()