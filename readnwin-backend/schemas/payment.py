from pydantic import BaseModel, constr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
from decimal import Decimal

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

class PaymentBase(BaseModel):
    amount: Decimal = Field(..., decimal_places=2, gt=0, description="Amount in Naira")
    currency: str = Field(default="NGN", pattern="^NGN$")
    payment_method: PaymentMethodType
    description: Optional[str] = Field(None, max_length=500)
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        return v

class PaymentCreate(PaymentBase):
    order_id: int = Field(..., gt=0)
    
    @validator('order_id')
    def validate_order_id(cls, v):
        if v <= 0:
            raise ValueError('Order ID must be positive')
        return v

class PaymentResponse(PaymentBase):
    id: int
    status: PaymentStatus
    transaction_reference: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaymentVerification(BaseModel):
    transaction_reference: str
    payment_provider: str
    verification_data: dict

class PaymentStatusUpdate(BaseModel):
    status: PaymentStatus
    transaction_reference: str

class AdminPaymentApproval(BaseModel):
    payment_id: int
    status: PaymentStatus
    admin_notes: Optional[str] = None

class BankTransferRequest(PaymentBase):
    order_id: int = Field(..., gt=0)
    bank_code: str = Field(..., min_length=3, max_length=10)
    account_number: str = Field(..., min_length=10, max_length=10, pattern="^[0-9]+$")
    account_name: str = Field(..., min_length=2, max_length=100)
    
    @validator('account_number')
    def validate_account_number(cls, v):
        if not v.isdigit() or len(v) != 10:
            raise ValueError('Account number must be exactly 10 digits')
        return v

class BankTransferWithProof(BankTransferRequest):
    proof_of_payment_url: str = Field(..., description="URL to uploaded proof of payment")
