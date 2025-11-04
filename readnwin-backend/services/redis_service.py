"""
Redis Service for caching and rate limiting
Redis is OPTIONAL - app works fully without it
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
_redis_available = None  # Track if Redis is available
_redis_enabled_setting = None  # Cache the setting

def is_redis_enabled() -> bool:
    """Check if Redis is enabled via system settings"""
    global _redis_enabled_setting
    
    # Cache the setting to avoid database queries on every call
    if _redis_enabled_setting is None:
        try:
            from sqlalchemy.orm import sessionmaker
            from core.database import engine
            from models.system_settings import SystemSetting
            
            SessionLocal = sessionmaker(bind=engine)
            db = SessionLocal()
            try:
                setting = db.query(SystemSetting).filter(SystemSetting.key == "redis_enabled").first()
                _redis_enabled_setting = setting.value.lower() == "true" if setting and setting.value else True
            finally:
                db.close()
        except Exception as e:
            logger.warning(f"Could not check Redis setting, defaulting to enabled: {e}")
            _redis_enabled_setting = True
    
    return _redis_enabled_setting

def reset_redis_setting_cache():
    """Reset the cached Redis setting (call when setting is updated)"""
    global _redis_enabled_setting
    _redis_enabled_setting = None

def get_redis_client() -> Optional[redis.Redis]:
    """Get or create Redis client - returns None if unavailable or disabled"""
    global _redis_client, _redis_available
    
    # Check if Redis is disabled via system settings
    if not is_redis_enabled():
        return None
    
    # If we already know Redis is unavailable, don't retry
    if _redis_available is False:
        return None
    
    if _redis_client is None:
        if not REDIS_URL or REDIS_URL == '':
            _redis_available = False
            return None
        
        try:
            # Parse URL to check if SSL is needed
            is_ssl = REDIS_URL.startswith('rediss://')
            
            if is_ssl:
                import ssl
                # Create SSL context with relaxed verification
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
                
                _redis_client = redis.from_url(
                    REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=3,  # Reduced timeout
                    socket_timeout=3,
                    socket_keepalive=True,
                    ssl_cert_reqs=None,
                    ssl_ca_certs=None,
                    ssl_check_hostname=False
                )
            else:
                _redis_client = redis.from_url(
                    REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=3,
                    socket_timeout=3
                )
            
            # Test connection
            _redis_client.ping()
            _redis_available = True
            logger.info("✅ Redis connected successfully")
        except Exception as e:
            _redis_available = False
            _redis_client = None
            logger.info("ℹ️  Redis unavailable - using in-memory fallback (this is normal for local development)")
    
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
