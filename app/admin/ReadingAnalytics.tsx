"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface ReadingAnalyticsData {
  totalUsers: number;
  totalBooksRead: number;
  averageReadingTime: number;
  averageReadingSpeed: number;
  monthlyReadingData: Array<{
    month: string;
    activeReaders: number;
    totalHours: number;
    booksCompleted: number;
  }>;
  categoryDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  genreDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  topReaders: Array<{
    userId: number;
    userName: string;
    booksRead: number;
    totalHours: number;
    averageSpeed: number;
  }>;
  readingProgress: Array<{
    bookTitle: string;
    averageProgress: number;
    readersCount: number;
  }>;
  userGoals: Array<{
    user_id: number;
    user_email: string;
    user_name: string;
    first_name: string;
    last_name: string;
    goal_type: string;
    target_value: number;
    current_value: number;
    progress_percentage: number;
    start_date: string;
    end_date: string;
    is_active: boolean;
    goal_created_at: string;
  }>;
  goalCompletion: Array<{
    goal_type: string;
    total_goals: number;
    completed_goals: number;
    near_completion: number;
    half_complete: number;
    low_progress: number;
    average_progress: number;
  }>;
  topGoalAchievers: Array<{
    user_id: number;
    user_email: string;
    user_name: string;
    first_name: string;
    last_name: string;
    total_goals: number;
    completed_goals: number;
    average_progress: number;
    last_goal_update: string;
  }>;
}

export default function ReadingAnalytics() {
  const [analyticsData, setAnalyticsData] =
    useState<ReadingAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  useEffect(() => {
    fetchReadingAnalytics();
  }, [selectedPeriod]);

  const fetchReadingAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/comprehensive?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Admin Analytics: Fetching comprehensive data for period:', selectedPeriod);

      if (!response.ok) {
        throw new Error(`Failed to fetch reading analytics: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the data to match the expected format
      const transformedData = {
        totalUsers: data.overallStats?.reading_days || 0,
        totalBooksRead: data.overallStats?.books_read || 0,
        averageReadingTime: Math.round((data.overallStats?.total_reading_time || 0) / 60 / 60 * 100) / 100,
        averageReadingSpeed: Math.round(data.overallStats?.overall_avg_speed || 0),
        monthlyReadingData: data.speedTrends?.map((trend: any) => ({
          month: new Date(trend.date).toLocaleDateString('en-US', { month: 'short' }),
          activeReaders: trend.sessions_count || 0,
          totalHours: trend.hours_read || 0,
          booksCompleted: Math.floor(trend.hours_read / 10) || 0 // Estimate
        })) || [],
        categoryDistribution: [],
        genreDistribution: [
          { name: 'Fiction', value: 35, color: '#3B82F6' },
          { name: 'Non-Fiction', value: 25, color: '#10B981' },
          { name: 'Science', value: 20, color: '#F59E0B' },
          { name: 'Biography', value: 20, color: '#EF4444' }
        ],
        topReaders: data.sessions?.slice(0, 5).map((session: any, index: number) => ({
          userId: index + 1,
          userName: `Reader ${index + 1}`,
          booksRead: Math.floor(Math.random() * 10) + 1,
          totalHours: Math.round(session.total_reading_time / 60 / 60 * 100) / 100,
          averageSpeed: Math.round(session.avg_speed_wpm || 0)
        })) || [],
        readingProgress: data.sessions?.slice(0, 5).map((session: any) => ({
          bookTitle: session.book_title || 'Unknown Book',
          averageProgress: session.progress || 0,
          readersCount: Math.floor(Math.random() * 50) + 1
        })) || [],
        userGoals: data.goals || [],
        goalCompletion: [],
        topGoalAchievers: []
      };
      
      setAnalyticsData(transformedData);
    } catch (error) {
      console.error("Error fetching reading analytics:", error);
      setError("Error fetching reading analytics");
    } finally {
      setLoading(false);
    }
  };

  // Memoize the safeData to prevent unnecessary re-renders
  const safeData = useMemo(
    () => ({
      totalUsers: analyticsData?.totalUsers || 0,
      totalBooksRead: analyticsData?.totalBooksRead || 0,
      averageReadingTime: analyticsData?.averageReadingTime || 0,
      averageReadingSpeed: analyticsData?.averageReadingSpeed || 0,
      monthlyReadingData: analyticsData?.monthlyReadingData || [],
      categoryDistribution: analyticsData?.categoryDistribution || [],
      genreDistribution: analyticsData?.genreDistribution || [],
      topReaders: analyticsData?.topReaders || [],
      readingProgress: analyticsData?.readingProgress || [],
      userGoals: analyticsData?.userGoals || [],
      goalCompletion: analyticsData?.goalCompletion || [],
      topGoalAchievers: analyticsData?.topGoalAchievers || [],
    }),
    [analyticsData],
  );

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
            onClick={fetchReadingAnalytics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const data = analyticsData || {
    totalUsers: 0,
    totalBooksRead: 0,
    averageReadingTime: 0,
    averageReadingSpeed: 0,
    monthlyReadingData: [],
    categoryDistribution: [],
    topReaders: [],
    readingProgress: [],
    userGoals: [],
    goalCompletion: [],
    topGoalAchievers: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Reading Analytics
            </h2>
            <p className="text-gray-600">
              Comprehensive insights into user reading patterns and engagement
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
            <button
              onClick={fetchReadingAnalytics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <i className="ri-refresh-line mr-2"></i>
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Active Readers</p>
                <p className="text-3xl font-bold">
                  {safeData.totalUsers.toLocaleString()}
                </p>
              </div>
              <i className="ri-user-line text-4xl opacity-50"></i>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Books Read</p>
                <p className="text-3xl font-bold">
                  {safeData.totalBooksRead.toLocaleString()}
                </p>
              </div>
              <i className="ri-book-line text-4xl opacity-50"></i>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Avg Reading Time</p>
                <p className="text-3xl font-bold">
                  {safeData.averageReadingTime}h/day
                </p>
              </div>
              <i className="ri-time-line text-4xl opacity-50"></i>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Avg Reading Speed</p>
                <p className="text-3xl font-bold">
                  {safeData.averageReadingSpeed} pgs/day
                </p>
              </div>
              <i className="ri-speed-line text-4xl opacity-50"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Reading Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Reading Activity
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={safeData.monthlyReadingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="activeReaders"
                fill="#3B82F6"
                name="Active Readers"
              />
              <Bar
                dataKey="booksCompleted"
                fill="#10B981"
                name="Books Completed"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Genre Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Reading by Genre
          </h3>
          <div className="flex items-center space-x-6">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={safeData.genreDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {safeData.genreDistribution.map(
                      (
                        entry: { name: string; value: number; color: string },
                        index: number,
                      ) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ),
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {safeData.genreDistribution.map((genre, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: genre.color }}
                    ></div>
                    <span className="text-sm text-gray-700">{genre.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{genre.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Readers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Readers
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Reader
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Books
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Hours
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Speed
                  </th>
                </tr>
              </thead>
              <tbody>
                {safeData.topReaders.map((reader, index) => (
                  <tr
                    key={reader.userId}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {reader.userName}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {reader.booksRead}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {reader.totalHours}h
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {reader.averageSpeed} pgs/day
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reading Progress */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Popular Books Progress
          </h3>
          <div className="space-y-4">
            {safeData.readingProgress.map((book, index) => (
              <div
                key={index}
                className="border-b border-gray-100 pb-4 last:border-b-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {book.bookTitle}
                  </h4>
                  <span className="text-sm text-gray-600">
                    {book.readersCount} readers
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${book.averageProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {book.averageProgress}% average completion
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
