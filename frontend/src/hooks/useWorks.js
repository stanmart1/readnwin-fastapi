import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useWorks = () => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorks();
  }, []);

  const fetchWorks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/works');
      if (response.data.success) {
        setWorks(response.data.works || []);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching works:', err);
    } finally {
      setLoading(false);
    }
  };

  return { works, loading, error, refetch: fetchWorks };
};
