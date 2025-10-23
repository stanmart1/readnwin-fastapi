import { useState } from 'react';
import api from '../lib/api';

export const useShipping = () => {
  const [shippingMethods, setShippingMethods] = useState([]);
  const [shippingZones, setShippingZones] = useState([]);
  const [methodZones, setMethodZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchShippingMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/shipping/methods');
      const methods = (response.data.methods || []).map(method => ({
        ...method,
        base_cost: Number(method.base_cost) || 0,
        cost_per_item: Number(method.cost_per_item) || 0,
        free_shipping_threshold: method.free_shipping_threshold ? Number(method.free_shipping_threshold) : null,
        estimated_days_min: Number(method.estimated_days_min) || 1,
        estimated_days_max: Number(method.estimated_days_max) || 7,
        sort_order: Number(method.sort_order) || 0
      }));
      setShippingMethods(methods);
      return { success: true, data: methods };
    } catch (err) {
      console.error('Error fetching shipping methods:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const fetchShippingZones = async () => {
    try {
      const response = await api.get('/admin/shipping/zones');
      const zones = response.data.zones || [];
      setShippingZones(zones);
      return { success: true, data: zones };
    } catch (err) {
      console.error('Error fetching shipping zones:', err);
      return { success: false, error: err.message };
    }
  };

  const fetchMethodZones = async () => {
    try {
      const response = await api.get('/admin/shipping/method-zones');
      const mz = response.data.methodZones || [];
      setMethodZones(mz);
      return { success: true, data: mz };
    } catch (err) {
      console.error('Error fetching method zones:', err);
      return { success: false, error: err.message };
    }
  };

  const createShippingMethod = async (data) => {
    try {
      await api.post('/admin/shipping/methods', data);
      return { success: true };
    } catch (err) {
      console.error('Error creating shipping method:', err);
      return { success: false, error: err.message };
    }
  };

  const updateShippingMethod = async (id, data) => {
    try {
      await api.put(`/admin/shipping/methods/${id}`, data);
      return { success: true };
    } catch (err) {
      console.error('Error updating shipping method:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteShippingMethod = async (id) => {
    try {
      await api.delete(`/admin/shipping/methods/${id}`);
      return { success: true };
    } catch (err) {
      console.error('Error deleting shipping method:', err);
      return { success: false, error: err.message };
    }
  };

  const createShippingZone = async (data) => {
    try {
      await api.post('/admin/shipping/zones', data);
      return { success: true };
    } catch (err) {
      console.error('Error creating shipping zone:', err);
      return { success: false, error: err.message };
    }
  };

  const updateShippingZone = async (id, data) => {
    try {
      await api.put(`/admin/shipping/zones/${id}`, data);
      return { success: true };
    } catch (err) {
      console.error('Error updating shipping zone:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteShippingZone = async (id) => {
    try {
      await api.delete(`/admin/shipping/zones/${id}`);
      return { success: true };
    } catch (err) {
      console.error('Error deleting shipping zone:', err);
      return { success: false, error: err.message };
    }
  };

  const toggleMethodZone = async (methodId, zoneId, isAvailable) => {
    try {
      await api.post('/admin/shipping/method-zones', {
        shipping_method_id: methodId,
        shipping_zone_id: zoneId,
        is_available: isAvailable
      });
      return { success: true };
    } catch (err) {
      console.error('Error toggling method-zone:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    shippingMethods,
    shippingZones,
    methodZones,
    loading,
    error,
    fetchShippingMethods,
    fetchShippingZones,
    fetchMethodZones,
    createShippingMethod,
    updateShippingMethod,
    deleteShippingMethod,
    createShippingZone,
    updateShippingZone,
    deleteShippingZone,
    toggleMethodZone
  };
};
