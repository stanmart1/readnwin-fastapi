'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import PaymentMethodSelection from '@/components/checkout/PaymentMethodSelection';
import { PaymentMethod } from '@/types/ecommerce';
import { handlePostCheckoutRedirect, PaymentIntegrationHandlers } from '@/lib/checkout-integration';
import { useFlutterwaveInline } from '@/hooks/useFlutterwaveInline';
import { apiClient } from '@/lib/api-client';

export default function PaymentMethodSelectionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock auth for now - replace with actual useAuth hook
  const user = { id: '1', email: 'user@example.com' };
  const isAuthenticated = true;
  const status = 'authenticated';

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
      alert('Payment failed. Please try again.');
    }
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [status, router]);

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
      alert('Failed to initialize payment. Please try again.');
    }
  };

  const handleProceedToPayment = async (method: PaymentMethod) => {
    setIsLoading(true);

    try {
      // Create order and initiate payment
      const result = await apiClient.request('/checkout-new', {
        method: 'POST',
        body: JSON.stringify({
          payment: {
            method: method,
            gateway: method
          }
        }),
      });

      if (result.success) {
        // Use the integration utility to handle redirects
        const redirectPath = handlePostCheckoutRedirect({
          paymentMethod: method,
          orderId: result.order.id,
          orderNumber: result.order.order_number,
          bankTransferId: result.bankTransferId,
          paymentUrl: result.paymentUrl,
          userId: parseInt(user?.id || '0')
        });

        // Handle payment method specific integration
        if (method === 'bank_transfer' && result.bankTransferId) {
          await PaymentIntegrationHandlers.bank_transfer.onInitiated(
            result.order.id, 
            result.bankTransferId
          );
        }

        // Handle payment method specific redirects
        if (method === 'flutterwave' && result.paymentUrl) {
          // Use inline payment for Flutterwave instead of redirect
          await handleInlinePayment(result);
        } else {
          router.push(redirectPath);
        }
      } else {
        alert(result.error || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('There was an error processing your payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <button 
            onClick={() => router.push('/cart-new')}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Cart
          </button>
          <i className="ri-arrow-right-s-line"></i>
          <button 
            onClick={() => router.push('/checkout-new')}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Checkout
          </button>
          <i className="ri-arrow-right-s-line"></i>
          <span className="text-gray-900 font-medium">Payment Method</span>
        </nav>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <PaymentMethodSelection
            onProceedToPayment={handleProceedToPayment}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
} 