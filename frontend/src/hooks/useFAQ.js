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
      
      if (response.data?.success && response.data?.data?.faqs) {
        setFaqs(response.data.data.faqs);
      } else {
        setFaqs([]);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching FAQs:', err);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  return { faqs, loading, error, refetch: fetchFAQs };
};
