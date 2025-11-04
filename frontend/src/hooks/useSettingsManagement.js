import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export const useSettingsManagement = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/system-settings');
      // Extract values from the settings objects
      const settingsData = response.data.settings || {};
      const extractedSettings = {};
      
      // Store both snake_case and camelCase versions for compatibility
      Object.keys(settingsData).forEach(key => {
        // Keep original snake_case key
        extractedSettings[key] = settingsData[key].value;
        
        // Also add camelCase version for UI compatibility
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        if (camelKey !== key) {
          extractedSettings[camelKey] = settingsData[key].value;
        }
      });
      
      setSettings(extractedSettings);
    } catch (err) {
      setError(err.message);
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      // Save each setting individually
      for (const [key, value] of Object.entries(settings)) {
        // Convert camelCase back to snake_case for backend
        // Handle special cases like sessionTimeoutMinutes -> session_timeout_minutes
        const snakeKey = key
          .replace(/([A-Z])/g, '_$1')
          .toLowerCase()
          .replace(/^_/, ''); // Remove leading underscore if any
        
        try {
          await api.put(`/admin/system-settings/${snakeKey}`, { value });
        } catch (err) {
          console.error(`Error saving ${snakeKey}:`, err);
          // Continue with other settings even if one fails
        }
      }
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error saving settings:', err);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [settings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    setSettings,
    loading,
    saving,
    error,
    saveSettings,
    refetch: loadSettings
  };
};
