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
      
      // Fetch reading stats
      const statsResponse = await api.get(`/analytics/stats?period=${period}`);
      setStats(statsResponse.data);

      // Fetch weekly reading data
      const weeklyResponse = await api.get('/analytics/weekly');
      setWeeklyData(weeklyResponse.data.data || []);

      // Fetch reading goals
      const goalsResponse = await api.get('/reading-goals');
      setGoals(goalsResponse.data.goals || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return { stats, weeklyData, goals, loading, error, refetch: fetchAnalytics };
};
