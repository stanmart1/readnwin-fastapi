import { useState } from 'react';
import api from '../lib/api';

export const useSettings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put('/auth/profile', profileData);
      
      // Update localStorage with new user data
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
      return { success: false, error: err.response?.data?.detail };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      setError(null);
      await api.post('/auth/change-password', passwordData);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password');
      return { success: false, error: err.response?.data?.detail };
    } finally {
      setLoading(false);
    }
  };

  const getNotificationPreferences = async () => {
    try {
      const response = await api.get('/user/notification-preferences');
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail };
    }
  };

  const updateNotificationPreferences = async (preferences) => {
    try {
      setLoading(true);
      setError(null);
      await api.put('/user/notification-preferences', preferences);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update preferences');
      return { success: false, error: err.response?.data?.detail };
    } finally {
      setLoading(false);
    }
  };

  return { updateProfile, changePassword, getNotificationPreferences, updateNotificationPreferences, loading, error };
};
