'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  TrashIcon, 
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface OrderItem {
  id: number;
  book_id: number;
  book_title: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  format: string;
}

interface Order {
  id: number;
  order_number: string;
  user_id?: number;
  guest_email?: string;
  status: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
  shipping_address?: any;
  billing_address?: any;
  payment_method?: string;
  payment_status?: string;
  items: OrderItem[];
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title: string;
}

export default function OrderDetailPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchOrder();
  }, [user, orderId]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      if (response.ok) {
        const data = await response.json();
        setOrder((data.data as unknown as Order) || null);
        setNewStatus((data.data as unknown as Order)?.status || '');
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to fetch order details. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch order details. Please check your connection.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: `Order #${order?.order_number} has been deleted successfully.`
        });
        router.push('/admin/orders');
      } else {
        const errorData = await response.json();
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: errorData.error || 'Failed to delete order. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred while deleting the order.'
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order || newStatus === order.status) {
      setEditingStatus(false);
      return;
    }

    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setOrder(prev => prev ? { ...prev, status: newStatus } : null);
        addNotification({
          type: 'success',
          title: 'Status Updated',
          message: `Order status has been updated to ${newStatus}.`
        });
        setEditingStatus(false);
      } else {
        const errorData = await response.json();
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: errorData.error || 'Failed to update order status. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred while updating the order status.'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'payment_processing': return 'bg-orange-100 text-orange-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Order Not Found</h3>
            <p className="text-gray-500 mb-4">The order you're looking for doesn't exist or has been deleted.</p>
            <button
              onClick={() => router.push('/admin/orders')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
                notification.type === 'success' ? 'ring-green-500' :
                notification.type === 'error' ? 'ring-red-500' :
                notification.type === 'warning' ? 'ring-yellow-500' : 'ring-blue-500'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {notification.type === 'success' && <CheckCircleIcon className="h-6 w-6 text-green-400" />}
                    {notification.type === 'error' && <XCircleIcon className="h-6 w-6 text-red-400" />}
                    {notification.type === 'warning' && <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />}
                    {notification.type === 'info' && <InformationCircleIcon className="h-6 w-6 text-blue-400" />}
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <span className="sr-only">Close</span>
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin/orders')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_number}</h1>
                <p className="text-gray-600">Order details and management</p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Order Number</label>
                  <p className="mt-1 text-sm text-gray-900">#{order.order_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Order Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(order.updated_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Customer</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {order.customer_name || order.guest_email || 'Unknown'}
                  </p>
                  {order.user_id && (
                    <p className="text-xs text-gray-500">User ID: {order.user_id}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{item.book_title}</h3>
                      <p className="text-sm text-gray-500">Format: {item.format}</p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(item.total_price)}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(item.unit_price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Order Status</h2>
                <button
                  onClick={() => setEditingStatus(!editingStatus)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
              
              {editingStatus ? (
                <div className="space-y-3">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="payment_processing">Payment Processing</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleStatusUpdate}
                      disabled={updatingStatus}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updatingStatus ? 'Updating...' : 'Update'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingStatus(false);
                        setNewStatus(order.status);
                      }}
                      className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              )}
            </div>

            {/* Financial Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Subtotal</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Tax</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(order.tax_amount)}</span>
                  </div>
                )}
                {order.shipping_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Shipping</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(order.shipping_amount)}</span>
                  </div>
                )}
                {order.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Discount</span>
                    <span className="text-sm font-medium text-gray-900">-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-base font-medium text-gray-900">Total</span>
                  <span className="text-base font-bold text-gray-900">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            {order.payment_method && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Payment Method</label>
                    <p className="mt-1 text-sm text-gray-900">{order.payment_method}</p>
                  </div>
                  {order.payment_status && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Payment Status</label>
                      <p className="mt-1 text-sm text-gray-900">{order.payment_status}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Order</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete order <strong>#{order.order_number}</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This action cannot be undone and will permanently remove the order and all associated data.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleDeleteOrder}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Delete Order'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="mt-2 px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 