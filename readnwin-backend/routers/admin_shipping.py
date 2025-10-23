from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.user import User
from models.shipping import ShippingMethod, ShippingZone, ShippingMethodZone
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/admin/shipping", tags=["admin", "shipping"])

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

@router.get("/methods")
def get_admin_shipping_methods(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get shipping methods for admin management"""
    check_admin_access(current_user)
    
    try:
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
        print(f"Error fetching admin shipping methods: {e}")
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
def get_admin_shipping_zones(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get shipping zones for admin management"""
    check_admin_access(current_user)
    
    try:
        zones = db.query(ShippingZone).all()
        
        return {
            "zones": [
                {
                    "id": zone.id,
                    "name": zone.name,
                    "description": zone.description or "",
                    "countries": zone.countries,
                    "states": zone.states,
                    "is_active": zone.is_active
                }
                for zone in zones
            ]
        }
    except Exception as e:
        print(f"Error fetching admin shipping zones: {e}")
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

# Method-Zone Associations
class MethodZoneCreate(BaseModel):
    shipping_method_id: int
    shipping_zone_id: int
    is_available: bool = True

@router.get("/method-zones")
def get_method_zones(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all method-zone associations"""
    check_admin_access(current_user)
    
    try:
        method_zones = db.query(ShippingMethodZone).all()
        
        result = []
        for mz in method_zones:
            method = db.query(ShippingMethod).filter(ShippingMethod.id == mz.shipping_method_id).first()
            zone = db.query(ShippingZone).filter(ShippingZone.id == mz.shipping_zone_id).first()
            
            result.append({
                "id": mz.id,
                "shipping_method_id": mz.shipping_method_id,
                "shipping_zone_id": mz.shipping_zone_id,
                "is_available": mz.is_available,
                "method_name": method.name if method else None,
                "zone_name": zone.name if zone else None
            })
        
        return {"methodZones": result}
    except Exception as e:
        print(f"Error fetching method zones: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch method zones")

@router.post("/method-zones")
def create_or_update_method_zone(
    data: MethodZoneCreate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create or update a method-zone association"""
    check_admin_access(current_user)
    
    try:
        # Check if association already exists
        existing = db.query(ShippingMethodZone).filter(
            ShippingMethodZone.shipping_method_id == data.shipping_method_id,
            ShippingMethodZone.shipping_zone_id == data.shipping_zone_id
        ).first()
        
        if existing:
            # Update existing
            existing.is_available = data.is_available
            db.commit()
            db.refresh(existing)
            return {"message": "Method-zone association updated", "id": existing.id}
        else:
            # Create new
            method_zone = ShippingMethodZone(
                shipping_method_id=data.shipping_method_id,
                shipping_zone_id=data.shipping_zone_id,
                is_available=data.is_available
            )
            db.add(method_zone)
            db.commit()
            db.refresh(method_zone)
            return {"message": "Method-zone association created", "id": method_zone.id}
    except Exception as e:
        db.rollback()
        print(f"Error creating/updating method zone: {e}")
        raise HTTPException(status_code=500, detail="Failed to create/update method-zone association")

@router.delete("/method-zones/{method_zone_id}")
def delete_method_zone(
    method_zone_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete a method-zone association"""
    check_admin_access(current_user)
    
    try:
        method_zone = db.query(ShippingMethodZone).filter(ShippingMethodZone.id == method_zone_id).first()
        if not method_zone:
            raise HTTPException(status_code=404, detail="Method-zone association not found")
        
        db.delete(method_zone)
        db.commit()
        return {"message": "Method-zone association deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting method zone: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete method-zone association")