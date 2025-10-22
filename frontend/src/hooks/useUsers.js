import { useState } from 'react';
import api from '../lib/api';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        skip: (page - 1) * 10,
        limit: 10,
        ...(filters.searchTerm && { search: filters.searchTerm }),
        ...(filters.filterStatus && filters.filterStatus !== 'all' && { status: filters.filterStatus }),
        ...(filters.filterRole && filters.filterRole !== 'all' && { role: filters.filterRole })
      };

      const response = await api.get('/admin/users', { params });
      const data = response.data;

      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / 10));
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData) => {
    try {
      const response = await api.post('/admin/users', userData);
      return response.data;
    } catch (err) {
      console.error('Error creating user:', err);
      return { success: false, error: err.message };
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (err) {
      console.error('Error updating user:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (err) {
      console.error('Error deleting user:', err);
      return { success: false, error: err.message };
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    return updateUser(userId, { is_active: isActive });
  };

  const resetPassword = async (userId, newPassword) => {
    try {
      const response = await api.put(`/admin/users/${userId}/password`, { password: newPassword });
      return response.data;
    } catch (err) {
      console.error('Error resetting password:', err);
      return { success: false, error: err.message };
    }
  };

  const assignBooks = async (userId, bookIds) => {
    try {
      const response = await api.post(`/admin/users/${userId}/assign-books`, { book_ids: bookIds });
      return response.data;
    } catch (err) {
      console.error('Error assigning books:', err);
      return { success: false, error: err.message };
    }
  };

  const getUserAnalytics = async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}/analytics`);
      return response.data;
    } catch (err) {
      console.error('Error fetching analytics:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    users,
    loading,
    error,
    currentPage,
    totalPages,
    totalUsers,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    resetPassword,
    assignBooks,
    getUserAnalytics
  };
};
