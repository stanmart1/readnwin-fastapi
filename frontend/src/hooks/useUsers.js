import { useState } from 'react';
import api from '../lib/api';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams(params).toString();
      const url = queryParams ? `/admin/users?${queryParams}` : '/admin/users';
      const response = await api.get(url);
      setUsers(response.data.users || response.data || []);
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
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
    fetchUsers,
    assignBookToUser
  };
};
