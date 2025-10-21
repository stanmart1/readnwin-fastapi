"""
Admin Maintenance Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user_from_token
from models.user import User
from services.token_cleanup_service import cleanup_expired_tokens
from datetime import datetime, timezone

router = APIRouter(prefix="/admin/maintenance", tags=["admin-maintenance"])

@router.post("/cleanup-tokens")
def manual_token_cleanup(
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Manually trigger token cleanup (Admin only)"""
    if not current_user.has_admin_access:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = cleanup_expired_tokens(db)
    return result

@router.get("/scheduler-status")
def get_scheduler_status(
    current_user: User = Depends(get_current_user_from_token)
):
    """Get scheduler status (Admin only)"""
    if not current_user.has_admin_access:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from services.scheduler import scheduler
    
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
            "trigger": str(job.trigger)
        })
    
    return {
        "running": scheduler.running,
        "jobs": jobs,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
