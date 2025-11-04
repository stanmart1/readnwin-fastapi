# Library Page Fix - Deployment Guide

## Issue Summary
The `/admin/library` page was showing CORS errors and 500 Internal Server Error when trying to fetch library assignments from `https://backend.readnwin.com/admin/library-assignments`.

## Root Cause
1. The `has_admin_access` property in the User model was trying to access `self.role.permissions` without checking if the relationship was loaded
2. This caused lazy loading errors when the role/permissions weren't eagerly loaded
3. The error resulted in a 500 response, which triggered CORS errors in the browser

## Files Modified

### 1. `/readnwin-backend/routers/admin_library.py`
**Changes:**
- Added comprehensive error handling in `get_library_assignments` endpoint
- Added try-catch blocks to handle admin access check failures
- Added safe null checks when formatting assignment data
- Added error handling for individual assignment formatting to prevent one bad record from breaking the entire response

**Key improvements:**
```python
# Added error handling for admin check
try:
    check_admin_access(current_user)
except HTTPException as e:
    raise e
except Exception as e:
    raise HTTPException(status_code=500, detail=f"Admin access check failed: {str(e)}")

# Added safe null checks for user/book data
"user_name": f"{assignment.user.first_name or ''} {assignment.user.last_name or ''}".strip(),
"user_email": assignment.user.email if assignment.user else "N/A",
"book_title": assignment.book.title if assignment.book else "Unknown",
```

### 2. `/readnwin-backend/models/user.py`
**Changes:**
- Improved `permissions` property to safely handle unloaded relationships
- Improved `has_admin_access` property to check role name first before accessing permissions
- Added try-catch blocks to prevent lazy loading errors

**Key improvements:**
```python
@property
def permissions(self):
    """Get user permissions from role"""
    try:
        if not self.role:
            return []
        if not hasattr(self.role, 'permissions') or not self.role.permissions:
            return []
        return [rp.permission.name for rp in self.role.permissions if rp.permission]
    except:
        return []

@property
def has_admin_access(self):
    """Check if user has admin access"""
    try:
        if not self.role:
            return False
        # Check role name first (doesn't require permissions to be loaded)
        if self.role.name in ['super_admin', 'admin']:
            return True
        # Only check permissions if they're loaded
        try:
            perms = self.permissions
            return 'super_admin' in perms or 'admin_access' in perms
        except:
            return False
    except:
        return False
```

## Deployment Steps

### For Production Server (backend.readnwin.com)

1. **SSH into the production server:**
   ```bash
   ssh user@backend.readnwin.com
   ```

2. **Navigate to the backend directory:**
   ```bash
   cd /path/to/readnwin-backend
   ```

3. **Pull the latest changes:**
   ```bash
   git pull origin main
   ```

4. **Restart the backend service:**
   ```bash
   # If using systemd
   sudo systemctl restart readnwin-backend
   
   # If using PM2
   pm2 restart readnwin-backend
   
   # If using supervisor
   sudo supervisorctl restart readnwin-backend
   
   # If running manually with uvicorn
   # Kill the existing process and restart
   pkill -f "uvicorn main:app"
   nohup uvicorn main:app --host 0.0.0.0 --port 8000 &
   ```

5. **Verify the fix:**
   ```bash
   # Test the endpoint
   curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
        https://backend.readnwin.com/admin/library-assignments?skip=0&limit=20
   ```

### For Local Development

1. **Navigate to backend directory:**
   ```bash
   cd readnwin-backend
   ```

2. **Start the backend:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

3. **Test locally:**
   - Open browser to `http://localhost:3000/admin/library`
   - Login as admin
   - Verify the library page loads without errors

## Testing Checklist

- [ ] Backend starts without errors
- [ ] `/admin/library-assignments` endpoint returns 200 status
- [ ] No CORS errors in browser console
- [ ] Library assignments display correctly in the admin panel
- [ ] Pagination works correctly
- [ ] Search and filters work
- [ ] Assign book modal works
- [ ] Remove assignment works

## Rollback Plan

If issues occur after deployment:

1. **Revert the changes:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Restart the backend service**

3. **Check logs for errors:**
   ```bash
   # If using systemd
   sudo journalctl -u readnwin-backend -f
   
   # If using PM2
   pm2 logs readnwin-backend
   ```

## Additional Notes

- The fix is backward compatible and doesn't require database migrations
- No frontend changes were needed
- The fix improves error handling across all admin endpoints that use `check_admin_access`
- Consider adding monitoring/alerting for 500 errors on admin endpoints

## Support

If you encounter issues:
1. Check backend logs for detailed error messages
2. Verify admin user has proper role assigned (super_admin or admin)
3. Ensure database relationships are properly configured
4. Test with a fresh admin token
