'use client';

import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';

export default function PaymentAwaitingApprovalPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-time-line text-3xl text-yellow-600"></i>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Completed Awaiting Approval
          </h1>
          
          <p className="text-gray-600 mb-6 text-lg">
            Your proof of payment has been uploaded successfully. Our team will review and approve your payment within 24 hours.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-blue-900 font-semibold mb-2">What happens next?</h3>
            <ul className="text-blue-800 text-sm space-y-1 text-left">
              <li>• Our team will verify your payment within 24 hours</li>
              <li>• You'll receive an email confirmation once approved</li>
              <li>• Digital books will be added to your library immediately</li>
              <li>• Physical books will be shipped to your address</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard/orders')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View My Orders
            </button>
            
            <button
              onClick={() => router.push('/books')}
              className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}