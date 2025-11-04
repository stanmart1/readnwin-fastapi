# Redis Admin Control Feature

This document describes the Redis enable/disable functionality added to the ReadnWin admin panel.

## Overview

The Redis admin control feature allows administrators to enable or disable Redis caching and rate limiting through the admin settings interface. The application gracefully handles Redis being disabled and falls back to in-memory alternatives.

## Features

### Backend Implementation

1. **System Setting**: Added `redis_enabled` boolean setting to control Redis usage
2. **Dynamic Redis Control**: Redis service checks the system setting before attempting connections
3. **Cache Management**: Setting changes are cached to avoid database queries on every Redis operation
4. **Graceful Fallback**: Application continues to work normally when Redis is disabled

### Frontend Implementation

1. **Admin Settings Toggle**: Simple on/off toggle in the General settings tab
2. **Redis Management Tab**: Dedicated tab showing Redis status and management options
3. **Real-time Status**: Shows current Redis connection status and server information
4. **Management Actions**: Refresh status, flush Redis data, and refresh settings cache

## Usage

### For Administrators

1. **Enable/Disable Redis**:
   - Go to Admin → Settings → General tab
   - Toggle "Redis Caching" on or off
   - Click "Save Settings"

2. **Monitor Redis Status**:
   - Go to Admin → Settings → Redis tab
   - View connection status, memory usage, and server info
   - Use "Refresh Status" to update information

3. **Manage Redis Data**:
   - Use "Refresh Settings Cache" to reload the Redis setting
   - Use "Flush All Redis Data" to clear all cached data (requires confirmation)

### For Developers

1. **Check Redis Status**:
   ```python
   from services.redis_service import is_redis_enabled
   if is_redis_enabled():
       # Redis operations
   ```

2. **Reset Setting Cache**:
   ```python
   from services.redis_service import reset_redis_setting_cache
   reset_redis_setting_cache()
   ```

## API Endpoints

### Redis Management
- `GET /admin/redis/status` - Get Redis connection status and server info
- `POST /admin/redis/refresh-setting` - Refresh Redis setting cache
- `DELETE /admin/redis/flush?confirm=true` - Flush all Redis data

### System Settings
- `GET /admin/system-settings` - Get all system settings
- `PUT /admin/system-settings/redis_enabled` - Update Redis setting

## Database Schema

### System Settings Table
```sql
INSERT INTO system_settings (key, value, data_type, category, description) 
VALUES ('redis_enabled', 'true', 'boolean', 'cache', 'Enable Redis caching and rate limiting');
```

## Migration

For existing installations, run the migration script:

```bash
cd readnwin-backend
python3 migrations/add_redis_setting.py
```

## Testing

Run the test script to verify functionality:

```bash
cd readnwin-backend
python3 test_redis_settings.py
```

## Technical Details

### How It Works

1. **Setting Check**: `is_redis_enabled()` checks the database setting (cached)
2. **Redis Client**: `get_redis_client()` returns `None` if Redis is disabled
3. **Fallback Behavior**: All Redis operations gracefully handle `None` client
4. **Cache Refresh**: Setting changes trigger cache refresh via `reset_redis_setting_cache()`

### Performance Considerations

- Setting is cached in memory to avoid database queries
- Cache is only refreshed when the setting is updated
- Redis operations fail gracefully without impacting performance

### Security

- Only admin users can access Redis management endpoints
- Redis flush operation requires explicit confirmation
- Setting changes are logged through the standard audit system

## Benefits

1. **Operational Flexibility**: Enable/disable Redis without code changes
2. **Development Friendly**: Easy to disable Redis for local development
3. **Graceful Degradation**: Application works fully without Redis
4. **Real-time Control**: Changes take effect immediately
5. **Monitoring**: Clear visibility into Redis status and performance

## Troubleshooting

### Common Issues

1. **Setting Not Taking Effect**:
   - Use "Refresh Settings Cache" in the Redis tab
   - Or call the `/admin/redis/refresh-setting` endpoint

2. **Redis Still Connecting When Disabled**:
   - Check if the setting was saved properly
   - Verify the setting value is "false" (string)

3. **Frontend Not Showing Redis Tab**:
   - Ensure the RedisManagement component is imported
   - Check that the Redis tab is added to the tabs array

### Debug Commands

```bash
# Check Redis setting in database
python3 -c "
from sqlalchemy.orm import sessionmaker
from core.database import engine
from models.system_settings import SystemSetting
db = sessionmaker(bind=engine)()
setting = db.query(SystemSetting).filter(SystemSetting.key == 'redis_enabled').first()
print(f'Redis enabled: {setting.value if setting else \"Not found\"}')
db.close()
"

# Test Redis service
python3 -c "
from services.redis_service import is_redis_enabled, get_redis_client
print(f'Redis enabled: {is_redis_enabled()}')
print(f'Redis client: {get_redis_client() is not None}')
"
```