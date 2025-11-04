# Session Timeout Implementation

## Overview
Implemented comprehensive session timeout management with user notifications and admin controls.

## Features

### 1. User Experience
- **Warning Modal**: Users receive a warning 5 minutes before session expires
- **Countdown Timer**: Shows remaining time in MM:SS format
- **Action Options**: 
  - "Stay Logged In" - Extends session
  - "Logout Now" - Immediate logout
- **Session Expired Message**: Clear notification on login page when redirected due to timeout
- **Activity Detection**: Session automatically extends on user activity (mouse, keyboard, scroll, touch)

### 2. Admin Controls
- **Configurable Timeout**: Admin can set session timeout from 5 to 1440 minutes (24 hours)
- **Settings Location**: Admin Settings > Security tab
- **Default Value**: 40 minutes
- **Public Setting**: Timeout value is accessible to frontend without authentication

### 3. Technical Implementation

#### Frontend Components
- **`useSessionTimeout` Hook** (`/frontend/src/hooks/useSessionTimeout.js`)
  - Manages session timers
  - Fetches timeout from system settings
  - Handles warning display and countdown
  - Resets timers on user activity
  - Auto-logout on timeout

- **`SessionTimeoutWarning` Component** (`/frontend/src/components/SessionTimeoutWarning.jsx`)
  - Modal warning dialog
  - Countdown display
  - Action buttons

- **App Integration** (`/frontend/src/App.jsx`)
  - Global session monitoring
  - Warning modal display

#### Backend Configuration
- **System Setting**: `session_timeout_minutes`
- **Category**: Security
- **Data Type**: Integer
- **Public**: Yes (accessible without auth)
- **Default**: 40 minutes
- **Range**: 5-1440 minutes

#### Admin UI
- **Location**: `/admin/settings` > Security tab
- **Input**: Number field with validation
- **Help Text**: "Users will be warned 5 minutes before timeout (5-1440 minutes)"

## User Flow

### Normal Session
1. User logs in
2. Session timer starts (e.g., 40 minutes)
3. User activity resets timer
4. User continues working

### Session Expiring
1. 5 minutes before timeout, warning modal appears
2. Countdown shows remaining time
3. User can:
   - Click "Stay Logged In" → Session extends, timer resets
   - Click "Logout Now" → Immediate logout
   - Do nothing → Auto-logout at 0:00

### Session Expired
1. User is logged out automatically
2. Redirected to `/login?reason=session_expired`
3. Yellow notification shows: "Your session has expired. Please login again."

## Configuration

### Admin Setup
1. Navigate to Admin Settings
2. Click "Security" tab
3. Set "Session Timeout (minutes)" value
4. Click "Save Settings"
5. Changes apply immediately to new sessions

### Default Values
- Session Timeout: 40 minutes
- Warning Time: 5 minutes before expiry
- Activity Events: mousedown, keydown, scroll, touchstart

## Security Features
- Automatic logout on inactivity
- Configurable timeout per organization needs
- Activity-based session extension
- Clear user communication
- Secure token cleanup on logout

## Files Modified/Created

### Created
- `/frontend/src/hooks/useSessionTimeout.js`
- `/frontend/src/components/SessionTimeoutWarning.jsx`

### Modified
- `/frontend/src/App.jsx` - Added session monitoring
- `/frontend/src/pages/Login.jsx` - Added session expired notification
- `/frontend/src/pages/admin/Settings.jsx` - Added timeout setting UI
- `/frontend/src/hooks/useSettingsManagement.js` - Added camelCase/snake_case conversion
- `/frontend/src/hooks/index.js` - Exported new hook
- `/readnwin-backend/routers/admin_system_settings.py` - Made timeout setting public

## Testing

### Test Session Timeout
1. Set timeout to 6 minutes in admin settings
2. Login as user
3. Wait 1 minute (warning should appear at 5 minutes remaining)
4. Verify countdown works
5. Test "Stay Logged In" button
6. Test "Logout Now" button
7. Test auto-logout at 0:00

### Test Activity Detection
1. Set timeout to 10 minutes
2. Login and wait 4 minutes
3. Move mouse or type
4. Verify timer resets (no warning at 5 minutes)

### Test Admin Configuration
1. Change timeout value in admin settings
2. Save settings
3. Logout and login again
4. Verify new timeout is applied

## Notes
- Session timeout is client-side managed
- Backend JWT tokens have their own expiration (typically longer)
- Activity detection only works when warning is not shown
- Timeout value is cached on page load
- Public endpoint allows unauthenticated access to timeout value
