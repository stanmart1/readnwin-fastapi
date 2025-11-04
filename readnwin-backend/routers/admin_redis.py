"""
Admin Redis Management Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from core.security import get_current_user_from_token
from models.user import User
from services.redis_service import get_redis_client, clear_rate_limit, is_redis_enabled, reset_redis_setting_cache
from typing import Optional

router = APIRouter(prefix="/admin/redis", tags=["admin-redis"])

@router.get("/status")
def redis_status(current_user: User = Depends(get_current_user_from_token)):
    """Check Redis connection status (Admin only)"""
    if not current_user.has_admin_access:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    enabled = is_redis_enabled()
    
    if not enabled:
        return {
            "enabled": False,
            "connected": False,
            "message": "Redis is disabled via system settings",
            "help": "Enable Redis in System Settings to use caching and rate limiting features"
        }
    
    try:
        client = get_redis_client()
        if not client:
            return {
                "enabled": True,
                "connected": False, 
                "message": "Redis is not available",
                "help": "Redis is optional. Install and start Redis server, or disable it in System Settings. The application works fully without Redis.",
                "instructions": {
                    "install": "brew install redis (macOS) or apt-get install redis (Linux)",
                    "start": "brew services start redis (macOS) or systemctl start redis (Linux)",
                    "disable": "Go to Admin Settings and disable Redis"
                }
            }
        
        info = client.info()
        return {
            "enabled": True,
            "connected": True,
            "version": info.get("redis_version"),
            "used_memory": info.get("used_memory_human"),
            "connected_clients": info.get("connected_clients"),
            "uptime_days": info.get("uptime_in_days")
        }
    except Exception as e:
        return {
            "enabled": True,
            "connected": False,
            "message": "Redis connection failed",
            "error": str(e),
            "help": "Check if Redis server is running or disable Redis in System Settings"
        }

@router.post("/clear-rate-limit")
def clear_rate_limit_endpoint(
    key: str,
    current_user: User = Depends(get_current_user_from_token)
):
    """Clear rate limit for a specific key (Admin only)"""
    if not current_user.has_admin_access:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    success = clear_rate_limit(key)
    return {"success": success, "key": key}

@router.get("/keys")
def list_keys(
    pattern: str = "*",
    current_user: User = Depends(get_current_user_from_token)
):
    """List Redis keys matching pattern (Admin only)"""
    if not current_user.has_admin_access:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        client = get_redis_client()
        if not client:
            return {"keys": [], "error": "Redis not connected"}
        
        keys = client.keys(pattern)
        return {"keys": keys[:100], "total": len(keys)}  # Limit to 100
    except Exception as e:
        return {"keys": [], "error": str(e)}

@router.post("/refresh-setting")
def refresh_redis_setting(
    current_user: User = Depends(get_current_user_from_token)
):
    """Refresh Redis setting cache (Admin only)"""
    if not current_user.has_admin_access:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    reset_redis_setting_cache()
    return {"success": True, "message": "Redis setting cache refreshed"}

@router.delete("/flush")
def flush_redis(
    confirm: bool = False,
    current_user: User = Depends(get_current_user_from_token)
):
    """Flush all Redis data (Admin only, requires confirmation)"""
    if not current_user.has_admin_access:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not confirm:
        raise HTTPException(status_code=400, detail="Confirmation required")
    
    try:
        client = get_redis_client()
        if not client:
            return {"success": False, "error": "Redis not connected or disabled"}
        
        client.flushdb()
        return {"success": True, "message": "Redis flushed"}
    except Exception as e:
        return {"success": False, "error": str(e)}
