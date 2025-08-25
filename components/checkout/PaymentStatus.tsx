'use client';

import React, { useState, useEffect } from 'react';

interface PaymentStatusProps {
  paymentIntentId: string;
  onRetry?: () => void;
  onSuccess?: () => void;
  onFailure?: () => void;
}

type PaymentStatus = 'processing' | 'succeeded' | 'failed' | 'canceled' | 'requires_action';

interface PaymentStatusData {
  status: PaymentStatus;
  amount: number;
  currency: string;
  lastPaymentError?: any;
  metadata?: any;
}

export default function PaymentStatus({ 
  paymentIntentId, 
  onRetry, 
  onSuccess, 
  onFailure 
}: PaymentStatusProps) {
  const [status, setStatus] = useState<PaymentStatus>('processing');
  const [paymentData, setPaymentData] = useState<PaymentStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  // Poll for payment status updates
  useEffect(() => {
    const pollPaymentStatus = async () => {
      try {
        const response = await Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
        const data = await response.json();

        if (data.success) {
          setPaymentData(data);
          setStatus(data.status);

          // Stop polling for terminal states
          if (['succeeded', 'failed', 'canceled'].includes(data.status)) {
            setIsPolling(false);
            
            // Call appropriate callbacks
            if (data.status === 'succeeded' && onSuccess) {
              onSuccess();
            } else if (['failed', 'canceled'].includes(data.status) && onFailure) {
              onFailure();
            }
          }
        } else {
          setError(data.error || 'Failed to get payment status');
          setIsPolling(false);
        }
      } catch (err) {
        setError('Failed to check payment status');
        setIsPolling(false);
      }
    };

    // Initial check
    pollPaymentStatus();

    // Set up polling interval
    const interval = setInterval(() => {
      if (isPolling) {
        pollPaymentStatus();
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [paymentIntentId, isPolling, onSuccess, onFailure]);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'processing':
        return (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        );
      case 'succeeded':
        return (
          <div className="rounded-full h-8 w-8 bg-green-100 flex items-center justify-center">
            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="rounded-full h-8 w-8 bg-red-100 flex items-center justify-center">
            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'canceled':
        return (
          <div className="rounded-full h-8 w-8 bg-yellow-100 flex items-center justify-center">
            <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="rounded-full h-8 w-8 bg-gray-100 flex items-center justify-center">
            <svg className="h-5 w-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const getStatusMessage = (status: PaymentStatus) => {
    switch (status) {
      case 'processing':
        return 'Processing your payment...';
      case 'succeeded':
        return 'Payment successful!';
      case 'failed':
        return 'Payment failed';
      case 'canceled':
        return 'Payment was canceled';
      case 'requires_action':
        return 'Additional action required';
      default:
        return 'Checking payment status...';
    }
  };

  const getStatusDescription = (status: PaymentStatus) => {
    switch (status) {
      case 'processing':
        return 'Please wait while we process your payment. This may take a few moments.';
      case 'succeeded':
        return 'Your payment has been processed successfully. Your order is being prepared.';
      case 'failed':
        return 'We were unable to process your payment. Please try again or use a different payment method.';
      case 'canceled':
        return 'The payment was canceled. You can try again or choose a different payment method.';
      case 'requires_action':
        return 'Your payment requires additional authentication. Please complete the verification process.';
      default:
        return 'We are checking the status of your payment.';
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center">
        {getStatusIcon(status)}
        
        <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
          {getStatusMessage(status)}
        </h3>
        
        <p className="text-gray-600 mb-4">
          {getStatusDescription(status)}
        </p>

        {paymentData && (
          <div className="bg-gray-50 rounded-md p-4 mb-4">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between mb-1">
                <span>Amount:</span>
                <span className="font-medium">
                  {formatAmount(paymentData.amount, paymentData.currency)}
                </span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Status:</span>
                <span className="font-medium capitalize">{paymentData.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment ID:</span>
                <span className="font-mono text-xs">{paymentIntentId}</span>
              </div>
            </div>
          </div>
        )}

        {status === 'failed' && onRetry && (
          <button
            onClick={onRetry}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        )}

        {status === 'succeeded' && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  Your order has been confirmed and will be processed shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'processing' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 100-2v-4a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  Please do not close this page while we process your payment.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 