from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.user import User
from models.shipping import ShippingMethod, ShippingZone
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/shipping", tags=["shipping"])

class ShippingZoneCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    countries: List[str] = ["NG"]
    states: List[str] = []
    is_active: bool = True

class ShippingMethodCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    base_cost: float
    cost_per_item: float
    free_shipping_threshold: Optional[float] = None
    estimated_days_min: int
    estimated_days_max: int
    is_active: bool = True
    sort_order: int = 0

class ShippingMethodResponse(BaseModel):
    id: int
    name: str
    description: str
    base_cost: float
    cost_per_item: float
    free_shipping_threshold: Optional[float]
    estimated_days_min: int
    estimated_days_max: int
    is_active: bool
    sort_order: int

def init_default_shipping_methods(db: Session):
    """Initialize default shipping methods if they don't exist"""
    if db.query(ShippingMethod).count() == 0:
        default_methods = [
            ShippingMethod(
                name="Standard Delivery",
                description="Regular delivery within Nigeria",
                base_cost=500.0,
                cost_per_item=0.0,
                free_shipping_threshold=5000.0,
                estimated_days_min=3,
                estimated_days_max=7,
                is_active=True,
                sort_order=1
            ),
            ShippingMethod(
                name="Express Delivery",
                description="Fast delivery within major cities",
                base_cost=1000.0,
                cost_per_item=0.0,
                free_shipping_threshold=None,
                estimated_days_min=1,
                estimated_days_max=3,
                is_active=True,
                sort_order=2
            )
        ]
        
        for method in default_methods:
            db.add(method)
        db.commit()

@router.get("/methods")
def get_shipping_methods(
    db: Session = Depends(get_db)
):
    """Get shipping methods from database - public endpoint"""
    
    try:
        # Initialize default methods if needed
        init_default_shipping_methods(db)
        
        # Get methods from database
        methods = db.query(ShippingMethod).all()
        
        return {
            "methods": [
                {
                    "id": method.id,
                    "name": method.name,
                    "description": method.description or "",
                    "base_cost": method.base_cost,
                    "cost_per_item": method.cost_per_item,
                    "free_shipping_threshold": method.free_shipping_threshold,
                    "estimated_days_min": method.estimated_days_min,
                    "estimated_days_max": method.estimated_days_max,
                    "is_active": method.is_active,
                    "sort_order": method.sort_order
                }
                for method in methods
            ]
        }
    except Exception as e:
        print(f"Error fetching shipping methods: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch shipping methods")

@router.post("/methods")
def create_shipping_method(
    method_data: ShippingMethodCreate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new shipping method"""
    check_admin_access(current_user)
    
    try:
        new_method = ShippingMethod(
            name=method_data.name,
            description=method_data.description,
            base_cost=method_data.base_cost,
            cost_per_item=method_data.cost_per_item,
            free_shipping_threshold=method_data.free_shipping_threshold,
            estimated_days_min=method_data.estimated_days_min,
            estimated_days_max=method_data.estimated_days_max,
            is_active=method_data.is_active,
            sort_order=method_data.sort_order
        )
        
        db.add(new_method)
        db.commit()
        db.refresh(new_method)
        
        return {"message": "Shipping method created successfully", "id": new_method.id}
    except Exception as e:
        db.rollback()
        print(f"Error creating shipping method: {e}")
        raise HTTPException(status_code=500, detail="Failed to create shipping method")

@router.put("/methods/{method_id}")
def update_shipping_method(
    method_id: int,
    method_data: ShippingMethodCreate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update a shipping method"""
    check_admin_access(current_user)
    
    try:
        method = db.query(ShippingMethod).filter(ShippingMethod.id == method_id).first()
        if not method:
            raise HTTPException(status_code=404, detail="Shipping method not found")
        
        method.name = method_data.name
        method.description = method_data.description
        method.base_cost = method_data.base_cost
        method.cost_per_item = method_data.cost_per_item
        method.free_shipping_threshold = method_data.free_shipping_threshold
        method.estimated_days_min = method_data.estimated_days_min
        method.estimated_days_max = method_data.estimated_days_max
        method.is_active = method_data.is_active
        method.sort_order = method_data.sort_order
        
        db.commit()
        return {"message": "Shipping method updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating shipping method: {e}")
        raise HTTPException(status_code=500, detail="Failed to update shipping method")

@router.delete("/methods/{method_id}")
def delete_shipping_method(
    method_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete a shipping method"""
    check_admin_access(current_user)
    
    try:
        method = db.query(ShippingMethod).filter(ShippingMethod.id == method_id).first()
        if not method:
            raise HTTPException(status_code=404, detail="Shipping method not found")
        
        db.delete(method)
        db.commit()
        return {"message": "Shipping method deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting shipping method: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete shipping method")

@router.get("/zones")
def get_shipping_zones(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get shipping zones from database"""
    check_admin_access(current_user)
    
    try:
        zones = db.query(ShippingZone).all()
        return {
            "zones": [
                {
                    "id": zone.id,
                    "name": zone.name,
                    "description": zone.description or "",
                    "countries": zone.countries or [],
                    "states": zone.states or [],
                    "is_active": zone.is_active
                }
                for zone in zones
            ]
        }
    except Exception as e:
        print(f"Error fetching shipping zones: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch shipping zones")

@router.post("/zones")
def create_shipping_zone(
    zone_data: ShippingZoneCreate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new shipping zone"""
    check_admin_access(current_user)
    
    try:
        new_zone = ShippingZone(
            name=zone_data.name,
            description=zone_data.description,
            countries=zone_data.countries,
            states=zone_data.states,
            is_active=zone_data.is_active
        )
        
        db.add(new_zone)
        db.commit()
        db.refresh(new_zone)
        
        return {"message": "Shipping zone created successfully", "id": new_zone.id}
    except Exception as e:
        db.rollback()
        print(f"Error creating shipping zone: {e}")
        raise HTTPException(status_code=500, detail="Failed to create shipping zone")

@router.put("/zones/{zone_id}")
def update_shipping_zone(
    zone_id: int,
    zone_data: ShippingZoneCreate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update a shipping zone"""
    check_admin_access(current_user)
    
    try:
        zone = db.query(ShippingZone).filter(ShippingZone.id == zone_id).first()
        if not zone:
            raise HTTPException(status_code=404, detail="Shipping zone not found")
        
        zone.name = zone_data.name
        zone.description = zone_data.description
        zone.countries = zone_data.countries
        zone.states = zone_data.states
        zone.is_active = zone_data.is_active
        
        db.commit()
        return {"message": "Shipping zone updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating shipping zone: {e}")
        raise HTTPException(status_code=500, detail="Failed to update shipping zone")

@router.delete("/zones/{zone_id}")
def delete_shipping_zone(
    zone_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete a shipping zone"""
    check_admin_access(current_user)
    
    try:
        zone = db.query(ShippingZone).filter(ShippingZone.id == zone_id).first()
        if not zone:
            raise HTTPException(status_code=404, detail="Shipping zone not found")
        
        db.delete(zone)
        db.commit()
        return {"message": "Shipping zone deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting shipping zone: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete shipping zone")