import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useDashboard = () => {
  const [stats, setStats] = useState(null);
  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard stats
      const statsResponse = await api.get('/dashboard/stats');
      setStats(statsResponse.data.stats);

      // Fetch currently reading books
      const readingResponse = await api.get('/dashboard/reading-progress');
      setCurrentlyReading(readingResponse.data.reading_progress || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return { stats, currentlyReading, loading, error, refetch: fetchDashboard };
};
