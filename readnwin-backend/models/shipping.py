from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from core.database import Base

class ShippingZone(Base):
    __tablename__ = "shipping_zones"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    countries = Column(JSON, default=list)
    states = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ShippingMethod(Base):
    __tablename__ = "shipping_methods"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    base_cost = Column(Float, nullable=False, default=0.0)
    cost_per_item = Column(Float, nullable=False, default=0.0)
    free_shipping_threshold = Column(Float, nullable=True)
    estimated_days_min = Column(Integer, nullable=False, default=1)
    estimated_days_max = Column(Integer, nullable=False, default=7)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ShippingMethodZone(Base):
    __tablename__ = "shipping_method_zones"
    
    id = Column(Integer, primary_key=True, index=True)
    shipping_method_id = Column(Integer, ForeignKey("shipping_methods.id"), nullable=False)
    shipping_zone_id = Column(Integer, ForeignKey("shipping_zones.id"), nullable=False)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)