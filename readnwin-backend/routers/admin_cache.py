from fastapi import APIRouter, Depends, HTTPException
from core.security import get_current_user_from_token, check_admin_access
from models.user import User
from services.redis_service import get_redis_client
from datetime import datetime

router = APIRouter(prefix="/admin/cache", tags=["admin-cache"])

@router.get("")
def get_cache_stats(current_user: User = Depends(get_current_user_from_token)):
    """Get cache statistics"""
    check_admin_access(current_user)
    
    try:
        client = get_redis_client()
        if not client:
            return {
                "cache_hits": 0,
                "cache_misses": 0,
                "total_requests": 0,
                "hit_rate": 0,
                "cache_size_mb": 0,
                "cached_items": 0,
                "total_images": 0,
                "last_cleared": None
            }
        
        info = client.info()
        keyspace_hits = info.get("keyspace_hits", 0)
        keyspace_misses = info.get("keyspace_misses", 0)
        total_requests = keyspace_hits + keyspace_misses
        hit_rate = round((keyspace_hits / total_requests * 100) if total_requests > 0 else 0, 2)
        
        # Get memory usage in MB
        used_memory = info.get("used_memory", 0)
        cache_size_mb = round(used_memory / (1024 * 1024), 2)
        
        # Count cached items
        cached_items = client.dbsize()
        
        # Get last cleared timestamp if exists
        last_cleared = client.get("cache:last_cleared")
        if last_cleared:
            last_cleared = last_cleared.decode('utf-8')
        
        return {
            "cache_hits": keyspace_hits,
            "cache_misses": keyspace_misses,
            "total_requests": total_requests,
            "hit_rate": hit_rate,
            "cache_size_mb": cache_size_mb,
            "cached_items": cached_items,
            "total_images": cached_items,  # Assuming most cached items are images
            "last_cleared": last_cleared
        }
    except Exception as e:
        print(f"Error getting cache stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get cache statistics")

@router.delete("")
def clear_cache(current_user: User = Depends(get_current_user_from_token)):
    """Clear all cache"""
    check_admin_access(current_user)
    
    try:
        client = get_redis_client()
        if not client:
            raise HTTPException(status_code=500, detail="Redis not connected")
        
        client.flushdb()
        
        # Set last cleared timestamp
        client.set("cache:last_cleared", datetime.utcnow().isoformat())
        
        return {"message": "Cache cleared successfully"}
    except Exception as e:
        print(f"Error clearing cache: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear cache")
