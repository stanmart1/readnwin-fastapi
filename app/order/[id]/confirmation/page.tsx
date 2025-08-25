'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
// Remix Icons are already available globally
import { toast } from 'react-hot-toast';

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

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <i className="ri-check-line w-6 h-6 text-green-500" />;
      case 'processing':
        return <i className="ri-box-line w-6 h-6 text-blue-500" />;
      case 'shipped':
        return <i className="ri-truck-line w-6 h-6 text-purple-500" />;
      case 'delivered':
        return <i className="ri-home-line w-6 h-6 text-green-600" />;
      default:
        return <i className="ri-check-line w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'processing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'shipped':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'delivered':
        return 'text-green-700 bg-green-50 border-green-300';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = async () => {
    try {
      // Show loading state
      const downloadButton = document.querySelector('[data-download-receipt]') as HTMLButtonElement;
      
      if (downloadButton) {
        downloadButton.disabled = true;
        downloadButton.innerHTML = '<i class="ri-loader-4-line animate-spin mr-2"></i>Generating Receipt...';
      }

      // Generate PDF receipt
      const response = await Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${order?.order_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show success message
      toast.success('Receipt downloaded successfully!');

    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt. Please try again.');
    } finally {
      // Reset button state
      const downloadButton = document.querySelector('[data-download-receipt]') as HTMLButtonElement;
      if (downloadButton) {
        downloadButton.disabled = false;
        downloadButton.innerHTML = '<i class="ri-download-line w-4 h-4" /><span>Download Receipt</span>';
      }
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      // Show loading state
      const downloadButton = document.querySelector('[data-download-invoice]') as HTMLButtonElement;
      
      if (downloadButton) {
        downloadButton.disabled = true;
        downloadButton.innerHTML = '<i class="ri-loader-4-line animate-spin mr-2"></i>Generating Invoice...';
      }

      // Generate PDF invoice
      const response = await Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order?.order_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show success message
      toast.success('Invoice downloaded successfully!');

    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice. Please try again.');
    } finally {
      // Reset button state
      const downloadButton = document.querySelector('[data-download-invoice]') as HTMLButtonElement;
      if (downloadButton) {
        downloadButton.disabled = false;
        downloadButton.innerHTML = '<i class="ri-file-text-line w-4 h-4" /><span>Download Invoice</span>';
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order confirmation...</p>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getStatusIcon(order.status)}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Confirmation</h1>
                <p className="text-gray-600">Order #{order.order_number}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <i className="ri-printer-line w-4 h-4" />
                <span>Print</span>
              </button>
              <button
                onClick={handleDownloadReceipt}
                data-download-receipt
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <i className="ri-download-line w-4 h-4" />
                <span>Download Receipt</span>
              </button>
              <button
                onClick={handleDownloadInvoice}
                data-download-invoice
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="ri-file-text-line w-4 h-4" />
                <span>Download Invoice</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
              <div className={`inline-flex items-center px-4 py-2 rounded-full border ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="ml-2 font-medium capitalize">{order.status}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Ordered on {formatDate(order.created_at)}
              </p>
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

            {/* Shipping Information */}
            {order.shipping_address && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {order.shipping_address.street && <p>{order.shipping_address.street}</p>}
                      {order.shipping_address.city && order.shipping_address.state && (
                        <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                      )}
                      {order.shipping_address.country && <p>{order.shipping_address.country}</p>}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Shipping Method</h3>
                    <p className="text-sm text-gray-600">{order.shipping_method || 'Not specified'}</p>
                    {order.estimated_delivery_date && (
                      <p className="text-sm text-gray-600 mt-1">
                        Estimated delivery: {formatDate(order.estimated_delivery_date)}
                      </p>
                    )}
                    {order.tracking_number && (
                      <p className="text-sm text-gray-600 mt-1">
                        Tracking: {order.tracking_number}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium text-gray-900">{order.payment_method || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <p className="font-medium text-gray-900 capitalize">{order.payment_status}</p>
                </div>
                {order.payment_transaction_id && (
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="font-mono text-sm text-gray-900">{order.payment_transaction_id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/order/${order.id}/tracking`)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Track Order
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
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
    </div>
  );
} 