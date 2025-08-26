from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class ShippingStatus(str, Enum):
    PREPARING = "preparing"
    READY_FOR_PICKUP = "ready_for_pickup"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    RETURNED = "returned"

class EnhancedOrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    price_at_time: float
    customizations: Optional[Dict[str, Any]]

class EnhancedOrderCreate(BaseModel):
    items: List[EnhancedOrderItemCreate]
    shipping_address: Dict[str, str]
    billing_address: Dict[str, str]
    payment_method: str
    shipping_method: str
    special_instructions: Optional[str]
    gift_wrapping: Optional[bool]
    estimated_delivery_date: Optional[datetime]

class OrderTrackingUpdate(BaseModel):
    tracking_number: str
    carrier: str
    current_status: ShippingStatus
    current_location: Optional[str]
    tracking_history: List[Dict[str, Any]]
    estimated_delivery: datetime

class ShippingStatusUpdate(BaseModel):
    status: ShippingStatus
    location: Optional[str]
    notes: Optional[str]
    updated_by: str
    timestamp: datetime

class GuestCheckoutCreate(BaseModel):
    items: List[EnhancedOrderItemCreate]
    customer_email: EmailStr
    customer_name: str
    shipping_address: Dict[str, str]
    billing_address: Dict[str, str]
    payment_method: str
    shipping_method: str

class EnhancedOrderResponse(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    items: List[Dict[str, Any]]
    subtotal: float
    tax: float
    shipping_cost: float
    total: float
    customer_info: Dict[str, Any]
    shipping_info: Dict[str, Any]
    payment_info: Dict[str, Any]
    tracking_info: Optional[OrderTrackingUpdate]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
