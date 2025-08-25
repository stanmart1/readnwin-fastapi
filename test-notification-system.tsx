/**
 * Test component to verify notification system functionality
 * This component can be temporarily added to test the notification features
 */

'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  formatNotificationTime, 
  getNotificationIcon, 
  getNotificationColor,
  dispatchNotificationEvent 
} from '@/lib/notification-utils';

export default function NotificationSystemTest() {
  const { 
    notifications, 
    notificationCount, 
    stats, 
    loading, 
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshStats 
  } = useNotifications();

  const [testMessage, setTestMessage] = useState('');

  const createTestNotification = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/admin/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'system',
          title: 'Test Notification',
          message: testMessage || 'This is a test notification to verify the system works correctly.',
          sendToAll: true
        })
      });

      if (response.ok) {
        setTestMessage('');
        // Dispatch event to update UI
        dispatchNotificationEvent({ type: 'created' });
        // Refresh notifications
        await fetchNotifications();
        await refreshStats();
      } else {
        console.error('Failed to create test notification');
      }
    } catch (error) {
      console.error('Error creating test notification:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Notification System Test
        </h2>
        
        {/* Stats Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <i className="ri-notification-line text-blue-600 text-2xl mr-3"></i>
              <div>
                <p className="text-sm font-medium text-blue-600">Total Notifications</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <i className="ri-time-line text-yellow-600 text-2xl mr-3"></i>
              <div>
                <p className="text-sm font-medium text-yellow-600">Unread Count</p>
                <p className="text-2xl font-bold text-yellow-900">{notificationCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <i className="ri-check-line text-green-600 text-2xl mr-3"></i>
              <div>
                <p className="text-sm font-medium text-green-600">Read Count</p>
                <p className="text-2xl font-bold text-green-900">{stats.read}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Controls</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Message
              </label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter test notification message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={createTestNotification}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Test Notification
              </button>
              
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh Notifications'}\n              </button>\n              \n              <button\n                onClick={refreshStats}\n                className=\"px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors\"\n              >\n                Refresh Stats\n              </button>\n              \n              {notificationCount > 0 && (\n                <button\n                  onClick={markAllAsRead}\n                  className=\"px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors\"\n                >\n                  Mark All as Read\n                </button>\n              )}\n            </div>\n          </div>\n        </div>\n\n        {/* Error Display */}\n        {error && (\n          <div className=\"mt-4 p-4 bg-red-50 border border-red-200 rounded-md\">\n            <div className=\"flex\">\n              <i className=\"ri-error-warning-line text-red-400 text-xl mr-2\"></i>\n              <div>\n                <h4 className=\"text-sm font-medium text-red-800\">Error</h4>\n                <p className=\"text-sm text-red-700 mt-1\">{error}</p>\n              </div>\n            </div>\n          </div>\n        )}\n\n        {/* Notifications List */}\n        <div className=\"mt-6\">\n          <h3 className=\"text-lg font-semibold text-gray-900 mb-4\">\n            Recent Notifications ({notifications.length})\n          </h3>\n          \n          {loading ? (\n            <div className=\"flex items-center justify-center py-8\">\n              <div className=\"animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600\"></div>\n              <span className=\"ml-2 text-sm text-gray-600\">Loading notifications...</span>\n            </div>\n          ) : notifications.length === 0 ? (\n            <div className=\"text-center py-8\">\n              <i className=\"ri-notification-off-line text-3xl text-gray-400 mb-2\"></i>\n              <p className=\"text-sm text-gray-500\">No notifications found</p>\n            </div>\n          ) : (\n            <div className=\"space-y-2\">\n              {notifications.map((notification) => (\n                <div\n                  key={notification.id}\n                  className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${\n                    !notification.is_read ? 'border-blue-200 bg-blue-50' : 'border-gray-200'\n                  }`}\n                >\n                  <div className=\"flex items-start justify-between\">\n                    <div className=\"flex items-start space-x-3\">\n                      <i className={`${getNotificationIcon(notification.type)} ${getNotificationColor(notification.type)} text-lg mt-0.5`}></i>\n                      <div className=\"flex-1\">\n                        <div className=\"flex items-center space-x-2\">\n                          <h4 className=\"text-sm font-medium text-gray-900\">\n                            {notification.title}\n                          </h4>\n                          {!notification.is_read && (\n                            <span className=\"w-2 h-2 bg-blue-600 rounded-full\"></span>\n                          )}\n                        </div>\n                        <p className=\"text-sm text-gray-600 mt-1\">\n                          {notification.message}\n                        </p>\n                        <p className=\"text-xs text-gray-500 mt-2\">\n                          {formatNotificationTime(notification.created_at)} • \n                          <span className=\"capitalize\">{notification.type}</span> • \n                          <span className={notification.is_read ? 'text-green-600' : 'text-yellow-600'}>\n                            {notification.is_read ? 'Read' : 'Unread'}\n                          </span>\n                        </p>\n                      </div>\n                    </div>\n                    \n                    {!notification.is_read && (\n                      <button\n                        onClick={() => markAsRead(notification.id)}\n                        className=\"text-xs text-blue-600 hover:text-blue-800 font-medium\"\n                      >\n                        Mark as Read\n                      </button>\n                    )}\n                  </div>\n                </div>\n              ))}\n            </div>\n          )}\n        </div>\n\n        {/* Mobile Test Section */}\n        <div className=\"mt-8 p-4 bg-gray-50 rounded-lg\">\n          <h3 className=\"text-lg font-semibold text-gray-900 mb-2\">\n            Mobile Optimization Test\n          </h3>\n          <p className=\"text-sm text-gray-600 mb-4\">\n            Test the notification popup on different screen sizes:\n          </p>\n          \n          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4 text-sm\">\n            <div>\n              <h4 className=\"font-medium text-gray-900\">Desktop (≥1024px)</h4>\n              <ul className=\"text-gray-600 mt-1 space-y-1\">\n                <li>• Popup appears as dropdown from notification bell</li>\n                <li>• Fixed width of 320px (w-80)</li>\n                <li>• Maximum height of 384px (max-h-96)</li>\n                <li>• Click outside to close</li>\n              </ul>\n            </div>\n            \n            <div>\n              <h4 className=\"font-medium text-gray-900\">Mobile (<1024px)</h4>\n              <ul className=\"text-gray-600 mt-1 space-y-1\">\n                <li>• Popup appears as modal overlay</li>\n                <li>• Full-width with margins (inset-x-4)</li>\n                <li>• Maximum height of 80vh</li>\n                <li>• Touch-friendly close button</li>\n                <li>• Backdrop overlay for better focus</li>\n              </ul>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}"}, {"oldStr": "              <button\n                onClick={fetchNotifications}\n                disabled={loading}\n                className=\"px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50\"\n              >\n                {loading ? 'Loading...' : 'Refresh Notifications'}", "newStr": "              <button\n                onClick={fetchNotifications}\n                disabled={loading}\n                className=\"px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50\"\n              >\n                {loading ? 'Loading...' : 'Refresh Notifications'}"}]