'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get('order');
  const reason = searchParams.get('reason');

  const getErrorMessage = (reason: string | null) => {
    switch (reason) {
      case 'verification_failed':
        return 'Payment verification failed. Please try again or contact support.';
      case 'verification_error':
        return 'An error occurred while verifying your payment. Please contact support.';
      case 'unknown_status':
        return 'Payment status could not be determined. Please contact support.';
      case 'server_error':
        return 'A server error occurred. Please try again later.';
      case 'missing_params':
        return 'Invalid payment parameters. Please start the checkout process again.';
      case 'payment_failed':
        return 'Your payment was not successful. This could be due to insufficient funds, incorrect card details, or other payment issues.';
      case 'payment_error':
        return 'An error occurred during payment processing. Please try again or contact support if the problem persists.';
      case 'card_declined':
        return 'Your card was declined by your bank. Please try a different payment method or contact your bank.';
      case 'insufficient_funds':
        return 'Insufficient funds in your account. Please try a different payment method or add funds to your account.';
      case 'expired_card':
        return 'Your card has expired. Please use a different payment method.';
      case 'invalid_card':
        return 'Invalid card details provided. Please check your card information and try again.';
      default:
        return 'Your payment could not be processed. Please try again or use a different payment method.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Failed
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            {getErrorMessage(reason)}
            {orderNumber && (
              <>
                <br />
                <span className="text-sm text-gray-500">Order: {orderNumber}</span>
              </>
            )}
          </p>

          {/* Common Issues */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-left">
            <h3 className="font-medium text-red-900 mb-2 flex items-center">
              <HelpCircle className="w-4 h-4 mr-2" />
              Common Issues
            </h3>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• Insufficient funds in your account</li>
              <li>• Incorrect card details or expired card</li>
              <li>• Network connectivity issues</li>
              <li>• Payment limit exceeded</li>
              <li>• Card blocked by your bank</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/checkout-enhanced')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Payment Again
            </button>

            <Link
              href="/cart-new"
              className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Cart
            </Link>

            <Link
              href="/books"
              className="w-full text-blue-600 hover:text-blue-700 py-2 text-center block"
            >
              Continue Shopping
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
            <p className="text-sm text-gray-500 mb-4">
              If you continue to experience issues, please try:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              <li>• Using a different payment method</li>
              <li>• Contacting your bank to authorize the payment</li>
              <li>• Checking your internet connection</li>
              <li>• Trying again in a few minutes</li>
            </ul>
            <p className="text-sm text-gray-500">
              Still having trouble? Contact our support team at{' '}
              <a href="mailto:support@readnwin.com" className="text-blue-600 hover:text-blue-700">
                support@readnwin.com
              </a>
              {' '}or call us at{' '}
              <a href="tel:+2348000000000" className="text-blue-600 hover:text-blue-700">
                +234 800 000 0000
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 