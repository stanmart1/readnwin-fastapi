"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { EnhancedApiClient } from "@/lib/api-enhanced";

interface ReadingSession {
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
}

interface SpeedTrend {
  date: string;
  avg_speed: number;
  sessions_count: number;
  hours_read: number;
}

interface BookAnalytics {
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
}

interface OverallStats {
  books_read: number;
  total_sessions: number;
  overall_avg_speed: number;
  total_reading_time: number;
  reading_days: number;
  avg_pages_per_session: number;
}

interface ReadingGoal {
  goal_type: string;
  target_value: number;
  current_value: number;
  progress_percentage: number;
}

interface RecentActivity {
  type: string;
  timestamp: string;
  book_title: string;
  value: number;
  unit: string;
}

interface ReadingAnalyticsData {
  sessions: ReadingSession[];
  speedTrends: SpeedTrend[];
  bookAnalytics?: BookAnalytics;
  overallStats: OverallStats;
  goals: ReadingGoal[];
  recentActivity: RecentActivity[];
}

export default function ReadingAnalyticsDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState<ReadingAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [selectedBook, setSelectedBook] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isAuthenticated || !user?.id) return;

      try {
        setLoading(true);
        const api = new EnhancedApiClient();
        const token = localStorage.getItem('token');
        if (token) {
          api.setToken(token);
        }

        const params: any = { period: selectedPeriod };
        if (selectedBook) {
          params.book_id = parseInt(selectedBook);
        }

        const data = await api.getComprehensiveAnalytics(params);
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching reading analytics:", error);
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAuthenticated, user?.id, selectedPeriod, selectedBook]);

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

  const formatGoalType = (goalType: string) => {
    return goalType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

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
        <div className="mb-4">
          <i className="ri-book-open-line text-6xl text-gray-300"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Reading Data Yet
        </h3>
        <p className="text-gray-600">
          Start reading books to see your analytics here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reading Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Track your reading progress and performance
            </p>
          </div>
          <div className="flex space-x-4 mt-4 sm:mt-0">
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
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
              { id: "sessions", label: "Sessions", icon: "ri-time-line" },
              { id: "speed", label: "Speed Trends", icon: "ri-speed-line" },
              { id: "goals", label: "Goals", icon: "ri-target-line" },
              { id: "activity", label: "Activity", icon: "ri-activity-line" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className={tab.icon}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Overall Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                  <div className="flex items-center">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <i className="ri-book-open-line text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm opacity-90">Books Read</p>
                      <p className="text-2xl font-bold">
                        {analytics.overallStats.books_read}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white">
                  <div className="flex items-center">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <i className="ri-time-line text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm opacity-90">Total Reading Time</p>
                      <p className="text-2xl font-bold">
                        {formatTime(analytics.overallStats.total_reading_time)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white">
                  <div className="flex items-center">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <i className="ri-speed-line text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm opacity-90">Avg Reading Speed</p>
                      <p className="text-2xl font-bold">
                        {Math.round(
                          analytics.overallStats.overall_avg_speed || 0,
                        )}{" "}
                        WPM
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg text-white">
                  <div className="flex items-center">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <i className="ri-calendar-line text-xl"></i>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm opacity-90">Reading Days</p>
                      <p className="text-2xl font-bold">
                        {analytics.overallStats.reading_days}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Session Statistics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Sessions</span>
                      <span className="font-medium">
                        {analytics.overallStats.total_sessions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Avg Pages per Session
                      </span>
                      <span className="font-medium">
                        {Math.round(
                          analytics.overallStats.avg_pages_per_session || 0,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Session Time</span>
                      <span className="font-medium">
                        {formatTime(
                          analytics.overallStats.total_reading_time /
                            Math.max(analytics.overallStats.total_sessions, 1),
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Reading Goals
                  </h3>
                  {analytics.goals.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.goals.slice(0, 3).map((goal, index) => (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">
                              {formatGoalType(goal.goal_type)}
                            </span>
                            <span className="text-gray-900">
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No active reading goals
                    </p>
                  )}
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-2">
                    {analytics.recentActivity
                      .slice(0, 5)
                      .map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3"
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              activity.type === "session"
                                ? "bg-blue-500"
                                : activity.type === "bookmark"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {activity.book_title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {activity.value} {activity.unit}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Reading Sessions
              </h3>
              {analytics.sessions.length > 0 ? (
                <div className="space-y-4">
                  {analytics.sessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {session.book_title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            by {session.book_author}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>{formatDate(session.session_start)}</span>
                            <span>•</span>
                            <span>{session.pages_read} pages read</span>
                            <span>•</span>
                            <span>
                              {formatTime(session.reading_time_minutes)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {Math.round(session.avg_speed_wpm || 0)} WPM
                          </p>
                          <p className="text-sm text-gray-500">Reading Speed</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="ri-time-line text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">
                    No reading sessions found for this period.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Speed Trends Tab */}
          {activeTab === "speed" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Reading Speed Trends
              </h3>
              {analytics.speedTrends.length > 0 ? (
                <div className="space-y-4">
                  {analytics.speedTrends.map((trend, index) => (
                    <div key={index} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {formatDate(trend.date)}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {trend.sessions_count} sessions
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {Math.round(trend.avg_speed || 0)} WPM
                          </p>
                          <p className="text-sm text-gray-500">
                            {Math.round(trend.hours_read * 100) / 100}h read
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="ri-speed-line text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">
                    No speed data available for this period.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === "goals" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Reading Goals
              </h3>
              {analytics.goals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analytics.goals.map((goal, index) => (
                    <div key={index} className="bg-white border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">
                          {formatGoalType(goal.goal_type)}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            goal.progress_percentage >= 100
                              ? "bg-green-100 text-green-800"
                              : goal.progress_percentage >= 75
                                ? "bg-blue-100 text-blue-800"
                                : goal.progress_percentage >= 50
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {Math.round(goal.progress_percentage)}%
                        </span>
                      </div>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Progress</span>
                          <span className="text-gray-900">
                            {goal.current_value}/{goal.target_value}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-300 ${
                              goal.progress_percentage >= 100
                                ? "bg-green-500"
                                : goal.progress_percentage >= 75
                                  ? "bg-blue-500"
                                  : goal.progress_percentage >= 50
                                    ? "bg-yellow-500"
                                    : "bg-gray-500"
                            }`}
                            style={{
                              width: `${Math.min(goal.progress_percentage, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {goal.progress_percentage >= 100
                          ? "Goal completed! 🎉"
                          : `${goal.target_value - goal.current_value} more to go`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="ri-target-line text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">No reading goals set yet.</p>
                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Set Reading Goals
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h3>
              {analytics.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {analytics.recentActivity.map((activity, index) => (
                    <div key={index} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-2 rounded-full ${
                            activity.type === "session"
                              ? "bg-blue-100 text-blue-600"
                              : activity.type === "bookmark"
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-green-100 text-green-600"
                          }`}
                        >
                          <i
                            className={`${
                              activity.type === "session"
                                ? "ri-book-open-line"
                                : activity.type === "bookmark"
                                  ? "ri-bookmark-line"
                                  : "ri-sticky-note-line"
                            }`}
                          ></i>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {activity.book_title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {activity.value} {activity.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {formatDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="ri-activity-line text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">No recent activity found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
