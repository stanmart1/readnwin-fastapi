"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface ReadingAnalytics {
  sessions: Array<{
    id: number;
    book_title: string;
    book_author: string;
    session_start: string;
    session_end: string;
    pages_read: number;
    reading_time_minutes: number;
    reading_speed_wpm: number;
    pages_tracked: number;
    avg_speed_wpm: number;
    total_reading_time: number;
  }>;
  speedTrends: Array<{
    date: string;
    avg_speed: number;
    sessions_count: number;
    hours_read: number;
  }>;
  bookAnalytics?: {
    title: string;
    author_name: string;
    total_pages: number;
    current_page: number;
    progress_percentage: number;
    total_sessions: number;
    avg_speed_wpm: number;
    total_minutes: number;
    bookmarks_count: number;
    notes_count: number;
    highlights_count: number;
  };
  overallStats: {
    books_read: number;
    total_sessions: number;
    overall_avg_speed: number;
    total_reading_time: number;
    reading_days: number;
    avg_pages_per_session: number;
  };
  goals: Array<{
    goal_type: string;
    target_value: number;
    current_value: number;
    progress_percentage: number;
  }>;
  recentActivity: Array<{
    type: string;
    timestamp: string;
    book_title: string;
    value: number;
    unit: string;
  }>;
}

export default function EnhancedReadingAnalytics() {
  const { user, isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState<ReadingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [selectedBook, setSelectedBook] = useState<string>("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isAuthenticated || !user?.id) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({
          period: selectedPeriod,
          ...(selectedBook && { bookId: selectedBook }),
        });

        const response = await Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] }),
        });
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data.analytics);
        }
      } catch (error) {
        console.error("Error fetching enhanced analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAuthenticated, user?.id, selectedPeriod, selectedBook]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No reading analytics available yet.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Reading Analytics</h2>
        <div className="flex space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="ri-book-open-line text-blue-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Books Read</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.overallStats.books_read}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="ri-time-line text-green-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Reading Time
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(analytics.overallStats.total_reading_time)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <i className="ri-speed-line text-purple-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Avg Reading Speed
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(analytics.overallStats.overall_avg_speed || 0)} WPM
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <i className="ri-calendar-line text-orange-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reading Days</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.overallStats.reading_days}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reading Goals */}
      {analytics.goals.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reading Goals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.goals.map((goal, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {goal.goal_type.replace("_", " ")}
                  </span>
                  <span className="text-sm text-gray-500">
                    {goal.current_value}/{goal.target_value}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(goal.progress_percentage, 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(goal.progress_percentage)}% complete
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Speed Trends */}
      {analytics.speedTrends.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reading Speed Trends
          </h3>
          <div className="space-y-3">
            {analytics.speedTrends.slice(0, 7).map((trend, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDate(trend.date)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {trend.sessions_count} sessions
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {Math.round(trend.avg_speed || 0)} WPM
                  </p>
                  <p className="text-sm text-gray-600">
                    {Math.round(trend.hours_read * 100) / 100}h read
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      {analytics.sessions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Reading Sessions
          </h3>
          <div className="space-y-3">
            {analytics.sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {session.book_title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    by {session.book_author}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(session.session_start)} • {session.pages_read}{" "}
                    pages read
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {Math.round(session.avg_speed_wpm || 0)} WPM
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatTime(session.reading_time_minutes)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Book Analytics */}
      {analytics.bookAnalytics && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current Book Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {analytics.bookAnalytics.progress_percentage}%
              </p>
              <p className="text-sm text-gray-600">Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {analytics.bookAnalytics.total_sessions}
              </p>
              <p className="text-sm text-gray-600">Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(analytics.bookAnalytics.avg_speed_wpm || 0)}
              </p>
              <p className="text-sm text-gray-600">Avg WPM</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(analytics.bookAnalytics.total_minutes)}
              </p>
              <p className="text-sm text-gray-600">Time Spent</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-blue-600">
                {analytics.bookAnalytics.bookmarks_count}
              </p>
              <p className="text-sm text-gray-600">Bookmarks</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-lg font-bold text-green-600">
                {analytics.bookAnalytics.notes_count}
              </p>
              <p className="text-sm text-gray-600">Notes</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-lg font-bold text-yellow-600">
                {analytics.bookAnalytics.highlights_count}
              </p>
              <p className="text-sm text-gray-600">Highlights</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {analytics.recentActivity.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-2">
            {analytics.recentActivity.slice(0, 10).map((activity, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
              >
                <div
                  className={`p-2 rounded-full ${
                    activity.type === "session"
                      ? "bg-blue-100"
                      : activity.type === "bookmark"
                        ? "bg-yellow-100"
                        : "bg-green-100"
                  }`}
                >
                  <i
                    className={`text-sm ${
                      activity.type === "session"
                        ? "ri-book-open-line text-blue-600"
                        : activity.type === "bookmark"
                          ? "ri-bookmark-line text-yellow-600"
                          : "ri-sticky-note-line text-green-600"
                    }`}
                  ></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.book_title}
                  </p>
                  <p className="text-xs text-gray-600">
                    {activity.value} {activity.unit} •{" "}
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
