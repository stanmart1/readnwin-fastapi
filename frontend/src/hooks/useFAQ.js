import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useFAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/faq');
      setFaqs(response.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  return { faqs, loading, error, refetch: fetchFAQs };
};
