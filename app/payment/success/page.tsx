'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Download, Mail } from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get('order');
  const isTest = searchParams.get('test') === 'true';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            {isTest ? (
              'Test payment completed successfully! This was a test transaction.'
            ) : (
              'Your payment has been processed successfully and your order has been confirmed.'
            )}
            {orderNumber && (
              <>
                <br />
                <span className="text-sm text-gray-500">Order: {orderNumber}</span>
              </>
            )}
          </p>

          {/* Success Details */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 text-left">
            <h3 className="font-medium text-green-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• You will receive an email confirmation shortly</li>
              <li>• Your order has been added to your account</li>
              <li>• eBooks are available for immediate download</li>
              <li>• Physical books will be shipped within 2-3 business days</li>
              <li>• You can track your order in your dashboard</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Link>

            <Link
              href="/orders"
              className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              View My Orders
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
              If you have any questions about your order, please contact us:
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a 
                href="mailto:support@readnwin.com" 
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center"
              >
                <Mail className="w-4 h-4 mr-1" />
                support@readnwin.com
              </a>
              <span className="text-sm text-gray-400 hidden sm:inline">|</span>
              <a 
                href="tel:+2348000000000" 
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                +234 800 000 0000
              </a>
            </div>
          </div>

          {/* Test Mode Notice */}
          {isTest && (
            <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Test Mode:</strong> This was a test payment. No actual charges were made.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 