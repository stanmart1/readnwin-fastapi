from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import csv
import io


from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.user import User
from models.book import Book, Category
from models.order import Order
from pydantic import BaseModel

router = APIRouter(tags=["admin"])

# Pydantic models for request/response
class SystemSettingsUpdate(BaseModel):
    site_name: Optional[str] = None
    site_description: Optional[str] = None
    contact_email: Optional[str] = None
    maintenance_mode: Optional[bool] = None
    max_books_per_order: Optional[int] = None
    default_shipping_cost: Optional[float] = None
    tax_rate: Optional[float] = None
    currency: Optional[str] = None

class SystemSettingsResponse(BaseModel):
    site_name: str
    site_description: str
    contact_email: str
    maintenance_mode: bool
    max_books_per_order: int
    default_shipping_cost: float
    tax_rate: float
    currency: str
    updated_at: str

class BulkOperationResponse(BaseModel):
    success: bool
    total_processed: int
    successful: int
    failed: int
    errors: List[str]
    message: str

class ShippingConfigCreate(BaseModel):
    name: str
    description: Optional[str] = None
    base_cost: float
    per_item_cost: Optional[float] = 0
    free_shipping_threshold: Optional[float] = None
    max_weight: Optional[float] = None
    delivery_days_min: int
    delivery_days_max: int
    is_active: bool = True

class ShippingConfigResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    base_cost: float
    per_item_cost: float
    free_shipping_threshold: Optional[float]
    max_weight: Optional[float]
    delivery_days_min: int
    delivery_days_max: int
    is_active: bool
    created_at: str

