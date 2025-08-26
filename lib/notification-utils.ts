'use client';

/**
 * Notification utilities for managing notification state across the application
 */

export interface NotificationEvent {
  type: 'created' | 'updated' | 'deleted' | 'read' | 'unread';
  notificationId?: number;
  count?: number;
}

/**
 * Dispatch a notification event to update UI components
 */
export function dispatchNotificationEvent(event: NotificationEvent) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(`notification-${event.type}`, {
        detail: event
      })
    );
  }
}

/**
 * Format notification time for display
 */
export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInMinutes < 1440) { // 24 hours
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h ago`;
  } else if (diffInMinutes < 10080) { // 7 days
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}

/**
 * Get notification type icon
 */
export function getNotificationIcon(type: string): string {
  const iconMap: Record<string, string> = {
    achievement: 'ri-trophy-line',
    book: 'ri-book-line',
    social: 'ri-user-line',
    reminder: 'ri-alarm-line',
    system: 'ri-settings-line',
    error: 'ri-error-warning-line',
    warning: 'ri-alert-line',
    success: 'ri-check-line',
    alert: 'ri-notification-line'
  };
  
  return iconMap[type] || 'ri-notification-line';
}

/**
 * Get notification type color
 */
export function getNotificationColor(type: string): string {
  const colorMap: Record<string, string> = {
    achievement: 'text-purple-600',
    book: 'text-blue-600',
    social: 'text-green-600',
    reminder: 'text-yellow-600',
    system: 'text-gray-600',
    error: 'text-red-600',
    warning: 'text-orange-600',
    success: 'text-green-600',
    alert: 'text-red-600'
  };
  
  return colorMap[type] || 'text-gray-600';
}

/**
 * Get notification dot color for status indicator
 */
export function getNotificationDotColor(type: string): string {
  const colorMap: Record<string, string> = {
    achievement: 'bg-purple-500',
    book: 'bg-blue-500',
    social: 'bg-green-500',
    reminder: 'bg-yellow-500',
    system: 'bg-gray-500',
    error: 'bg-red-500',
    warning: 'bg-orange-500',
    success: 'bg-green-500',
    alert: 'bg-red-500'
  };
  
  return colorMap[type] || 'bg-gray-500';
}

/**
 * Truncate notification text for display
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.innerWidth < 1024;
}

/**
 * Handle notification click with proper mobile behavior
 */
export function handleNotificationClick(
  notification: any,
  onRead?: (id: number) => void,
  onClose?: () => void
) {
  // Mark as read if unread
  if (!notification.is_read && onRead) {
    onRead(notification.id);
  }
  
  // Close popup on mobile
  if (isMobileDevice() && onClose) {
    onClose();
  }
  
  // Dispatch click event for analytics or other handlers
  dispatchNotificationEvent({
    type: 'updated',
    notificationId: notification.id
  });
}

/**
 * Debounce function for API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Local storage keys for notification preferences
 */
export const NOTIFICATION_STORAGE_KEYS = {
  LAST_CHECK: 'notification_last_check',
  PREFERENCES: 'notification_preferences',
  MUTED_TYPES: 'notification_muted_types'
} as const;

/**
 * Save notification preferences to local storage
 */
export function saveNotificationPreferences(preferences: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      NOTIFICATION_STORAGE_KEYS.PREFERENCES,
      JSON.stringify(preferences)
    );
  }
}

/**
 * Load notification preferences from local storage
 */
export function loadNotificationPreferences(): any {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEYS.PREFERENCES);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading notification preferences:', error);
    return null;
  }
}

/**
 * Update last notification check timestamp
 */
export function updateLastNotificationCheck() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      NOTIFICATION_STORAGE_KEYS.LAST_CHECK,
      new Date().toISOString()
    );
  }
}

/**
 * Get last notification check timestamp
 */
export function getLastNotificationCheck(): Date | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEYS.LAST_CHECK);
    return stored ? new Date(stored) : null;
  } catch (error) {
    console.error('Error getting last notification check:', error);
    return null;
  }
}