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
        
        // Cache permissions for quick access
        if (response.data.user.permissions) {
          localStorage.setItem('permissions', JSON.stringify(response.data.user.permissions));
        }
        
        // Transfer guest cart after login
        await transferGuestCartAfterLogin();
        
        return response.data;
      }
      return null;
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const transferGuestCartAfterLogin = async () => {
    try {
      const guestCart = localStorage.getItem('readnwin_guest_cart');
      if (!guestCart) return;
      
      const guestItems = JSON.parse(guestCart);
      if (guestItems.length === 0) return;
      
      // Transfer cart items
      await api.post('/cart/transfer-guest', {
        cartItems: guestItems.map(item => ({
          book_id: item.book_id,
          quantity: item.quantity
        }))
      });
      
      // Clear guest cart
      localStorage.removeItem('readnwin_guest_cart');
    } catch (err) {
      console.error('Error transferring guest cart:', err);
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
    localStorage.removeItem('permissions');
    window.location.href = '/';
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  };

  const getPermissions = () => {
    const permissions = localStorage.getItem('permissions');
    return permissions ? JSON.parse(permissions) : [];
  };

  return {
    login,
    signup,
    forgotPassword,
    logout,
    isAuthenticated,
    getUser,
    getPermissions,
    loading,
    error
  };
};
