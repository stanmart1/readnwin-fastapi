'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentMethod } from '@/types/ecommerce';
import { apiClient } from '@/lib/api-client';

interface PaymentGateway {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  testMode: boolean;
  status: string;
  features: string[];
  supportedCurrencies: string[];
}

interface PaymentMethodSelectionProps {
  onProceedToPayment: (method: PaymentMethod) => void;
  isLoading?: boolean;
}

export default function PaymentMethodSelection({ 
  onProceedToPayment, 
  isLoading = false 
}: PaymentMethodSelectionProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load payment gateways from API
  useEffect(() => {
    const loadPaymentGateways = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await apiClient.getPaymentGateways();
        const enabledGateways = data.gateways || [];
        setPaymentGateways(enabledGateways);
        
        // Don't auto-select any payment method - user must choose
        // if (enabledGateways.length > 0) {
        //   setSelectedMethod(enabledGateways[0].id as PaymentMethod);
        // }
      } catch (error) {
        console.error('Error loading payment gateways:', error);
        setError('Failed to load payment options. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPaymentGateways();
  }, []);

  const handleMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  const handleProceedToPayment = () => {
    if (selectedMethod) {
      onProceedToPayment(selectedMethod);
    }
  };

  const handleBackToCheckout = () => {
    router.push('/checkout-new');
  };

  // Get method-specific benefits
  const getMethodBenefits = (gatewayId: string): string[] => {
    switch (gatewayId) {
      case 'flutterwave':
        return [
          'Instant payment processing',
          'Multiple payment options (Card, Bank Transfer, Mobile Money)',
          'Secure and encrypted transactions',
          'eBooks added to library immediately after payment'
        ];
      case 'bank_transfer':
        return [
          'No additional processing fees',
          'Direct bank transfer',
          'Upload proof of payment',
          'eBooks added to library after payment confirmation'
        ];
      default:
        return ['Secure payment processing', 'Fast transaction completion'];
    }
  };

  // Get method-specific icon
  const getMethodIcon = (gatewayId: string): string => {
    switch (gatewayId) {
      case 'flutterwave':
        return 'ri-bank-card-line';
      case 'bank_transfer':
        return 'ri-bank-line';
      default:
        return 'ri-secure-payment-line';
    }
  };

  // Get method-specific color
  const getMethodColor = (gatewayId: string): string => {
    switch (gatewayId) {
      case 'flutterwave':
        return 'blue';
      case 'bank_transfer':
        return 'green';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment options...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-error-warning-line text-2xl text-red-600"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Payment Options</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (paymentGateways.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-alert-line text-2xl text-yellow-600"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Methods Available</h3>
          <p className="text-gray-600 mb-4">Please contact support for assistance with payment options.</p>
          <button
            onClick={handleBackToCheckout}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Checkout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Payment Method</h2>
        <p className="text-gray-600">Select your preferred payment option to complete your purchase</p>
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        {paymentGateways.map((gateway) => {
          const color = getMethodColor(gateway.id);
          const icon = getMethodIcon(gateway.id);
          const benefits = getMethodBenefits(gateway.id);
          
          return (
            <div
              key={gateway.id}
                              className={`border rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                  selectedMethod === gateway.id
                    ? color === 'blue'
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-md'
                      : 'border-green-500 bg-green-50 ring-2 ring-green-200 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              onClick={() => handleMethodChange(gateway.id as PaymentMethod)}
            >
              <div className="flex items-start space-x-4">
                {/* Radio Button */}
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === gateway.id
                      ? color === 'blue'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedMethod === gateway.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>

                {/* Icon */}
                                 <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                   color === 'blue' ? 'bg-blue-100' : 'bg-green-100'
                 }`}>
                   <i className={`${icon} text-xl ${color === 'blue' ? 'text-blue-600' : 'text-green-600'}`}></i>
                 </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{gateway.name}</h3>
                    {gateway.testMode && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Test Mode
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-3">{gateway.description}</p>
                  
                  {/* Benefits */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <i className={`ri-check-line text-sm ${color === 'blue' ? 'text-blue-600' : 'text-green-600'}`}></i>
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  {gateway.features && gateway.features.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {gateway.features.slice(0, 3).map((feature, index) => (
                        <span 
                          key={index}
                          className={`px-2 py-1 text-xs rounded-full ${
                            color === 'blue' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
        <button
          onClick={handleBackToCheckout}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          <i className="ri-arrow-left-line mr-2"></i>
          Back to Checkout
        </button>
        
        <button
          onClick={handleProceedToPayment}
          disabled={isLoading || !selectedMethod}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              Continue to Payment
              <i className="ri-arrow-right-line ml-2"></i>
            </>
          )}
        </button>
      </div>

      {/* Payment Security Notice */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <div className="flex items-center space-x-2 mb-2">
          <i className="ri-shield-check-line text-green-600"></i>
          <h4 className="font-medium text-gray-900">Secure Payment</h4>
        </div>
        <p className="text-sm text-gray-600">
          All payments are processed securely with industry-standard encryption. 
          Your payment information is never stored on our servers.
        </p>
      </div>
    </div>
  );
} 