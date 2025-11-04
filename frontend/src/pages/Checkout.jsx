import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart, useAuth } from '../hooks';
import { getImageUrl } from '../lib/fileService';
import Header from '../components/Header';
import CheckoutFlow from '../components/CheckoutFlow';

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { cartItems, isLoading: cartLoading, error: cartError, refreshCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Check for payment status from URL
  useEffect(() => {
    const status = searchParams.get('status');
    const message = searchParams.get('message');
    
    if (status === 'cancelled') {
      setPaymentStatus({
        type: 'warning',
        title: 'Payment Cancelled',
        message: 'Your payment was cancelled. You can try again or choose a different payment method.'
      });
    } else if (status === 'failed') {
      setPaymentStatus({
        type: 'error',
        title: 'Payment Failed',
        message: message || 'Payment verification failed. Please try again.'
      });
    } else if (status === 'error') {
      setPaymentStatus({
        type: 'error',
        title: 'Payment Error',
        message: message || 'An error occurred during payment processing.'
      });
    }
    
    // Clear URL params after showing message
    if (status) {
      window.history.replaceState({}, '', '/checkout');
    }
  }, [searchParams]);

  // Refresh cart on mount
  useEffect(() => {
    refreshCart().catch(err => {
      console.error('Failed to refresh cart:', err);
      setError('Failed to load cart items');
    });
  }, [refreshCart]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    }
  }, [isAuthenticated, navigate]);

  const handleCheckoutComplete = async (orderData) => {
    try {
      setIsProcessing(true);
      setError(null);

      if (orderData.success) {
        const orderId = orderData.order?.order_number || orderData.order?.id || orderData.orderId;

        // Handle different payment methods
        if (orderData.payment_method === 'flutterwave' && orderData.payment_url) {
          window.location.href = orderData.payment_url;
        } else if (orderData.payment_method === 'bank_transfer') {
          localStorage.setItem('bank_transfer_details', JSON.stringify(orderData));
          navigate(`/bank-transfer/${orderId}`);
        } else {
          navigate(`/order-confirmation/${orderId}`);
        }
      } else {
        throw new Error(orderData.error || orderData.message || 'Checkout failed');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'An error occurred during checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    navigate('/cart');
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 pt-24 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 pt-24 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-red-800">{cartError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 pt-24 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-8">Add some books before checking out</p>
          <button
            onClick={() => navigate('/books')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Browse Books
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {paymentStatus && (
          <div className={`mb-6 rounded-lg p-4 ${
            paymentStatus.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
            paymentStatus.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-start">
              <i className={`text-xl mr-3 ${
                paymentStatus.type === 'warning' ? 'ri-alert-line text-yellow-600' :
                paymentStatus.type === 'error' ? 'ri-close-circle-line text-red-600' :
                'ri-information-line text-blue-600'
              }`}></i>
              <div className="flex-1">
                <h4 className={`font-medium ${
                  paymentStatus.type === 'warning' ? 'text-yellow-800' :
                  paymentStatus.type === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>{paymentStatus.title}</h4>
                <p className={`text-sm mt-1 ${
                  paymentStatus.type === 'warning' ? 'text-yellow-700' :
                  paymentStatus.type === 'error' ? 'text-red-700' :
                  'text-blue-700'
                }`}>{paymentStatus.message}</p>
              </div>
              <button
                onClick={() => setPaymentStatus(null)}
                className={`transition-colors ${
                  paymentStatus.type === 'warning' ? 'text-yellow-600 hover:text-yellow-800' :
                  paymentStatus.type === 'error' ? 'text-red-600 hover:text-red-800' :
                  'text-blue-600 hover:text-blue-800'
                }`}
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <i className="ri-alert-line text-red-600 text-xl mr-3"></i>
              <div className="flex-1">
                <h4 className="text-red-800 font-medium">Checkout Error</h4>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
          </div>
        )}

        {/* Back to Cart */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Back to Cart ({cartItems.length} items)
          </button>
        </div>

        {/* Secure Checkout Indicator */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <i className="ri-shield-check-line text-green-600 text-xl mr-3"></i>
            <div>
              <h4 className="text-green-800 font-medium">Secure Checkout</h4>
              <p className="text-green-700 text-sm mt-1">
                Your payment information is encrypted and secure. We never store your payment details.
              </p>
            </div>
          </div>
        </div>

        {isProcessing ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Processing your order...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <CheckoutFlow
                cartItems={cartItems}
                onComplete={handleCheckoutComplete}
                onCancel={handleCancel}
              />
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1 order-first lg:order-last">
              <div className="lg:sticky lg:top-8">
                <OrderSummarySidebar cartItems={cartItems} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderSummarySidebar({ cartItems }) {
  const { updateQuantity } = useCart();
  
  const ebooks = cartItems.filter(item => item.book?.format === 'ebook');
  const physicalBooks = cartItems.filter(item => item.book?.format === 'physical');
  const isEbookOnly = ebooks.length > 0 && physicalBooks.length === 0;
  
  const subtotal = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.book?.price || 0);
    const quantity = parseInt(item.quantity || 0);
    return sum + (price * quantity);
  }, 0);
  
  const shipping = isEbookOnly ? 0 : 0;
  const tax = Math.round(subtotal * 0.075);
  const total = subtotal + shipping + tax;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
      
      {/* Cart Items */}
      <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
        {cartItems.map((item) => {
          const itemImageUrl = getImageUrl(item.book?.cover_image_url);
          return (
          <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <img
              src={itemImageUrl || '/placeholder-book.jpg'}
              alt={item.book?.title}
              className="w-12 h-16 object-cover rounded"
              onError={(e) => {
                if (e.currentTarget.src !== '/placeholder-book.jpg') {
                  e.currentTarget.src = '/placeholder-book.jpg';
                }
                e.currentTarget.onerror = null;
              }}
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {item.book?.title}
              </h4>
              <p className="text-xs text-gray-500">
                ₦{item.book?.price?.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateQuantity(item.book_id, item.quantity - 1)}
                className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-xs"
              >
                <i className="ri-subtract-line"></i>
              </button>
              <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.book_id, item.quantity + 1)}
                className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-xs"
              >
                <i className="ri-add-line"></i>
              </button>
            </div>
          </div>
          );
        })}
      </div>
      
      <div className="space-y-3 mb-4 border-t pt-4">
        <div className="flex justify-between">
          <span>Subtotal ({cartItems.length} items)</span>
          <span>₦{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{isEbookOnly ? 'Free' : 'Select method'}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax (7.5%)</span>
          <span>₦{tax.toLocaleString()}</span>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>₦{total.toLocaleString()}</span>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-2">
        {isEbookOnly ? 'Ebook orders ship instantly via email' : 'Physical books ship within 2-3 business days'}
      </p>
    </div>
  );
}
