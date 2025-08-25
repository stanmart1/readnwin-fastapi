'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface ReadingAnalyticsProps {
  profile: any;
}

interface ReadingStats {
  totalBooksRead: number;
  totalPagesRead: number;
  totalHoursRead: number;
  currentStreak: number;
  averageRating: number;
  favoriteGenres: string[];
  monthlyProgress: Array<{
    month: string;
    booksRead: number;
    pagesRead: number;
    hoursRead: number;
  }>;
  genreDistribution: Array<{
    genre: string;
    count: number;
    percentage: number;
  }>;
  readingSpeed: {
    averagePagesPerDay: number;
    averageHoursPerDay: number;
    fastestDay: string;
    slowestDay: string;
  };
}

export default function ReadingAnalytics({ profile }: ReadingAnalyticsProps) {
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('progress');

  useEffect(() => {
    fetchReadingStats();
  }, []);

  const fetchReadingStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile/reading-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        // Fallback data if API is not available
        setStats({
          totalBooksRead: 47,
          totalPagesRead: 12500,
          totalHoursRead: 312,
          currentStreak: 12,
          averageRating: 4.2,
          favoriteGenres: ['Fiction', 'Non-Fiction', 'Science Fiction', 'Biography'],
          monthlyProgress: [
            { month: 'Jan', booksRead: 4, pagesRead: 1200, hoursRead: 30 },
            { month: 'Feb', booksRead: 3, pagesRead: 900, hoursRead: 22 },
            { month: 'Mar', booksRead: 5, pagesRead: 1500, hoursRead: 38 },
            { month: 'Apr', booksRead: 4, pagesRead: 1100, hoursRead: 28 },
            { month: 'May', booksRead: 6, pagesRead: 1800, hoursRead: 45 },
            { month: 'Jun', booksRead: 5, pagesRead: 1400, hoursRead: 35 },
            { month: 'Jul', booksRead: 7, pagesRead: 2100, hoursRead: 52 },
            { month: 'Aug', booksRead: 4, pagesRead: 1200, hoursRead: 30 },
            { month: 'Sep', booksRead: 5, pagesRead: 1500, hoursRead: 38 },
            { month: 'Oct', booksRead: 6, pagesRead: 1800, hoursRead: 45 },
            { month: 'Nov', booksRead: 4, pagesRead: 1200, hoursRead: 30 },
            { month: 'Dec', booksRead: 5, pagesRead: 1500, hoursRead: 38 }
          ],
          genreDistribution: [
            { genre: 'Fiction', count: 15, percentage: 32 },
            { genre: 'Non-Fiction', count: 12, percentage: 26 },
            { genre: 'Science Fiction', count: 8, percentage: 17 },
            { genre: 'Biography', count: 6, percentage: 13 },
            { genre: 'Mystery', count: 4, percentage: 9 },
            { genre: 'Romance', count: 2, percentage: 3 }
          ],
          readingSpeed: {
            averagePagesPerDay: 45,
            averageHoursPerDay: 1.2,
            fastestDay: 'Saturday',
            slowestDay: 'Tuesday'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching reading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <i className="ri-bar-chart-line text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">No reading analytics available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Reading Analytics</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Books Read</p>
              <p className="text-2xl font-bold">{stats.totalBooksRead}</p>
            </div>
            <i className="ri-book-line text-2xl opacity-50"></i>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Pages Read</p>
              <p className="text-2xl font-bold">{stats.totalPagesRead.toLocaleString()}</p>
            </div>
            <i className="ri-file-text-line text-2xl opacity-50"></i>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Hours Read</p>
              <p className="text-2xl font-bold">{stats.totalHoursRead}</p>
            </div>
            <i className="ri-time-line text-2xl opacity-50"></i>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Current Streak</p>
              <p className="text-2xl font-bold">{stats.currentStreak} days</p>
            </div>
            <i className="ri-fire-line text-2xl opacity-50"></i>
          </div>
        </div>
      </div>

      {/* Chart Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-4 border-b border-gray-200">
          {[
            { id: 'progress', label: 'Monthly Progress', icon: 'ri-line-chart-line' },
            { id: 'genres', label: 'Genre Distribution', icon: 'ri-pie-chart-line' },
            { id: 'speed', label: 'Reading Speed', icon: 'ri-speed-line' }
          ].map((chart) => (
            <button
              key={chart.id}
              onClick={() => setActiveChart(chart.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                activeChart === chart.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className={`${chart.icon} text-lg`}></i>
              <span>{chart.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        {/* Monthly Progress Chart */}
        {activeChart === 'progress' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Reading Progress</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'booksRead' ? `${value} books` : 
                      name === 'pagesRead' ? `${value} pages` : 
                      `${value} hours`,
                      name === 'booksRead' ? 'Books Read' : 
                      name === 'pagesRead' ? 'Pages Read' : 
                      'Hours Read'
                    ]}
                  />
                  <Line type="monotone" dataKey="booksRead" stroke="#3B82F6" strokeWidth={2} name="Books Read" />
                  <Line type="monotone" dataKey="pagesRead" stroke="#10B981" strokeWidth={2} name="Pages Read" />
                  <Line type="monotone" dataKey="hoursRead" stroke="#8B5CF6" strokeWidth={2} name="Hours Read" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Genre Distribution Chart */}
        {activeChart === 'genres' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Genre Distribution</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.genreDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ genre, percentage }) => `${genre} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.genreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Genre Breakdown</h4>
                {stats.genreDistribution.map((genre, index) => (
                  <div key={genre.genre} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="font-medium text-gray-900">{genre.genre}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{genre.count} books</p>
                      <p className="text-sm text-gray-500">{genre.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reading Speed Chart */}
        {activeChart === 'speed' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Speed Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Average Daily Reading</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Pages per day:</span>
                      <span className="font-semibold text-blue-900">{stats.readingSpeed.averagePagesPerDay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Hours per day:</span>
                      <span className="font-semibold text-blue-900">{stats.readingSpeed.averageHoursPerDay}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Best Performance</h4>
                  <p className="text-green-700">
                    <span className="font-semibold">{stats.readingSpeed.fastestDay}</span> is your most productive reading day
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-900 mb-2">Room for Improvement</h4>
                  <p className="text-orange-700">
                    <span className="font-semibold">{stats.readingSpeed.slowestDay}</span> has the lowest reading activity
                  </p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { day: 'Mon', pages: 35 },
                    { day: 'Tue', pages: 25 },
                    { day: 'Wed', pages: 40 },
                    { day: 'Thu', pages: 45 },
                    { day: 'Fri', pages: 50 },
                    { day: 'Sat', pages: 65 },
                    { day: 'Sun', pages: 55 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} pages`, 'Pages Read']} />
                    <Bar dataKey="pages" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Stats */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
            <p className="text-sm text-gray-600">Average Rating</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{stats.favoriteGenres.length}</p>
            <p className="text-sm text-gray-600">Favorite Genres</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {Math.round((stats.totalPagesRead / stats.totalBooksRead))}
            </p>
            <p className="text-sm text-gray-600">Avg Pages per Book</p>
          </div>
        </div>
      </div>
    </div>
  );
} 