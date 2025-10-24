import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, useAuth } from '../hooks';
import Header from '../components/Header';
import CheckoutFlow from '../components/CheckoutFlow';

export default function Checkout() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cartItems, isLoading: cartLoading, error: cartError } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login?redirect=/checkout');
    }
  }, [isAuthenticated, navigate]);

  // Redirect if cart is empty (but wait for cart to load first)
  useEffect(() => {
    if (!cartLoading && (!cartItems || cartItems.length === 0)) {
      console.log('Cart empty, redirecting back', { cartItems, cartLoading });
      navigate('/cart');
    }
  }, [cartItems, cartLoading, navigate]);

  const handleCheckoutComplete = async (orderData) => {
    try {
      setIsProcessing(true);
      setError(null);

      if (orderData.success) {
        const orderId = orderData.order?.order_number || orderData.order?.id;

        // Handle different payment methods
        if (orderData.paymentMethod === 'flutterwave' && orderData.flutterwavePaymentUrl) {
          window.location.href = orderData.flutterwavePaymentUrl;
        } else if (orderData.paymentMethod === 'bank_transfer') {
          navigate(`/order-confirmation/${orderId}?payment=bank_transfer`);
        } else {
          navigate(`/order-confirmation/${orderId}`);
        }
      } else {
        throw new Error(orderData.error || 'Checkout failed');
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
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
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
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
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
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
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
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {isProcessing ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Processing your order...</p>
          </div>
        ) : (
          <CheckoutFlow
            cartItems={cartItems}
            onComplete={handleCheckoutComplete}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}
