from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from .orders import OrderStatus, PaymentStatus, ShippingMethod

class ShippingMethodDetails(BaseModel):
    name: str
    description: str
    price: Decimal
    free_threshold: Decimal
    estimated_days: str

class ShippingEstimate(BaseModel):
    order_id: int
    shipping_method: ShippingMethod
    shipping_cost: Decimal
    estimated_delivery: str

class CheckoutOrder(BaseModel):
    items: List[dict]
    shipping_address: dict
    billing_address: Optional[dict] = None
    shipping_method: ShippingMethod
    payment_method: str
    email: EmailStr
    phone: Optional[str] = None
    notes: Optional[str] = None

class CheckoutResponse(BaseModel):
    order_id: int
    status: OrderStatus
    payment_status: PaymentStatus
    total_amount: Decimal
    shipping_cost: Decimal
    payment_details: dict
    created_at: datetime
    
    class Config:
        from_attributes = True
