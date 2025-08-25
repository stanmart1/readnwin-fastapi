'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/contexts/CartContextNew';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [message, setMessage] = useState('Processing payment...');

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        const txRef = searchParams.get('tx_ref');
        const status = searchParams.get('status');
        
        if (!txRef) {
          setStatus('failed');
          setMessage('Invalid payment reference');
          return;
        }

        // Complete payment and clear cart only on success
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            transaction_reference: txRef,
            status: status === 'successful' ? 'successful' : 'failed',
            verification_data: Object.fromEntries(searchParams.entries())
          })
        });

        const result = await response.json();

        if (result.success) {
          setStatus('success');
          setMessage('Payment completed successfully!');
          
          // Clear cart only after successful payment
          if (result.cart_cleared) {
            await clearCart();
          }
          
          // Redirect to order confirmation
          setTimeout(() => {
            router.push(`/order-confirmation/${result.order_id}`);
          }, 2000);
        } else {
          setStatus('failed');
          setMessage(result.message || 'Payment failed');
          
          // Redirect back to cart with items intact
          setTimeout(() => {
            router.push('/cart-new?payment_failed=true');
          }, 3000);
        }
      } catch (error) {
        console.error('Payment callback error:', error);
        setStatus('failed');
        setMessage('Payment verification failed');
        
        setTimeout(() => {
          router.push('/cart-new?payment_error=true');
        }, 3000);
      }
    };

    handlePaymentCallback();
  }, [searchParams, clearCart, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting to order confirmation...</p>
          </>
        )}
        
        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-2">Your cart items are still available. Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}