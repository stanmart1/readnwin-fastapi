"""
Token Cleanup Service - Removes expired blacklisted tokens
"""
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models.token_blacklist import TokenBlacklist
from core.database import SessionLocal

logger = logging.getLogger(__name__)

def cleanup_expired_tokens(db: Session = None) -> dict:
    """Remove expired tokens from blacklist"""
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True
    
    try:
        # Delete tokens that have expired
        deleted_count = db.query(TokenBlacklist).filter(
            TokenBlacklist.expires_at < datetime.now(timezone.utc)
        ).delete(synchronize_session=False)
        
        db.commit()
        
        logger.info(f"Cleaned up {deleted_count} expired tokens")
        return {
            "success": True,
            "deleted_count": deleted_count,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    except Exception as e:
        logger.error(f"Token cleanup failed: {e}")
        db.rollback()
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    finally:
        if should_close:
            db.close()

if __name__ == "__main__":
    # Can be run directly for manual cleanup
    result = cleanup_expired_tokens()
    print(f"Cleanup result: {result}")
