import { useState } from 'react';
import api from '../lib/api';

export const useAdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/orders', { params });
      setOrders(response.data.orders || []);
      return {
        success: true,
        data: response.data,
        pages: response.data.pages || 1,
        total: response.data.total || 0
      };
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status, notes) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status, notes });
      return { success: true };
    } catch (err) {
      console.error('Error updating order status:', err);
      return { success: false, error: err.message };
    }
  };

  const updatePaymentStatus = async (orderId, paymentStatus, notes) => {
    try {
      await api.patch(`/admin/orders/${orderId}/payment-status`, { 
        status: paymentStatus, 
        notes 
      });
      return { success: true };
    } catch (err) {
      console.error('Error updating payment status:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      await api.delete(`/admin/orders/${orderId}`);
      return { success: true };
    } catch (err) {
      console.error('Error deleting order:', err);
      return { success: false, error: err.message };
    }
  };

  const batchDeleteOrders = async (orderIds) => {
    try {
      await api.post('/admin/orders/batch-delete', { order_ids: orderIds });
      return { success: true };
    } catch (err) {
      console.error('Error batch deleting orders:', err);
      return { success: false, error: err.message };
    }
  };

  const downloadReceipt = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/receipt`, {
        responseType: 'blob'
      });
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error downloading receipt:', err);
      return { success: false, error: err.message };
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/invoice`, {
        responseType: 'blob'
      });
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error downloading invoice:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    orders,
    loading,
    error,
    fetchOrders,
    updateOrderStatus,
    updatePaymentStatus,
    deleteOrder,
    batchDeleteOrders,
    downloadReceipt,
    downloadInvoice
  };
};
