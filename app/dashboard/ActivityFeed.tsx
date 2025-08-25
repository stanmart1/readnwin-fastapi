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

interface Activity {
  id: number;
  activity_type: string;
  title: string;
  description?: string;
  book_id?: number;
  book_title?: string;
  cover_image_url?: string;
  created_at: string;
}

export default function ActivityFeed() {
  const { user, isAuthenticated } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!isAuthenticated || !user?.id) return;

      try {
        const api = new EnhancedApiClient();
        const token = localStorage.getItem("token");
        if (token) {
          api.setToken(token);
        }

        const data = await api.request("/dashboard/activity?limit=10");
        setActivities(data.activities || []);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [isAuthenticated, user?.id]);

  const displayActivities = activities;

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "completed":
        return "ri-check-line";
      case "review":
        return "ri-star-line";
      case "started":
        return "ri-book-open-line";
      case "achievement":
        return "ri-trophy-line";
      case "purchase":
        return "ri-shopping-cart-line";
      case "bookmark":
        return "ri-heart-line";
      case "goal_reached":
        return "ri-target-line";
      default:
        return "ri-notification-line";
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "review":
        return "text-yellow-600 bg-yellow-100";
      case "started":
        return "text-blue-600 bg-blue-100";
      case "achievement":
        return "text-purple-600 bg-purple-100";
      case "purchase":
        return "text-orange-600 bg-orange-100";
      case "bookmark":
        return "text-red-600 bg-red-100";
      case "goal_reached":
        return "text-indigo-600 bg-indigo-100";
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

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Activity
      </h2>

      {displayActivities.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <i className="ri-activity-line text-2xl"></i>
          </div>
          <p className="text-sm text-gray-600">No activity yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Your reading activity will appear here
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {displayActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.activity_type)}`}
                >
                  <i
                    className={`${getActivityIcon(activity.activity_type)} text-sm`}
                  ></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatSafeDate(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer whitespace-nowrap">
            View All Activity
          </button>
        </>
      )}
    </div>
  );
}
