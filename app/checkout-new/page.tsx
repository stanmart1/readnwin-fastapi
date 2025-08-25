'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, CreditCard, Banknote, Globe } from 'lucide-react';
import { useCart } from '@/contexts/CartContextNew';
import { useGuestCart } from '@/contexts/GuestCartContext';
import { useFlutterwaveInline } from '@/hooks/useFlutterwaveInline';
import { useCheckoutFlow } from '@/hooks/useCheckoutFlow';
import { useCheckoutError } from '@/hooks/useCheckoutError';
import { fetchShippingMethods } from '@/utils/api';
import Header from '@/components/Header';
import CheckoutFlow from '@/components/checkout/CheckoutFlow';
import OrderSummary from '@/components/checkout/OrderSummary';

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  deliveryTime: string;
  description: string;
}

interface CheckoutStep {
  id: number;
  title: string;
  description: string;
  required: boolean;
}

export default function CheckoutPage() {
  const { user, isAuthenticated, status } = useAuth();
  const router = useRouter();
  
  // Use cart context
  const { 
    cartItems, 
    isLoading: cartLoading,
    isEbookOnly,
    isPhysicalOnly,
    isMixedCart,
    getTotalItems,
    getSubtotal,
    analytics,
    clearCart
  } = useCart();

  // Initialize checkout flow
  const {
    error: checkoutError,
    isProcessing,
    checkoutData,
    handleCheckout,
    fetchShippingMethods
  } = useCheckoutFlow({
    isGuest: !isAuthenticated,
    onSuccess: (orderId) => {
      // Clear checkout data from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('checkout-form-data');
        localStorage.removeItem('checkout-current-step');
      }
      router.push(`/order-confirmation/${orderId}`);
    }
  });

  const { error, handleCheckoutError } = useCheckoutError();
  
  // Loading state is handled by useCheckoutFlow
  const [checkoutSummary, setCheckoutSummary] = useState<any>(null);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);

  // Flutterwave inline payment hook
  const { initializePayment } = useFlutterwaveInline({
    onSuccess: (response) => {
      console.log('Payment successful:', response);
      if (response.status === 'successful') {
        router.push(`/order-confirmation/${response.meta?.order_id || 'success'}`);
      }
    },
    onClose: () => {
      console.log('Payment modal closed');
    },
    onError: (error) => {
      console.error('Payment error:', error);
    }
  });

  // Load checkout data
  useEffect(() => {
    if (cartItems.length > 0) {
      loadCheckoutData();
    }
  }, [cartItems]);

  // Add beforeunload event listener to warn users when leaving with unsaved data
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasCheckoutData = localStorage.getItem('checkout-form-data');
      if (hasCheckoutData) {
        e.preventDefault();
        e.returnValue = 'You have unsaved checkout data. Are you sure you want to leave?';
        return 'You have unsaved checkout data. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const loadCheckoutData = async () => {
    try {
      // Load shipping methods
      const methods = await fetchShippingMethods();
      
      // Update checkout summary with cart data
      if (cartItems?.length > 0) {
        const subtotal = cartItems.reduce((sum, item) => {
          const price = item.book_price || item.book?.price || 0;
          return sum + (price * item.quantity);
        }, 0);
        setCheckoutSummary({
          subtotal,
          items: cartItems,
          itemCount: getTotalItems()
        });
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
      handleCheckoutError('Failed to load checkout data. Please try again.');
    }
  };

  // Redirect to cart if no items
  useEffect(() => {
    if (status === 'loading') return;

    if (cartItems.length === 0) {
      router.push('/cart-new');
      return;
    }
  }, [status, router, cartItems]);

  const handleCheckoutComplete = async (orderData: any) => {
    try {
      if (!cartItems.length) {
        handleCheckoutError('Your cart is empty');
        return;
      }

      // Transform order data to match backend schema
      const checkoutRequest = {
        shipping_address: {
          first_name: orderData.shipping?.firstName || '',
          last_name: orderData.shipping?.lastName || '',
          email: orderData.shipping?.email || user?.email || '',
          phone: orderData.shipping?.phone || '',
          address: orderData.shipping?.address || '',
          city: orderData.shipping?.city || '',
          state: orderData.shipping?.state || '',
          zip_code: orderData.shipping?.lga || '',
          country: orderData.shipping?.country || 'NG'
        },
        billing_address: {
          same_as_shipping: orderData.billing?.sameAsShipping ?? true
        },
        payment: {
          method: orderData.payment?.method || 'bank_transfer',
          gateway: orderData.payment?.gateway || 'bank_transfer'
        },
        cart_items: cartItems.map(item => ({
          book_id: item.book_id,
          quantity: item.quantity,
          price: (item.book?.price || item.price || 0).toString()
        })),
        is_ebook_only: isEbookOnly()
      };

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/checkout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkoutRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create order');
      }

      const result = await response.json();
      
      // Clear the cart after successful order creation and refresh to sync with backend
      await clearCart();
      
      router.push(`/order-confirmation/${result.order_id}`);
    } catch (err) {
      console.error('Error completing checkout:', err);
      handleCheckoutError('An unexpected error occurred during checkout. Please try again.');
    }
  };

  const handleInlinePayment = async (result: any) => {
    try {
      // Extract payment data from result
      const paymentData = {
        amount: result.order.total_amount,
        currency: 'NGN',
        email: user?.email || '',
        phone_number: result.order.shipping_address?.phone || '',
        tx_ref: result.order.order_number,
        customizations: {
          title: 'ReadnWin Payment',
          description: `Payment for order ${result.order.order_number}`,
          logo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo.png`,
        },
        meta: {
          order_id: result.order.id,
          user_id: user?.id,
          order_number: result.order.order_number,
        }
      };

      // Initialize inline payment
      await initializePayment(paymentData);
    } catch (error) {
      console.error('Inline payment error:', error);
    }
  };

  const handleBackToCart = () => {
    // Clear checkout data when user goes back to cart
    if (typeof window !== 'undefined') {
      localStorage.removeItem('checkout-form-data');
      localStorage.removeItem('checkout-current-step');
    }
    router.push('/cart-new');
  };

  if (status === 'loading' || cartLoading || isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return null; // Will redirect to cart
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your purchase</p>
        </div>

        {/* Cart Type Indicator */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isEbookOnly() 
                    ? 'bg-green-100 text-green-600' 
                    : isPhysicalOnly() 
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-purple-100 text-purple-600'
                }`}>
                  {isEbookOnly() ? (
                    <Globe className="w-5 h-5" />
                  ) : isPhysicalOnly() ? (
                    <CreditCard className="w-5 h-5" />
                  ) : (
                    <Banknote className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {isEbookOnly() ? 'Digital Books Only' :
                     isPhysicalOnly() ? 'Physical Books Only' :
                     'Mixed Cart'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  ₦{(analytics?.totalValue || getSubtotal()).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  Total Value
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Checkout Flow */}
        <CheckoutFlow
          cartItems={cartItems}
          isEbookOnly={isEbookOnly}
          isPhysicalOnly={isPhysicalOnly}
          isMixedCart={isMixedCart}
          analytics={analytics || { totalValue: getSubtotal(), totalItems: getTotalItems() }}
          onComplete={handleCheckoutComplete}
          onBack={handleBackToCart}
          clearCart={clearCart}
        />
      </div>
    </div>
  );
} 