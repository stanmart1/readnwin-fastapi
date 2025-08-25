from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum

from core.database import Base

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    AWAITING_APPROVAL = "awaiting_approval"
    REFUNDED = "refunded"

class PaymentMethodType(str, Enum):
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    FLUTTERWAVE = "flutterwave"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Numeric(12, 2), nullable=False)  # Precision for Naira amounts
    currency = Column(String(3), default="NGN", nullable=False)
    payment_method = Column(SQLEnum(PaymentMethodType), nullable=False)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    transaction_reference = Column(String(100), unique=True, index=True)
    description = Column(String(500), nullable=True)
    
    # Foreign Keys
    order_id = Column(Integer, ForeignKey("orders.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Bank Transfer specific fields
    proof_of_payment_url = Column(String(500))
    admin_notes = Column(String(1000))

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    order = relationship("Order", back_populates="payments")
    user = relationship("User", back_populates="payments")
