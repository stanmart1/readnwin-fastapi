import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export const useContactManagement = () => {
  const [contactMethods, setContactMethods] = useState([]);
  const [officeInfo, setOfficeInfo] = useState({});
  const [contactSubjects, setContactSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/contact/admin');
      const data = response.data.data || response.data;
      setContactMethods(data.contactMethods || []);
      setOfficeInfo(data.officeInfo || {});
      setContactSubjects(data.contactSubjects || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading contact content:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveContent = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      await api.put('/api/contact/admin', {
        contactMethods,
        officeInfo,
        contactSubjects
      });
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error saving contact content:', err);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [contactMethods, officeInfo, contactSubjects]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  return {
    contactMethods,
    setContactMethods,
    officeInfo,
    setOfficeInfo,
    contactSubjects,
    setContactSubjects,
    loading,
    saving,
    error,
    saveContent,
    refetch: loadContent
  };
};