# System Settings Management
@router.get("/admin/enhanced/settings")
def get_system_settings(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get system settings"""
    check_admin_access(current_user)

    try:
        # For now, return default settings since we don't have a settings table
        # In production, this would come from a system_settings table
        default_settings = {
            "site_name": "ReadnWin",
            "site_description": "Your Digital Library Platform",
            "contact_email": "admin@readnwin.com",
            "maintenance_mode": False,
            "max_books_per_order": 10,
            "default_shipping_cost": 1500.0,  # Nigerian Naira
            "tax_rate": 0.075,  # 7.5% VAT
            "currency": "NGN",
            "updated_at": datetime.utcnow().isoformat()
        }

        return default_settings

    except Exception as e:
        print(f"Error fetching system settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch system settings")

@router.put("/admin/enhanced/settings")
def update_system_settings(
    settings: SystemSettingsUpdate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update system settings"""
    check_admin_access(current_user)

    try:
        # For now, just return the updated settings
        # In production, this would update a system_settings table
        updated_settings = {
            "site_name": settings.site_name or "ReadnWin",
            "site_description": settings.site_description or "Your Digital Library Platform",
            "contact_email": settings.contact_email or "admin@readnwin.com",
            "maintenance_mode": settings.maintenance_mode if settings.maintenance_mode is not None else False,
            "max_books_per_order": settings.max_books_per_order or 10,
            "default_shipping_cost": settings.default_shipping_cost or 1500.0,
            "tax_rate": settings.tax_rate or 0.075,
            "currency": settings.currency or "NGN",
            "updated_at": datetime.utcnow().isoformat()
        }

        return {
            "message": "System settings updated successfully",
            "settings": updated_settings
        }

    except Exception as e:
        print(f"Error updating system settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update system settings")

# Bulk Library Operations
@router.post("/admin/enhanced/library/bulk-import")
def bulk_import_books(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Bulk import books from CSV/Excel"""
    check_admin_access(current_user)

    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be CSV or Excel format")

    try:
        content = file.file.read()

        # Parse CSV file (only support CSV for now without pandas)
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are supported")

        try:
            # Parse CSV content
            csv_content = content.decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(csv_content))

            # Validate required columns
            required_columns = ['title', 'author', 'price', 'category']
            fieldnames = csv_reader.fieldnames or []
            missing_columns = [col for col in required_columns if col not in fieldnames]
            if missing_columns:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required columns: {', '.join(missing_columns)}"
                )

            # Process rows
            rows = list(csv_reader)
            total_processed = len(rows)
            successful = 0
            failed = 0
            errors = []

            for index, row in enumerate(rows):
                try:
                    # Get or create category
                    category = db.query(Category).filter(Category.name == row['category']).first()
                    if not category:
                        category = Category(name=row['category'], description=f"Category for {row['category']}")
                        db.add(category)
                        db.commit()
                        db.refresh(category)

                    # Create book
                    new_book = Book(
                        title=row['title'],
                        author=row['author'],
                        price=float(row['price']),
                        category_id=category.id,
                        description=row.get('description', ''),
                        isbn=row.get('isbn', ''),
                        format=row.get('format', 'ebook'),
                        stock_quantity=int(row.get('stock_quantity', 0)),
                        status='active'
                    )

                    db.add(new_book)
                    db.commit()
                    successful += 1

                except Exception as e:
                    failed += 1
                    errors.append(f"Row {index + 1}: {str(e)}")
                    db.rollback()

        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="Invalid file encoding. Please use UTF-8.")

        return {
            "success": True,
            "total_processed": total_processed,
            "successful": successful,
            "failed": failed,
            "errors": errors[:10],  # Limit error messages
            "message": f"Import completed: {successful} successful, {failed} failed"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in bulk import: {e}")
        raise HTTPException(status_code=500, detail="Failed to process bulk import")

@router.post("/admin/enhanced/library/bulk-update")
def bulk_update_books(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Bulk update book details"""
    check_admin_access(current_user)

    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be CSV or Excel format")

    try:
        content = file.file.read()

        # Parse CSV file (only support CSV for now)
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are supported")

        try:
            # Parse CSV content
            csv_content = content.decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(csv_content))

            # Validate required columns (must have ID to update)
            fieldnames = csv_reader.fieldnames or []
            if 'id' not in fieldnames:
                raise HTTPException(status_code=400, detail="Missing required 'id' column for updates")

            # Process rows
            rows = list(csv_reader)
            total_processed = len(rows)
            successful = 0
            failed = 0
            errors = []

            for index, row in enumerate(rows):
                try:
                    book = db.query(Book).filter(Book.id == int(row['id'])).first()
                    if not book:
                        failed += 1
                        errors.append(f"Row {index + 1}: Book with ID {row['id']} not found")
                        continue

                    # Update fields if provided
                    if 'title' in row and row['title'].strip():
                        book.title = row['title']
                    if 'author' in row and row['author'].strip():
                        book.author = row['author']
                    if 'price' in row and row['price'].strip():
                        book.price = float(row['price'])
                    if 'description' in row and row['description'].strip():
                        book.description = row['description']
                    if 'stock_quantity' in row and row['stock_quantity'].strip():
                        book.stock_quantity = int(row['stock_quantity'])
                    if 'status' in row and row['status'].strip():
                        book.status = row['status']

                    book.updated_at = datetime.utcnow()
                    db.commit()
                    successful += 1

                except Exception as e:
                    failed += 1
                    errors.append(f"Row {index + 1}: {str(e)}")
                    db.rollback()

        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="Invalid file encoding. Please use UTF-8.")

        return {
            "success": True,
            "total_processed": total_processed,
            "successful": successful,
            "failed": failed,
            "errors": errors[:10],
            "message": f"Update completed: {successful} successful, {failed} failed"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in bulk update: {e}")
        raise HTTPException(status_code=500, detail="Failed to process bulk update")

# Enhanced Shipping Management
@router.post("/admin/enhanced/shipping/config")
def create_shipping_config(
    config: ShippingConfigCreate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create shipping configuration"""
    check_admin_access(current_user)

    try:
        # For now, return simulated response since we don't have shipping config table
        # In production, this would create a record in shipping_configs table

        new_config = {
            "id": 1,  # Would be auto-generated
            "name": config.name,
            "description": config.description,
            "base_cost": config.base_cost,
            "per_item_cost": config.per_item_cost,
            "free_shipping_threshold": config.free_shipping_threshold,
            "max_weight": config.max_weight,
            "delivery_days_min": config.delivery_days_min,
            "delivery_days_max": config.delivery_days_max,
            "is_active": config.is_active,
            "created_at": datetime.utcnow().isoformat()
        }

        return {
            "message": "Shipping configuration created successfully",
            "config": new_config
        }

    except Exception as e:
        print(f"Error creating shipping config: {e}")
        raise HTTPException(status_code=500, detail="Failed to create shipping configuration")

@router.get("/admin/enhanced/shipping/config")
def get_shipping_configs(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all shipping configurations"""
    check_admin_access(current_user)

    try:
        # Return default shipping configurations
        # In production, this would query the shipping_configs table

        default_configs = [
            {
                "id": 1,
                "name": "Standard Shipping",
                "description": "Regular delivery within Nigeria",
                "base_cost": 1500.0,
                "per_item_cost": 500.0,
                "free_shipping_threshold": 50000.0,
                "max_weight": 5.0,
                "delivery_days_min": 3,
                "delivery_days_max": 7,
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": 2,
                "name": "Express Shipping",
                "description": "Fast delivery within 1-2 days",
                "base_cost": 3000.0,
                "per_item_cost": 1000.0,
                "free_shipping_threshold": 100000.0,
                "max_weight": 3.0,
                "delivery_days_min": 1,
                "delivery_days_max": 2,
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            }
        ]

        return default_configs

    except Exception as e:
        print(f"Error fetching shipping configs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch shipping configurations")

@router.put("/admin/enhanced/shipping/config/{config_id}")
def update_shipping_config(
    config_id: int,
    config: ShippingConfigCreate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update shipping configuration"""
    check_admin_access(current_user)

    try:
        # For now, return simulated response
        # In production, this would update the shipping_configs table

        updated_config = {
            "id": config_id,
            "name": config.name,
            "description": config.description,
            "base_cost": config.base_cost,
            "per_item_cost": config.per_item_cost,
            "free_shipping_threshold": config.free_shipping_threshold,
            "max_weight": config.max_weight,
            "delivery_days_min": config.delivery_days_min,
            "delivery_days_max": config.delivery_days_max,
            "is_active": config.is_active,
            "updated_at": datetime.utcnow().isoformat()
        }

        return {
            "message": "Shipping configuration updated successfully",
            "config": updated_config
        }

    except Exception as e:
        print(f"Error updating shipping config: {e}")
        raise HTTPException(status_code=500, detail="Failed to update shipping configuration")

# Additional Enhanced Admin Features
@router.get("/admin/enhanced/analytics/overview")
def get_enhanced_analytics(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get enhanced analytics overview"""
    check_admin_access(current_user)

    try:
        # Get comprehensive analytics
        total_revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0)).scalar()
        total_orders = db.query(Order).count()
        total_books = db.query(Book).count()
        total_users = db.query(User).count()

        # Monthly trends
        monthly_data = db.execute(text("""
            SELECT
                DATE_TRUNC('month', created_at) as month,
                COUNT(*) as orders,
                COALESCE(SUM(total_amount), 0) as revenue
            FROM orders
            WHERE created_at >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month
        """)).fetchall()

        return {
            "overview": {
                "total_revenue": float(total_revenue),
                "total_orders": total_orders,
                "total_books": total_books,
                "total_users": total_users,
                "avg_order_value": float(total_revenue / total_orders) if total_orders > 0 else 0
            },
            "monthly_trends": [
                {
                    "month": row.month.strftime("%Y-%m") if row.month else "",
                    "orders": row.orders,
                    "revenue": float(row.revenue)
                }
                for row in monthly_data
            ]
        }

    except Exception as e:
        print(f"Error fetching enhanced analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")
