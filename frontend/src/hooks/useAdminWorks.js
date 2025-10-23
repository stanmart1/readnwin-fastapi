import { useState } from 'react';
import api from '../lib/api';

export const useAdminWorks = () => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWorks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/works');
      const data = response.data;
      setWorks(data.works || []);
      return { success: true, data: data.works };
    } catch (err) {
      console.error('Error fetching works:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const uploadWork = async (formData) => {
    try {
      const response = await api.post('/admin/works', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error uploading work:', err);
      return { success: false, error: err.message };
    }
  };

  const updateWork = async (id, formData) => {
    try {
      const response = await api.put(`/admin/works/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error updating work:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteWork = async (id) => {
    try {
      await api.delete(`/admin/works/${id}`);
      return { success: true };
    } catch (err) {
      console.error('Error deleting work:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    works,
    loading,
    error,
    fetchWorks,
    uploadWork,
    updateWork,
    deleteWork
  };
};
