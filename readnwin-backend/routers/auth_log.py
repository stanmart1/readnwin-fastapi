from typing import Dict, Any, Optional, List
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, and_, or_
from core.database import get_db
from models.auth_log import AuthLog
from models.user import User
from core.security import get_current_user_from_token, check_admin_access

router = APIRouter()

class AuthLogEntry(BaseModel):
    type: str
    userId: Optional[int] = None
    message: str
    metadata: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[int]
    details: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime
    user: Optional[Dict[str, Any]] = None

class PaginationInfo(BaseModel):
    page: int
    pages: int
    total: int
    limit: int

class AuditLogsListResponse(BaseModel):
    success: bool
    logs: List[AuditLogResponse]
    pagination: PaginationInfo



@router.post("/_log")
async def log_auth_event(
    data: AuthLogEntry,
    db: Session = Depends(get_db)
):
    """Log authentication-related events."""
    try:
        log_entry = AuthLog(
            event_type=data.type,
            user_id=data.userId,
            message=data.message,
            log_metadata=data.metadata or {},
            timestamp=data.timestamp or datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()
        return {"status": "success", "id": log_entry.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to log auth event: {str(e)}"
        )

@router.get("/audit-logs", response_model=AuditLogsListResponse)
async def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Get audit logs with pagination and filtering."""
    check_admin_access(current_user)

    try:
        # Build query
        query = db.query(AuthLog).options(joinedload(AuthLog.user))

        # Apply filters
        filters = []
        if user_id:
            filters.append(AuthLog.user_id == user_id)
        if action:
            filters.append(AuthLog.event_type.ilike(f"%{action}%"))
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                filters.append(AuthLog.timestamp >= start_dt)
            except ValueError:
                pass
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                filters.append(AuthLog.timestamp <= end_dt)
            except ValueError:
                pass

        if filters:
            query = query.filter(and_(*filters))

        # Get total count
        total = query.count()

        # Apply pagination
        offset = (page - 1) * limit
        logs = query.order_by(desc(AuthLog.timestamp)).offset(offset).limit(limit).all()

        # Calculate pagination info
        total_pages = (total + limit - 1) // limit

        # Format response
        formatted_logs = []
        for log in logs:
            user_info = None
            if log.user:
                user_info = {
                    "id": log.user.id,
                    "first_name": log.user.first_name or "",
                    "last_name": log.user.last_name or "",
                    "email": log.user.email
                }

            formatted_logs.append(AuditLogResponse(
                id=log.id,
                user_id=log.user_id,
                action=log.event_type,
                resource_type="auth",
                resource_id=log.user_id,
                details=log.log_metadata or {},
                ip_address=None,
                user_agent=None,
                created_at=log.timestamp,
                user=user_info
            ))

        return AuditLogsListResponse(
            success=True,
            logs=formatted_logs,
            pagination=PaginationInfo(
                page=page,
                pages=total_pages,
                total=total,
                limit=limit
            )
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch audit logs: {str(e)}"
        )

@router.post("/audit-logs")
async def create_audit_log(
    user_id: Optional[int] = None,
    action: str = "unknown",
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Create a new audit log entry."""
    check_admin_access(current_user)

    try:
        # Create metadata
        metadata = details or {}
        if ip_address:
            metadata["ip_address"] = ip_address
        if user_agent:
            metadata["user_agent"] = user_agent
        if resource_type:
            metadata["resource_type"] = resource_type
        if resource_id:
            metadata["resource_id"] = resource_id

        log_entry = AuthLog(
            event_type=action,
            user_id=user_id or current_user.id,
            message=f"Action: {action}",
            log_metadata=metadata,
            timestamp=datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()

        return {"success": True, "id": log_entry.id}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create audit log: {str(e)}"
        )
