import { useState } from 'react';
import api from '../lib/api';

export const useReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    featured: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReviews = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/reviews', { params });
      setReviews(response.data.reviews || []);
      return { 
        success: true, 
        data: response.data,
        pages: response.data.pages || 1
      };
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/reviews/stats');
      setStats(response.data.stats || response.data);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error fetching stats:', err);
      return { success: false, error: err.message };
    }
  };

  const updateReviewStatus = async (reviewId, status) => {
    try {
      await api.patch('/admin/reviews', { reviewId, status });
      return { success: true };
    } catch (err) {
      console.error('Error updating review:', err);
      return { success: false, error: err.message };
    }
  };

  const toggleFeatured = async (reviewId, isFeatured) => {
    try {
      await api.patch('/admin/reviews/feature', { reviewId, isFeatured });
      return { success: true };
    } catch (err) {
      console.error('Error toggling featured:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      return { success: true };
    } catch (err) {
      console.error('Error deleting review:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    reviews,
    stats,
    loading,
    error,
    fetchReviews,
    fetchStats,
    updateReviewStatus,
    toggleFeatured,
    deleteReview
  };
};
