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
      
      setStats(analyticsData.stats);
      setWeeklyData(analyticsData.monthlyData || []);

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
