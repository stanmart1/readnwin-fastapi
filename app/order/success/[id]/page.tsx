'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import { CheckCircle, Download, BookOpen, ArrowRight } from 'lucide-react';

interface OrderData {
  id: number;
  order_number: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  book_id: number;
  title: string;
  author_name: string;
  format: string;
  price: number;
  quantity: number;
  book?: {
    cover_image_url: string;
    ebook_file_url?: string;
  };
}

export default function OrderSuccessPage() {
  const { user, isAuthenticated, status } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (orderId) {
      fetchOrderDetails();
    }
  }, [isAuthenticated, status, router, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      const response = await Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      
      if (response.ok) {
        const data = await response.json();
        // The API returns the order directly, not wrapped in an object
        setOrder(data);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load order details');
      }
    } catch (error) {
      setError('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewLibrary = () => {
    router.push('/dashboard?tab=library');
  };

  const handleBrowseBooks = () => {
    router.push('/books');
  };

  const handleDownloadBook = async (bookId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/user/library/${bookId}/download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank');
        }
      } else {
        alert('Failed to download book');
      }
    } catch (error) {
      console.error('Error downloading book:', error);
      alert('Failed to download book');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-line text-2xl text-red-600"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The order you are looking for does not exist.'}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isEbookOrder = order.items.every(item => item.format === 'ebook');
  const isPaid = order.payment_status === 'paid';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isPaid ? 'Order Successful!' : 'Order Placed Successfully!'}
          </h1>
          <p className="text-gray-600 text-lg">
            {isPaid 
              ? 'Your payment has been confirmed and your e-books are ready to download.'
              : 'Your order has been placed. Payment is awaiting approval.'
            }
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="font-semibold text-gray-900">{order.order_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-semibold text-gray-900 capitalize">
                {order.payment_method.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="font-semibold text-gray-900">₦{order.total_amount.toLocaleString()}</p>
            </div>
          </div>

          {/* Payment Status */}
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            isPaid 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isPaid ? 'bg-green-500' : 'bg-yellow-500'
            }`}></div>
            {isPaid ? 'Payment Confirmed' : 'Payment Awaiting Approval'}
          </div>
        </div>

        {/* Purchased Books */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Your E-books</h2>
          
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                {/* Book Cover */}
                <div className="flex-shrink-0">
                  <img 
                    src={item.book?.cover_image_url || '/placeholder-book.png'} 
                    alt={item.title}
                    className="w-16 h-20 object-cover rounded-md shadow-sm"
                  />
                </div>
                
                {/* Book Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                  <p className="text-sm text-gray-600">by {item.author_name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      E-book
                    </span>
                    <span className="text-sm text-gray-500">
                      ₦{item.price.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex-shrink-0 space-x-2">
                  {isPaid && item.book?.ebook_file_url && (
                    <button
                      onClick={() => handleDownloadBook(item.book_id)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                  )}
                  <button
                    onClick={handleViewLibrary}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <BookOpen className="w-4 h-4 mr-1" />
                    Read
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">What's Next?</h3>
          
          {isPaid ? (
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="text-blue-900 font-medium">Download your e-books</p>
                  <p className="text-blue-700 text-sm">Click the download button above to get your e-books</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="text-blue-900 font-medium">Access your library</p>
                  <p className="text-blue-700 text-sm">All your e-books are now available in your digital library</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="text-blue-900 font-medium">Start reading</p>
                  <p className="text-blue-700 text-sm">Read on any device with your account</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="text-blue-900 font-medium">Complete your payment</p>
                  <p className="text-blue-700 text-sm">Follow the payment instructions provided</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="text-blue-900 font-medium">Wait for verification</p>
                  <p className="text-blue-700 text-sm">Your payment will be verified within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="text-blue-900 font-medium">Access your e-books</p>
                  <p className="text-blue-700 text-sm">Once verified, your e-books will be available in your library</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleViewLibrary}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
          >
            <BookOpen className="w-5 h-5" />
            <span>View My Library</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleBrowseBooks}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
          >
            <span>Browse More Books</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 