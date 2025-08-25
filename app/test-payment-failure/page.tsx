'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useFlutterwaveInline } from '@/hooks/useFlutterwaveInline';

export default function TestPaymentFailurePage() {
  const router = useRouter();
  const [testScenario, setTestScenario] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { initializePayment } = useFlutterwaveInline({
    onSuccess: (response) => {
      console.log('Payment successful:', response);
      if (response.status === 'successful') {
        router.push('/payment/success?test=true');
      } else {
        const orderNumber = response.meta?.order_number || 'TEST-ORDER';
        router.push(`/payment/failed?order=${orderNumber}&reason=payment_failed`);
      }
    },
    onClose: () => {
      console.log('Payment modal closed - user cancelled');
      router.push('/payment/cancelled?order=TEST-ORDER');
    },
    onError: (error) => {
      console.error('Payment error:', error);
      router.push('/payment/failed?order=TEST-ORDER&reason=payment_error');
    }
  });

  const handleTestPayment = async (scenario: string) => {
    setIsLoading(true);
    setTestScenario(scenario);

    try {
      const paymentData = {
        amount: 1000, // 1000 NGN
        currency: 'NGN',
        email: 'test@example.com',
        phone_number: '+2341234567890',
        tx_ref: `TEST-${Date.now()}-${scenario}`,
        customizations: {
          title: 'ReadnWin Payment Test',
          description: `Test payment for scenario: ${scenario}`,
          logo: 'https://readnwin.com/logo.png',
        },
        meta: {
          order_id: 'TEST-ORDER-123',
          user_id: 'TEST-USER-456',
          order_number: 'TEST-ORDER',
          test_scenario: scenario
        }
      };

      await initializePayment(paymentData);
    } catch (error) {
      console.error('Test payment error:', error);
      router.push('/payment/failed?order=TEST-ORDER&reason=test_error');
    } finally {
      setIsLoading(false);
    }
  };

  const testScenarios = [
    {
      id: 'success',
      title: 'Successful Payment',
      description: 'Simulate a successful payment flow',
      color: 'bg-green-500'
    },
    {
      id: 'cancelled',
      title: 'Cancelled Payment',
      description: 'Simulate user cancelling the payment',
      color: 'bg-yellow-500'
    },
    {
      id: 'failed',
      title: 'Failed Payment',
      description: 'Simulate a failed payment',
      color: 'bg-red-500'
    },
    {
      id: 'card_declined',
      title: 'Card Declined',
      description: 'Simulate card being declined by bank',
      color: 'bg-red-600'
    },
    {
      id: 'insufficient_funds',
      title: 'Insufficient Funds',
      description: 'Simulate insufficient funds error',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Failure Handling Test
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This page allows you to test different payment scenarios to verify that the 
            application properly handles payment failures and cancellations with Flutterwave.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <div className={`w-12 h-12 ${scenario.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <span className="text-white font-bold text-lg">
                  {scenario.id.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {scenario.title}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4">
                {scenario.description}
              </p>
              
              <button
                onClick={() => handleTestPayment(scenario.id)}
                disabled={isLoading}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : `${scenario.color} text-white hover:opacity-90`
                }`}
              >
                {isLoading && testScenario === scenario.id ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Testing...
                  </span>
                ) : (
                  `Test ${scenario.title}`
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Test Instructions
          </h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>• <strong>Successful Payment:</strong> Complete the payment normally to test success flow</li>
            <li>• <strong>Cancelled Payment:</strong> Close the payment modal to test cancellation handling</li>
            <li>• <strong>Failed Payment:</strong> Use invalid card details to test failure handling</li>
            <li>• <strong>Card Declined:</strong> Use a card that will be declined by the bank</li>
            <li>• <strong>Insufficient Funds:</strong> Use a card with insufficient funds</li>
          </ul>
          
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p className="text-blue-900 text-sm">
              <strong>Note:</strong> These tests will redirect you to the appropriate success, failed, or cancelled pages 
              to verify that the design system is maintained and error handling works correctly.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
} 