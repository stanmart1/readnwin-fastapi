"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { EnhancedApiClient } from "@/lib/api-enhanced";

// Utility function for safe date formatting
const formatSafeDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || !dateString) {
      return "Unknown date";
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return "Unknown date";
  }
};

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  date: string;
  priority: string;
  is_read?: boolean;
}

export default function NotificationCenter() {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      if (!user?.id) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setError(null);
        }

        const api = new EnhancedApiClient();
        const token = localStorage.getItem("token");
        if (token) {
          api.setToken(token);
        }

        const data = await api.request("/dashboard/notifications?limit=10");

        if (isMounted) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        if (isMounted) {
          setError("Failed to load notifications");
          setNotifications([]);
          setUnreadCount(0);
          setLoading(false);
        }
      }
    };

    if (user?.id) {
      fetchNotifications();
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const markAsRead = async (id: number) => {
    try {
      const api = new EnhancedApiClient();
      const token = localStorage.getItem("token");
      if (token) {
        api.setToken(token);
      }

      await api.request("/dashboard/notifications", {
        method: "PUT",
        body: JSON.stringify({
          notificationIds: [id],
          markAsRead: true,
        }),
      });

      setNotifications(
        notifications.map((notif) =>
          notif.id === id ? { ...notif, is_read: true } : notif,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "achievement":
        return "ri-trophy-line";
      case "book":
        return "ri-book-line";
      case "social":
        return "ri-thumb-up-line";
      case "reminder":
        return "ri-alarm-line";
      case "system":
        return "ri-notification-line";
      default:
        return "ri-notification-line";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "achievement":
        return "text-yellow-600 bg-yellow-100";
      case "book":
        return "text-blue-600 bg-blue-100";
      case "social":
        return "text-green-600 bg-green-100";
      case "reminder":
        return "text-purple-600 bg-purple-100";
      case "system":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-2">
          <i className="ri-error-warning-line text-2xl"></i>
        </div>
        <p className="text-sm text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-2">
          <i className="ri-user-line text-2xl"></i>
        </div>
        <p className="text-sm text-gray-600">
          Please log in to view notifications
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {unreadCount}
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <i className="ri-notification-off-line text-3xl"></i>
          </div>
          <p className="text-sm text-gray-600">No notifications yet</p>
          <p className="text-xs text-gray-500 mt-1">
            We'll notify you when there's something new!
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                notification.is_read
                  ? "bg-gray-50 border-gray-200"
                  : "bg-white border-blue-200 shadow-sm"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(
                    notification.type,
                  )}`}
                >
                  <i
                    className={`${getNotificationIcon(notification.type)} text-sm`}
                  ></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatSafeDate(notification.date)}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {notifications.length > 0 && (
        <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
          View All Notifications
        </button>
      )}
    </div>
  );
}
