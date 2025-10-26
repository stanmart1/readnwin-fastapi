import { useState } from 'react';
import api from '../lib/api';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [itemsPerPage] = useState(10);

  const fetchUsers = async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const validPage = Number(page) || 1;
      const skip = (validPage - 1) * itemsPerPage;
      const params = {
        skip,
        limit: itemsPerPage
      };
      
      // Map filter names to backend parameter names
      if (filters.searchTerm) {
        params.search = filters.searchTerm;
      }
      if (filters.filterRole && filters.filterRole !== 'all') {
        params.role = filters.filterRole;
      }
      if (filters.filterStatus && filters.filterStatus !== 'all') {
        params.status = filters.filterStatus;
      }
      
      const queryParams = new URLSearchParams(params).toString();
      const url = `/admin/users?${queryParams}`;
      const response = await api.get(url);
      
      setUsers(response.data.users || []);
      setCurrentPage(page);
      const total = response.data.total || 0;
      setTotalUsers(total);
      setTotalPages(Math.ceil(total / itemsPerPage));
      
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData) => {
    try {
      const response = await api.post('/admin/users', userData);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error creating user:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error deleting user:', err);
      return { success: false, error: err.message };
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    try {
      const response = await api.put(`/admin/users/${userId}/status`, { is_active: isActive });
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error updating user status:', err);
      return { success: false, error: err.message };
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error updating user:', err);
      return { success: false, error: err.message };
    }
  };

  const resetPassword = async (userId, newPassword) => {
    try {
      const response = await api.post(`/admin/users/${userId}/reset-password`, { new_password: newPassword });
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error resetting password:', err);
      return { success: false, error: err.message };
    }
  };

  const assignBooks = async (userId, bookIds) => {
    try {
      const response = await api.post(`/admin/users/${userId}/assign-books`, { book_ids: bookIds });
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error assigning books:', err);
      return { success: false, error: err.message };
    }
  };

  const assignBookToUser = async (userId, bookId, format) => {
    try {
      const response = await api.post('/admin/user-library', {
        user_id: userId,
        book_id: bookId,
        format: format
      });
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error assigning book:', err);
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
    deleteUser,
    updateUser,
    updateUserStatus,
    resetPassword,
    assignBooks,
    assignBookToUser
  };
};
