import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useAbout = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/about/');
      setContent(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching about content:', err);
    } finally {
      setLoading(false);
    }
  };

  return { content, loading, error, refetch: fetchAbout };
};
