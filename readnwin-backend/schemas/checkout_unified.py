from pydantic import BaseModel, Field, validator
from typing import Optional, List, Literal
from decimal import Decimal
from enum import Enum

class PaymentMethodType(str, Enum):
    FLUTTERWAVE = "flutterwave"
    BANK_TRANSFER = "bank_transfer"

class ShippingAddress(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')
    phone: Optional[str] = Field(None, max_length=15)
    address: Optional[str] = Field(None, max_length=200)
    city: Optional[str] = Field(None, max_length=50)
    state: Optional[str] = Field(None, max_length=50)
    zip_code: Optional[str] = Field(None, max_length=10)
    country: str = Field(default="NG", max_length=2)

class BillingAddress(BaseModel):
    same_as_shipping: bool = Field(default=True)
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, pattern=r'^[^@]+@[^@]+\.[^@]+$')
    phone: Optional[str] = Field(None, max_length=15)
    address: Optional[str] = Field(None, max_length=200)
    city: Optional[str] = Field(None, max_length=50)
    state: Optional[str] = Field(None, max_length=50)
    zip_code: Optional[str] = Field(None, max_length=10)
    country: Optional[str] = Field(None, max_length=2)

class PaymentData(BaseModel):
    method: PaymentMethodType
    gateway: PaymentMethodType

    @validator('gateway')
    def validate_gateway_matches_method(cls, v, values):
        if 'method' in values and v != values['method']:
            raise ValueError('Gateway must match payment method')
        return v

class ShippingMethodData(BaseModel):
    id: int
    name: str
    base_cost: Decimal
    cost_per_item: Decimal = Field(default=Decimal('0'))
    estimated_days_min: int
    estimated_days_max: int
    free_shipping_threshold: Optional[Decimal] = None

class CartItemData(BaseModel):
    book_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0, le=10)
    price: Decimal = Field(..., gt=0)

class CheckoutRequest(BaseModel):
    shipping_address: ShippingAddress
    billing_address: BillingAddress
    payment: PaymentData
    shipping_method: Optional[ShippingMethodData] = None
    cart_items: Optional[List[CartItemData]] = []
    notes: Optional[str] = Field(None, max_length=500)
    is_ebook_only: Optional[bool] = Field(default=False)

class CheckoutResponse(BaseModel):
    success: bool
    order_id: int
    order_number: str
    total_amount: Decimal
    payment_method: PaymentMethodType
    payment_url: Optional[str] = None
    bank_transfer_details: Optional[dict] = None
    message: str

class OrderSummary(BaseModel):
    subtotal: Decimal
    shipping_cost: Decimal
    tax_amount: Decimal
    discount_amount: Decimal = Field(default=Decimal('0'))
    total_amount: Decimal
    currency: str = Field(default="NGN")