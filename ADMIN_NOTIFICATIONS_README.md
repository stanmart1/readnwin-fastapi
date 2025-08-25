# Admin Notifications System

## Overview
The admin notifications system provides real-time notifications for administrators in the admin sidebar. The notification bell is located in the footer of the admin sidebar and displays unread notification counts with automatic refresh.

## Features

### Frontend Features
- **Real-time Notification Bell**: Located in the admin sidebar footer
- **Unread Count Badge**: Shows number of unread notifications with pulsing animation
- **Dropdown Notification Panel**: Click the bell to view recent notifications
- **Auto-refresh**: Notifications refresh every 30 seconds
- **Responsive Design**: Works on both desktop and mobile
- **Footer Positioning**: Footer stays at the bottom of the sidebar

### Backend Features
- **FastAPI Endpoints**: RESTful API for notification management
- **Database Integration**: PostgreSQL with SQLAlchemy ORM
- **Admin Access Control**: Only admin users can access notification endpoints
- **Notification Types**: system, warning, error, info, success
- **Priority Levels**: urgent, high, normal, low
- **Global Notifications**: System-wide notifications for all admins

## API Endpoints

### Get Notifications
```
GET /admin/notifications
Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 20, max: 100)
- type: Filter by notification type
- isRead: Filter by read status (true/false)
- search: Search in title and message
```

### Get Notification Statistics
```
GET /admin/notifications/stats
Returns:
- total: Total notification count
- unread: Unread notification count
- read: Read notification count
- byType: Count by notification type
- byPriority: Count by priority level
```

### Create Sample Notifications (Testing)
```
POST /admin/notifications/create-sample
Creates sample notifications for testing purposes
```

## Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),  -- NULL for global notifications
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    is_global BOOLEAN DEFAULT FALSE,
    priority VARCHAR DEFAULT 'normal',
    metadata JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);
```

## Setup Instructions

### 1. Database Setup
Run the setup script to add the metadata column and create sample notifications:
```bash
cd readnwin-backend
python add_notification_metadata.py
```

### 2. Backend Setup
The notification endpoints are already integrated into the FastAPI application. Make sure the backend server is running:
```bash
cd readnwin-backend
python main.py
```

### 3. Frontend Integration
The admin sidebar automatically loads notifications when an admin user is logged in. No additional setup required.

### 4. Testing
Run the test script to verify functionality:
```bash
python test_admin_notifications.py
```

## Usage

### For Administrators
1. **Login** to the admin panel
2. **View Notifications**: Click the notification bell in the sidebar footer
3. **Refresh**: Click "Refresh" in the notification dropdown or wait for auto-refresh
4. **View All**: Click "View All Notifications" to go to the full notification management page

### For Developers
1. **Create Notifications**: Use the `/admin/notifications` POST endpoint
2. **Monitor Stats**: Use the `/admin/notifications/stats` endpoint
3. **Filter Notifications**: Use query parameters for filtering

## Notification Types

- **system**: General system messages (blue)
- **warning**: Warning messages (yellow)
- **error**: Error messages (red)
- **info**: Informational messages (blue)
- **success**: Success messages (green)

## Priority Levels

- **urgent**: Critical issues requiring immediate attention
- **high**: Important issues that should be addressed soon
- **normal**: Standard notifications
- **low**: Low priority informational messages

## Styling

The notification system uses Tailwind CSS classes and includes:
- Responsive design for mobile and desktop
- Smooth animations and transitions
- Color-coded notification types
- Pulsing animation for unread count badge
- Scrollable notification list with custom scrollbars

## Troubleshooting

### Common Issues

1. **Notifications not loading**
   - Check if backend server is running
   - Verify admin user has proper permissions
   - Check browser console for API errors

2. **Footer not staying at bottom**
   - Ensure CSS flexbox classes are applied correctly
   - Check that sidebar has `flex flex-col` classes

3. **Database errors**
   - Run the setup script to ensure proper table structure
   - Check database connection settings

### Debug Mode
Enable debug logging in the backend to see notification-related logs:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Future Enhancements

- Real-time WebSocket notifications
- Email notifications for urgent alerts
- Notification categories and filtering
- Bulk notification actions
- Notification templates
- Integration with monitoring systems