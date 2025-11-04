# Mixed Content Error Fix

## Problem
The site at `https://readnwin.com/faq` was trying to access `http://backend.readnwin.com/api/faq/` which caused a mixed content error. Browsers block HTTP requests from HTTPS pages for security reasons.

## Root Cause
The API base URL was configured with `http://` protocol instead of `https://` in the environment configuration.

## Solution Applied

### 1. Updated Environment Files
- **`.env`**: Changed from `http://localhost:8000` to `https://backend.readnwin.com`
- **`.env.production`**: Already correctly set to `https://backend.readnwin.com`

### 2. Improved API Configuration (`frontend/src/lib/api.js`)
- Simplified the HTTPS enforcement logic
- Ensures automatic HTTP to HTTPS conversion when site is accessed over HTTPS
- Removed unnecessary localhost-specific logic

### 3. Updated Build Script (`package.json`)
- Changed build script to explicitly use production mode: `vite build --mode production`
- This ensures `.env.production` is loaded during production builds

## How It Works

1. **Development**: Uses HTTPS backend URL to match production behavior
2. **Production Build**: Vite automatically loads `.env.production` which has HTTPS URL
3. **Runtime Protection**: If somehow HTTP URL is used, the code automatically converts it to HTTPS when the page is loaded over HTTPS

## Files Modified

1. `/frontend/.env` - Updated API URL to HTTPS
2. `/frontend/src/lib/api.js` - Simplified HTTPS enforcement
3. `/frontend/package.json` - Updated build script

## Testing

To verify the fix:

1. **Build for production**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Check the built files** - The API calls should use HTTPS

3. **Deploy and test** - Access `https://readnwin.com/faq` and check browser console for no mixed content errors

## Prevention

- Always use HTTPS URLs in production environment files
- The runtime protection in `api.js` acts as a safety net
- Build script explicitly uses production mode

## Related Files

- FAQ Public Page: `/frontend/src/pages/FAQ.jsx`
- FAQ Admin Page: `/frontend/src/pages/admin/FAQ.jsx`
- FAQ Hooks: 
  - `/frontend/src/hooks/useFAQ.js`
  - `/frontend/src/hooks/useFAQManagement.js`
- API Configuration: `/frontend/src/lib/api.js`
