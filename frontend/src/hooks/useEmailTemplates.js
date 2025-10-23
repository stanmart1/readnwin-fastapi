import { useState } from 'react';
import api from '../lib/api';

export const useEmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [emailFunctions, setEmailFunctions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, byCategory: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTemplates = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.isActive) params.append('is_active', filters.isActive);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/admin/email-templates?${params}`);
      setTemplates(response.data.templates || []);
      return { success: true, data: response.data.templates };
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/email-categories');
      setCategories(response.data.categories || []);
      return { success: true, data: response.data.categories };
    } catch (err) {
      console.error('Error fetching categories:', err);
      return { success: false, error: err.message };
    }
  };

  const fetchEmailFunctions = async () => {
    try {
      const response = await api.get('/admin/email-functions');
      setEmailFunctions(response.data.functions || []);
      return { success: true, data: response.data.functions };
    } catch (err) {
      console.error('Error fetching functions:', err);
      return { success: false, error: err.message };
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/admin/email-assignments');
      setAssignments(response.data.assignments || []);
      return { success: true, data: response.data.assignments };
    } catch (err) {
      console.error('Error fetching assignments:', err);
      return { success: false, error: err.message };
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/email-stats');
      setStats(response.data.stats || { total: 0, active: 0, byCategory: {} });
      return { success: true, data: response.data.stats };
    } catch (err) {
      console.error('Error fetching stats:', err);
      return { success: false, error: err.message };
    }
  };

  const createTemplate = async (data) => {
    try {
      await api.post('/admin/email-templates', data);
      return { success: true };
    } catch (err) {
      console.error('Error creating template:', err);
      return { success: false, error: err.message };
    }
  };

  const updateTemplate = async (id, data) => {
    try {
      await api.put(`/admin/email-templates/${id}`, data);
      return { success: true };
    } catch (err) {
      console.error('Error updating template:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteTemplate = async (id) => {
    try {
      await api.delete(`/admin/email-templates/${id}`);
      return { success: true };
    } catch (err) {
      console.error('Error deleting template:', err);
      return { success: false, error: err.message };
    }
  };

  const assignTemplate = async (functionId, templateId, priority = 1) => {
    try {
      await api.post('/admin/email-templates/assignments', {
        functionId,
        templateId,
        priority
      });
      return { success: true };
    } catch (err) {
      console.error('Error assigning template:', err);
      return { success: false, error: err.message };
    }
  };

  const unassignTemplate = async (functionId, templateId) => {
    try {
      await api.delete(`/admin/email-templates/assignments?function_id=${functionId}&template_id=${templateId}`);
      return { success: true };
    } catch (err) {
      console.error('Error unassigning template:', err);
      return { success: false, error: err.message };
    }
  };

  const sendTestEmail = async (templateId, email) => {
    try {
      await api.post('/admin/email-templates/test', { templateId, email });
      return { success: true };
    } catch (err) {
      console.error('Error sending test email:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    templates,
    categories,
    emailFunctions,
    assignments,
    stats,
    loading,
    error,
    fetchTemplates,
    fetchCategories,
    fetchEmailFunctions,
    fetchAssignments,
    fetchStats,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    assignTemplate,
    unassignTemplate,
    sendTestEmail
  };
};
