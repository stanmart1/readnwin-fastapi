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
        total_time: Math.round((analyticsData.stats?.totalHours || 0) * 60),
        books_completed: analyticsData.stats?.totalBooks || 0,
        pages_read: Math.round((analyticsData.stats?.totalBooks || 0) * (analyticsData.stats?.avgPagesPerBook || 0)),
        current_streak: analyticsData.stats?.readingDays || 0,
        longest_streak: analyticsData.stats?.readingDays || 0
      };

      setStats(transformedStats);

      // Transform monthlyData to weeklyData format
      const transformedData = (analyticsData.monthlyData || []).map(item => ({
        day: item.month,
        minutes: Math.round(item.hours * 60),
        pages: Math.round(item.books * (analyticsData.stats?.avgPagesPerBook || 0))
      }));

      setWeeklyData(transformedData);

      // Fetch reading goals
      const goalsResponse = await api.get('/reading-goals/');
      const goalsData = goalsResponse.data || [];
      
      // Transform goals to match UI expectations
      const transformedGoals = goalsData.map(goal => {
        let unit = 'items';
        if (goal.goal_type === 'books') unit = 'books';
        else if (goal.goal_type === 'pages') unit = 'pages';
        else if (goal.goal_type === 'minutes') unit = 'minutes';
        else if (goal.goal_type === 'streak') unit = 'days';
        
        return {
          id: goal.id,
          goal: goal.goal_type,
          title: `${goal.goal_type.charAt(0).toUpperCase() + goal.goal_type.slice(1)} Goal`,
          current: goal.current_value,
          target: goal.target_value,
          target_value: goal.target_value,
          unit: unit,
          start_date: goal.start_date,
          end_date: goal.end_date,
          status: goal.status,
          completed: goal.completed
        };
      });
      
      setGoals(transformedGoals);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData) => {
    try {
      const response = await api.post('/reading-goals/', goalData);
      await fetchAnalytics();
      
      // Check if goal is completed on creation
      if (response.data?.progress_percentage >= 100) {
        return { success: true, completed: true };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Failed to create goal' };
    }
  };

  return { stats, weeklyData, goals, loading, error, refetch: fetchAnalytics, createGoal };
};
