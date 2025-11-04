# Deployment Checklist - Mixed Content Fix

## Pre-Deployment Steps

### 1. Verify Environment Configuration
- [x] `.env` uses HTTPS: `https://backend.readnwin.com`
- [x] `.env.production` uses HTTPS: `https://backend.readnwin.com`
- [x] Build script uses production mode

### 2. Build the Application
```bash
cd frontend
npm run build
```

### 3. Verify Build Output
Check that the built files reference HTTPS URLs:
```bash
grep -r "http://backend.readnwin.com" dist/
```
This should return NO results. If it does, the fix didn't work.

### 4. Test Locally (Optional)
```bash
npm run preview
```
Then access via `http://localhost:4173` and check browser console.

## Deployment Steps

### 1. Deploy Frontend
Upload the `dist/` folder to your hosting service (e.g., Netlify, Vercel, AWS S3)

### 2. Ensure Backend is HTTPS
Verify that `https://backend.readnwin.com` is accessible and has a valid SSL certificate

### 3. Test Production Site
1. Visit `https://readnwin.com/faq`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Check for mixed content errors - there should be NONE
5. Go to Network tab
6. Verify all API calls use `https://backend.readnwin.com`

## Post-Deployment Verification

### Check These Pages
- [ ] FAQ Public Page: `https://readnwin.com/faq`
- [ ] FAQ Admin Page: `https://readnwin.com/admin/faq`
- [ ] Any other pages that make API calls

### Browser Console Checks
- [ ] No "Mixed Content" errors
- [ ] No "blocked" requests
- [ ] All API calls successful

### Network Tab Checks
- [ ] All requests to backend use HTTPS
- [ ] No HTTP requests to `http://backend.readnwin.com`

## Rollback Plan

If issues occur:
1. Check browser console for specific errors
2. Verify SSL certificate on backend
3. Check that environment variables are correctly set
4. Rebuild with: `npm run build --mode production`

## Success Criteria

✅ No mixed content errors in browser console
✅ All API calls use HTTPS
✅ FAQ page loads and displays data correctly
✅ Admin FAQ page works without errors

## Additional Notes

- The fix includes runtime protection that automatically converts HTTP to HTTPS
- This means even if configuration is wrong, it will self-correct when accessed via HTTPS
- Always use HTTPS URLs in production environment files
