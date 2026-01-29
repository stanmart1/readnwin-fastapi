import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useBooks = (params = {}) => {
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 0, limit: 12 });
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
      const data = response.data;
      setBooks(data.books || []);
      setPagination({
        total: data.total || 0,
        page: data.page || 1,
        pages: data.pages || 0,
        limit: data.limit || 12
      });
    } catch (err) {
      setError(err.message);
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  };

  return { books, pagination, loading, error, refetch: fetchBooks };
};
