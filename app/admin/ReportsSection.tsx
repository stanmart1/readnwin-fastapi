'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatNumber } from '@/lib/dateUtils';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError, redirectToLogin } from '@/lib/error-utils';

export default function ReportsSection() {
  const { user } = useAuth();
  const [engagementData, setEngagementData] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [reviewAnalytics, setReviewAnalytics] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all reports data from single endpoint
      const reportsDataResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/data`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Fetch reviews analytics
      const reviewsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reviews/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!reportsDataResponse.ok) {
        const apiError = handleApiError(null, reportsDataResponse);
        if (apiError.isAuthError) {
          redirectToLogin();
          return;
        }
        throw new Error(apiError.message);
      }

      if (!reviewsResponse.ok) {
        const apiError = handleApiError(null, reviewsResponse);
        if (apiError.isAuthError) {
          redirectToLogin();
          return;
        }
        throw new Error(apiError.message);
      }

      const reportsData = await reportsDataResponse.json();
      const reviewsResult = await reviewsResponse.json();

      // Set engagement data from database
      setEngagementData(reportsData.engagement || []);

      // Set popular books from database
      setPopularBooks(reportsData.popularBooks || []);

      // Transform reviews data from database
      const total = reviewsResult.total_reviews || 1;
      const reviewData = [
        { 
          rating: 5, 
          count: reviewsResult.five_star || 0, 
          percentage: total > 0 ? Math.round((reviewsResult.five_star || 0) / total * 100) : 0 
        },
        { 
          rating: 4, 
          count: reviewsResult.four_star || 0, 
          percentage: total > 0 ? Math.round((reviewsResult.four_star || 0) / total * 100) : 0 
        },
        { 
          rating: 3, 
          count: reviewsResult.three_star || 0, 
          percentage: total > 0 ? Math.round((reviewsResult.three_star || 0) / total * 100) : 0 
        },
        { 
          rating: 2, 
          count: reviewsResult.two_star || 0, 
          percentage: total > 0 ? Math.round((reviewsResult.two_star || 0) / total * 100) : 0 
        },
        { 
          rating: 1, 
          count: reviewsResult.one_star || 0, 
          percentage: total > 0 ? Math.round((reviewsResult.one_star || 0) / total * 100) : 0 
        }
      ];
      setReviewAnalytics(reviewData);

      // Set reports data
      setReports([
        {
          title: 'Monthly Sales Report',
          description: 'Comprehensive sales analysis for the current month',
          lastGenerated: new Date().toISOString().split('T')[0],
          type: 'sales',
          status: 'ready'
        },
        {
          title: 'User Engagement Report',
          description: 'User activity and engagement metrics',
          lastGenerated: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          type: 'engagement',
          status: 'ready'
        },
        {
          title: 'Inventory Report',
          description: 'Current stock levels and inventory management',
          lastGenerated: new Date(Date.now() - 172800000).toISOString().split('T')[0],
          type: 'inventory',
          status: 'ready'
        },
        {
          title: 'Author Performance Report',
          description: 'Author sales and performance analytics',
          lastGenerated: new Date(Date.now() - 259200000).toISOString().split('T')[0],
          type: 'authors',
          status: 'ready'
        }
      ]);

    } catch (error) {
      console.error('Error fetching reports data:', error);
      const apiError = handleApiError(error);
      if (apiError.isAuthError) {
        redirectToLogin();
        return;
      }
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: reportType })
      });
      
      if (response.ok) {
        alert('Report generation started. You will be notified when it\'s ready.');
        fetchReportsData(); // Refresh data
      } else {
        const apiError = handleApiError(null, response);
        if (apiError.isAuthError) {
          redirectToLogin();
          return;
        }
        alert(apiError.message);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      const apiError = handleApiError(error);
      if (apiError.isAuthError) {
        redirectToLogin();
        return;
      }
      alert(apiError.message);
    }
  };

  const downloadReport = async (reportType: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/download/${reportType}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const apiError = handleApiError(null, response);
        if (apiError.isAuthError) {
          redirectToLogin();
          return;
        }
        alert(apiError.message);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      const apiError = handleApiError(error);
      if (apiError.isAuthError) {
        redirectToLogin();
        return;
      }
      alert(apiError.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-6">
        <p>{error}</p>
        <button 
          onClick={fetchReportsData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Report Generation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{report.title}</h4>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  report.status === 'ready' ? 'bg-green-100 text-green-800' :
                  report.status === 'generating' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {report.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{report.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Last generated: {report.lastGenerated}
                </span>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => generateReport(report.type)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer whitespace-nowrap"
                  >
                    Generate
                  </button>
                  <button 
                    onClick={() => downloadReport(report.type)}
                    className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 cursor-pointer whitespace-nowrap"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Engagement */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h3>
          <div className="h-64">
            {engagementData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="sessions" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No engagement data available
              </div>
            )}
          </div>
        </div>

        {/* Review Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Distribution</h3>
          <div className="space-y-3">
            {reviewAnalytics.length > 0 ? reviewAnalytics.map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600">{item.rating}</span>
                  <i className="ri-star-fill text-yellow-400 text-sm"></i>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-600">{item.count}</span>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-4">
                No review data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popular Books */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Books Tracking</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviews</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {popularBooks.length > 0 ? popularBooks.map((book, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{book.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(book.views)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center space-x-1">
                      <span>{book.rating.toFixed(1)}</span>
                      <i className="ri-star-fill text-yellow-400 text-sm"></i>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{book.reviews}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <i className="ri-arrow-up-line text-green-600"></i>
                      <span className="text-green-600">+{(index + 1) * 5}%</span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-sm text-gray-500 text-center">
                    No books data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
