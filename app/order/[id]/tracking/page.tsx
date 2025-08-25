'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
// Remix Icons are already available globally

interface OrderStatusHistory {
  id: number;
  order_id: number;
  status: string;
  notes?: string;
  created_at: string;
  created_by?: number;
}

interface Order {
  id: number;
  order_number: string;
  user_id?: number;
  guest_email?: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  payment_method?: string;
  payment_status: string;
  payment_transaction_id?: string;
  shipping_address?: any;
  billing_address?: any;
  shipping_method?: string;
  tracking_number?: string;
  estimated_delivery_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: number;
  book_id: number;
  title: string;
  author_name: string;
  price: number;
  quantity: number;
  total_price: number;
  format: string;
}

const ORDER_STATUSES = [
  { key: 'pending', label: 'Order Placed', icon: 'ri-time-line', color: 'text-yellow-600 bg-yellow-50' },
  { key: 'payment_processing', label: 'Payment Processing', icon: 'ri-time-line', color: 'text-blue-600 bg-blue-50' },
  { key: 'paid', label: 'Payment Confirmed', icon: 'ri-check-line', color: 'text-green-600 bg-green-50' },
  { key: 'processing', label: 'Processing', icon: 'ri-box-line', color: 'text-purple-600 bg-purple-50' },
  { key: 'shipped', label: 'Shipped', icon: 'ri-truck-line', color: 'text-indigo-600 bg-indigo-50' },
  { key: 'delivered', label: 'Delivered', icon: 'ri-home-line', color: 'text-green-700 bg-green-50' },
  { key: 'cancelled', label: 'Cancelled', icon: 'ri-error-warning-line', color: 'text-red-600 bg-red-50' },
  { key: 'refunded', label: 'Refunded', icon: 'ri-error-warning-line', color: 'text-gray-600 bg-gray-50' },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);

  const orderId = params.id as string;

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchOrderData = async () => {
      try {
        setLoading(true);
        
        // Fetch order details
        const orderResponse = await Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
        if (!orderResponse.ok) {
          throw new Error('Order not found');
        }
        const orderData = await orderResponse.json();
        setOrder(orderData);

        // Fetch order items
        const itemsResponse = await Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          setOrderItems(itemsData);
        }

        // Fetch status history
        const historyResponse = await Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setStatusHistory(historyData);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId, session, router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: order?.currency || 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIndex = (status: string) => {
    return ORDER_STATUSES.findIndex(s => s.key === status);
  };

  const getCurrentStatusIndex = () => {
    if (!order) return -1;
    return getStatusIndex(order.status);
  };

  const isStatusCompleted = (statusKey: string) => {
    const currentIndex = getCurrentStatusIndex();
    const statusIndex = getStatusIndex(statusKey);
    return statusIndex <= currentIndex && statusIndex !== -1;
  };

  const isStatusActive = (statusKey: string) => {
    return order?.status === statusKey;
  };

  const getStatusIcon = (statusKey: string) => {
    const status = ORDER_STATUSES.find(s => s.key === statusKey);
    if (!status) return 'ri-time-line';
    return status.icon;
  };

  const getStatusColor = (statusKey: string) => {
    const status = ORDER_STATUSES.find(s => s.key === statusKey);
    if (!status) return 'text-gray-600 bg-gray-50';
    return status.color;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order tracking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
              <p className="text-gray-600">Order #{order.order_number}</p>
            </div>
            <button
              onClick={() => router.push(`/order/${order.id}/confirmation`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Order Details
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Order Status Timeline</h2>
                {/* Mobile Toggle Button */}
                <button
                  onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                  className="lg:hidden flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <span className="text-sm font-medium">
                    {isTimelineExpanded ? 'Hide Timeline' : 'Show Timeline'}
                  </span>
                  <i className={`ri-arrow-down-s-line transition-transform duration-200 ${
                    isTimelineExpanded ? 'rotate-180' : ''
                  }`}></i>
                </button>
              </div>
              
              <div className={`lg:block ${isTimelineExpanded ? 'block' : 'hidden'}`}>
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-6">
                    {ORDER_STATUSES.map((status, index) => {
                      const Icon = getStatusIcon(status.key);
                      const isCompleted = isStatusCompleted(status.key);
                      const isActive = isStatusActive(status.key);
                      
                      return (
                        <div key={status.key} className="relative flex items-start">
                          {/* Status Icon */}
                          <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                            isCompleted 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : isActive
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : 'bg-white border-gray-300 text-gray-400'
                          }`}>
                            <i className={`${Icon} w-6 h-6`} />
                          </div>
                          
                          {/* Status Content */}
                          <div className="ml-4 flex-1">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              isCompleted ? getStatusColor(status.key) : 'text-gray-500 bg-gray-100'
                            }`}>
                              {status.label}
                            </div>
                            
                            {/* Status History Entry */}
                            {statusHistory.find(h => h.status === status.key) && (
                              <div className="mt-2 text-sm text-gray-600">
                                <p>{formatDate(statusHistory.find(h => h.status === status.key)!.created_at)}</p>
                                {statusHistory.find(h => h.status === status.key)!.notes && (
                                  <p className="mt-1 text-gray-500">
                                    {statusHistory.find(h => h.status === status.key)!.notes}
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {/* Active Status Message */}
                            {isActive && (
                              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                  Your order is currently {status.label.toLowerCase()}. 
                                  {order.estimated_delivery_date && (
                                    <span> Estimated delivery: {formatDate(order.estimated_delivery_date)}</span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600">by {item.author_name}</p>
                      <p className="text-sm text-gray-500 capitalize">{item.format}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      <p className="font-medium text-gray-900">{formatCurrency(item.total_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h2>
              <div className={`inline-flex items-center px-4 py-2 rounded-full border ${getStatusColor(order.status)}`}>
                {(() => {
                  const Icon = getStatusIcon(order.status);
                  return <i className={`${Icon} w-5 h-5 mr-2`} />;
                })()}
                <span className="font-medium capitalize">{order.status.replace('_', ' ')}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Last updated: {formatDate(order.updated_at)}
              </p>
            </div>

            {/* Shipping Information */}
            {order.shipping_address && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h2>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <i className="ri-map-pin-line w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="text-sm text-gray-600">
                      {order.shipping_address.street && <p>{order.shipping_address.street}</p>}
                      {order.shipping_address.city && order.shipping_address.state && (
                        <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                      )}
                      {order.shipping_address.country && <p>{order.shipping_address.country}</p>}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">Shipping Method</p>
                    <p className="text-sm text-gray-600">{order.shipping_method || 'Not specified'}</p>
                  </div>
                  
                  {order.estimated_delivery_date && (
                    <div>
                      <p className="text-sm font-medium text-gray-900">Estimated Delivery</p>
                      <p className="text-sm text-gray-600">{formatDate(order.estimated_delivery_date)}</p>
                    </div>
                  )}
                  
                  {order.tracking_number && (
                    <div>
                      <p className="text-sm font-medium text-gray-900">Tracking Number</p>
                      <p className="font-mono text-sm text-gray-600">{order.tracking_number}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatCurrency(order.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">{formatCurrency(order.shipping_amount)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-green-600">-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard/orders')}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View All Orders
                </button>
                <button
                  onClick={() => router.push('/books')}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 