'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface ReadingSession {
  id: number;
  user_id: number;
  book_id: number;
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

interface OverallStats {
  books_read: number;
  total_sessions: number;
  overall_avg_speed: number;
  total_reading_time: number;
  reading_days: number;
  avg_pages_per_session: number;
}

interface UserActivity {
  user_id: number;
  user_name: string;
  total_sessions: number;
  total_reading_time: number;
  avg_speed_wpm: number;
  books_read: number;
  last_activity: string;
}

interface AdminReadingAnalytics {
  sessions: ReadingSession[];
  speedTrends: SpeedTrend[];
  overallStats: OverallStats;
  topUsers: UserActivity[];
  recentActivity: any[];
}

export default function EnhancedReadingAnalytics() {
  const [analytics, setAnalytics] = useState<AdminReadingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminAnalytics();
  }, [selectedPeriod]);

  const fetchAdminAnalytics = async () => {
    try {
      setLoading(true);
      const response = await Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reading analytics');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        setError(data.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching admin reading analytics:', error);
      setError('Error fetching reading analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          <i className="ri-error-warning-line text-4xl mb-4"></i>
          <p>{error}</p>
          <button 
            onClick={fetchAdminAnalytics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <i className="ri-bar-chart-line text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reading Data Available</h3>
          <p className="text-gray-600">Reading analytics will appear here once users start reading books.</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const speedTrendsData = analytics.speedTrends.map(trend => ({
    date: formatDate(trend.date),
    speed: Math.round(trend.avg_speed || 0),
    sessions: trend.sessions_count,
    hours: Math.round(trend.hours_read * 100) / 100
  }));

  const topUsersData = analytics.topUsers?.slice(0, 10).map(user => ({
    name: user.user_name,
    sessions: user.total_sessions,
    time: Math.round(user.total_reading_time / 60),
    speed: Math.round(user.avg_speed_wpm || 0),
    books: user.books_read
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reading Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive reading analytics across all users</p>
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

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="ri-book-open-line text-blue-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Books Read</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overallStats.books_read}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="ri-time-line text-green-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reading Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(analytics.overallStats.total_reading_time)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <i className="ri-speed-line text-purple-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Reading Speed</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(analytics.overallStats.overall_avg_speed || 0)} WPM
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <i className="ri-calendar-line text-orange-600 text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overallStats.total_sessions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reading Speed Trends */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Speed Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={speedTrendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="speed" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Readers */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Readers</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topUsersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sessions" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reading Sessions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pages Read
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Speed (WPM)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.sessions.slice(0, 10).map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    User #{session.user_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{session.book_title}</div>
                      <div className="text-sm text-gray-500">by {session.book_author}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(session.session_start)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.pages_read}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(session.avg_speed_wpm || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(session.reading_time_minutes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Average Pages per Session</span>
              <span className="font-medium">{Math.round(analytics.overallStats.avg_pages_per_session || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Reading Days</span>
              <span className="font-medium">{analytics.overallStats.reading_days}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Session Time</span>
              <span className="font-medium">
                {formatTime(analytics.overallStats.total_reading_time / Math.max(analytics.overallStats.total_sessions, 1))}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {analytics.recentActivity?.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'session' ? 'bg-blue-500' :
                  activity.type === 'bookmark' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{activity.book_title}</p>
                  <p className="text-xs text-gray-500">{activity.value} {activity.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 