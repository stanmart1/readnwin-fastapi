import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export const useImageCache = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get('/admin/cache');
      setStats(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load cache stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(async () => {
    if (!confirm('Are you sure you want to clear the image cache? This will temporarily slow down image loading.')) {
      return { success: false };
    }

    setClearing(true);
    try {
      const response = await api.delete('/admin/cache');
      await loadStats();
      return { success: true, message: response.data.message };
    } catch (err) {
      setError(err.message);
      console.error('Failed to clear cache:', err);
      return { success: false, error: err.message };
    } finally {
      setClearing(false);
    }
  }, [loadStats]);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  return {
    stats,
    loading,
    clearing,
    error,
    loadStats,
    clearCache
  };
};
