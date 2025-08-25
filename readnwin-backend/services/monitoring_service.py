import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from models.security_log import SecurityLog, LoginAttempt
from models.token_blacklist import TokenBlacklist
from core.database import get_db
import logging

logger = logging.getLogger(__name__)

class SecurityMonitoringService:
    
    @staticmethod
    async def cleanup_expired_tokens():
        """Clean up expired blacklisted tokens"""
        try:
            db = next(get_db())
            expired_tokens = db.query(TokenBlacklist).filter(
                TokenBlacklist.expires_at < datetime.now(timezone.utc)
            ).all()
            
            for token in expired_tokens:
                db.delete(token)
            
            db.commit()
            logger.info(f"Cleaned up {len(expired_tokens)} expired tokens")
        except Exception as e:
            logger.error(f"Error cleaning up expired tokens: {e}")
        finally:
            db.close()
    
    @staticmethod
    async def cleanup_old_logs():
        """Clean up old security logs (keep last 90 days)"""
        try:
            db = next(get_db())
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=90)
            
            # Clean old security logs
            old_security_logs = db.query(SecurityLog).filter(
                SecurityLog.created_at < cutoff_date
            ).count()
            
            db.query(SecurityLog).filter(
                SecurityLog.created_at < cutoff_date
            ).delete()
            
            # Clean old login attempts (keep last 30 days)
            login_cutoff = datetime.now(timezone.utc) - timedelta(days=30)
            old_login_attempts = db.query(LoginAttempt).filter(
                LoginAttempt.attempted_at < login_cutoff
            ).count()
            
            db.query(LoginAttempt).filter(
                LoginAttempt.attempted_at < login_cutoff
            ).delete()
            
            db.commit()
            logger.info(f"Cleaned up {old_security_logs} old security logs and {old_login_attempts} old login attempts")
        except Exception as e:
            logger.error(f"Error cleaning up old logs: {e}")
        finally:
            db.close()
    
    @staticmethod
    async def detect_brute_force_attacks():
        """Detect potential brute force attacks"""
        try:
            db = next(get_db())
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=1)
            
            # Find IPs with excessive failed login attempts
            suspicious_ips = db.query(LoginAttempt.ip_address).filter(
                LoginAttempt.success == False,
                LoginAttempt.attempted_at > cutoff_time
            ).group_by(LoginAttempt.ip_address).having(
                db.func.count(LoginAttempt.id) > 20  # More than 20 failed attempts in 1 hour
            ).all()
            
            for (ip,) in suspicious_ips:
                logger.warning(f"Potential brute force attack detected from IP: {ip}")
                # In production, you might want to automatically block these IPs
                
        except Exception as e:
            logger.error(f"Error detecting brute force attacks: {e}")
        finally:
            db.close()
    
    @staticmethod
    async def generate_security_report():
        """Generate daily security report"""
        try:
            db = next(get_db())
            today = datetime.now(timezone.utc).date()
            start_of_day = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
            
            # Count various security events
            login_attempts = db.query(LoginAttempt).filter(
                LoginAttempt.attempted_at >= start_of_day
            ).count()
            
            successful_logins = db.query(LoginAttempt).filter(
                LoginAttempt.attempted_at >= start_of_day,
                LoginAttempt.success == True
            ).count()
            
            failed_logins = login_attempts - successful_logins
            
            suspicious_activities = db.query(SecurityLog).filter(
                SecurityLog.created_at >= start_of_day,
                SecurityLog.risk_level.in_(["high", "critical"])
            ).count()
            
            report = {
                "date": today.isoformat(),
                "total_login_attempts": login_attempts,
                "successful_logins": successful_logins,
                "failed_logins": failed_logins,
                "suspicious_activities": suspicious_activities,
                "success_rate": (successful_logins / login_attempts * 100) if login_attempts > 0 else 0
            }
            
            logger.info(f"Daily security report: {report}")
            return report
            
        except Exception as e:
            logger.error(f"Error generating security report: {e}")
            return None
        finally:
            db.close()

# Background task scheduler (in production, use Celery or similar)
async def run_security_maintenance():
    """Run periodic security maintenance tasks"""
    while True:
        try:
            await SecurityMonitoringService.cleanup_expired_tokens()
            await SecurityMonitoringService.cleanup_old_logs()
            await SecurityMonitoringService.detect_brute_force_attacks()
            
            # Run every hour
            await asyncio.sleep(3600)
        except Exception as e:
            logger.error(f"Error in security maintenance: {e}")
            await asyncio.sleep(300)  # Wait 5 minutes before retrying