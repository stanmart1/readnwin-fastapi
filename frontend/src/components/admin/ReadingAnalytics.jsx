import { useState, useEffect, useMemo, useRef } from 'react';
import { useReadingAnalytics } from '../../hooks/useReadingAnalytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const ReadingAnalytics = () => {
  const { analyticsData, loading, error, fetchReadingAnalytics } = useReadingAnalytics();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchReadingAnalytics(selectedPeriod);
      hasFetched.current = true;
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) {
      fetchReadingAnalytics(selectedPeriod);
    }
  }, [selectedPeriod]);

  const handleRefresh = () => {
    fetchReadingAnalytics(selectedPeriod);
  };

  const safeData = useMemo(() => ({
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
    topGoalAchievers: analyticsData?.topGoalAchievers || []
  }), [analyticsData]);

  if (loading && !analyticsData) {
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
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Reading Analytics</h2>
            <p className="text-xs sm:text-base text-gray-600 mt-1">Comprehensive insights into user reading patterns and engagement</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
            <button
              onClick={handleRefresh}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap w-full sm:w-auto"
            >
              <i className="ri-refresh-line"></i>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-blue-100 text-xs sm:text-sm">Total Active Readers</p>
                <p className="text-lg sm:text-2xl md:text-3xl font-bold truncate">{safeData.totalUsers.toLocaleString()}</p>
              </div>
              <i className="ri-user-line text-2xl sm:text-3xl md:text-4xl opacity-50 flex-shrink-0"></i>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-green-100 text-xs sm:text-sm">Books Read</p>
                <p className="text-lg sm:text-2xl md:text-3xl font-bold truncate">{safeData.totalBooksRead.toLocaleString()}</p>
              </div>
              <i className="ri-book-line text-2xl sm:text-3xl md:text-4xl opacity-50 flex-shrink-0"></i>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-purple-100 text-xs sm:text-sm">Avg Reading Time</p>
                <p className="text-lg sm:text-2xl md:text-3xl font-bold truncate">{safeData.averageReadingTime}h/day</p>
              </div>
              <i className="ri-time-line text-2xl sm:text-3xl md:text-4xl opacity-50 flex-shrink-0"></i>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-orange-100 text-xs sm:text-sm">Avg Reading Speed</p>
                <p className="text-lg sm:text-2xl md:text-3xl font-bold truncate">{safeData.averageReadingSpeed} pgs/day</p>
              </div>
              <i className="ri-speed-line text-2xl sm:text-3xl md:text-4xl opacity-50 flex-shrink-0"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly Reading Activity */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Monthly Reading Activity</h3>
          {safeData.monthlyReadingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={safeData.monthlyReadingData} margin={{ left: -20, right: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="activeReaders" fill="#3B82F6" name="Active Readers" />
                <Bar dataKey="booksCompleted" fill="#10B981" name="Books Completed" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 sm:h-64 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Genre Distribution */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Reading by Genre</h3>
          {safeData.genreDistribution.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={safeData.genreDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {safeData.genreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 w-full">
                {safeData.genreDistribution.map((genre, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: genre.color }}
                      ></div>
                      <span className="text-xs sm:text-sm text-gray-700 truncate">{genre.name}</span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0 ml-2">{genre.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 sm:h-64 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Readers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Readers</h3>
          {safeData.topReaders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Reader</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Books</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Hours</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Speed</th>
                  </tr>
                </thead>
                <tbody>
                  {safeData.topReaders.map((reader) => (
                    <tr key={reader.userId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{reader.userName}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{reader.booksRead}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{reader.totalHours}h</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{reader.averageSpeed} pgs/day</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Reading Progress */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Books Progress</h3>
          {safeData.readingProgress.length > 0 ? (
            <div className="space-y-4">
              {safeData.readingProgress.map((book, index) => (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{book.bookTitle}</span>
                    <span className="text-sm text-gray-600">{book.readersCount} readers</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${book.averageProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{book.averageProgress}% average progress</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Goal Completion Section */}
      {safeData.goalCompletion.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Goals Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {safeData.goalCompletion.map((goal, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{goal.goal_type}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Goals:</span>
                    <span className="font-medium">{goal.total_goals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium text-green-600">{goal.completed_goals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Progress:</span>
                    <span className="font-medium">{goal.average_progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Goal Achievers */}
      {safeData.topGoalAchievers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Goal Achievers</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total Goals</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Completed</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Avg Progress</th>
                </tr>
              </thead>
              <tbody>
                {safeData.topGoalAchievers.map((achiever) => (
                  <tr key={achiever.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {achiever.first_name} {achiever.last_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{achiever.total_goals}</td>
                    <td className="py-3 px-4 text-sm text-green-600">{achiever.completed_goals}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{achiever.average_progress}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingAnalytics;
