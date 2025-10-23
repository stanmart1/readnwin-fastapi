import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export const usePaymentGateway = () => {
  const [gateways, setGateways] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [testing, setTesting] = useState(null);
  const [error, setError] = useState(null);

  const loadPaymentSettings = useCallback(async () => {
    try:
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/payment-settings');
      if (response.data.gateways) {
        setGateways(response.data.gateways);
      }
      if (response.data.settings) {
        setSettings(response.data.settings);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading payment settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveGateway = useCallback(async (gateway) => {
    try {
      setSaving(gateway.id);
      const response = await api.post('/admin/payment-settings/gateway', { gateway });
      await loadPaymentSettings();
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error saving gateway:', err);
      return { success: false, error: err.message };
    } finally {
      setSaving(null);
    }
  }, [loadPaymentSettings]);

  const testConnection = useCallback(async (gatewayId, apiKeys, testMode) => {
    try {
      setTesting(gatewayId);
      const response = await api.post('/admin/payment-settings/test-connection', {
        gatewayId,
        apiKeys,
        testMode
      });
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error testing connection:', err);
      return { success: false, error: err.message };
    } finally {
      setTesting(null);
    }
  }, []);

  const saveAllSettings = useCallback(async (gatewaysData, settingsData) => {
    try {
      setSaving('all');
      await api.post('/admin/payment-settings', {
        gateways: gatewaysData,
        settings: settingsData
      });
      await loadPaymentSettings();
      return { success: true };
    } catch (err) {
      console.error('Error saving settings:', err);
      return { success: false, error: err.message };
    } finally {
      setSaving(null);
    }
  }, [loadPaymentSettings]);

  useEffect(() => {
    loadPaymentSettings();
  }, [loadPaymentSettings]);

  return {
    gateways,
    setGateways,
    settings,
    setSettings,
    loading,
    saving,
    testing,
    error,
    loadPaymentSettings,
    saveGateway,
    testConnection,
    saveAllSettings
  };
};
