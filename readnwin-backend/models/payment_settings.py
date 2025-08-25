from sqlalchemy import Column, Integer, String, Boolean, Float, Text, JSON, DateTime
from sqlalchemy.sql import func
from core.database import Base

class PaymentSettings(Base):
    __tablename__ = "payment_settings"

    id = Column(Integer, primary_key=True, index=True)
    default_gateway = Column(String(50), default="flutterwave")
    currency = Column(String(10), default="NGN")
    tax_rate = Column(Float, default=7.5)
    shipping_cost = Column(Float, default=500.0)
    free_shipping_threshold = Column(Float, default=5000.0)
    webhook_url = Column(String(255), nullable=True)
    test_mode = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class PaymentGateway(Base):
    __tablename__ = "payment_gateways"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(100), nullable=True)
    enabled = Column(Boolean, default=False)
    test_mode = Column(Boolean, default=True)
    api_keys = Column(JSON, nullable=True)
    bank_account = Column(JSON, nullable=True)
    supported_currencies = Column(JSON, nullable=True)
    features = Column(JSON, nullable=True)
    status = Column(String(20), default="inactive")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())