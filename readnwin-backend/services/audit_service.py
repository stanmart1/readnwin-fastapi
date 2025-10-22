from sqlalchemy.orm import Session
from models.audit_log import AuditLog
from fastapi import Request
from typing import Optional, Dict, Any

class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        user_id: Optional[int],
        action: str,
        resource: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None,
        status: str = "success"
    ):
        """Log an audit event"""
        try:
            ip_address = None
            user_agent = None
            
            if request:
                ip_address = request.client.host if request.client else None
                user_agent = request.headers.get("user-agent")
            
            audit_log = AuditLog(
                user_id=user_id,
                action=action,
                resource=resource,
                resource_id=str(resource_id) if resource_id else None,
                details=details,
                ip_address=ip_address,
                user_agent=user_agent,
                status=status
            )
            
            db.add(audit_log)
            db.commit()
            return True
        except Exception as e:
            print(f"Audit logging error: {e}")
            db.rollback()
            return False
    
    @staticmethod
    def get_user_activity(db: Session, user_id: int, limit: int = 50):
        """Get recent activity for a user"""
        return db.query(AuditLog).filter(
            AuditLog.user_id == user_id
        ).order_by(AuditLog.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_resource_history(db: Session, resource: str, resource_id: str, limit: int = 50):
        """Get history for a specific resource"""
        return db.query(AuditLog).filter(
            AuditLog.resource == resource,
            AuditLog.resource_id == resource_id
        ).order_by(AuditLog.created_at.desc()).limit(limit).all()
