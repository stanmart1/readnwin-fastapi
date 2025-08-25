'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function BankTransferSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-check-line text-3xl text-green-600"></i>
          </div>
          
          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Order Successful!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Your order has been placed successfully. Payment is awaiting approval.
          </p>
          
          {/* Additional Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              What happens next?
            </h2>
            <ul className="text-left text-blue-800 space-y-2">
              <li className="flex items-start">
                <i className="ri-time-line text-blue-600 mr-2 mt-0.5"></i>
                <span>Our team will review your payment proof within 24 hours</span>
              </li>
              <li className="flex items-start">
                <i className="ri-mail-line text-blue-600 mr-2 mt-0.5"></i>
                <span>You'll receive an email notification once payment is verified</span>
              </li>
              <li className="flex items-start">
                <i className="ri-download-line text-blue-600 mr-2 mt-0.5"></i>
                <span>Digital books will be available for download after verification</span>
              </li>
            </ul>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
            
            <button
              onClick={() => router.push('/dashboard/orders')}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              View My Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 