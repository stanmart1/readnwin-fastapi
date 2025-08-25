from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class AdminUserBase(BaseModel):
    email: str
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool = True
    role_id: Optional[int] = None

class AdminUserCreate(AdminUserBase):
    password: str

class AdminUserUpdate(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = None
    role_id: Optional[int] = None
    password: Optional[str] = None

class AdminUserResponse(AdminUserBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AdminStats(BaseModel):
    total_users: int
    active_users: int
    total_books: int
    total_orders: int
    total_revenue: float
    recent_activities: List[Dict[str, Any]]

class AdminActionLog(BaseModel):
    action: str
    user_id: int
    target_id: Optional[int] = None
    target_type: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    timestamp: datetime = datetime.utcnow()

class AdminEmailTemplate(BaseModel):
    name: str
    subject: str
    body: str
    variables: Optional[Dict[str, str]] = None
    
class AdminEmailTemplateUpdate(BaseModel):
    subject: Optional[str] = None
    body: Optional[str] = None
    variables: Optional[Dict[str, str]] = None

class AdminEmailTemplateResponse(AdminEmailTemplate):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AdminOrderStatus(BaseModel):
    order_id: int
    status: str
    note: Optional[str] = None

class AdminBookCreate(BaseModel):
    title: str
    author: str
    description: Optional[str] = None
    price: float
    isbn: Optional[str] = None
    category_id: Optional[int] = None
    publication_date: Optional[datetime] = None
    cover_image: Optional[str] = None
    file_path: Optional[str] = None

class AdminBookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    isbn: Optional[str] = None
    category_id: Optional[int] = None
    publication_date: Optional[datetime] = None
    cover_image: Optional[str] = None
    file_path: Optional[str] = None

class SystemSettingsUpdate(BaseModel):
    site_name: Optional[str] = None
    maintenance_mode: Optional[bool] = None
    analytics_enabled: Optional[bool] = None
    default_currency: Optional[str] = None
    contact_email: Optional[str] = None
    terms_url: Optional[str] = None
    privacy_url: Optional[str] = None
    custom_css: Optional[str] = None
    custom_js: Optional[str] = None
    features_config: Optional[Dict[str, Any]] = None

class SystemSettingsResponse(SystemSettingsUpdate):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class BulkOperationResponse(BaseModel):
    success: bool
    total: int
    processed: int
    failed: int
    errors: List[Dict[str, Any]]

class ShippingConfigCreate(BaseModel):
    name: str
    carrier: str
    method: str
    base_rate: float
    rate_per_kg: Optional[float] = None
    min_weight: Optional[float] = None
    max_weight: Optional[float] = None
    restrictions: Optional[Dict[str, Any]] = None
    estimated_days: Optional[int] = None

class ShippingConfigResponse(ShippingConfigCreate):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
