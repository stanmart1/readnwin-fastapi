import { useState } from 'react';
import api from '../lib/api';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError('');
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return true;
      }
      return false;
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setLoading(true);
      setError('');
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        return true;
      }
      return false;
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError('');
      await api.post('/auth/forgot-password', { email });
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset email.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  };

  return {
    login,
    signup,
    forgotPassword,
    logout,
    isAuthenticated,
    getUser,
    loading,
    error
  };
};
