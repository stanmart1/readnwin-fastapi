'use client';

import { useState, useEffect, useCallback } from 'react';

interface Notification {
  id: number;
  user_id: number;
  type: 'achievement' | 'book' | 'social' | 'reminder' | 'system' | 'error' | 'warning' | 'success' | 'alert';
  title: string;
  message: string;
  is_read: boolean;
  metadata?: any;
  created_at: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  read: number;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  notificationCount: number;
  stats: NotificationStats;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    read: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }, []);

  const fetchNotifications = useCallback(async (limit = 10) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/admin/notifications?limit=${limit}&isRead=false`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, getAuthHeaders]);

  const refreshStats = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/admin/notifications/stats`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const data = await response.json();
      const statsData = data.stats || { total: 0, unread: 0, read: 0 };
      
      setStats(statsData);
      setNotificationCount(statsData.unread);
    } catch (err) {
      console.error('Error fetching notification stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notification stats');
      setStats({ total: 0, unread: 0, read: 0 });
      setNotificationCount(0);
    }
  }, [apiUrl, getAuthHeaders]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const response = await fetch(`${apiUrl}/admin/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.statusText}`);
      }

      // Update local state immediately for instant UI feedback
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );

      // Update count immediately
      setNotificationCount(prev => Math.max(0, prev - 1));

      // Dispatch event for other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notification-read', { 
          detail: { notificationId } 
        }));
      }

      // Refresh stats to sync with server
      await refreshStats();
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  }, [apiUrl, getAuthHeaders, refreshStats]);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/admin/notifications/mark-all-read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.statusText}`);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );

      // Refresh stats
      await refreshStats();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
    }
  }, [apiUrl, getAuthHeaders, refreshStats]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchNotifications(),
        refreshStats()
      ]);
    };

    fetchData();

    // Set up frequent refresh for dynamic updates (every 10 seconds)
    const interval = setInterval(() => {
      refreshStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchNotifications, refreshStats]);

  // Listen for notification events and page visibility changes
  useEffect(() => {
    const handleNotificationUpdate = () => {
      refreshStats();
      fetchNotifications();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refresh when page becomes visible
        refreshStats();
      }
    };

    const handleFocus = () => {
      // Refresh when window gains focus
      refreshStats();
    };

    // Listen for custom events
    window.addEventListener('notification-updated', handleNotificationUpdate);
    window.addEventListener('notification-created', handleNotificationUpdate);
    window.addEventListener('notification-read', handleNotificationUpdate);
    
    // Listen for page visibility and focus changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('notification-updated', handleNotificationUpdate);
      window.removeEventListener('notification-created', handleNotificationUpdate);
      window.removeEventListener('notification-read', handleNotificationUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshStats, fetchNotifications]);

  return {
    notifications,
    notificationCount,
    stats,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshStats
  };
}