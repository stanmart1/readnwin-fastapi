'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, ArrowLeft, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContextNew';
import Header from '@/components/Header';
import UnifiedCheckoutFlow from '@/components/checkout/UnifiedCheckoutFlow';

export default function UnifiedCheckoutPage() {
  const { user, isAuthenticated, status } = useAuth();
  const router = useRouter();
  const { cartItems, isLoading, error, getTotalItems, clearCart } = useCart();

  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return;

    if (!isAuthenticated) {
      localStorage.setItem('redirectAfterLogin', '/checkout-unified');
      router.push('/login?redirect=/checkout-unified');
      return;
    }
  }, [isAuthenticated, status, router]);

  // Redirect to cart if no items
  useEffect(() => {
    if (!isLoading && cartItems.length === 0 && isAuthenticated) {
      router.push('/cart-new');
      return;
    }
  }, [cartItems, isLoading, isAuthenticated, router]);

  const handleCheckoutComplete = async (orderData: any) => {
    try {
      setIsProcessing(true);
      setCheckoutError(null);

      // Show success message briefly before redirect
      const successMessage = orderData.payment_method === 'flutterwave' 
        ? 'Order created successfully! Redirecting to payment...'
        : orderData.payment_method === 'bank_transfer'
        ? 'Order created successfully! Redirecting to payment instructions...'
        : 'Order completed successfully!';

      // NOTE: Cart will be cleared after successful payment completion
      // Do not clear cart here as payment might fail

      // Brief delay to show success state
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Handle different payment methods
      if (orderData.payment_method === 'flutterwave' && orderData.payment_url) {
        // Redirect to Flutterwave payment page
        window.location.href = orderData.payment_url;
      } else if (orderData.payment_method === 'bank_transfer') {
        // Redirect to bank transfer confirmation page
        router.push(`/payment/bank-transfer/${orderData.order_id}`);
      } else {
        // Default redirect to order confirmation
        router.push(`/order-confirmation/${orderData.order_id}`);
      }
    } catch (error) {
      console.error('Checkout completion error:', error);
      setCheckoutError('Failed to complete checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    router.push('/cart-new');
  };

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-600">Loading checkout...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to continue with your purchase.
          </p>
          <button
            onClick={() => router.push('/login?redirect=/checkout-unified')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your Cart is Empty
          </h2>
          <p className="text-gray-600 mb-6">
            Add some books to your cart before proceeding to checkout.
          </p>
          <button
            onClick={() => router.push('/books')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mr-3"
          >
            Browse Books
          </button>
          <button
            onClick={() => router.push('/cart-new')}
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            View Cart
          </button>
        </div>
      </div>
    );
  }

  // Cart error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cart Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mr-3"
          >
            Retry
          </button>
          <button
            onClick={() => router.push('/cart-new')}
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  // Processing state
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Processing Your Order...
              </h3>
              <p className="text-gray-600">
                Please wait while we finalize your order. This may take a few moments.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 text-blue-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Important:</span>
              </div>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Do not refresh or close this page</li>
                <li>• Do not press the back button</li>
                <li>• You will be redirected automatically</li>
              </ul>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span>Securing your transaction...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main checkout interface
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Checkout Error */}
        {checkoutError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <h4 className="text-red-800 font-medium">Checkout Error</h4>
                <p className="text-red-700 text-sm mt-1">{checkoutError}</p>
              </div>
            </div>
            <button
              onClick={() => setCheckoutError(null)}
              className="mt-3 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Back to Cart */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/cart-new')}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart ({getTotalItems()} items)
          </button>
        </div>

        {/* Secure Checkout Indicator */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <h4 className="text-green-800 font-medium">Secure Checkout</h4>
              <p className="text-green-700 text-sm">
                Your payment information is encrypted and secure. We never store your payment details.
              </p>
            </div>
          </div>
        </div>

        {/* Main Checkout Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <UnifiedCheckoutFlow
              cartItems={cartItems}
              onComplete={handleCheckoutComplete}
              onCancel={handleCancel}
            />
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummarySidebar cartItems={cartItems} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Order Summary Sidebar Component
function OrderSummarySidebar({ cartItems }: { cartItems: any[] }) {
  // Calculate cart analytics with new structure
  const ebooks = cartItems.filter((item) => {
    const format = item.book_format || item.book?.format;
    return format === 'ebook' || format === 'both';
  });
  const physicalBooks = cartItems.filter((item) => {
    const format = item.book_format || item.book?.format;
    return format === 'physical' || format === 'both';
  });

  const isEbookOnly = ebooks.length > 0 && physicalBooks.length === 0;
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.book_price || item.book?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  const shipping = isEbookOnly ? 0 : 3000; // ₦3,000 base cost for Express Shipping
  const tax = Math.round(subtotal * 0.075); // 7.5% tax
  const total = subtotal + shipping + tax;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

      {/* Cart Items */}
      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
        {cartItems.map((item) => {
          const title = item.book_title || item.book?.title || 'Unknown Book';
          const price = item.book_price || item.book?.price || 0;
          const isActive = item.book_is_active ?? item.book?.is_active ?? true;
          
          return (
            <div key={item.id} className="flex justify-between items-start text-sm">
              <div className="flex-1 mr-2">
                <p className="font-medium text-gray-900 line-clamp-2">
                  {title}
                  {!isActive && (
                    <span className="ml-1 text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded">
                      Unavailable
                    </span>
                  )}
                </p>
                <p className="text-gray-500">
                  Qty: {item.quantity} × ₦{price.toLocaleString()}
                </p>
              </div>
              <p className="font-medium text-gray-900">
                ₦{(price * item.quantity).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Summary Totals */}
      <div className="space-y-3 mb-4 border-t pt-4">
        <div className="flex justify-between">
          <span>Subtotal ({cartItems.length} items)</span>
          <span>₦{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{isEbookOnly ? 'Free' : `₦${shipping.toLocaleString()}`}</span>
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

      <p className="text-sm text-gray-600 mt-4">
        {isEbookOnly
          ? 'Ebook orders are delivered instantly via email'
          : 'Physical books ship within 2-3 business days'}
      </p>

      {/* Security Badge */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center text-sm text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
          <span>SSL Secured Checkout</span>
        </div>
      </div>
    </div>
  );
}