# Database Connection Issues - Production

## Common Causes & Solutions

### 1. ⚠️ SSL Mode Issue (Most Common)

**Problem:** Production database requires SSL, but connection string doesn't specify it.

**Current Config:**
```python
if settings.is_production:
    engine_config["connect_args"]["sslmode"] = "require"
```

**Solutions:**

#### Option A: Disable SSL Requirement (Quick Fix)
```python
# In core/database.py
engine_config["connect_args"]["sslmode"] = "prefer"  # or "disable"
```

#### Option B: Add SSL to Connection String
```env
# In Coolify environment variables
DB_HOST=149.102.159.118?sslmode=prefer
```

#### Option C: Remove Production SSL Check
```python
# Comment out SSL requirement
# if settings.is_production:
#     engine_config["connect_args"]["sslmode"] = "require"
```

### 2. 🔒 Firewall/Network Issue

**Problem:** Database server blocks connections from Coolify server.

**Check:**
```bash
# From Coolify container, test connection
telnet 149.102.159.118 54527
```

**Solution:**
- Whitelist Coolify server IP in database firewall
- Check if database allows external connections
- Verify port 54527 is open

### 3. 🔑 Wrong Credentials

**Problem:** Environment variables not set correctly in Coolify.

**Verify in Coolify:**
```env
DB_HOST=149.102.159.118
DB_PORT=54527
DB_USER=postgres
DB_PASSWORD=MCHQ6bEKrXypYnHbXXNxsF3IYpdX1XDOKpSkPeNdcZUjYDNQfUz7ewuHweMhIeWX
DB_NAME=postgres
```

### 4. ⏱️ Connection Timeout

**Problem:** Database takes too long to respond.

**Current:** 10 seconds timeout
```python
"connect_timeout": 10
```

**Solution:** Increase timeout
```python
"connect_timeout": 30
```

### 5. 🌐 DNS Resolution

**Problem:** Hostname not resolving.

**Solution:** Use IP address instead
```env
DB_HOST=149.102.159.118  # ✅ IP address (better)
# Not: DB_HOST=db.example.com
```

## Quick Fix (Recommended)

### Update `core/database.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from .config import settings
import logging

logger = logging.getLogger(__name__)

# Production-ready database configuration
engine_config = {
    "pool_size": 20,
    "max_overflow": 30,
    "pool_pre_ping": True,
    "pool_recycle": 3600,
    "connect_args": {
        "connect_timeout": 30,  # Increased timeout
        "application_name": "readnwin_api"
    }
}

# SSL configuration - prefer instead of require
if settings.is_production:
    engine_config["connect_args"]["sslmode"] = "prefer"  # Changed from "require"

engine = create_engine(
    settings.database_url,
    poolclass=QueuePool,
    **engine_config
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

def test_database_connection():
    """Test database connectivity"""
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("✅ Database connection successful")
            return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {str(e)}")
        return False
```

## Testing Connection

### 1. Add Health Check with DB Test

```python
# In main.py
@app.get("/health")
async def health_check():
    from core.database import test_database_connection
    
    db_status = "connected" if test_database_connection() else "disconnected"
    
    return {
        "status": "healthy",
        "database": db_status,
        "timestamp": datetime.now().isoformat()
    }
```

### 2. Test from Coolify Container

```bash
# SSH into container
docker exec -it <container-id> bash

# Test database connection
python -c "
from core.database import test_database_connection
test_database_connection()
"
```

### 3. Check Logs

```bash
# View container logs
docker logs <container-id> | grep -i database
```

## Environment Variable Checklist

```env
# Required - Double check these in Coolify
✓ DB_HOST=149.102.159.118
✓ DB_PORT=54527
✓ DB_USER=postgres
✓ DB_PASSWORD=MCHQ6bEKrXypYnHbXXNxsF3IYpdX1XDOKpSkPeNdcZUjYDNQfUz7ewuHweMhIeWX
✓ DB_NAME=postgres
✓ ENVIRONMENT=production
```

## Common Error Messages

### Error: "could not connect to server"
**Cause:** Network/firewall issue
**Fix:** Check firewall, whitelist IP

### Error: "password authentication failed"
**Cause:** Wrong credentials
**Fix:** Verify DB_PASSWORD in Coolify

### Error: "SSL connection required"
**Cause:** Database requires SSL
**Fix:** Change sslmode to "prefer" or add SSL cert

### Error: "timeout expired"
**Cause:** Database too slow or unreachable
**Fix:** Increase connect_timeout to 30

### Error: "database does not exist"
**Cause:** Wrong DB_NAME
**Fix:** Verify database name is "postgres"

## Debugging Steps

### Step 1: Check Environment Variables
```bash
# In Coolify container
echo $DB_HOST
echo $DB_PORT
echo $DB_USER
echo $DB_NAME
```

### Step 2: Test Raw Connection
```bash
# Install psql in container
apt-get update && apt-get install -y postgresql-client

# Test connection
psql -h 149.102.159.118 -p 54527 -U postgres -d postgres
```

### Step 3: Check Application Logs
```bash
docker logs <container-id> 2>&1 | grep -i "database\|connection\|error"
```

### Step 4: Verify Database is Running
```bash
# From your local machine
psql -h 149.102.159.118 -p 54527 -U postgres -d postgres
```

## Immediate Action

1. **Update `core/database.py`:**
   - Change `sslmode` from "require" to "prefer"
   - Increase `connect_timeout` to 30

2. **Verify Environment Variables in Coolify:**
   - All DB_* variables are set correctly
   - No typos in password

3. **Redeploy:**
   - Push changes
   - Coolify will rebuild and restart

4. **Test:**
   - Visit `/health` endpoint
   - Check if database status is "connected"

## Expected Result

After fix, `/health` should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-22T00:49:54"
}
```

## Still Not Working?

### Check Database Server
- Is PostgreSQL running?
- Is it accepting external connections?
- Is port 54527 open?
- Is the password correct?

### Check Network
- Can Coolify server reach database IP?
- Is there a firewall blocking?
- Is VPN required?

### Check Coolify
- Are environment variables saved?
- Did container restart after setting vars?
- Are there any deployment errors?

## Contact Database Admin

If still failing, ask database admin:
1. Is external access allowed?
2. What's the correct connection string?
3. Is SSL required or optional?
4. Is the IP whitelisted?
5. Are credentials correct?
