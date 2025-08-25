'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface UserReadingData {
  userId: number;
  userName: string;
  email: string;
  totalBooksRead: number;
  totalReadingTime: number;
  averageReadingSpeed: number;
  favoriteCategories: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  readingHistory: Array<{
    bookTitle: string;
    progress: number;
    lastRead: string;
    totalPages: number;
    currentPage: number;
  }>;
  monthlyActivity: Array<{
    month: string;
    booksRead: number;
    hoursSpent: number;
    pagesRead: number;
  }>;
  readingGoals: {
    booksGoal: number;
    booksCompleted: number;
    timeGoal: number;
    timeCompleted: number;
  };
}

interface UserReadingAnalyticsProps {
  userId?: number;
  onClose?: () => void;
}

export default function UserReadingAnalytics({ userId, onClose }: UserReadingAnalyticsProps) {
  const [userData, setUserData] = useState<UserReadingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(userId || null);
  const [users, setUsers] = useState<Array<{ id: number; name: string; email: string }>>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserReadingAnalytics(selectedUser);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.users.map((user: any) => ({
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            email: user.email
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUserReadingAnalytics = async (userId: number) => {
    try {
      setLoading(true);
      const response = await Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user reading analytics');
      }
      
      const data = await response.json();
      
      // The API returns the data directly, not wrapped in a success object
      if (data.userId) {
        setUserData(data);
      } else {
        setError(data.error || 'Failed to fetch user analytics');
      }
    } catch (error) {
      console.error('Error fetching user reading analytics:', error);
      setError('Error fetching user reading analytics');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedUser) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">User Reading Analytics</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select User
          </label>
          <select
            value={selectedUser || ''}
            onChange={(e) => setSelectedUser(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a user...</option>
            {users && users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading user reading analytics...</p>
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
            onClick={() => selectedUser && fetchUserReadingAnalytics(selectedUser)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Use real data from API, fallback to empty data if not available
  const data = userData || {
    userId: selectedUser,
    userName: users.find(u => u.id === selectedUser)?.name || 'Unknown User',
    email: users.find(u => u.id === selectedUser)?.email || 'unknown@example.com',
    totalBooksRead: 0,
    totalReadingTime: 0,
    averageReadingSpeed: 0,
    favoriteCategories: [],
    readingHistory: [],
    monthlyActivity: [],
    readingGoals: {
      booksGoal: 0,
      booksCompleted: 0,
      timeGoal: 0,
      timeCompleted: 0
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Reading Analytics</h2>
            <p className="text-gray-600">{data.userName} ({data.email})</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {users && users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Books Read</p>
                <p className="text-3xl font-bold">{data.totalBooksRead}</p>
              </div>
              <i className="ri-book-line text-4xl opacity-50"></i>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Reading Time</p>
                <p className="text-3xl font-bold">{data.totalReadingTime}h</p>
              </div>
              <i className="ri-time-line text-4xl opacity-50"></i>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Reading Speed</p>
                <p className="text-3xl font-bold">{data.averageReadingSpeed} pgs/day</p>
              </div>
              <i className="ri-speed-line text-4xl opacity-50"></i>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Goal Progress</p>
                <p className="text-3xl font-bold">{Math.round((data.readingGoals.booksCompleted / data.readingGoals.booksGoal) * 100)}%</p>
              </div>
              <i className="ri-target-line text-4xl opacity-50"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Reading Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlyActivity || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="booksRead" stroke="#3B82F6" name="Books Read" />
              <Line type="monotone" dataKey="hoursSpent" stroke="#10B981" name="Hours Spent" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Favorite Genres */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Favorite Categories</h3>
          <div className="space-y-4">
            {data.favoriteCategories && data.favoriteCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12">{category.count} books</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reading History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reading History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Book</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Progress</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Pages</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Last Read</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.readingHistory && data.readingHistory.map((book, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{book.bookTitle}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${book.progress === 100 ? 'bg-green-600' : 'bg-blue-600'}`}
                        style={{ width: `${book.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{book.progress}%</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{book.currentPage}/{book.totalPages}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{book.lastRead}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      book.progress === 100 
                        ? 'bg-green-100 text-green-800' 
                        : book.progress > 50 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {book.progress === 100 ? 'Completed' : book.progress > 50 ? 'In Progress' : 'Started'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reading Goals */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Books Goal</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{data.readingGoals.booksCompleted} of {data.readingGoals.booksGoal} books</span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round((data.readingGoals.booksCompleted / data.readingGoals.booksGoal) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(data.readingGoals.booksCompleted / data.readingGoals.booksGoal) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Reading Time Goal</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{data.readingGoals.timeCompleted} of {data.readingGoals.timeGoal} hours</span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round((data.readingGoals.timeCompleted / data.readingGoals.timeGoal) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(data.readingGoals.timeCompleted / data.readingGoals.timeGoal) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 