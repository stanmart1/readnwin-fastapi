import { useState } from 'react';
import api from '../lib/api';

export const useReadingAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReadingAnalytics = async (period = 'month') => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/analytics/reading?period=${period}`);
      
      // Backend returns data directly, not wrapped in success/analytics
      const data = response.data;
      
      // Transform backend data to match frontend expectations
      const transformedData = {
        totalUsers: data.stats?.totalSessions || 0,
        totalBooksRead: data.stats?.booksStarted || 0,
        averageReadingTime: data.stats?.averageSessionTime || 0,
        averageReadingSpeed: data.stats?.totalPages || 0,
        monthlyReadingData: data.weeklyData || [],
        categoryDistribution: [],
        genreDistribution: [],
        topReaders: [],
        readingProgress: data.currentlyReading?.map(book => ({
          bookTitle: book.title,
          averageProgress: book.progress || 0,
          readersCount: 1
        })) || [],
        userGoals: [],
        goalCompletion: [],
        topGoalAchievers: []
      };
      
      setAnalyticsData(transformedData);
      return { success: true, data: transformedData };
    } catch (err) {
      console.error('Error fetching reading analytics:', err);
      setError('Error fetching reading analytics');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    analyticsData,
    loading,
    error,
    fetchReadingAnalytics
  };
};
