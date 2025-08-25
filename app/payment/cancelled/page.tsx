'use client';

import { useSearchParams, useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';

function PaymentCancelledContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get('order');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Your payment was cancelled and no charges were made to your account.
            {orderNumber && (
              <>
                <br />
                <span className="text-sm text-gray-500">Order: {orderNumber}</span>
              </>
            )}
          </p>

          {/* What Happened */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-left">
            <h3 className="font-medium text-yellow-900 mb-2">What happened?</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• You cancelled the payment process</li>
              <li>• No money was charged to your account</li>
              <li>• Your order is still pending payment</li>
              <li>• Your cart items remain saved for retry</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/checkout-new')}
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

          {/* Help */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@readnwin.com" className="text-blue-600 hover:text-blue-700">
                support@readnwin.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelledPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <PaymentCancelledContent />
    </Suspense>
  );
} 