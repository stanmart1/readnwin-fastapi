'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';

export default function PaymentVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, status } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'loading') return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const verifyPayment = async () => {
      try {
        // Get transaction reference from URL params
        const txRef = searchParams.get('tx_ref');
        const transactionId = searchParams.get('transaction_id');
        const status = searchParams.get('status');

        if (!txRef) {
          setVerificationStatus('failed');
          setMessage('No transaction reference found');
          return;
        }

        // Handle cancelled payments
        if (status === 'cancelled') {
          router.push(`/payment/cancelled?order=${txRef}`);
          return;
        }

        // Verify payment with backend
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/verify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transaction_reference: txRef,
            payment_provider: 'flutterwave',
            verification_data: {
              status: status,
              transaction_id: transactionId
            }
          }),
        });

        const data = await response.json();

        if (data.success) {
          if (data.payment_status === 'successful') {
            setVerificationStatus('success');
            setMessage('Payment completed successfully!');
          } else if (data.payment_status === 'pending') {
            setVerificationStatus('pending');
            setMessage('Payment is being processed. Please wait...');
          } else {
            setVerificationStatus('failed');
            setMessage(data.message || 'Payment verification failed');
          }
        } else {
          setVerificationStatus('failed');
          setMessage(data.error || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setVerificationStatus('failed');
        setMessage('An error occurred during payment verification');
      }
    };

    verifyPayment();
  }, [isAuthenticated, status, router, searchParams]);

  const handleContinue = () => {
    router.push('/dashboard');
  };

  const handleRetry = () => {
    router.push('/checkout-new');
  };

  if (status === 'loading' || verificationStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying payment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-20">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            {/* Status Icon */}
            <div className="mb-6">
              {verificationStatus === 'success' && (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <i className="ri-check-line text-3xl text-green-600"></i>
                </div>
              )}
              {verificationStatus === 'failed' && (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <i className="ri-close-line text-3xl text-red-600"></i>
                </div>
              )}
              {verificationStatus === 'pending' && (
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                  <i className="ri-time-line text-3xl text-yellow-600"></i>
                </div>
              )}
            </div>

            {/* Status Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {verificationStatus === 'success' && 'Payment Successful!'}
              {verificationStatus === 'failed' && 'Payment Failed'}
              {verificationStatus === 'pending' && 'Payment Pending'}
            </h1>

            {/* Status Message */}
            <p className="text-gray-600 mb-8">{message}</p>

            {/* Action Buttons */}
            <div className="space-y-3">
              {verificationStatus === 'success' && (
                <button
                  onClick={handleContinue}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                >
                  Continue to Dashboard
                </button>
              )}

              {verificationStatus === 'failed' && (
                <button
                  onClick={handleRetry}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                >
                  Try Again
                </button>
              )}

              {verificationStatus === 'pending' && (
                <button
                  onClick={handleContinue}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  Go to Dashboard
                </button>
              )}

              <button
                onClick={() => router.push('/books')}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
              >
                Browse Books
              </button>
            </div>

            {/* Additional Info */}
            {verificationStatus === 'success' && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  You will receive an email confirmation shortly. Your order has been processed successfully.
                </p>
              </div>
            )}

            {verificationStatus === 'failed' && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  If you believe this is an error, please contact our support team.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 