from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from core.database import get_db
from core.security import get_current_user_from_token, check_admin_access
from models.user import User
from models.notification import Notification
from pydantic import BaseModel
from typing import Optional, List
from fastapi.security import HTTPBearer
from jose import JWTError, jwt
from core.config import settings

router = APIRouter(prefix="/admin/notifications", tags=["admin", "notifications"])

security = HTTPBearer(auto_error=False)

def get_user_or_none(token: Optional[str] = Depends(security), db: Session = Depends(get_db)) -> Optional[User]:
    """Get user from token or return None if not authenticated (for stats endpoint)"""
    if not token:
        return None
    
    try:
        payload = jwt.decode(token.credentials, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            return None
            
        # Check if user has admin access
        if not user.has_admin_access:
            return None
            
        return user
    except (JWTError, AttributeError):
        return None

class NotificationCreate(BaseModel):
    type: str
    title: str
    message: str
    sendToAll: bool = True
    userId: Optional[str] = None

class NotificationUpdate(BaseModel):
    title: str
    message: str

class BatchDeleteRequest(BaseModel):
    notificationIds: List[int]

@router.get("/stats")
def get_notification_stats(
    current_user: Optional[User] = Depends(get_user_or_none),
    db: Session = Depends(get_db)
):
    """Get notification statistics - DISABLED - returns empty stats"""
    # Stats disabled - always return empty stats
    return {
        "stats": {
            "total": 0,
            "unread": 0,
            "read": 0,
            "byType": {
                'achievement': 0,
                'book': 0,
                'social': 0,
                'reminder': 0,
                'system': 0,
                'warning': 0,
                'error': 0,
                'info': 0,
                'success': 0
            },
            "byPriority": {
                'urgent': 0,
                'high': 0,
                'normal': 0,
                'low': 0
            }
        }
    }

@router.get("")
def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    type: Optional[str] = Query(None),
    isRead: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get notifications with pagination and filtering - includes global admin notifications"""
    check_admin_access(current_user)
    
    try:
        # Get both global admin notifications and user-specific notifications
        query = db.query(Notification).filter(
            (Notification.user_id == None) |  # Global notifications
            (Notification.user_id == current_user.id)  # User-specific notifications
        )
        
        if type:
            query = query.filter(Notification.type == type)
        
        if isRead:
            is_read_bool = isRead.lower() == 'true'
            query = query.filter(Notification.is_read == is_read_bool)
        
        if search:
            query = query.filter(
                (Notification.title.contains(search)) |
                (Notification.message.contains(search))
            )
        
        # Order by creation date
        query = query.order_by(Notification.created_at.desc())
        
        total = query.count()
        offset = (page - 1) * limit
        notifications = query.offset(offset).limit(limit).all()
        
        return {
            "notifications": [
                {
                    "id": notif.id,
                    "user_id": notif.user_id,
                    "first_name": "Admin" if notif.user_id is None else "User",
                    "last_name": "System" if notif.user_id is None else str(notif.user_id),
                    "user_email": "system@admin" if notif.user_id is None else f"user{notif.user_id}@example.com",
                    "type": notif.type,
                    "title": notif.title,
                    "message": notif.message,
                    "is_read": notif.is_read,
                    "is_global": False,
                    "priority": "normal",
                    "extra_data": None,
                    "created_at": notif.created_at.isoformat()
                }
                for notif in notifications
            ],
            "pages": (total + limit - 1) // limit,
            "total": total
        }
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")

@router.post("")
def create_notification(
    request: NotificationCreate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new notification"""
    check_admin_access(current_user)
    
    try:
        if request.sendToAll:
            # Create notification for all users (simplified - just create one system notification)
            notification = Notification(
                user_id=None,
                type=request.type,
                title=request.title,
                message=request.message,
                is_read=False
            )
        else:
            # Create notification for specific user
            user_id = int(request.userId) if request.userId else None
            notification = Notification(
                user_id=user_id,
                type=request.type,
                title=request.title,
                message=request.message,
                is_read=False
            )
        
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        return {"message": "Notification created successfully", "id": notification.id}
    except Exception as e:
        db.rollback()
        print(f"Error creating notification: {e}")
        raise HTTPException(status_code=500, detail="Failed to create notification")

@router.put("/{notification_id}")
def update_notification(
    notification_id: int,
    request: NotificationUpdate,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update a notification"""
    check_admin_access(current_user)
    
    try:
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        notification.title = request.title
        notification.message = request.message
        
        db.commit()
        return {"message": "Notification updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating notification: {e}")
        raise HTTPException(status_code=500, detail="Failed to update notification")

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    check_admin_access(current_user)
    
    try:
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        db.delete(notification)
        db.commit()
        return {"message": "Notification deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting notification: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete notification")

@router.put("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    check_admin_access(current_user)
    
    try:
        notification = db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        notification.is_read = True
        db.commit()
        return {"message": "Notification marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error marking notification as read: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark notification as read")

@router.put("/mark-all-read")
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for the current admin user"""
    check_admin_access(current_user)
    
    try:
        updated_count = db.query(Notification).filter(
            (Notification.user_id == None) |  # Global notifications
            (Notification.user_id == current_user.id),  # User-specific notifications
            Notification.is_read == False
        ).update({"is_read": True}, synchronize_session=False)
        
        db.commit()
        return {"message": f"Marked {updated_count} notifications as read"}
    except Exception as e:
        db.rollback()
        print(f"Error marking all notifications as read: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark all notifications as read")

@router.delete("/batch-delete")
def batch_delete_notifications(
    request: BatchDeleteRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Batch delete notifications"""
    check_admin_access(current_user)
    
    try:
        deleted_count = db.query(Notification).filter(
            Notification.id.in_(request.notificationIds)
        ).delete(synchronize_session=False)
        
        db.commit()
        return {"message": f"Successfully deleted {deleted_count} notifications"}
    except Exception as e:
        db.rollback()
        print(f"Error batch deleting notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete notifications")

@router.post("/create-sample")
def create_sample_notifications(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create sample admin notifications for testing"""
    check_admin_access(current_user)
    
    try:
        sample_notifications = [
            {
                "type": "system",
                "title": "System Update",
                "message": "System maintenance completed successfully",
                "is_global": True,
                "priority": "normal"
            },
            {
                "type": "warning",
                "title": "High Server Load",
                "message": "Server load is above 80%. Consider scaling resources.",
                "is_global": True,
                "priority": "high"
            },
            {
                "type": "info",
                "title": "New User Registration",
                "message": "50 new users registered in the last hour",
                "is_global": True,
                "priority": "normal"
            },
            {
                "type": "error",
                "title": "Payment Gateway Issue",
                "message": "Payment processing experiencing delays",
                "is_global": True,
                "priority": "urgent"
            }
        ]
        
        created_count = 0
        for notif_data in sample_notifications:
            notification = Notification(
                user_id=None,
                type=notif_data["type"],
                title=notif_data["title"],
                message=notif_data["message"],
                is_read=False
            )
            db.add(notification)
            created_count += 1
        
        db.commit()
        return {"message": f"Created {created_count} sample notifications"}
    except Exception as e:
        db.rollback()
        print(f"Error creating sample notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to create sample notifications")