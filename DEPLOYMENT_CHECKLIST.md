# Admin Library Fix - Deployment Checklist

## Pre-Deployment

### Code Review
- [x] User model properties fixed with error handling
- [x] Admin library endpoint enhanced with error handling
- [x] All tests passing locally
- [x] No breaking changes introduced
- [x] Backward compatibility maintained

### Testing
- [x] Unit tests pass (2/2 tests)
- [x] User model properties work correctly
- [x] Endpoint routes exist and are accessible
- [ ] Manual testing on local environment
- [ ] Admin login works
- [ ] Library page loads
- [ ] Can view assignments
- [ ] Can assign books
- [ ] Can remove assignments

### Documentation
- [x] Fix summary created
- [x] Deployment guide created
- [x] Quick reference created
- [x] Visual diagrams created
- [x] Rollback plan documented

## Deployment Steps

### 1. Backup
- [ ] Backup production database
- [ ] Note current git commit hash: `git rev-parse HEAD`
- [ ] Document current backend version/state

### 2. Code Deployment
- [ ] Commit changes locally
  ```bash
  git add .
  git commit -m "Fix admin library page 500 error and CORS issues"
  ```
- [ ] Push to repository
  ```bash
  git push origin main
  ```
- [ ] SSH to production server
  ```bash
  ssh user@backend.readnwin.com
  ```
- [ ] Navigate to backend directory
  ```bash
  cd /path/to/readnwin-backend
  ```
- [ ] Pull latest changes
  ```bash
  git pull origin main
  ```
- [ ] Verify correct files updated
  ```bash
  git log -1
  git diff HEAD~1 models/user.py
  git diff HEAD~1 routers/admin_library.py
  ```

### 3. Service Restart
- [ ] Restart backend service (choose appropriate method):
  
  **Systemd:**
  ```bash
  sudo systemctl restart readnwin-backend
  sudo systemctl status readnwin-backend
  ```
  
  **PM2:**
  ```bash
  pm2 restart readnwin-backend
  pm2 logs readnwin-backend --lines 50
  ```
  
  **Supervisor:**
  ```bash
  sudo supervisorctl restart readnwin-backend
  sudo supervisorctl status readnwin-backend
  ```
  
  **Manual:**
  ```bash
  pkill -f "uvicorn main:app"
  nohup uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
  ```

### 4. Verification
- [ ] Check backend is running
  ```bash
  ps aux | grep uvicorn
  ```
- [ ] Test health endpoint
  ```bash
  curl https://backend.readnwin.com/health
  ```
- [ ] Test library endpoint (with admin token)
  ```bash
  curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
       https://backend.readnwin.com/admin/library-assignments?skip=0&limit=20
  ```
- [ ] Check for errors in logs
  ```bash
  # Systemd
  sudo journalctl -u readnwin-backend -n 50 --no-pager
  
  # PM2
  pm2 logs readnwin-backend --lines 50
  
  # Manual
  tail -f backend.log
  ```

## Post-Deployment Testing

### Backend Tests
- [ ] Health endpoint returns 200
- [ ] Library assignments endpoint returns 200
- [ ] No 500 errors in logs
- [ ] No CORS errors in logs
- [ ] Response includes proper CORS headers
- [ ] Response data structure is correct

### Frontend Tests
- [ ] Open https://readnwin.com/admin/library
- [ ] No CORS errors in browser console
- [ ] No 500 errors in browser console
- [ ] Page loads successfully
- [ ] Library assignments table displays
- [ ] Pagination controls work
- [ ] Search functionality works
- [ ] Status filter works
- [ ] User filter works
- [ ] "Assign Book" button works
- [ ] Assign book modal opens
- [ ] Can select user from dropdown
- [ ] Can select book from dropdown
- [ ] Can select format (ebook/physical)
- [ ] Assignment succeeds
- [ ] New assignment appears in table
- [ ] Can remove assignment
- [ ] Removal succeeds
- [ ] Assignment disappears from table

### User Acceptance
- [ ] Admin user can access library page
- [ ] All features work as expected
- [ ] No error messages displayed
- [ ] Performance is acceptable
- [ ] UI is responsive

## Monitoring (First 24 Hours)

### Metrics to Watch
- [ ] Error rate on /admin/library-assignments endpoint
- [ ] Response time for library endpoint
- [ ] Number of 500 errors (should be 0)
- [ ] Number of CORS errors (should be 0)
- [ ] User complaints/support tickets

### Log Monitoring
- [ ] Check logs every 2 hours for first 8 hours
- [ ] Check logs once after 24 hours
- [ ] Look for any new error patterns
- [ ] Monitor for performance issues

## Rollback Plan (If Needed)

### When to Rollback
- Multiple 500 errors occurring
- CORS errors still present
- Library page still not loading
- New errors introduced
- Performance degradation

### Rollback Steps
1. [ ] SSH to production server
2. [ ] Navigate to backend directory
3. [ ] Revert to previous commit
   ```bash
   git revert HEAD
   git push origin main
   # OR
   git reset --hard PREVIOUS_COMMIT_HASH
   git push -f origin main
   ```
4. [ ] Restart backend service
5. [ ] Verify rollback successful
6. [ ] Notify team
7. [ ] Investigate issue
8. [ ] Plan fix

## Success Criteria

### Must Have (Critical)
- [x] Code changes implemented
- [ ] Backend deployed successfully
- [ ] Backend service running
- [ ] No 500 errors
- [ ] No CORS errors
- [ ] Library page loads
- [ ] Can view assignments

### Should Have (Important)
- [ ] All CRUD operations work
- [ ] Pagination works
- [ ] Search works
- [ ] Filters work
- [ ] Performance acceptable

### Nice to Have (Optional)
- [ ] No warnings in logs
- [ ] Response time < 200ms
- [ ] Zero downtime deployment

## Sign-Off

### Deployment Team
- [ ] Developer: _________________ Date: _______
- [ ] Reviewer: _________________ Date: _______
- [ ] QA: _______________________ Date: _______

### Production Verification
- [ ] Backend deployed: Yes / No
- [ ] Tests passing: Yes / No
- [ ] Issues found: Yes / No
- [ ] Rollback needed: Yes / No

### Notes
```
Add any deployment notes, issues encountered, or observations here:

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

## Contact Information

### Support Escalation
- Developer: [Your contact]
- DevOps: [DevOps contact]
- On-call: [On-call contact]

### Useful Commands

**Check backend status:**
```bash
sudo systemctl status readnwin-backend
```

**View logs:**
```bash
sudo journalctl -u readnwin-backend -f
```

**Test endpoint:**
```bash
curl -H "Authorization: Bearer TOKEN" \
     https://backend.readnwin.com/admin/library-assignments
```

**Restart service:**
```bash
sudo systemctl restart readnwin-backend
```

## Completion

- [ ] All checklist items completed
- [ ] Deployment successful
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Team notified

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Status:** ⬜ Success ⬜ Failed ⬜ Rolled Back
