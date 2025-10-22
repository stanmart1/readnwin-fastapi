import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useActivity = (limit = 20) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/dashboard/activity?limit=${limit}`);
      setActivities(response.data.activities || []);
      setHasMore(response.data.has_more || false);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    try {
      const offset = activities.length;
      const response = await api.get(`/dashboard/activity?limit=${limit}&offset=${offset}`);
      setActivities([...activities, ...(response.data.activities || [])]);
      setHasMore(response.data.has_more || false);
    } catch (err) {
      console.error('Error loading more activities:', err);
    }
  };

  return { activities, loading, error, hasMore, loadMore, refetch: fetchActivities };
};
