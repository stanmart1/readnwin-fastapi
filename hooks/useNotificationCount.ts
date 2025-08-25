'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Lightweight hook specifically for notification count tracking
 * Provides real-time updates with minimal overhead
 */
export function useNotificationCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const refreshCount = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setCount(0);
        return;
      }

      const response = await fetch(`${apiUrl}/admin/notifications/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCount(data.stats?.unread || 0);
      } else {
        setCount(0);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Initial load and periodic refresh
  useEffect(() => {
    refreshCount();

    // Refresh every 10 seconds for dynamic updates
    const interval = setInterval(refreshCount, 10000);
    return () => clearInterval(interval);
  }, [refreshCount]);

  // Listen for notification events
  useEffect(() => {
    const handleNotificationEvent = (event: CustomEvent) => {
      const { type, notificationId } = event.detail || {};
      
      if (type === 'mark-all-read') {
        setCount(0);
      } else if (event.type === 'notification-read') {
        setCount(prev => Math.max(0, prev - 1));
      } else {
        // For other events, refresh from server
        refreshCount();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshCount();
      }
    };

    // Event listeners
    window.addEventListener('notification-created', handleNotificationEvent as EventListener);
    window.addEventListener('notification-updated', handleNotificationEvent as EventListener);
    window.addEventListener('notification-read', handleNotificationEvent as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', refreshCount);

    return () => {
      window.removeEventListener('notification-created', handleNotificationEvent as EventListener);
      window.removeEventListener('notification-updated', handleNotificationEvent as EventListener);
      window.removeEventListener('notification-read', handleNotificationEvent as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refreshCount);
    };
  }, [refreshCount]);

  return { count, loading, refreshCount };
}