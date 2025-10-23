import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export const useFAQManagement = () => {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const faqResponse = await api.get('/api/faq');
      const faqData = faqResponse.data;
      if (faqData.success) {
        setFaqs(faqData.data.faqs);
      }

      const categoryResponse = await api.get('/api/faq/categories');
      const categoryData = categoryResponse.data;
      if (categoryData.success) {
        setCategories(categoryData.data);
      }

      setStats({
        total_faqs: faqData.data?.total || 0,
        total_categories: categoryData.data?.length || 0,
        total_views: 0,
        recent_faqs: faqData.data?.faqs?.slice(0, 5) || []
      });
    } catch (err) {
      setError(err.message);
      console.error('Error fetching FAQ data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createFAQ = useCallback(async (data) => {
    try {
      await api.post('/api/faq', data);
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error creating FAQ:', err);
      return { success: false, error: err.message };
    }
  }, [fetchData]);

  const updateFAQ = useCallback(async (data) => {
    try {
      await api.put(`/api/faq/${data.id}`, data);
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error updating FAQ:', err);
      return { success: false, error: err.message };
    }
  }, [fetchData]);

  const deleteFAQ = useCallback(async (id) => {
    try {
      await api.delete(`/api/faq/${id}`);
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      return { success: false, error: err.message };
    }
  }, [fetchData]);

  const bulkDeleteFAQs = useCallback(async (ids) => {
    try {
      await api.post('/api/faq/bulk-delete', { ids });
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error bulk deleting FAQs:', err);
      return { success: false, error: err.message };
    }
  }, [fetchData]);

  const bulkUpdateFAQs = useCallback(async (ids, updates) => {
    try {
      await api.post('/api/faq/bulk-update', { ids, updates });
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error bulk updating FAQs:', err);
      return { success: false, error: err.message };
    }
  }, [fetchData]);

  const createCategory = useCallback(async (data) => {
    try {
      await api.post('/api/faq/categories', data);
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error creating category:', err);
      return { success: false, error: err.message };
    }
  }, [fetchData]);

  const updateCategory = useCallback(async (data) => {
    try {
      await api.put(`/api/faq/categories/${data.id}`, data);
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error('Error updating category:', err);
      return { success: false, error: err.message };
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    faqs,
    categories,
    stats,
    loading,
    error,
    refetch: fetchData,
    createFAQ,
    updateFAQ,
    deleteFAQ,
    bulkDeleteFAQs,
    bulkUpdateFAQs,
    createCategory,
    updateCategory
  };
};
