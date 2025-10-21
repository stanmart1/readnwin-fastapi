# Redis Implementation

## Overview
Redis is now integrated for production-grade rate limiting and caching, replacing in-memory storage.

## ✅ Implementation Complete

### Connection Details
**URL:** `rediss://149.102.159.118:55322/0`
**Protocol:** Redis with SSL (rediss://)
**Database:** 0

### Features Implemented

#### 1. Rate Limiting
**Replaced:** In-memory dictionary storage
**Now:** Redis-based with TTL

**Endpoints Protected:**
- Registration: 3 attempts / 15 minutes
- Login: 5 attempts / 15 minutes (via SecurityService)
- Password Reset: 3 attempts / 60 minutes

**Implementation:**
```python
from services.redis_service import check_rate_limit

# Check rate limit
rate_key = f"register:{ip_address}"
if not check_rate_limit(rate_key, max_attempts=3, window_seconds=900):
    raise HTTPException(status_code=429, detail="Too many attempts")
```

#### 2. Caching
**Available Functions:**
- `set_cache(key, value, ttl)` - Store with expiration
- `get_cache(key)` - Retrieve cached value
- `delete_cache(key)` - Remove from cache

**Use Cases:**
- API response caching
- Session data
- Temporary tokens
- Computed results

#### 3. Admin Management
**Endpoints:**
- `GET /admin/redis/status` - Connection status
- `POST /admin/redis/clear-rate-limit` - Clear specific rate limit
- `GET /admin/redis/keys` - List keys
- `DELETE /admin/redis/flush` - Clear all data (requires confirmation)

## Files Created/Modified

### 1. `services/redis_service.py` (NEW)
Core Redis functionality:
```python
def get_redis_client() -> redis.Redis
def check_rate_limit(key, max_attempts, window_seconds) -> bool
def set_cache(key, value, ttl) -> bool
def get_cache(key) -> Optional[str]
def delete_cache(key) -> bool
def clear_rate_limit(key) -> bool
```

### 2. `routers/admin_redis.py` (NEW)
Admin management endpoints

### 3. `routers/auth.py` (UPDATED)
- Removed in-memory rate limiting
- Added Redis-based rate limiting
- Updated registration and password reset

### 4. `main.py` (UPDATED)
- Added Redis initialization on startup
- Registered admin_redis router

### 5. `requirements.txt` (UPDATED)
Added: `redis>=5.0.0`

## Usage Examples

### Rate Limiting
```python
from services.redis_service import check_rate_limit

# Check if user can proceed
rate_key = f"action:{user_id}"
if check_rate_limit(rate_key, max_attempts=5, window_seconds=300):
    # Allowed
    perform_action()
else:
    # Rate limited
    raise HTTPException(status_code=429)
```

### Caching
```python
from services.redis_service import set_cache, get_cache

# Cache expensive query
cache_key = f"user_data:{user_id}"
cached = get_cache(cache_key)

if cached:
    return json.loads(cached)

# Compute and cache
data = expensive_query()
set_cache(cache_key, json.dumps(data), ttl=3600)  # 1 hour
return data
```

### Clear Rate Limit
```python
from services.redis_service import clear_rate_limit

# Admin action to unblock user
clear_rate_limit(f"login:{user_email}")
```

## Installation

### Install Redis Client
```bash
cd readnwin-backend
pip install redis
```

### Start Application
```bash
python main.py
```

**Output:**
```
✅ Database tables created successfully
✅ Background scheduler started
✅ Redis connected successfully
```

## Testing

### Test Connection
```bash
cd readnwin-backend
python -c "from services.redis_service import get_redis_client; client = get_redis_client(); print('Connected!' if client else 'Failed')"
```

### Test Rate Limiting
```bash
# Register multiple times to trigger rate limit
for i in {1..5}; do
  curl -X POST http://localhost:8000/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@example.com\",\"username\":\"test$i\",\"password\":\"Test123!@#\"}"
done
```

### Test Admin Endpoints
```bash
# Get admin token
TOKEN=$(curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPass123!"}' \
  | jq -r '.access_token')

# Check Redis status
curl http://localhost:8000/admin/redis/status \
  -H "Authorization: Bearer $TOKEN"

# List keys
curl http://localhost:8000/admin/redis/keys?pattern=register:* \
  -H "Authorization: Bearer $TOKEN"

# Clear rate limit
curl -X POST http://localhost:8000/admin/redis/clear-rate-limit?key=register:192.168.1.1 \
  -H "Authorization: Bearer $TOKEN"
```

## Admin Endpoints

### 1. Redis Status
**GET** `/admin/redis/status`

**Response:**
```json
{
  "connected": true,
  "version": "7.0.0",
  "used_memory": "1.2M",
  "connected_clients": 5,
  "uptime_days": 30
}
```

### 2. Clear Rate Limit
**POST** `/admin/redis/clear-rate-limit?key=register:192.168.1.1`

**Response:**
```json
{
  "success": true,
  "key": "register:192.168.1.1"
}
```

### 3. List Keys
**GET** `/admin/redis/keys?pattern=*`

**Response:**
```json
{
  "keys": ["register:192.168.1.1", "login:user@example.com"],
  "total": 2
}
```

### 4. Flush Redis
**DELETE** `/admin/redis/flush?confirm=true`

**Response:**
```json
{
  "success": true,
  "message": "Redis flushed"
}
```

## Rate Limiting Keys

### Format
```
{action}:{identifier}
```

### Examples
```
register:192.168.1.1        # Registration by IP
login:user@example.com      # Login by email
reset:192.168.1.1          # Password reset by IP
api:user_123               # API calls by user
```

## Error Handling

### Graceful Degradation
If Redis is unavailable:
- Rate limiting allows all requests (fail-open)
- Caching returns None
- Application continues to function
- Errors logged

```python
try:
    client = get_redis_client()
    if not client:
        return True  # Allow if Redis unavailable
except Exception as e:
    logger.error(f"Redis error: {e}")
    return True  # Fail-open
```

## Monitoring

### Check Connection
```bash
curl http://localhost:8000/admin/redis/status \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Monitor Keys
```bash
# All keys
curl http://localhost:8000/admin/redis/keys \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Specific pattern
curl "http://localhost:8000/admin/redis/keys?pattern=register:*" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Application Logs
```bash
tail -f app.log | grep Redis
```

## Performance Benefits

### Before (In-Memory)
- ❌ Lost on restart
- ❌ Not shared across instances
- ❌ Memory leaks possible
- ❌ No persistence

### After (Redis)
- ✅ Persistent across restarts
- ✅ Shared across multiple instances
- ✅ Automatic expiration (TTL)
- ✅ Production-ready
- ✅ Scalable

## Configuration

### Change Connection
Edit `services/redis_service.py`:
```python
REDIS_URL = "your-redis-url"
```

### Adjust Rate Limits
Edit `routers/auth.py`:
```python
# Registration: 5 attempts / 30 minutes
check_rate_limit(rate_key, max_attempts=5, window_seconds=1800)

# Login: 10 attempts / 15 minutes
check_rate_limit(rate_key, max_attempts=10, window_seconds=900)
```

### Cache TTL
```python
# 1 hour
set_cache(key, value, ttl=3600)

# 1 day
set_cache(key, value, ttl=86400)

# 1 week
set_cache(key, value, ttl=604800)
```

## Security

### SSL/TLS
✅ Using `rediss://` (Redis with SSL)

### Authentication
✅ Password included in connection string

### Network
✅ Remote Redis server (not localhost)

### Best Practices
- ✅ Don't store sensitive data in cache
- ✅ Use appropriate TTLs
- ✅ Monitor memory usage
- ✅ Regular backups (if needed)

## Troubleshooting

### Issue: Connection Failed
**Check:**
1. Redis server is running
2. Network connectivity
3. Firewall rules
4. Credentials are correct

**Test:**
```bash
redis-cli -u "rediss://..." ping
```

### Issue: Rate Limiting Not Working
**Check:**
1. Redis connection status
2. Key format is correct
3. TTL is set properly
4. Check logs for errors

### Issue: High Memory Usage
**Solutions:**
1. Reduce TTL values
2. Clear old keys
3. Use `FLUSHDB` to reset
4. Monitor with `/admin/redis/status`

## Production Recommendations

### 1. Monitoring
- Set up Redis monitoring
- Alert on connection failures
- Track memory usage
- Monitor key count

### 2. Backup
- Enable Redis persistence (RDB/AOF)
- Regular backups
- Test restore procedures

### 3. Scaling
- Use Redis Cluster for high availability
- Read replicas for read-heavy workloads
- Connection pooling

### 4. Security
- Use strong passwords
- Enable SSL/TLS
- Restrict network access
- Regular security updates

### 5. Maintenance
- Monitor memory usage
- Set maxmemory policy
- Regular key cleanup
- Performance tuning

## Future Enhancements

- [ ] Session storage in Redis
- [ ] Pub/Sub for real-time features
- [ ] Distributed locks
- [ ] Leaderboards
- [ ] Real-time analytics
- [ ] Message queues
- [ ] Full-page caching

## Conclusion

Redis is **fully integrated and production-ready** with:
- ✅ Rate limiting (registration, login, password reset)
- ✅ Caching infrastructure
- ✅ Admin management endpoints
- ✅ Graceful error handling
- ✅ SSL/TLS connection
- ✅ Monitoring tools

The application now uses production-grade Redis for all rate limiting and caching needs!
