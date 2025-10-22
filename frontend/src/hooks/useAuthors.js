import { useState } from 'react';
import api from '../lib/api';

export const useAuthors = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/authors');
      setAuthors(response.data.authors || response.data || []);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error fetching authors:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    authors,
    loading,
    error,
    fetchAuthors
  };
};
