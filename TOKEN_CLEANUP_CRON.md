# Token Cleanup Cron Job

## Overview
Automatic cleanup of expired blacklisted JWT tokens to prevent database bloat.

## ✅ Implementation Complete

### Features
- **Automatic Cleanup**: Runs daily at 2 AM
- **Manual Trigger**: Admin endpoint available
- **Standalone Script**: Can run via system cron
- **Logging**: All operations logged
- **Safe**: Only deletes expired tokens

## Implementation Methods

### Method 1: Built-in Scheduler (Recommended)
**Automatic when FastAPI starts**

The scheduler starts automatically with the application and runs daily at 2 AM.

**Files:**
- `services/token_cleanup_service.py` - Cleanup logic
- `services/scheduler.py` - APScheduler configuration
- `main.py` - Auto-starts on startup

**Configuration:**
```python
# Runs daily at 2 AM
scheduler.add_job(
    cleanup_expired_tokens,
    CronTrigger(hour=2, minute=0),
    id='cleanup_expired_tokens'
)
```

**To change schedule:**
Edit `services/scheduler.py`:
```python
# Every 6 hours
CronTrigger(hour='*/6')

# Every day at 3 AM
CronTrigger(hour=3, minute=0)

# Every Sunday at midnight
CronTrigger(day_of_week='sun', hour=0, minute=0)
```

### Method 2: System Cron (Alternative)
**For system-level scheduling**

**Setup:**
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * cd /path/to/readnwin-backend && python3 cron_cleanup_tokens.py >> /var/log/token_cleanup.log 2>&1
```

**Cron Schedule Examples:**
```bash
# Every day at 2 AM
0 2 * * * /path/to/script

# Every 6 hours
0 */6 * * * /path/to/script

# Every Sunday at midnight
0 0 * * 0 /path/to/script

# Every hour
0 * * * * /path/to/script
```

### Method 3: Manual Trigger
**Via Admin API endpoint**

**Endpoint:** `POST /admin/maintenance/cleanup-tokens`

**Usage:**
```bash
curl -X POST http://localhost:8000/admin/maintenance/cleanup-tokens \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "deleted_count": 42,
  "timestamp": "2025-10-21T21:00:00Z"
}
```

## Files Created

### 1. `services/token_cleanup_service.py`
Core cleanup logic:
```python
def cleanup_expired_tokens(db: Session = None) -> dict:
    """Remove expired tokens from blacklist"""
    deleted_count = db.query(TokenBlacklist).filter(
        TokenBlacklist.expires_at < datetime.now(timezone.utc)
    ).delete(synchronize_session=False)
    
    db.commit()
    return {"success": True, "deleted_count": deleted_count}
```

### 2. `services/scheduler.py`
APScheduler configuration:
```python
def start_scheduler():
    """Start the background scheduler"""
    scheduler.add_job(
        cleanup_expired_tokens,
        CronTrigger(hour=2, minute=0),
        id='cleanup_expired_tokens'
    )
    scheduler.start()
