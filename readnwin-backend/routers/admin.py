from fastapi import APIRouter, Depends, HTTPException, Query, Form, File, UploadFile
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, desc, text
from datetime import datetime, timedelta
from decimal import Decimal
from core.database import get_db
from core.storage import storage
from core.security import get_current_user_from_token, check_admin_access
from models.user import User
from models.book import Book, Category
from models.order import Order, OrderItem
from models.contact import Contact
from models.reading_session import ReadingSession
from models.user_library import UserLibrary
from models.notification import Notification
from models.role import Role
from models.blog import BlogPost
from models.email import EmailTemplate
from pydantic import BaseModel
from typing import List, Optional
import uuid

router = APIRouter()

class StatsResponse(BaseModel):
    total_users: int
    total_books: int
    total_orders: int
    total_revenue: float
    pending_contacts: int
    active_users_today: int
    completed_orders: int
    new_users_this_month: int

class ReadingProgressResponse(BaseModel):
    total_readers: int
    active_readers: int
    books_read_today: int
    average_reading_time: float
    total_reading_sessions: int
    books_completed_this_month: int
    most_popular_book: Optional[str]
    total_pages_read: int

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: str
    priority: str
    user_email: Optional[str] = None

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    unread_only: bool = Query(False)
):
    """Get admin notifications from database"""
    check_admin_access(current_user)

    # Build query for admin notifications (global notifications or user-specific for admins)
    query = db.query(Notification).options(joinedload(Notification.user))

    # Filter for admin-relevant notifications
    query = query.filter(
        and_(
            # Global notifications OR notifications for admin users
            (Notification.is_global == True) |
            (Notification.user_id.in_(
                db.query(User.id).join(Role, User.role_id == Role.id).filter(
                    Role.name.in_(['admin', 'super_admin'])
                )
            ))
        )
    )

    # Filter unread only if requested
    if unread_only:
        query = query.filter(Notification.is_read == False)

    # Order by creation date (newest first) and apply pagination
    notifications = query.order_by(desc(Notification.created_at)).offset(offset).limit(limit).all()

    # Convert to response format
    result = []
    for notification in notifications:
        result.append(NotificationResponse(
            id=notification.id,
            title=notification.title,
            message=notification.message,
            type=notification.type,
            is_read=notification.is_read,
            created_at=notification.created_at.isoformat(),
            priority=notification.priority,
            user_email=notification.user.email if notification.user else None
        ))

    return result

@router.get("/orders")
def get_all_orders(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    sort_by: str = Query("created_at", regex="^(created_at|total_amount|status)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$")
):
    """Get all orders with comprehensive filtering and search"""
    check_admin_access(current_user)

    from models.payment import Payment
    query = db.query(Order).options(joinedload(Order.user), joinedload(Order.items), joinedload(Order.payments))
    base_query = db.query(Order)

    # Apply filters
    if status:
        query = query.filter(Order.status == status)
        base_query = base_query.filter(Order.status == status)
    
    if payment_method:
        query = query.filter(Order.payment_method == payment_method)
        base_query = base_query.filter(Order.payment_method == payment_method)
    
    if search:
        search_filter = (
            (Order.order_number.contains(search)) |
            (Order.user.has(User.email.contains(search))) |
            (Order.user.has(User.first_name.contains(search))) |
            (Order.user.has(User.last_name.contains(search)))
        )
        query = query.filter(search_filter)
        base_query = base_query.filter(search_filter)
    
    if date_from:
        try:
            from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            query = query.filter(Order.created_at >= from_date)
            base_query = base_query.filter(Order.created_at >= from_date)
        except ValueError:
            pass
    
    if date_to:
        try:
            to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query = query.filter(Order.created_at <= to_date)
            base_query = base_query.filter(Order.created_at <= to_date)
        except ValueError:
            pass

    # Get total count
    total_count = base_query.count()

    # Apply sorting
    if sort_by == "total_amount":
        order_by = Order.total_amount.desc() if sort_order == "desc" else Order.total_amount.asc()
    elif sort_by == "status":
        order_by = Order.status.desc() if sort_order == "desc" else Order.status.asc()
    else:  # created_at
        order_by = Order.created_at.desc() if sort_order == "desc" else Order.created_at.asc()

    # Apply pagination and sorting
    orders = query.order_by(order_by).offset(offset).limit(limit).all()

    result = []
    for order in orders:
        # Calculate total items
        total_items = sum(item.quantity for item in order.items)
        
        # Handle both authenticated and guest orders
        user_email = order.user.email if order.user else getattr(order, 'guest_email', 'N/A')
        user_name = ""
        if order.user:
            user_name = f"{order.user.first_name or ''} {order.user.last_name or ''}".strip() or order.user.email
        else:
            user_name = "Guest User"

        result.append({
            "id": order.id,
            "order_number": order.order_number,
            "user_email": user_email,
            "user_name": user_name,
            "total_amount": float(order.total_amount),
            "status": order.status,
            "total_items": total_items,
            "payment_method": order.payment_method,
            "payment_status": order.payments[0].status if order.payments else "pending",
            "tracking_number": order.tracking_number,
            "created_at": order.created_at.isoformat(),
            "updated_at": order.updated_at.isoformat() if order.updated_at else order.created_at.isoformat(),
            "shipping_address": order.shipping_address,
            "billing_address": order.billing_address,
            "notes": order.notes,
            "items": [
                {
                    "book_title": item.book.title,
                    "quantity": item.quantity,
                    "price": float(item.price)
                }
                for item in order.items
            ]
        })

    return {
        "orders": result,
        "total": total_count,
        "offset": offset,
        "limit": limit,
        "has_more": offset + limit < total_count
    }

