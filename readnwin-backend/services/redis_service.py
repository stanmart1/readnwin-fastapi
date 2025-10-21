"""
Redis Service for caching and rate limiting
"""
import redis
import logging
from typing import Optional
from core.config import settings

logger = logging.getLogger(__name__)

# Redis connection from environment
REDIS_URL = settings.redis_url

# Global Redis client
_redis_client: Optional[redis.Redis] = None

def get_redis_client() -> redis.Redis:
    """Get or create Redis client"""
    global _redis_client
    
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(
                REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test connection
            _redis_client.ping()
            logger.info("✅ Redis connected successfully")
        except Exception as e:
            logger.error(f"❌ Redis connection failed: {e}")
            _redis_client = None
    
    return _redis_client

def check_rate_limit(key: str, max_attempts: int, window_seconds: int) -> bool:
    """
    Check rate limit using Redis
    Returns True if allowed, False if limit exceeded
    """
    try:
        client = get_redis_client()
        if not client:
            return True  # Allow if Redis unavailable
        
        current = client.get(key)
        
        if current is None:
            # First attempt
            client.setex(key, window_seconds, 1)
            return True
        
        count = int(current)
        if count >= max_attempts:
            return False
        
        # Increment counter
        client.incr(key)
        return True
        
    except Exception as e:
        logger.error(f"Rate limit check failed: {e}")
        return True  # Allow on error

def set_cache(key: str, value: str, ttl: int = 3600) -> bool:
    """Set cache value with TTL"""
    try:
        client = get_redis_client()
        if not client:
            return False
        
        client.setex(key, ttl, value)
        return True
    except Exception as e:
        logger.error(f"Cache set failed: {e}")
        return False

def get_cache(key: str) -> Optional[str]:
    """Get cache value"""
    try:
        client = get_redis_client()
        if not client:
            return None
        
        return client.get(key)
    except Exception as e:
        logger.error(f"Cache get failed: {e}")
        return None

def delete_cache(key: str) -> bool:
    """Delete cache key"""
    try:
        client = get_redis_client()
        if not client:
            return False
        
        client.delete(key)
        return True
    except Exception as e:
        logger.error(f"Cache delete failed: {e}")
        return False

def clear_rate_limit(key: str) -> bool:
    """Clear rate limit for a key"""
    return delete_cache(key)
