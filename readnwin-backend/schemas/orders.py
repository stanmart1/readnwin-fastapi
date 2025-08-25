from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, constr, condecimal
from decimal import Decimal
from datetime import datetime
from enum import Enum

class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class ShippingMethod(str, Enum):
    STANDARD = "standard"
    EXPRESS = "express"
    DIGITAL = "digital"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    AUTHORIZED = "authorized"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"

class OrderItemBase(BaseModel):
    book_id: int
    quantity: int = 1
    unit_price: Decimal
    subtotal: Decimal

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: int
    order_id: int
    book_title: str
    book_author: Optional[str] = None
    book_cover: Optional[str] = None
    
    class Config:
        from_attributes = True

class ShippingAddress(BaseModel):
    full_name: str
    street_address: str
    city: str
    state: str
    postal_code: str
    country: str
    phone: Optional[str] = None

class OrderBase(BaseModel):
    user_id: int
    shipping_method: ShippingMethod
    shipping_address: ShippingAddress
    notes: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    shipping_method: Optional[ShippingMethod] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None

class OrderResponse(OrderBase):
    id: int
    order_number: str
    status: OrderStatus
    payment_status: PaymentStatus
    items: List[OrderItemResponse]
    subtotal: Decimal
    shipping_cost: Decimal
    tax: Decimal
    total: Decimal
    tracking_number: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class OrderSummary(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    total: Decimal
    created_at: datetime
    item_count: int

class OrderAnalytics(BaseModel):
    total_orders: int
    total_revenue: Decimal
    average_order_value: Decimal
    orders_by_status: Dict[OrderStatus, int]
    revenue_by_day: List[Dict[str, Any]]

class BulkOrderUpdate(BaseModel):
    order_ids: List[int]
    status: OrderStatus
    notify_customers: bool = False

class OrderRefundRequest(BaseModel):
    order_id: int
    amount: Decimal
    reason: str
    items: Optional[List[int]] = None  # List of order item IDs to refund

class GuestCheckoutCreate(OrderCreate):
    email: EmailStr
    create_account: bool = False
    password: Optional[str] = None

class EnhancedOrderCreate(OrderCreate):
    save_address: bool = False
    use_saved_address_id: Optional[int] = None
    preferred_delivery_time: Optional[str] = None
    gift_wrapping: bool = False
    gift_message: Optional[str] = None

class OrderTrackingUpdate(BaseModel):
    tracking_number: str
    carrier: str
    estimated_delivery: Optional[datetime] = None
    tracking_url: Optional[str] = None

class ShippingStatusUpdate(BaseModel):
    status: OrderStatus
    location: Optional[str] = None
    description: Optional[str] = None
    timestamp: datetime = datetime.utcnow()

class EnhancedOrderResponse(OrderResponse):
    tracking_info: Optional[OrderTrackingUpdate] = None
    shipping_updates: List[ShippingStatusUpdate] = []
    is_gift: bool = False
    gift_message: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    delivery_preferences: Optional[Dict[str, Any]] = None
