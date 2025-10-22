import { useState } from 'react';
import api from '../lib/api';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/categories');
      setCategories(response.data.categories || response.data || []);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    loading,
    error,
    fetchCategories
  };
};
