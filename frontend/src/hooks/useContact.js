import { useState } from 'react';
import api from '../lib/api';

export const useContact = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const sendMessage = async (formData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      await api.post('/api/contact', formData);
      setSuccess(true);
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send message. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSuccess(false);
    setError('');
  };

  return { sendMessage, loading, success, error, reset };
};
