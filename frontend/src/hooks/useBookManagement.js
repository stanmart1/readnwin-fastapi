import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export const useBookManagement = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category_id: undefined
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.category_id && { category_id: filters.category_id })
      };
      
      const response = await api.get('/admin/books', { params });
      const result = response.data;
      
      setBooks(result.books || []);
      if (result.pagination) {
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total || 0,
          pages: result.pagination.pages || 0
        }));
      }
      
      return { success: true, data: result };
    } catch (err) {
      console.error('Load books error:', err);
      setError(err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateBook = async (bookId, updates) => {
    try {
      await api.put(`/admin/books/${bookId}`, updates);
      await loadBooks();
      return { success: true };
    } catch (err) {
      console.error('Update error:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteBooks = async (bookIds) => {
    try {
      // Optimistically remove books from UI
      setBooks(prevBooks => prevBooks.filter(book => !bookIds.includes(book.id)));
      
      if (bookIds.length === 1) {
        await api.delete(`/admin/books/${bookIds[0]}`);
      } else {
        await api.post('/admin/books/bulk-delete', { book_ids: bookIds });
      }
      
      // Refresh the list
      await loadBooks();
      return { success: true };
    } catch (err) {
      console.error('Delete error:', err);
      // Revert optimistic update on error
      await loadBooks();
      return { success: false, error: err.message };
    }
  };

  const batchUpdateBooks = async (bookIds, updates) => {
    try {
      await api.put('/admin/books/batch', { ids: bookIds, updates });
      await loadBooks();
      return { success: true };
    } catch (err) {
      console.error('Batch update error:', err);
      return { success: false, error: err.message };
    }
  };

  // Only load on mount
  useEffect(() => {
    loadBooks();
  }, []);

  return {
    books,
    loading,
    error,
    filters,
    pagination,
    setFilters,
    setPagination,
    updateBook,
    deleteBooks,
    batchUpdateBooks,
    setError,
    loadBooks
  };
};
