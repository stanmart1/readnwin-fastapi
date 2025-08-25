'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { X, Calendar, CreditCard, Truck, MapPin, Phone, Mail } from 'lucide-react';

interface OrderItem {
  id: number;
  book_title: string;
  quantity: number;
  price: number;
  book_format: string;
}

interface PaymentInfo {
  id: number;
  status: string;
  method: string;
  proof_of_payment_url?: string;
  transaction_reference?: string;
  created_at: string;
}

interface Order {
  id: number;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  payment_info?: PaymentInfo;
  items: OrderItem[];
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onViewProof?: (imageUrl: string) => void;
}

interface ProofViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  orderNumber: string;
}

function ProofViewerModal({ isOpen, onClose, imageUrl, orderNumber }: ProofViewerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <i className="ri-image-line text-white"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Proof of Payment</h3>
              <p className="text-sm text-gray-600">Order #{orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 flex items-center justify-center bg-gray-50 min-h-[400px]">
          <img
            src={imageUrl}
            alt="Proof of Payment"
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-image.png';
            }}
          />
        </div>
      </div>
    </div>
  );
}

function OrderDetailsModal({ isOpen, onClose, order, onViewProof }: OrderDetailsModalProps) {
  if (!isOpen || !order) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <i className="ri-checkbox-circle-line text-green-600" />;
      case 'shipped':
        return <i className="ri-truck-line text-blue-600" />;
      case 'pending':
        return <i className="ri-time-line text-yellow-600" />;
      case 'cancelled':
      case 'failed':
        return <i className="ri-close-circle-line text-red-600" />;
      default:
        return <i className="ri-time-line text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'cancelled':
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <i className="ri-file-list-3-line text-white text-lg"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <p className="text-sm text-gray-600">#{order.order_number}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Status */}
          <div className={`p-4 rounded-lg border ${getStatusColor(order.status)}`}>
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{getStatusIcon(order.status)}</div>
              <div>
                <h3 className="font-semibold capitalize">{order.status}</h3>
                <p className="text-sm opacity-75">
                  Order placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <i className="ri-shopping-bag-line mr-2 text-blue-600"></i>
                Order Summary
              </h3>
              <span className="text-lg font-bold text-gray-900">
                ₦{order.total_amount.toLocaleString()}
              </span>
            </div>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.book_title}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center">
                        <i className="ri-book-line mr-1"></i>
                        {item.book_format}
                      </span>
                      <span className="flex items-center">
                        <i className="ri-hashtag mr-1"></i>
                        Qty: {item.quantity}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      ₦{item.price.toLocaleString()} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 flex items-center mb-3">
              <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
              Payment Information
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <span className={`font-medium capitalize ${
                  order.payment_status === 'completed' ? 'text-green-600' :
                  order.payment_status === 'pending' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {order.payment_status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {order.payment_info?.method?.replace('_', ' ') || 'Unknown'}
                </span>
              </div>
              {order.payment_info?.transaction_reference && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-mono text-sm text-gray-900">
                    {order.payment_info.transaction_reference}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold text-gray-900">₦{order.total_amount.toLocaleString()}</span>
              </div>
              {order.payment_info?.proof_of_payment_url && (
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={() => onViewProof?.(order.payment_info!.proof_of_payment_url!)}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <i className="ri-image-line"></i>
                    <span>View Proof of Payment</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 flex items-center mb-3">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Order Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Order Placed</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              {order.status !== 'pending' && (
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    order.status === 'completed' || order.status === 'delivered' || order.status === 'shipped'
                      ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{order.status}</p>
                    <p className="text-sm text-gray-600">Status updated</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Support Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 flex items-center mb-3">
              <i className="ri-customer-service-2-line mr-2"></i>
              Need Help?
            </h3>
            <p className="text-blue-800 text-sm mb-3">
              If you have any questions about your order, feel free to contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href="mailto:support@readnwin.com"
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Support
              </a>
              <a
                href="/contact"
                className="flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-sm font-medium"
              >
                <Phone className="h-4 w-4 mr-2" />
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProofViewerOpen, setIsProofViewerOpen] = useState(false);
  const [proofImageUrl, setProofImageUrl] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view orders');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else if (response.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to load orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <i className="ri-checkbox-circle-line text-green-600" />;
      case 'shipped':
        return <i className="ri-truck-line text-blue-600" />;
      case 'pending':
        return <i className="ri-time-line text-yellow-600" />;
      case 'cancelled':
      case 'failed':
        return <i className="ri-close-circle-line text-red-600" />;
      default:
        return <i className="ri-time-line text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'cancelled':
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleViewProof = (imageUrl: string) => {
    setProofImageUrl(imageUrl);
    setIsProofViewerOpen(true);
  };

  const handleCloseProofViewer = () => {
    setIsProofViewerOpen(false);
    setProofImageUrl('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-lock-line text-white text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
            <p className="text-gray-600 mb-6">You need to be signed in to view your orders.</p>
            <a
              href="/login"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              Sign In Now
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <i className="ri-shopping-bag-line text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-600">Track and manage your book orders</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading your orders...</p>
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <i className="ri-error-warning-line text-red-500 text-3xl mb-4"></i>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchOrders}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-shopping-bag-line text-blue-500 text-3xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Orders Yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't placed any orders yet. Start exploring our collection of amazing books!
            </p>
            <a
              href="/books"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium inline-flex items-center space-x-2"
            >
              <i className="ri-book-line"></i>
              <span>Browse Books</span>
            </a>
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                    <div className="mb-4 sm:mb-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        Order #{order.order_number}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <i className="ri-calendar-line mr-1"></i>
                        Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end space-y-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                        <span className="mr-2 text-lg">{getStatusIcon(order.status)}</span>
                        <span className="capitalize">{order.status}</span>
                      </span>
                      <span className="text-2xl font-bold text-gray-900">
                        ₦{order.total_amount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <i className="ri-book-line mr-2 text-blue-600"></i>
                      Items ({order.items.length})
                    </h4>
                    <div className="space-y-3">
                      {order.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.book_title}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center">
                                <i className="ri-file-text-line mr-1"></i>
                                {item.book_format}
                              </span>
                              <span className="flex items-center">
                                <i className="ri-hashtag mr-1"></i>
                                Qty: {item.quantity}
                              </span>
                            </div>
                          </div>
                          <p className="font-semibold text-gray-900">
                            ₦{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-sm text-gray-600 text-center py-2 border-t border-gray-200">
                          +{order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-gray-200">
                    <div className="mb-4 sm:mb-0">
                      <div className="flex items-center text-sm text-gray-600">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Payment: <span className={`ml-1 font-medium capitalize ${
                          order.payment_status === 'completed' ? 'text-green-600' :
                          order.payment_status === 'pending' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>{order.payment_status}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center space-x-2"
                    >
                      <i className="ri-eye-line"></i>
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        order={selectedOrder}
        onViewProof={handleViewProof}
      />

      {/* Proof Viewer Modal */}
      <ProofViewerModal
        isOpen={isProofViewerOpen}
        onClose={handleCloseProofViewer}
        imageUrl={proofImageUrl}
        orderNumber={selectedOrder?.order_number || ''}
      />
    </div>
  );
}