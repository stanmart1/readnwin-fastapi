import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export const useEmailGateway = () => {
  const [gateways, setGateways] = useState([]);
  const [activeGateway, setActiveGateway] = useState('resend');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(null);
  const [error, setError] = useState(null);

  const loadGateways = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/email/gateways');
      if (response.data.gateways) {
        setGateways(response.data.gateways);
      }
      if (response.data.activeGateway) {
        setActiveGateway(response.data.activeGateway);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading gateway settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveGateways = useCallback(async (gatewaysData, activeGatewayId) => {
    try {
      setSaving(true);
      setError(null);
      await api.post('/admin/email/gateways', {
        gateways: gatewaysData,
        activeGateway: activeGatewayId
      });
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error saving gateway settings:', err);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, []);

  const testConnection = useCallback(async (gatewayId, config, testEmail) => {
    try {
      setTesting(gatewayId);
      const response = await api.post('/admin/email/gateways/test', {
        gatewayId,
        config,
        testEmail
      });
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error testing connection:', err);
      return { success: false, error: err.message };
    } finally {
      setTesting(null);
    }
  }, []);

  useEffect(() => {
    loadGateways();
  }, [loadGateways]);

  return {
    gateways,
    setGateways,
    activeGateway,
    setActiveGateway,
    loading,
    saving,
    testing,
    error,
    loadGateways,
    saveGateways,
    testConnection
  };
};
