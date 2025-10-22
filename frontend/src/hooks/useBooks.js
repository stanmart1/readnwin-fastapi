import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useBooks = (params = {}) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, [JSON.stringify(params)]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/books/', { params });
      setBooks(response.data.books || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  };

  return { books, loading, error, refetch: fetchBooks };
};
