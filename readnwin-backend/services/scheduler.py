"""
Background Scheduler for periodic tasks
"""
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from services.token_cleanup_service import cleanup_expired_tokens

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def start_scheduler():
    """Start the background scheduler"""
    if scheduler.running:
        return
    
    # Run token cleanup daily at 2 AM
    scheduler.add_job(
        cleanup_expired_tokens,
        CronTrigger(hour=2, minute=0),
        id='cleanup_expired_tokens',
        name='Clean up expired blacklisted tokens',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started - Token cleanup runs daily at 2 AM")

def stop_scheduler():
    """Stop the background scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