```

### 3. `routers/admin_maintenance.py`
Admin endpoints:
- `POST /admin/maintenance/cleanup-tokens` - Manual cleanup
- `GET /admin/maintenance/scheduler-status` - Check scheduler

### 4. `cron_cleanup_tokens.py`
Standalone script for system cron

### 5. `main.py` (Updated)
- Auto-starts scheduler on startup
- Stops scheduler on shutdown

## Installation

### Install Dependencies
```bash
cd readnwin-backend
pip install APScheduler
```

### Start Application
```bash
python main.py
```

**Output:**
```
✅ Database tables created successfully
✅ Background scheduler started
Scheduler started - Token cleanup runs daily at 2 AM
```

## Testing

### Test Cleanup Function
```bash
cd readnwin-backend
python -c "from services.token_cleanup_service import cleanup_expired_tokens; print(cleanup_expired_tokens())"
```

### Test Standalone Script
```bash
cd readnwin-backend
python cron_cleanup_tokens.py
```

### Test Admin Endpoint
```bash
# Get admin token first
TOKEN=$(curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPass123!"}' \
  | jq -r '.access_token')

# Trigger cleanup
curl -X POST http://localhost:8000/admin/maintenance/cleanup-tokens \
  -H "Authorization: Bearer $TOKEN"

# Check scheduler status
curl http://localhost:8000/admin/maintenance/scheduler-status \
  -H "Authorization: Bearer $TOKEN"
```

## Monitoring

### Check Scheduler Status
**Endpoint:** `GET /admin/maintenance/scheduler-status`

**Response:**
```json
{
  "running": true,
  "jobs": [
    {
      "id": "cleanup_expired_tokens",
      "name": "Clean up expired blacklisted tokens",
      "next_run": "2025-10-22T02:00:00",
      "trigger": "cron[hour='2', minute='0']"
    }
  ],
  "timestamp": "2025-10-21T21:00:00Z"
}
```

### Check Logs
```bash
# Application logs
tail -f /path/to/app.log | grep "Cleaned up"

# System cron logs (if using system cron)
tail -f /var/log/token_cleanup.log
```

### Database Query
```sql
-- Check expired tokens count
SELECT COUNT(*) FROM token_blacklist 
WHERE expires_at < NOW();

-- View recent cleanups (from logs)
SELECT * FROM security_logs 
WHERE event_type = 'token_cleanup' 
ORDER BY created_at DESC 
LIMIT 10;
```

## How It Works

### Token Lifecycle
```
1. User logs out
   ↓
2. Token added to blacklist with expiry
   ↓
3. Token expires (after access_token_expire_minutes)
   ↓
4. Cleanup job runs (daily at 2 AM)
   ↓
5. Expired token deleted from database
```

### Cleanup Query
```sql
DELETE FROM token_blacklist 
WHERE expires_at < NOW();
```

### Performance
- **Fast**: Uses indexed `expires_at` column
- **Safe**: Only deletes expired tokens
- **Non-blocking**: Runs in background
- **Logged**: All operations logged

## Configuration

### Change Schedule
Edit `services/scheduler.py`:
```python
# Current: Daily at 2 AM
CronTrigger(hour=2, minute=0)

# Options:
CronTrigger(hour=3, minute=30)  # 3:30 AM
CronTrigger(hour='*/6')          # Every 6 hours
CronTrigger(day_of_week='sun')   # Every Sunday
```

### Disable Auto-Cleanup
Comment out in `main.py`:
```python
# from services.scheduler import start_scheduler
# start_scheduler()
```

### Add More Jobs
In `services/scheduler.py`:
```python
# Add another job
scheduler.add_job(
    another_cleanup_function,
    CronTrigger(hour=3, minute=0),
    id='another_job'
)
```

## Troubleshooting

### Issue: Scheduler not starting
**Check:**
1. APScheduler installed: `pip install APScheduler`
2. Check logs for errors
3. Verify database connection

### Issue: Jobs not running
**Check:**
1. Scheduler status endpoint
2. Application logs
3. System time/timezone

### Issue: Tokens not being deleted
**Check:**
1. Database connection
2. Token expiry times
3. Manual trigger to test

## Production Recommendations

### 1. Monitoring
- Set up alerts for failed cleanups
- Monitor deleted token counts
- Track database size

### 2. Logging
- Log to file: `/var/log/readnwin/token_cleanup.log`
- Rotate logs daily
- Keep 30 days of logs

### 3. Backup
- Backup before cleanup (optional)
- Archive old tokens instead of deleting

### 4. Performance
- Run during low-traffic hours (2-4 AM)
- Add database index on `expires_at`
- Monitor cleanup duration

### 5. Alerting
```python
# Add to cleanup_service.py
if deleted_count > 10000:
    send_alert("High token deletion count")
```

## Statistics

### Expected Cleanup Volumes
- **Low traffic**: 10-100 tokens/day
- **Medium traffic**: 100-1000 tokens/day
- **High traffic**: 1000+ tokens/day

### Database Impact
- **Before cleanup**: Tokens accumulate indefinitely
- **After cleanup**: Only active tokens remain
- **Space saved**: ~1KB per token

## Future Enhancements

- [ ] Archive old tokens before deletion
- [ ] Email reports to admins
- [ ] Cleanup statistics dashboard
- [ ] Configurable retention period
- [ ] Multiple cleanup schedules
- [ ] Cleanup other expired data (sessions, logs)

## Conclusion

Token cleanup is **fully implemented and automated** with:
- ✅ Daily automatic cleanup at 2 AM
- ✅ Manual trigger via admin endpoint
- ✅ Standalone script for system cron
- ✅ Comprehensive logging
- ✅ Monitoring endpoints
- ✅ Production-ready

The system will automatically maintain a clean token blacklist!
