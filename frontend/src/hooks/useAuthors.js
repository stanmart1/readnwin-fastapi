import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export const useAuthors = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });
  const [initialized, setInitialized] = useState(false);

  const fetchAuthors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status })
      };

      const response = await api.get('/admin/authors', { params });
      const result = response.data;

      // Handle both array and object responses
      let authorsData = [];
      if (Array.isArray(result)) {
        authorsData = result;
      } else if (result.authors && Array.isArray(result.authors)) {
        authorsData = result.authors;
      } else if (result.data && Array.isArray(result.data)) {
        authorsData = result.data;
      } else {
        authorsData = [];
      }
      setAuthors(authorsData);
      
      if (result.pagination) {
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total || 0,
          pages: result.pagination.pages || 0
        }));
      }
      return { success: true, data: result };
    } catch (err) {
      console.error('Failed to fetch authors:', err);
      setError(err.response?.data?.error || 'Failed to load authors');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters.search, filters.status]);

  const createAuthor = async (authorData) => {
    try {
      const response = await api.post('/admin/authors', authorData);
      await fetchAuthors();
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Failed to create author:', err);
      return { success: false, error: err.response?.data?.error || 'Failed to create author' };
    }
  };

  const updateAuthor = async (authorId, authorData) => {
    try {
      const response = await api.put(`/admin/authors/${authorId}`, authorData);
      await fetchAuthors();
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Failed to update author:', err);
      return { success: false, error: err.response?.data?.error || 'Failed to update author' };
    }
  };

  const deleteAuthor = async (authorId) => {
    try {
      await api.delete(`/admin/authors/${authorId}`);
      await fetchAuthors();
      return { success: true };
    } catch (err) {
      console.error('Failed to delete author:', err);
      return { success: false, error: err.response?.data?.error || 'Failed to delete author' };
    }
  };

  const toggleAuthorStatus = async (authorId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    return await updateAuthor(authorId, { status: newStatus });
  };

  useEffect(() => {
    if (!initialized) {
      fetchAuthors();
      setInitialized(true);
    }
  }, []);

  return {
    authors,
    loading,
    error,
    pagination,
    filters,
    setPagination,
    setFilters,
    fetchAuthors,
    createAuthor,
    updateAuthor,
    deleteAuthor,
    toggleAuthorStatus
  };
};
