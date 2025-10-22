import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useTestimonials = (limit = 10, featuredOnly = true) => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTestimonials();
  }, [limit, featuredOnly]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/testimonials?featured_only=${featuredOnly}&limit=${limit}`);
      if (response.data.success) {
        setTestimonials(response.data.testimonials || []);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  return { testimonials, loading, error, refetch: fetchTestimonials };
};
