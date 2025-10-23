import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export const useAboutManagement = () => {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/about/admin');
      setContent(response.data || {});
    } catch (err) {
      setError(err.message);
      console.error('Error loading about content:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveContent = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      await api.put('/api/about/admin', content);
      setLastSaved(new Date());
      setUnsavedChanges(false);
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error saving about content:', err);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [content]);

  const updateContent = useCallback((section, data) => {
    setContent(prev => ({ ...prev, [section]: data }));
    setUnsavedChanges(true);
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  return {
    content,
    loading,
    saving,
    error,
    lastSaved,
    unsavedChanges,
    updateContent,
    saveContent,
    refetch: loadContent
  };
};