class OrderUpdateRequest(BaseModel):
    status: Optional[str] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None
    shipping_address: Optional[dict] = None
    billing_address: Optional[dict] = None

class OrderCreateRequest(BaseModel):
    user_id: Optional[int] = None
    guest_email: Optional[str] = None
    items: List[dict]
    shipping_address: dict
    billing_address: Optional[dict] = None
    payment_method: str
    notes: Optional[str] = None

@router.post("/orders")
def create_order(
    order_data: OrderCreateRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new order manually"""
    check_admin_access(current_user)

    try:
        # Calculate total amount
        total_amount = 0
        for item_data in order_data.items:
            book = db.query(Book).filter(Book.id == item_data['book_id']).first()
            if not book:
                raise HTTPException(status_code=400, detail=f"Book with ID {item_data['book_id']} not found")
            total_amount += book.price * item_data['quantity']

        # Create order
        order = Order(
            user_id=order_data.user_id,
            order_number=str(uuid.uuid4())[:8].upper(),
            total_amount=total_amount,
            status='pending',
            payment_method=order_data.payment_method,
            shipping_address=order_data.shipping_address,
            billing_address=order_data.billing_address or order_data.shipping_address,
            notes=order_data.notes
        )
        
        db.add(order)
        db.flush()
        
        # Create order items
        for item_data in order_data.items:
            book = db.query(Book).filter(Book.id == item_data['book_id']).first()
            order_item = OrderItem(
                order_id=order.id,
                book_id=item_data['book_id'],
                quantity=item_data['quantity'],
                price=book.price
            )
            db.add(order_item)
        
        db.commit()
        db.refresh(order)
        
        return {
            "message": "Order created successfully",
            "order_id": order.id,
            "order_number": order.order_number
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

@router.patch("/orders/{order_id}/payment-status")
def update_payment_status(
    order_id: int,
    status_data: dict,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update payment status for an order"""
    check_admin_access(current_user)

    try:
        from models.payment import Payment
        
        # Find payment for this order
        payment = db.query(Payment).filter(Payment.order_id == order_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found for this order")
        
        # Update payment status
        new_status = status_data.get("status")
        if new_status:
            payment.status = new_status
            db.commit()
        
        return {"message": "Payment status updated successfully", "status": payment.status}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update payment status: {str(e)}")

@router.put("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    status_data: dict,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update order status specifically"""
    check_admin_access(current_user)

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.status
    new_status = status_data.get("status")
    notes = status_data.get("notes")
    
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    # Validate status
    valid_statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "completed", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    # Update order status
    order.status = new_status
    if notes:
        order.notes = notes
    order.updated_at = datetime.utcnow()
    
    # Add books to user library when order is confirmed
    if new_status == "confirmed" and old_status != "confirmed" and order.user_id:
        from models.user_library import UserLibrary
        order_items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
        for item in order_items:
            # Check if book already in library
            existing = db.query(UserLibrary).filter(
                UserLibrary.user_id == order.user_id,
                UserLibrary.book_id == item.book_id
            ).first()
            if not existing:
                library_entry = UserLibrary(
                    user_id=order.user_id,
                    book_id=item.book_id,
                    status="unread",
                    progress=0
                )
                db.add(library_entry)

    # Create notification for status change if user exists and status changed
    if new_status != old_status and order.user_id:
        notification = Notification(
            user_id=order.user_id,
            title=f"Order Status Updated",
            message=f"Your order #{order.order_number} status has been updated from '{old_status}' to '{new_status}'",
            type="order",
            priority="normal"
        )
        db.add(notification)
        
        # Send shipping notification email if status changed to shipped
        if new_status == "shipped" and order.user:
            try:
                from services.resend_email_service import ResendEmailService
                email_service = ResendEmailService(db)
                tracking_data = {
                    'tracking_number': order.tracking_number or 'N/A',
                    'estimated_delivery': '3-5 business days',
                    'order_number': order.order_number,
                    'tracking_url': f'https://tracking.example.com/{order.tracking_number}' if order.tracking_number else '#'
                }
                result = email_service.send_shipping_notification_email(
                    order.user.email,
                    tracking_data,
                    order.user.first_name or order.user.username
                )
                if result.get('success'):
                    print(f"✅ Shipping notification email sent to {order.user.email}")
                else:
                    print(f"❌ Failed to send shipping notification email: {result.get('error')}")
            except Exception as e:
                print(f"❌ Failed to send shipping notification email: {str(e)}")
                # Don't fail order update if email fails

    db.commit()

    return {
        "message": "Order status updated successfully",
        "order_id": order_id,
        "old_status": old_status,
        "new_status": new_status
    }

@router.put("/orders/{order_id}")
def update_order(
    order_id: int,
    order_data: OrderUpdateRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update order details"""
    check_admin_access(current_user)

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.status
    
    # Update fields if provided
    if order_data.status is not None:
        valid_statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "completed", "cancelled"]
        if order_data.status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        order.status = order_data.status
    
    if order_data.tracking_number is not None:
        order.tracking_number = order_data.tracking_number
    
    if order_data.notes is not None:
        order.notes = order_data.notes
    
    if order_data.shipping_address is not None:
        order.shipping_address = order_data.shipping_address
    
    if order_data.billing_address is not None:
        order.billing_address = order_data.billing_address
    
    order.updated_at = datetime.utcnow()

    # Create notification for status change if user exists and status changed
    if order_data.status and order_data.status != old_status and order.user_id:
        notification = Notification(
            user_id=order.user_id,
            title=f"Order Status Updated",
            message=f"Your order #{order.order_number} status has been updated from '{old_status}' to '{order_data.status}'",
            type="order",
            priority="normal"
        )
        db.add(notification)
        
        # Send shipping notification email if status changed to shipped
        if order_data.status == "shipped" and order.user:
            try:
                from services.resend_email_service import ResendEmailService
                email_service = ResendEmailService(db)
                tracking_data = {
                    'tracking_number': order.tracking_number or 'N/A',
                    'estimated_delivery': '3-5 business days',
                    'order_number': order.order_number,
                    'tracking_url': f'https://tracking.example.com/{order.tracking_number}' if order.tracking_number else '#'
                }
                result = email_service.send_shipping_notification_email(
                    order.user.email,
                    tracking_data,
                    order.user.first_name or order.user.username
                )
                if result.get('success'):
                    print(f"✅ Shipping notification email sent to {order.user.email}")
                else:
                    print(f"❌ Failed to send shipping notification email: {result.get('error')}")
            except Exception as e:
                print(f"❌ Failed to send shipping notification email: {str(e)}")
                # Don't fail order update if email fails

    db.commit()

    return {
        "message": "Order updated successfully",
        "order_id": order_id,
        "changes": {
            "status": {"old": old_status, "new": order.status} if order_data.status else None,
            "tracking_number": order.tracking_number if order_data.tracking_number else None
        }
    }

@router.get("/orders/stats")
def get_order_stats(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get order statistics"""
    check_admin_access(current_user)

    try:
        # Basic stats
        total_orders = db.query(Order).count()
        total_revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0)).scalar()
        
        # Orders by status
        status_stats = db.query(
            Order.status,
            func.count(Order.id).label('count')
        ).group_by(Order.status).all()
        
        # Orders by payment method
        payment_stats = db.query(
            Order.payment_method,
            func.count(Order.id).label('count')
        ).group_by(Order.payment_method).all()
        
        # Recent orders (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_orders = db.query(Order).filter(Order.created_at >= thirty_days_ago).count()
        
        # Average order value
        avg_order_value = db.query(func.avg(Order.total_amount)).scalar() or 0
        
        return {
            "total_orders": total_orders,
            "total_revenue": float(total_revenue),
            "recent_orders": recent_orders,
            "average_order_value": float(avg_order_value),
            "status_breakdown": {stat.status: stat.count for stat in status_stats},
            "payment_method_breakdown": {stat.payment_method: stat.count for stat in payment_stats}
        }
        
    except Exception as e:
        print(f"Error fetching order stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch order statistics")

@router.delete("/orders/{order_id}")
def delete_order(
    order_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete an order"""
    check_admin_access(current_user)

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    try:
        # Delete related records in correct order to avoid foreign key violations
        
        # 1. Delete payments first (they reference orders)
        from models.payment import Payment
        db.query(Payment).filter(Payment.order_id == order_id).delete()
        
        # 2. Delete order items
        db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()
        
        # 3. Delete the order
        db.delete(order)
        db.commit()

        return {"message": "Order deleted successfully"}

    except Exception as e:
        db.rollback()
        print(f"Error deleting order: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete order")

class BulkOrderAction(BaseModel):
    action: str  # "delete", "update_status", "export"
    order_ids: List[int]
    data: Optional[dict] = None  # Additional data for the action

@router.post("/orders/bulk-action")
def bulk_order_action(
    bulk_action: BulkOrderAction,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Perform bulk actions on multiple orders"""
    check_admin_access(current_user)

    try:
        if bulk_action.action == "delete":
            # Delete related records in correct order to avoid foreign key violations
            
            # 1. Delete payments first (they reference orders)
            from models.payment import Payment
            db.query(Payment).filter(Payment.order_id.in_(bulk_action.order_ids)).delete(synchronize_session=False)
            
            # 2. Delete order items
            db.query(OrderItem).filter(OrderItem.order_id.in_(bulk_action.order_ids)).delete(synchronize_session=False)
            
            # 3. Delete orders
            deleted_count = db.query(Order).filter(Order.id.in_(bulk_action.order_ids)).delete(synchronize_session=False)
            db.commit()

            return {
                "message": f"Successfully deleted {deleted_count} orders",
                "affected_count": deleted_count
            }
        
        elif bulk_action.action == "update_status":
            new_status = bulk_action.data.get("status") if bulk_action.data else None
            if not new_status:
                raise HTTPException(status_code=400, detail="Status is required for update_status action")
            
            valid_statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "completed", "cancelled"]
            if new_status not in valid_statuses:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
                )
            
            # Update orders
            updated_count = db.query(Order).filter(Order.id.in_(bulk_action.order_ids)).update(
                {"status": new_status, "updated_at": datetime.utcnow()},
                synchronize_session=False
            )
            
            # Create notifications for users
            orders = db.query(Order).filter(Order.id.in_(bulk_action.order_ids)).all()
            for order in orders:
                if order.user_id:
                    notification = Notification(
                        user_id=order.user_id,
                        title=f"Order Status Updated",
                        message=f"Your order #{order.order_number} status has been updated to '{new_status}'",
                        type="order",
                        priority="normal"
                    )
                    db.add(notification)
            
            db.commit()
            
            return {
                "message": f"Successfully updated {updated_count} orders to status '{new_status}'",
                "affected_count": updated_count
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {bulk_action.action}")

    except Exception as e:
        db.rollback()
        print(f"Error performing bulk action: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to perform bulk action: {str(e)}")

@router.get("/orders/export")
def export_orders(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
    format: str = Query("csv", regex="^(csv|json)$"),
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None)
):
    """Export orders data"""
    check_admin_access(current_user)

    query = db.query(Order).options(joinedload(Order.user), joinedload(Order.items))
    
    # Apply filters
    if status:
        query = query.filter(Order.status == status)
    
    if date_from:
        try:
            from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            query = query.filter(Order.created_at >= from_date)
        except ValueError:
            pass
    
    if date_to:
        try:
            to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query = query.filter(Order.created_at <= to_date)
        except ValueError:
            pass
    
    orders = query.all()
    
    export_data = []
    for order in orders:
        user_name = ""
        if order.user:
            user_name = f"{order.user.first_name or ''} {order.user.last_name or ''}".strip() or order.user.email
        else:
            user_name = "Guest User"
        
        export_data.append({
            "order_id": order.id,
            "order_number": order.order_number,
            "user_name": user_name,
            "user_email": order.user.email if order.user else getattr(order, 'guest_email', 'N/A'),
            "total_amount": float(order.total_amount),
            "status": order.status,
            "payment_method": order.payment_method,
            "tracking_number": order.tracking_number or "",
            "created_at": order.created_at.isoformat(),
            "items_count": len(order.items),
            "items": ", ".join([f"{item.book.title} (x{item.quantity})" for item in order.items])
        })
    
    return {
        "data": export_data,
        "format": format,
        "total_records": len(export_data),
        "exported_at": datetime.utcnow().isoformat()
    }

@router.get("/orders/{order_id}")
def get_order_details(
    order_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get detailed order information"""
    check_admin_access(current_user)

    from models.payment import Payment
    order = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.items).joinedload(OrderItem.book),
        joinedload(Order.payments)
    ).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Handle both authenticated and guest orders
    user_info = None
    if order.user:
        user_info = {
            "id": order.user.id,
            "email": order.user.email,
            "first_name": order.user.first_name,
            "last_name": order.user.last_name,
            "phone": getattr(order.user, 'phone', None)
        }
    else:
        user_info = {
            "email": getattr(order, 'guest_email', 'N/A'),
            "first_name": "Guest",
            "last_name": "User"
        }

    return {
        "id": order.id,
        "user": user_info,
        "status": order.status,
        "payment_status": order.payments[0].status if order.payments else "pending",
        "payment_method": order.payment_method,
        "payment_proof_url": storage.get_url(order.payments[0].proof_of_payment_url) if order.payments and order.payments[0].proof_of_payment_url else None,
        "total_amount": float(order.total_amount),
        "subtotal": float(order.subtotal or order.total_amount),
        "shipping_cost": float(order.shipping_cost or 0),
        "tax_amount": float(order.tax_amount or 0),
        "shipping_address": order.shipping_address,
        "billing_address": order.billing_address,
        "shipping_method": getattr(order, 'shipping_method', None),
        "tracking_number": order.tracking_number,
        "notes": order.notes,
        "created_at": order.created_at.isoformat(),
        "updated_at": order.updated_at.isoformat() if order.updated_at else order.created_at.isoformat(),
        "items": [
            {
                "id": item.id,
                "book": {
                    "id": item.book.id if item.book else None,
                    "title": item.book.title if item.book else item.book_title,
                    "author": item.book.author if item.book else "Unknown",
                    "cover_image": f"/{item.book.cover_image}" if item.book and item.book.cover_image and not item.book.cover_image.startswith('/') else item.book.cover_image if item.book else None
                },
                "quantity": item.quantity,
                "unit_price": float(item.price),
                "subtotal": float(item.quantity * item.price)
            }
            for item in order.items
        ]
    }

@router.post("/notifications/{notification_id}/mark-read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    check_admin_access(current_user)

    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()

    return {"message": "Notification marked as read"}


@router.get("/books/{book_id}")
def get_admin_book(
    book_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get detailed book information for admin"""
    check_admin_access(current_user)

    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Get detailed sales and reading statistics
    sales_stats = db.query(
        func.count(OrderItem.id).label('total_orders'),
        func.sum(OrderItem.quantity).label('total_sold'),
        func.sum(OrderItem.price * OrderItem.quantity).label('total_revenue')
    ).join(Order).filter(
        OrderItem.book_id == book_id,
        Order.status == 'completed'
    ).first()

    reading_stats = db.query(
        func.count(ReadingSession.id).label('total_sessions'),
        func.count(func.distinct(ReadingSession.user_id)).label('unique_readers'),
        func.avg(ReadingSession.duration).label('avg_reading_time')
    ).filter(ReadingSession.book_id == book_id).first()

    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "author_id": book.author_id,
        "description": book.description,
        "price": float(book.price),
        "status": book.status,
        "stock_quantity": book.stock_quantity,
        "is_featured": book.is_featured,
        "cover_image": book.cover_image,
        "cover_image_url": storage.get_url(book.cover_image) if book.cover_image else None,
        "file_path": book.file_path,
        "format": book.format,
        "isbn": book.isbn,
        "pages": book.pages,
        "language": book.language,
        "publisher": book.publisher,
        "publication_date": book.publication_date.isoformat() if book.publication_date else None,
        "category_id": book.category_id,
        "inventory_enabled": book.inventory_enabled if hasattr(book, 'inventory_enabled') else False,
        "created_at": book.created_at.isoformat(),
        "sales_stats": {
            "total_orders": sales_stats.total_orders or 0,
            "total_sold": sales_stats.total_sold or 0,
            "total_revenue": float(sales_stats.total_revenue or 0)
        },
        "reading_stats": {
            "total_sessions": reading_stats.total_sessions or 0,
            "unique_readers": reading_stats.unique_readers or 0,
            "avg_reading_time": float(reading_stats.avg_reading_time or 0)
        }
    }



@router.put("/books/{book_id}")
async def update_admin_book(
    book_id: int,
    title: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[str] = Form(None),
    category_id: Optional[str] = Form(None),
    author_id: Optional[str] = Form(None),
    isbn: Optional[str] = Form(None),
    format: Optional[str] = Form(None),
    stock_quantity: Optional[str] = Form(None),
    is_featured: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    cover_image: Optional[UploadFile] = File(None),
    ebook_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update book information with file upload support"""
    check_admin_access(current_user)

    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    try:
        # Update fields if provided
        if title is not None:
            book.title = title
        if author is not None:
            book.author = author
        if description is not None:
            book.description = description
        if price is not None:
            book.price = Decimal(price)
        if category_id is not None:
            book.category_id = int(category_id)
        if author_id is not None:
            book.author_id = int(author_id) if author_id else None
        if isbn is not None:
            # Check if ISBN is already used by another book
            existing_book = db.query(Book).filter(Book.isbn == isbn, Book.id != book_id).first()
            if existing_book:
                raise HTTPException(status_code=400, detail="ISBN already used by another book")
            book.isbn = isbn
        if format is not None:
            book.format = format
        if stock_quantity is not None:
            book.stock_quantity = int(stock_quantity)
        if is_featured is not None:
            book.is_featured = is_featured.lower() == "true"
        if status is not None:
            book.status = status

        # Handle file uploads
        if cover_image and cover_image.filename:
            book.cover_image = await storage.save_cover(cover_image)
        if ebook_file and ebook_file.filename:
            book.file_path = await storage.save_book(ebook_file)

        book.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(book)

        return {
            "message": "Book updated successfully",
            "book_id": book.id,
            "book": {
                "id": book.id,
                "title": book.title,
                "cover_image_url": storage.get_url(book.cover_image) if book.cover_image else None
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating book: {e}")
        raise HTTPException(status_code=500, detail="Failed to update book")

@router.delete("/books/{book_id}")
def delete_admin_book(
    book_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete a book"""
    check_admin_access(current_user)

    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    try:
        # Check if book has orders
        has_orders = db.query(OrderItem).filter(OrderItem.book_id == book_id).first()
        if has_orders:
            # Soft delete - change status to inactive instead of deleting
            book.status = "inactive"
            db.commit()
            return {"message": "Book deactivated successfully (has associated orders)"}
        else:
            # Hard delete if no orders
            db.delete(book)
            db.commit()
            return {"message": "Book deleted successfully"}

    except Exception as e:
        db.rollback()
        print(f"Error deleting book: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete book")

# Categories Management Endpoints
@router.get("/categories")
def get_admin_categories(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all categories with book counts"""
    check_admin_access(current_user)

    try:
        categories = db.query(
            Category.id,
            Category.name,
            Category.description,
            Category.status,
            func.count(Book.id).label('book_count')
        ).outerjoin(Book).group_by(Category.id, Category.name, Category.description, Category.status).all()

        return [
            {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "status": cat.status,
                "book_count": cat.book_count
            }
            for cat in categories
        ]

    except Exception as e:
        print(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch categories")

@router.post("/categories")
def create_admin_category(
    category_data: dict,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new category"""
    check_admin_access(current_user)

    try:
        name = category_data.get('name')
        description = category_data.get('description')
        status = category_data.get('status', 'active')
        
        if not name:
            raise HTTPException(status_code=400, detail="Category name is required")
        
        # Check if category already exists
        existing_category = db.query(Category).filter(Category.name == name).first()
        if existing_category:
            raise HTTPException(status_code=400, detail="Category with this name already exists")

        new_category = Category(name=name, description=description, status=status)
        db.add(new_category)
        db.commit()
        db.refresh(new_category)

        return {
            "message": "Category created successfully",
            "category": {
                "id": new_category.id,
                "name": new_category.name,
                "description": new_category.description,
                "status": new_category.status
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating category: {e}")
        raise HTTPException(status_code=500, detail="Failed to create category")

@router.put("/categories/{category_id}")
def update_admin_category(
    category_id: int,
    category_data: dict,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update a category"""
    check_admin_access(current_user)

    try:
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        name = category_data.get('name')
        description = category_data.get('description')
        status = category_data.get('status')
        
        if name:
            # Check if name already exists for another category
            existing = db.query(Category).filter(
                Category.name == name,
                Category.id != category_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Category with this name already exists")
            category.name = name
        
        if description is not None:
            category.description = description
        
        if status is not None:
            category.status = status
        
        db.commit()
        db.refresh(category)

        return {
            "message": "Category updated successfully",
            "category": {
                "id": category.id,
                "name": category.name,
                "description": category.description,
                "status": category.status
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating category: {e}")
        raise HTTPException(status_code=500, detail="Failed to update category")

@router.delete("/categories/{category_id}")
def delete_admin_category(
    category_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete a category"""
    check_admin_access(current_user)

    try:
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        db.delete(category)
        db.commit()

        return {"message": "Category deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting category: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete category")

# Authors Management Endpoints are now in admin_authors_categories.py
# (Removed conflicting endpoint that was querying Book.author instead of Author table)

class AuthorCreateRequest(BaseModel):
    name: str
    email: Optional[str] = ""
    bio: Optional[str] = ""
    website: Optional[str] = ""

@router.post("/authors")
def create_admin_author(
    author_data: AuthorCreateRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new author entry"""
    check_admin_access(current_user)
    
    try:
        from models.author import Author
        
        # Validate author name
        if not author_data.name or not author_data.name.strip():
            raise HTTPException(status_code=400, detail="Author name is required")
        
        clean_name = author_data.name.strip()
        if len(clean_name) < 2:
            raise HTTPException(status_code=400, detail="Author name must be at least 2 characters")
        
        # Check for existing author by name (case insensitive)
        existing = db.query(Author).filter(Author.name.ilike(clean_name)).first()
        if existing:
            return {
                "message": "Author already exists", 
                "author": {
                    "id": existing.id,
                    "name": existing.name
                }
            }
        
        # Create new author
        author = Author(
            name=clean_name,
            email=author_data.email.strip() if author_data.email else None,
            bio=author_data.bio.strip() if author_data.bio else None,
            website=author_data.website.strip() if author_data.website else None
        )
        db.add(author)
        db.commit()
        db.refresh(author)
        
        return {
            "message": "Author created successfully",
            "author": {
                "id": author.id,
                "name": author.name,
                "email": author.email,
                "bio": author.bio,
                "status": "active"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Author creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create author: {str(e)}")

@router.get("/roles")
def get_admin_roles(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get all roles for admin interface - simplified endpoint"""
    check_admin_access(current_user)

    try:
        roles = db.query(Role).all()
        return [
            {
                "id": role.id,
                "name": role.name,
                "display_name": role.display_name,
                "description": role.description,
                "priority": role.priority
            }
            for role in roles
        ]
    except Exception as e:
        print(f"Error fetching roles: {e}")
        return []



        db.delete(user)
        db.commit()

        # Create audit log entry
        from models.auth_log import AuthLog
        audit_entry = AuthLog(
            event_type="user_deleted",
            user_id=current_user.id,
            message=f"User {deleted_user_info['email']} deleted by admin",
            log_metadata={
                "deleted_user": deleted_user_info,
                "action": "delete_user",
                "admin_user_id": current_user.id,
                "admin_email": current_user.email
            }
        )
        db.add(audit_entry)
        db.commit()

        return {"success": True, "message": "User deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

@router.get("/stats/daily-activity")
def get_daily_activity(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get daily activity statistics for the past week"""
    check_admin_access(current_user)

    try:
        # Get data for the past 7 days
        seven_days_ago = datetime.utcnow() - timedelta(days=7)

        daily_stats = []
        for i in range(7):
            day_start = (datetime.utcnow() - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start.replace(hour=23, minute=59, second=59, microsecond=999999)

            # Active users (users who logged in that day)
            active_users = db.query(User).filter(
                and_(
                    User.last_login >= day_start,
                    User.last_login <= day_end
                )
            ).count()

            # Orders that day
            daily_orders = db.query(Order).filter(
                and_(
                    Order.created_at >= day_start,
                    Order.created_at <= day_end
                )
            ).count()

            daily_stats.append({
                "day": day_start.strftime("%a"),
                "active": active_users,
                "orders": daily_orders
            })

        # Reverse to show oldest to newest
        daily_stats.reverse()

        return {"daily_activity": daily_stats}

    except Exception as e:
        print(f"Error fetching daily activity: {e}")
        return {"daily_activity": []}

@router.get("/stats/monthly-trends")
def get_monthly_trends(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get monthly trend data for the past 6 months"""
    check_admin_access(current_user)

    try:
        monthly_data = []

        for i in range(6):
            # Calculate month start and end
            current_date = datetime.utcnow()
            if i == 0:
                month_start = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                month_end = current_date
            else:
                month_start = (current_date.replace(day=1) - timedelta(days=i*30)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                next_month = month_start.replace(month=month_start.month + 1) if month_start.month < 12 else month_start.replace(year=month_start.year + 1, month=1)
                month_end = next_month - timedelta(days=1)

            # Sales for the month
            monthly_sales = db.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
                and_(
                    Order.created_at >= month_start,
                    Order.created_at <= month_end
                )
            ).scalar()

            # Orders for the month
            monthly_orders = db.query(Order).filter(
                and_(
                    Order.created_at >= month_start,
                    Order.created_at <= month_end
                )
            ).count()

            # New users for the month
            monthly_users = db.query(User).filter(
                and_(
                    User.created_at >= month_start,
                    User.created_at <= month_end
                )
            ).count()

            monthly_data.append({
                "date": month_start.strftime("%b"),
                "sales": float(monthly_sales) if monthly_sales else 0,
                "orders": monthly_orders,
                "users": monthly_users
            })

        # Reverse to show oldest to newest
        monthly_data.reverse()

        return {"monthly_trends": monthly_data}

    except Exception as e:
        print(f"Error fetching monthly trends: {e}")
        return {"monthly_trends": []}

@router.get("/stats/recent-activities")
def get_recent_activities(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=50)
):
    """Get recent platform activities"""
    check_admin_access(current_user)

    try:
        activities = []

        # Recent user registrations
        recent_users = db.query(User).order_by(desc(User.created_at)).limit(5).all()
        for user in recent_users:
            activities.append({
                "action": f"New user registered",
                "user": f"{user.first_name} {user.last_name}" if user.first_name else user.email,
                "time": user.created_at.strftime("%H:%M"),
                "type": "user",
                "book": "",
                "amount": ""
            })

        # Recent book purchases
        recent_orders = db.query(Order).options(
            joinedload(Order.user),
            joinedload(Order.items).joinedload(OrderItem.book)
        ).order_by(desc(Order.created_at)).limit(5).all()

        for order in recent_orders:
            book_titles = [item.book.title for item in order.items]
            activities.append({
                "action": f"Book purchase",
                "user": f"{order.user.first_name} {order.user.last_name}" if order.user.first_name else order.user.email,
                "time": order.created_at.strftime("%H:%M"),
                "type": "order",
                "book": book_titles[0] if book_titles else "",
                "amount": f"₦{order.total_amount:,.2f}"
            })

        # Recent book additions (if you have an admin book creation log)
        recent_books = db.query(Book).order_by(desc(Book.created_at)).limit(3).all()
        for book in recent_books:
            activities.append({
                "action": f"New book added",
                "user": "Admin",
                "time": book.created_at.strftime("%H:%M"),
                "type": "book",
                "book": book.title,
                "amount": f"₦{book.price:,.2f}"
            })

        # Sort all activities by time (most recent first)
        activities.sort(key=lambda x: x["time"], reverse=True)

        return {"recent_activities": activities[:limit]}

    except Exception as e:
        print(f"Error fetching recent activities: {e}")
        return {"recent_activities": []}

@router.get("/debug/user-library/{user_id}")
def debug_user_library(
    user_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Debug user library entries"""
    check_admin_access(current_user)
    
    try:
        # Get all UserLibrary entries for the user
        library_entries = db.query(UserLibrary).filter(
            UserLibrary.user_id == user_id
        ).all()
        
        result = []
        for entry in library_entries:
            book = db.query(Book).filter(Book.id == entry.book_id).first()
            result.append({
                "library_entry_id": entry.id,
                "book_id": entry.book_id,
                "book_exists": book is not None,
                "book_title": book.title if book else "MISSING",
                "status": entry.status,
                "progress": entry.progress,
                "created_at": entry.created_at.isoformat() if entry.created_at else None
            })
        
        return {
            "user_id": user_id,
            "total_library_entries": len(library_entries),
            "entries": result
        }
        
    except Exception as e:
        return {"error": str(e)}

@router.get("/stats/growth-metrics")
def get_growth_metrics(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get growth metrics and percentage changes"""
    check_admin_access(current_user)

    try:
        # Current month data
        current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        current_month_end = datetime.utcnow()

        # Previous month data
        if current_month_start.month == 1:
            prev_month_start = current_month_start.replace(year=current_month_start.year - 1, month=12)
        else:
            prev_month_start = current_month_start.replace(month=current_month_start.month - 1)

        prev_month_end = current_month_start - timedelta(days=1)

        # Current month metrics
        current_users = db.query(User).filter(User.created_at >= current_month_start).count()
        current_revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
            and_(Order.created_at >= current_month_start, Order.created_at <= current_month_end)
        ).scalar()
        current_orders = db.query(Order).filter(
            and_(Order.created_at >= current_month_start, Order.created_at <= current_month_end)
        ).count()
        current_books = db.query(Book).filter(Book.created_at >= current_month_start).count()

        # Previous month metrics
        prev_users = db.query(User).filter(
            and_(User.created_at >= prev_month_start, User.created_at <= prev_month_end)
        ).count()
        prev_revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
            and_(Order.created_at >= prev_month_start, Order.created_at <= prev_month_end)
        ).scalar()
        prev_orders = db.query(Order).filter(
            and_(Order.created_at >= prev_month_start, Order.created_at <= prev_month_end)
        ).count()
        prev_books = db.query(Book).filter(
            and_(Book.created_at >= prev_month_start, Book.created_at <= prev_month_end)
        ).count()

        # Calculate percentage changes
        def calculate_percentage_change(current, previous):
            if previous == 0:
                return "+100%" if current > 0 else "0%"
            change = ((current - previous) / previous) * 100
            return f"+{change:.1f}%" if change >= 0 else f"{change:.1f}%"

        return {
            "user_growth": calculate_percentage_change(current_users, prev_users),
            "revenue_growth": calculate_percentage_change(float(current_revenue) if current_revenue else 0, float(prev_revenue) if prev_revenue else 0),
            "order_growth": calculate_percentage_change(current_orders, prev_orders),
            "book_growth": calculate_percentage_change(current_books, prev_books)
        }

    except Exception as e:
        print(f"Error calculating growth metrics: {e}")
        return {
            "user_growth": "+0%",
            "revenue_growth": "+0%",
            "order_growth": "+0%",
            "book_growth": "+0%"
        }
