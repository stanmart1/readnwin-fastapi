'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Truck, Download, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/contexts/CartContextNew';
import Header from '@/components/Header';

interface OrderItem {
  id: number;
  book_id: number;
  quantity: number;
  price: number;
  book: {
    id: number;
    title: string;
    author: string;
    format: 'ebook' | 'physical' | 'both';
    cover_image?: string;
  };
}

interface Order {
  id: string;
  user_id: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  shipping_method?: {
    name: string;
    price: number;
    delivery_time: string;
  };
  shipping_address?: {
    first_name: string;
    last_name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  created_at: string;
  items: OrderItem[];
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = params.orderId as string;

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      console.error('Error loading order:', err);
      setError('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />;
      case 'shipped':
        return <Truck className="w-5 h-5" />;
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'cancelled':
      case 'failed':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payment Successful';
      case 'shipped':
        return 'Order Shipped';
      case 'delivered':
        return 'Order Delivered';
      case 'pending':
        return 'Payment Pending';
      case 'cancelled':
        return 'Order Cancelled';
      case 'failed':
        return 'Payment Failed';
      default:
        return 'Processing';
    }
  };

  const isEbookOnly = () => {
    return order?.items.every(item => 
      item.book.format === 'ebook' || item.book.format === 'both'
    );
  };

  const isPhysicalOnly = () => {
    return order?.items.every(item => 
      item.book.format === 'physical' || item.book.format === 'both'
    );
  };

  const hasEbooks = () => {
    return order?.items.some(item => 
      item.book.format === 'ebook' || item.book.format === 'both'
    );
  };

  const hasPhysicalBooks = () => {
    return order?.items.some(item => 
      item.book.format === 'physical' || item.book.format === 'both'
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The order you are looking for does not exist.'}</p>
            <button
              onClick={() => router.push('/orders')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600 mb-4">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Order #{order.id}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Status</h2>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.payment_status)}`}>
                  {getStatusIcon(order.payment_status)}
                  <span className="ml-2">{getStatusText(order.payment_status)}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Order placed on {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    {item.book.cover_image && (
                      <img
                        src={item.book.cover_image}
                        alt={item.book.title}
                        className="w-16 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.book.title}</h3>
                      <p className="text-sm text-gray-600">by {item.book.author}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-sm text-gray-500">
                          Format: {item.book.format}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Information */}
            {hasPhysicalBooks() && order.shipping_address && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Shipping Address</p>
                    <p className="text-gray-900">
                      {order.shipping_address.first_name} {order.shipping_address.last_name}
                    </p>
                    <p className="text-gray-900">{order.shipping_address.address}</p>
                    <p className="text-gray-900">
                      {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}
                    </p>
                    <p className="text-gray-900">{order.shipping_address.country}</p>
                  </div>
                  {order.shipping_method && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Shipping Method</p>
                      <p className="text-gray-900">{order.shipping_method.name}</p>
                      <p className="text-gray-600">{order.shipping_method.delivery_time}</p>
                      <p className="text-gray-900">₦{order.shipping_method.price.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Next?</h2>
              <div className="space-y-4">
                {hasEbooks() && (
                  <div className="flex items-start space-x-3">
                    <Download className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-900">Digital Books</h3>
                      <p className="text-sm text-gray-600">
                        Your digital books are now available in your library. You can start reading immediately!
                      </p>
                    </div>
                  </div>
                )}
                
                {hasPhysicalBooks() && (
                  <div className="flex items-start space-x-3">
                    <Truck className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-900">Physical Books</h3>
                      <p className="text-sm text-gray-600">
                        We'll ship your physical books as soon as possible. You'll receive tracking information via email.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Order Updates</h3>
                    <p className="text-sm text-gray-600">
                      You'll receive email updates about your order status and shipping progress.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">
                    ₦{(order.total_amount - (order.shipping_method?.price || 0)).toLocaleString()}
                  </span>
                </div>
                {order.shipping_method && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">
                      ₦{order.shipping_method.price.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₦{order.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/library')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Go to Library</span>
                </button>
                
                <button
                  onClick={() => router.push('/orders')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>View All Orders</span>
                </button>
                
                <button
                  onClick={() => router.push('/')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Continue Shopping</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 