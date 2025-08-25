'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatNaira } from '@/lib/currency';
import ProofUpload from '@/components/checkout/ProofUpload';
import { 
  CheckCircle, 
  Package, 
  Download, 
  Clock, 
  AlertCircle, 
  Eye,
  BookOpen,
  Truck,
  CreditCard,
  Home,
  Mail,
  ArrowRight,
  ExternalLink,
  Phone
} from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';

interface OrderItem {
  id: number;
  title: string;
  author_name: string;
  price: number;
  quantity: number;
  total_price: number;
  format: 'ebook' | 'physical' | 'both';
  book_id: number;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  shipping_address: any;
  billing_address: any;
  shipping_method: string;
  tracking_number?: string;
  estimated_delivery_date?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

interface LibraryItem {
  id: number;
  book_id: number;
  book_title: string;
  author_name: string;
  cover_image_url?: string;
  ebook_file_url?: string;
  download_count: number;
  purchase_date: string;
}

export default function EnhancedOrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, status } = useAuth();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'ebooks' | 'shipping' | 'payment'>('summary');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!isAuthenticated) {
      router.push('/login?redirect=/order-confirmation-enhanced/' + orderId);
      return;
    }

    fetchOrderDetails();
  }, [session, status, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch order details
      const orderResponse = await Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      if (!orderResponse.ok) {
        throw new Error('Failed to fetch order details');
      }
      const orderData = await orderResponse.json();
      setOrder(orderData.order);

      // If order has ebooks and payment is successful, fetch library items
      const hasEbooks = orderData.order.items?.some((item: OrderItem) => 
        item.format === 'ebook' || item.format === 'both'
      );

      if (hasEbooks && orderData.order.payment_status === 'paid') {
        const libraryResponse = await fetch('/api/user/library');
        if (libraryResponse.ok) {
          const libraryData = await libraryResponse.json();
          // Filter library items to only those from this order
          const orderLibraryItems = libraryData.libraryItems?.filter((item: any) => 
            orderData.order.items.some((orderItem: OrderItem) => orderItem.book_id === item.book_id)
          ) || [];
          setLibraryItems(orderLibraryItems);
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderTypeAnalysis = (order: Order) => {
    if (!order.items) return { isEbookOnly: false, isPhysicalOnly: false, isMixed: false };
    
    const ebooks = order.items.filter(item => item.format === 'ebook' || item.format === 'both');
    const physicalBooks = order.items.filter(item => item.format === 'physical' || item.format === 'both');
    
    return {
      isEbookOnly: ebooks.length > 0 && physicalBooks.length === 0,
      isPhysicalOnly: physicalBooks.length > 0 && ebooks.length === 0,
      isMixed: ebooks.length > 0 && physicalBooks.length > 0,
      hasEbooks: ebooks.length > 0,
      hasPhysical: physicalBooks.length > 0,
      ebookItems: ebooks,
      physicalItems: physicalBooks
    };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Package },
      shipped: { color: 'bg-purple-100 text-purple-800', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      paid: { color: 'bg-green-100 text-green-800', text: 'Paid' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Failed' },
      refunded: { color: 'bg-gray-100 text-gray-800', text: 'Refunded' },
      pending_bank_transfer: { color: 'bg-blue-100 text-blue-800', text: 'Awaiting Bank Transfer' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <CreditCard className="w-4 h-4 mr-1" />
        {config.text}
      </span>
    );
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-600">Loading order details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your order details.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Order</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mr-3"
          >
            Retry
          </button>
          <Link 
            href="/dashboard"
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors inline-block"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link 
            href="/dashboard"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const orderAnalysis = getOrderTypeAnalysis(order);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <CheckCircle className="w-12 h-12 text-green-600 mr-4" />
            <div>
              <h1 className="text-2xl font-bold text-green-900">Order Confirmed!</h1>
              <p className="text-green-700 mt-1">
                Order #{order.order_number} • Placed on {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Order Type Banner */}
        <div className="mb-6">
          {/* Bank Transfer Payment Notice */}
          {order.payment_method === 'bank_transfer' && order.payment_status === 'pending_bank_transfer' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="w-6 h-6 text-orange-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-orange-900">Payment Pending</h3>
                  <p className="text-orange-700 text-sm">
                    Your order is confirmed but awaiting bank transfer payment. Please see payment instructions below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {orderAnalysis.isEbookOnly && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Download className="w-6 h-6 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-blue-900">Digital Order</h3>
                  <p className="text-blue-700 text-sm">
                    {order.payment_status === 'paid' 
                      ? 'Your ebooks are now available in your library for immediate access.'
                      : 'Your ebooks will be available in your library after payment confirmation.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {orderAnalysis.isPhysicalOnly && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <Package className="w-6 h-6 text-green-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-green-900">Physical Books Order</h3>
                  <p className="text-green-700 text-sm">
                    {order.payment_status === 'paid'
                      ? 'Your books will be carefully packaged and shipped to your address.'
                      : 'Your books will be shipped after payment confirmation.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {orderAnalysis.isMixed && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex space-x-2 mr-3">
                  <Download className="w-5 h-5 text-purple-600" />
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">Mixed Order</h3>
                  <p className="text-purple-700 text-sm">
                    {order.payment_status === 'paid'
                      ? 'Your ebooks are available now. Physical books will be shipped separately.'
                      : 'Your ebooks and physical books will be available after payment confirmation.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status and Payment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                {getStatusBadge(order.status)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment:</span>
                {getPaymentStatusBadge(order.payment_status)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Method:</span>
                <span className="font-medium">
                  {order.payment_method === 'flutterwave' ? 'Flutterwave' :
                   order.payment_method === 'bank_transfer' ? 'Bank Transfer' :
                   order.payment_method}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Total</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span>₦{order.subtotal.toLocaleString()}</span>
              </div>
              {order.shipping_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span>₦{order.shipping_amount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span>₦{order.tax_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total:</span>
                <span>₦{order.total_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'summary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Order Summary
            </button>
            
            {orderAnalysis.hasEbooks && (
              <button
                onClick={() => setActiveTab('ebooks')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ebooks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Download className="w-4 h-4 inline mr-1" />
                My eBooks ({orderAnalysis.ebookItems.length})
              </button>
            )}
            
            {orderAnalysis.hasPhysical && (
              <button
                onClick={() => setActiveTab('shipping')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'shipping'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Truck className="w-4 h-4 inline mr-1" />
                Shipping Details
              </button>
            )}
            
            {order.payment_method === 'bank_transfer' && order.payment_status === 'pending_bank_transfer' && (
              <button
                onClick={() => setActiveTab('payment')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payment'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-4 h-4 inline mr-1" />
                Payment Instructions
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'summary' && (
          <OrderSummaryTab order={order} />
        )}
        
        {activeTab === 'ebooks' && orderAnalysis.hasEbooks && (
          <EbooksTab 
            orderItems={orderAnalysis.ebookItems} 
            libraryItems={libraryItems}
          />
        )}
        
        {activeTab === 'shipping' && orderAnalysis.hasPhysical && (
          <ShippingTab order={order} />
        )}
        
        {activeTab === 'payment' && order.payment_method === 'bank_transfer' && order.payment_status === 'pending_bank_transfer' && (
          <BankTransferTab order={order} />
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {orderAnalysis.hasEbooks && (
              <Link
                href="/reading"
                className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h4 className="font-medium text-blue-900">Start Reading</h4>
                  <p className="text-sm text-blue-700">Access your digital library</p>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-600 ml-auto" />
              </Link>
            )}
            
            <Link
              href="/dashboard"
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Home className="w-8 h-8 text-gray-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Dashboard</h4>
                <p className="text-sm text-gray-700">View account overview</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-600 ml-auto" />
            </Link>
            
            <Link
              href="/books"
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Package className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <h4 className="font-medium text-green-900">Continue Shopping</h4>
                <p className="text-sm text-green-700">Discover more books</p>
              </div>
              <ArrowRight className="w-5 h-5 text-green-600 ml-auto" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tab Components
function OrderSummaryTab({ order }: { order: Order }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
      <div className="space-y-4">
        {order.items?.map((item) => (
          <div key={item.id} className="flex items-start space-x-4 py-4 border-b border-gray-100 last:border-b-0">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-600">by {item.author_name}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  item.format === 'ebook' ? 'bg-blue-100 text-blue-800' :
                  item.format === 'physical' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {item.format === 'ebook' ? 'Digital' :
                   item.format === 'physical' ? 'Physical' :
                   'Both Formats'}
                </span>
                <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                <span className="text-sm font-medium text-gray-900">
                  ₦{item.total_price.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EbooksTab({ orderItems, libraryItems }: { 
  orderItems: OrderItem[];
  libraryItems: LibraryItem[];
}) {
  const handleReadBook = (bookId: number) => {
    window.open(`/read/${bookId}`, '_blank');
  };

  const handleDownloadBook = async (bookId: number) => {
    try {
      const response = await fetch(`/api/user/library/${bookId}/download`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `book-${bookId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Your eBooks</h3>
        <Link
          href="/reading"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
        >
          View All in Library
          <ExternalLink className="w-4 h-4 ml-1" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orderItems.map((item) => {
          const libraryItem = libraryItems.find(lib => lib.book_id === item.book_id);
          
          return (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <img
                    src={libraryItem?.cover_image_url || '/placeholder-book.jpg'}
                    alt={item.title}
                    className="w-16 h-20 object-cover rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.author_name}</p>
                  {libraryItem && (
                    <p className="text-xs text-gray-500 mt-1">
                      Downloaded {libraryItem.download_count} times
                    </p>
                  )}
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => handleReadBook(item.book_id)}
                      className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Read
                    </button>
                    <button
                      onClick={() => handleDownloadBook(item.book_id)}
                      className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShippingTab({ order }: { order: Order }) {
  const shippingAddress = order.shipping_address;
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">
                {shippingAddress?.first_name} {shippingAddress?.last_name}
              </p>
              <p>{shippingAddress?.address}</p>
              <p>
                {shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.zip_code}
              </p>
              <p>{shippingAddress?.country}</p>
              {shippingAddress?.phone && (
                <p className="flex items-center mt-2">
                  <Phone className="w-4 h-4 mr-1" />
                  {shippingAddress.phone}
                </p>
              )}
              {shippingAddress?.email && (
                <p className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  {shippingAddress.email}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Shipping Method</h4>
            <p className="text-sm text-gray-600 mb-4">{order.shipping_method}</p>
            
            {order.tracking_number && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Tracking Number</h4>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                    {order.tracking_number}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(order.tracking_number!)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
            
            {order.estimated_delivery_date && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Estimated Delivery</h4>
                <p className="text-sm text-gray-600">
                  {new Date(order.estimated_delivery_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Timeline</h3>
        <ShippingTimeline order={order} />
      </div>
    </div>
  );
}

function ShippingTimeline({ order }: { order: Order }) {
  const getTimelineSteps = (status: string) => {
    const steps = [
      { id: 'confirmed', title: 'Order Confirmed', completed: true },
      { id: 'processing', title: 'Processing', completed: status !== 'pending' },
      { id: 'shipped', title: 'Shipped', completed: ['shipped', 'delivered'].includes(status) },
      { id: 'delivered', title: 'Delivered', completed: status === 'delivered' }
    ];
    
    return steps;
  };

  const steps = getTimelineSteps(order.status);
  
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {steps.map((step, stepIdx) => (
          <li key={step.id}>
            <div className="relative pb-8">
              {stepIdx !== steps.length - 1 ? (
                <span
                  className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                      step.completed
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : (
                      <Clock className="h-5 w-5 text-gray-500" />
                    )}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className={`text-sm ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BankTransferTab({ order }: { order: Order }) {
  const [bankTransfer, setBankTransfer] = useState<any>(null);
  const [proofs, setProofs] = useState<any[]>([]);
  const [isLoadingBankTransfer, setIsLoadingBankTransfer] = useState(true);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleCopyAccountNumber = (accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber);
  };

  // Fetch bank transfer details
  useEffect(() => {
    const fetchBankTransferDetails = async () => {
      try {
        setIsLoadingBankTransfer(true);
        const response = await Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
        
        if (response.ok) {
          const data = await response.json();
          setBankTransfer(data.bankTransfer);
          setProofs(data.proofs || []);
        } else {
          console.error('Failed to fetch bank transfer details');
        }
      } catch (error) {
        console.error('Error fetching bank transfer details:', error);
      } finally {
        setIsLoadingBankTransfer(false);
      }
    };

    if (order.id) {
      fetchBankTransferDetails();
    }
  }, [order.id]);

  const handleUploadSuccess = (proof: any) => {
    setProofs(prev => [proof, ...prev]);
    setUploadSuccess(true);
    setUploadError(null);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setTimeout(() => setUploadError(null), 5000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Transfer Payment Instructions</h3>
        
        {/* Payment Amount */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-blue-900">Amount to Transfer</h4>
            <p className="text-3xl font-bold text-blue-600">₦{order.total_amount.toLocaleString()}</p>
            <p className="text-sm text-blue-700 mt-1">Order #{order.order_number}</p>
          </div>
        </div>

        {/* Bank Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Bank Account Details</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">ReadnWin Bank Account</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Number</label>
                <div className="mt-1 flex items-center space-x-2">
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900 font-mono">1234567890</span>
                  </div>
                  <button
                    onClick={() => handleCopyAccountNumber('1234567890')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Name</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">ReadnWin Limited</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Important Information</h4>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">1.</span>
                <span className="text-gray-700">
                  Transfer exactly <strong>₦{order.total_amount.toLocaleString()}</strong>
                </span>
              </div>
              
              <div className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">2.</span>
                <span className="text-gray-700">
                  Use order number <strong>{order.order_number}</strong> as reference
                </span>
              </div>
              
              <div className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">3.</span>
                <span className="text-gray-700">
                  Upload proof of payment after transfer
                </span>
              </div>
              
              <div className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">4.</span>
                <span className="text-gray-700">
                  Verification takes 1-2 business days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {uploadSuccess && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <i className="ri-check-line text-green-600 mr-2"></i>
              <span className="text-green-800">Proof uploaded successfully!</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {uploadError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <i className="ri-error-warning-line text-red-600 mr-2"></i>
              <span className="text-red-800">{uploadError}</span>
            </div>
          </div>
        )}

        {/* Upload Proof Section */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Upload Proof of Payment</h4>
          <p className="text-sm text-gray-600 mb-4">
            After making the transfer, please upload a screenshot or photo of your payment receipt.
          </p>
          
          {isLoadingBankTransfer ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading bank transfer details...</span>
            </div>
          ) : bankTransfer ? (
            <ProofUpload
              bankTransferId={bankTransfer.id}
              amount={bankTransfer.amount}
              transactionReference={bankTransfer.transaction_reference}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              existingProofs={proofs}
              orderId={order.id}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Bank transfer details not found.</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h5 className="font-medium text-yellow-900 mb-2">Need Help?</h5>
          <p className="text-sm text-yellow-800">
            If you have any issues with the transfer, please contact our support team at{' '}
            <a href="mailto:support@readnwin.com" className="underline">support@readnwin.com</a> or{' '}
            <a href="tel:+2348000000000" className="underline">+234 800 000 0000</a>
          </p>
        </div>
      </div>
    </div>
  );
} 