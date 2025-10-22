import { useState } from 'react';
import api from '../lib/api';

export const useAdminAnalytics = () => {
  const [stats, setStats] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/admin/admin/enhanced/analytics/overview');
      const data = response.data;

      setStats([
        {
          label: 'Total Users',
          value: data.overview.total_users || 0,
          change: `${data.overview.user_growth >= 0 ? '+' : ''}${data.overview.user_growth}%`,
          icon: 'ri-user-line',
          color: 'bg-blue-500'
        },
        {
          label: 'Total Books',
          value: data.overview.total_books || 0,
          change: `${data.overview.book_growth >= 0 ? '+' : ''}${data.overview.book_growth}%`,
          icon: 'ri-book-line',
          color: 'bg-green-500'
        },
        {
          label: 'Total Orders',
          value: data.overview.total_orders || 0,
          change: `${data.overview.order_growth >= 0 ? '+' : ''}${data.overview.order_growth}%`,
          icon: 'ri-shopping-cart-line',
          color: 'bg-purple-500'
        },
        {
          label: 'Revenue',
          value: `₦${(data.overview.total_revenue || 0).toLocaleString()}`,
          change: `${data.overview.revenue_growth >= 0 ? '+' : ''}${data.overview.revenue_growth}%`,
          icon: 'ri-money-dollar-circle-line',
          color: 'bg-yellow-500'
        }
      ]);

      // Transform user growth for chart
      const trends = (data.user_growth || []).map(item => ({
        date: item.month,
        sales: 0,
        orders: item.users
      }));
      setTrendData(trends);

      setDailyActivity(data.daily_activity || []);
      setRecentActivities(data.recent_activities || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    trendData,
    dailyActivity,
    recentActivities,
    loading,
    error,
    fetchAnalytics
  };
};
