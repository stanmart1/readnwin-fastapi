import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useAnalytics = (period = 'week') => {
  const [stats, setStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch analytics from dashboard
      const analyticsResponse = await api.get('/dashboard/analytics');
      const analyticsData = analyticsResponse.data.analytics;

      // Transform stats to match expected format
      const transformedStats = {
        total_time: Math.round((analyticsData.stats?.totalHours || 0) * 60), // Convert hours to minutes
        books_completed: analyticsData.stats?.totalBooks || 0,
        pages_read: (analyticsData.stats?.totalBooks || 0) * (analyticsData.stats?.avgPagesPerBook || 0),
        current_streak: analyticsData.stats?.readingDays || 0,
        longest_streak: analyticsData.stats?.readingDays || 0
      };

      setStats(transformedStats);

      // Transform monthlyData to match expected format
      const transformedData = (analyticsData.monthlyData || []).map(item => ({
        day: item.month,
        minutes: Math.round(item.hours * 60),
        pages: item.books * (analyticsData.stats?.avgPagesPerBook || 0)
      }));

      setWeeklyData(transformedData);

      // Fetch reading goals
      const goalsResponse = await api.get('/reading-goals');
      setGoals(goalsResponse.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData) => {
    try {
      await api.post('/reading-goals/', goalData);
      await fetchAnalytics();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Failed to create goal' };
    }
  };

  return { stats, weeklyData, goals, loading, error, refetch: fetchAnalytics, createGoal };
};
