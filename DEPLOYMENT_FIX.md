# Deployment Fix - Coolify

## ✅ Issue Resolved

**Error:** `REDIS_URL not found. Declare it as envvar or define a default value.`

**Root Cause:** Required environment variables without defaults

**Fix Applied:** Added default values to optional config variables

## Changes Made

### `core/config.py`

```python
# Before (Required - causes deployment failure)
resend_api_key: str = config('RESEND_API_KEY')
redis_url: str = config('REDIS_URL')

# After (Optional with defaults)
resend_api_key: str = config('RESEND_API_KEY', default='')
redis_url: str = config('REDIS_URL', default='redis://localhost:6379/0')
```

## Required Environment Variables

### Minimum Required (Must Set in Coolify)

```env
# Database (REQUIRED)
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=readnwin

# Security (REQUIRED)
SECRET_KEY=your-secret-key-min-32-chars
CSRF_SECRET_KEY=your-csrf-secret-key
```

### Optional (Have Defaults)

```env
# Redis (Optional - defaults to localhost)
REDIS_URL=redis://your-redis:6379/0

# Email (Optional - empty by default)
RESEND_API_KEY=re_your_api_key

# Other (Have defaults)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
FRONTEND_URL=https://your-domain.com
ENVIRONMENT=production
```

## Coolify Deployment Steps

### 1. Set Environment Variables

In Coolify dashboard:

```env
DB_HOST=149.102.159.118
DB_PORT=54527
DB_USER=postgres
DB_PASSWORD=MCHQ6bEKrXypYnHbXXNxsF3IYpdX1XDOKpSkPeNdcZUjYDNQfUz7ewuHweMhIeWX
DB_NAME=postgres

SECRET_KEY=your-secret-key-change-in-production-min-32-chars
CSRF_SECRET_KEY=your-csrf-secret-key-change-in-production

ENVIRONMENT=production
FRONTEND_URL=https://your-domain.com
```

### 2. Optional Services

**If using Redis:**
```env
REDIS_URL=rediss://:password@host:port/0
```

**If using Resend Email:**
```env
RESEND_API_KEY=re_your_api_key
```

### 3. Deploy

```bash
# Coolify will automatically:
# 1. Build Docker image
# 2. Set environment variables
# 3. Start container
# 4. Run health checks
```

## Dockerfile (No Changes Needed)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Health Check

The app should now start successfully. Check logs:

```bash
# Should see:
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Troubleshooting

### Still Getting Errors?

**1. Check DB_HOST is set:**
```bash
echo $DB_HOST
```

**2. Check SECRET_KEY is set:**
```bash
echo $SECRET_KEY
```

**3. View container logs:**
```bash
docker logs <container-id>
```

### Common Issues

**Issue:** `DB_HOST not found`
**Fix:** Set DB_HOST in Coolify environment variables

**Issue:** `SECRET_KEY not found`
**Fix:** Set SECRET_KEY in Coolify environment variables

**Issue:** Database connection failed
**Fix:** Verify database credentials and network access

## Testing Deployment

### 1. Health Check
```bash
curl https://your-domain.com/health
```

### 2. API Docs
```bash
curl https://your-domain.com/docs
```

### 3. Test Endpoint
```bash
curl https://your-domain.com/api/books?page=1&limit=10
```

## Production Checklist

- [x] Config has default values for optional vars
- [ ] DB_HOST set in Coolify
- [ ] DB_PASSWORD set in Coolify
- [ ] SECRET_KEY set in Coolify (generate new!)
- [ ] CSRF_SECRET_KEY set in Coolify (generate new!)
- [ ] FRONTEND_URL set to production domain
- [ ] ENVIRONMENT set to "production"
- [ ] Redis URL set (if using Redis)
- [ ] Resend API key set (if using email)
- [ ] Database accessible from container
- [ ] Health check passing
- [ ] API endpoints working

## Generate Secure Keys

```bash
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate CSRF_SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Summary

✅ **Fixed:** Added default values to `REDIS_URL` and `RESEND_API_KEY`

✅ **Required:** Only `DB_HOST`, `DB_PASSWORD`, `SECRET_KEY`, `CSRF_SECRET_KEY`

✅ **Optional:** Redis and email services (have defaults)

✅ **Ready:** Deploy to Coolify now!

The application will now start successfully even without Redis or Resend configured.
