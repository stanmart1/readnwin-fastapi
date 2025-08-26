from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class CartItemStatus(str, Enum):
    ACTIVE = "active"
    SAVED_FOR_LATER = "saved_for_later"
    UNAVAILABLE = "unavailable"

class EnhancedCartItemCreate(BaseModel):
    product_id: int
    quantity: int
    customizations: Optional[Dict[str, Any]]
    gift_wrapping: Optional[bool]
    status: CartItemStatus = CartItemStatus.ACTIVE

class EnhancedCartResponse(BaseModel):
    id: str
    items: List[Dict[str, Any]]
    subtotal: float
    tax: float
    estimated_shipping: float
    total: float
    available_discounts: List[Dict[str, Any]]
    recommended_items: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CheckoutSessionCreate(BaseModel):
    cart_id: str
    customer_email: Optional[str]
    shipping_address: Optional[Dict[str, str]]
    billing_address: Optional[Dict[str, str]]
    payment_method: Optional[str]
    shipping_method: Optional[str]

class CheckoutSessionResponse(BaseModel):
    session_id: str
    status: str
    cart: EnhancedCartResponse
    customer_info: Optional[Dict[str, Any]]
    shipping_methods: List[Dict[str, Any]]
    payment_methods: List[Dict[str, Any]]
    expires_at: datetime

    class Config:
        from_attributes = True

class ShoppingPreferences(BaseModel):
    preferred_categories: List[str]
    favorite_authors: List[str]
    price_range: Dict[str, float]
    preferred_formats: List[str]
    notification_preferences: Dict[str, bool]
    accessibility_settings: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
