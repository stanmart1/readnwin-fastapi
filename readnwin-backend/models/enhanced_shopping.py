from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum

from core.database import Base

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class ShippingStatus(str, Enum):
    NOT_SHIPPED = "not_shipped"
    PREPARING = "preparing"
    SHIPPED = "shipped"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    FAILED_DELIVERY = "failed_delivery"

class CartItemStatus(str, Enum):
    ACTIVE = "active"
    SAVED_FOR_LATER = "saved_for_later"
    REMOVED = "removed"

class EnhancedOrder(Base):
    __tablename__ = "enhanced_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)
    items = Column(JSON, nullable=False)
    subtotal = Column(Float, nullable=False)
    tax = Column(Float, nullable=False)
    shipping_cost = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    customer_info = Column(JSON, nullable=False)
    shipping_info = Column(JSON, nullable=False)
    payment_info = Column(JSON, nullable=False)
    tracking_info = Column(JSON)
    special_instructions = Column(String)
    gift_wrapping = Column(Boolean, default=False)
    estimated_delivery_date = Column(DateTime)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for guest checkouts
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="enhanced_orders")

class EnhancedCart(Base):
    __tablename__ = "enhanced_carts"

    id = Column(String, primary_key=True)  # UUID
    items = Column(JSON, nullable=False)
    subtotal = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    estimated_shipping = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    available_discounts = Column(JSON)
    recommended_items = Column(JSON)
    is_guest = Column(Boolean, default=False)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="enhanced_cart")

class ShoppingPreference(Base):
    __tablename__ = "shopping_preferences"

    id = Column(Integer, primary_key=True, index=True)
    preferred_categories = Column(JSON)
    favorite_authors = Column(JSON)
    price_range = Column(JSON)
    preferred_formats = Column(JSON)
    notification_preferences = Column(JSON)
    accessibility_settings = Column(JSON)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="shopping_preferences")
