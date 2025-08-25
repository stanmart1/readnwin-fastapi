'use client';

import { useState } from 'react';

export const dynamic = 'force-dynamic';
import { useAuth } from '@/hooks/useAuth';
import { useFlutterwaveInline } from '@/hooks/useFlutterwaveInline';
import Header from '@/components/Header';

export default function TestInlinePaymentPage() {
  const { user, isAuthenticated } = useAuth();
  const [testResult, setTestResult] = useState<string>('');

  const { initializePayment, isLoading, isScriptLoaded, error } = useFlutterwaveInline({
    onSuccess: (response) => {
      console.log('Payment successful:', response);
      setTestResult(`Payment successful! Status: ${response.status}, Reference: ${response.tx_ref}`);
    },
    onClose: () => {
      console.log('Payment modal closed');
      setTestResult('Payment modal was closed by user');
    },
    onError: (error) => {
      console.error('Payment error:', error);
      setTestResult(`Payment error: ${error.message || 'Unknown error'}`);
    }
  });

  const handleTestPayment = async () => {
    if (!user?.email) {
      setTestResult('Please log in to test payment');
      return;
    }

    try {
      const paymentData = {
        amount: 1000, // 1000 NGN test amount
        currency: 'NGN',
        email: user.email,
        phone_number: '+2348012345678',
        tx_ref: `TEST-${Date.now()}`,
        customizations: {
          title: 'ReadnWin Test Payment',
          description: 'Test payment for inline functionality',
          logo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo.png`,
        },
        meta: {
          test: true,
          user_id: user.id,
          timestamp: new Date().toISOString(),
        }
      };

      await initializePayment(paymentData);
      setTestResult('Initializing payment...');
    } catch (error) {
      console.error('Test payment error:', error);
      setTestResult(`Failed to initialize payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Inline Flutterwave Payment Test</h1>
          
          <div className="space-y-6">
            {/* Status Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Status</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="font-medium">Script Loaded:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${isScriptLoaded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {isScriptLoaded ? 'Yes' : 'Loading...'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">User Logged In:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user ? 'Yes' : 'No'}
                  </span>
                </div>
                {error && (
                  <div className="flex items-center">
                    <span className="font-medium">Error:</span>
                    <span className="ml-2 px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                      {error}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Test Payment Button */}
            <div className="text-center">
              <button
                onClick={handleTestPayment}
                disabled={!isScriptLoaded || !user || isLoading}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  !isScriptLoaded || !user || isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Initializing Payment...' : 'Test Inline Payment (₦1,000)'}
              </button>
            </div>

            {/* Test Results */}
            {testResult && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Test Result</h3>
                <p className="text-blue-800">{testResult}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Instructions</h3>
              <ul className="text-yellow-800 space-y-1 text-sm">
                <li>• This test will open a Flutterwave payment modal in the same page</li>
                <li>• No page redirect will occur (no "leave page" warning)</li>
                <li>• You can use test card: 5531886652142950</li>
                <li>• Expiry: 09/32, CVV: 564, PIN: 3310</li>
                <li>• OTP: 12345</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 