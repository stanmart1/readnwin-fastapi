'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface PaymentFormProps {
  formData: any;
  updateFormData: (section: string, data: any) => void;
  onNext: () => void;
  onBack: () => void;
  isEbookOnly?: boolean;
}

export default function PaymentForm({ 
  formData, 
  updateFormData, 
  onNext, 
  onBack,
  isEbookOnly = false 
}: PaymentFormProps) {
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate payment method
    if (!formData.payment.method) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    // Validate card details if card payment is selected
    if (formData.payment.method === 'card') {
      if (!formData.payment.cardNumber.trim()) {
        newErrors.cardNumber = 'Card number is required';
      } else if (!/^\d{16}$/.test(formData.payment.cardNumber.replace(/\s/g, ''))) {
        newErrors.cardNumber = 'Please enter a valid card number';
      }
      
      if (!formData.payment.expiryDate.trim()) {
        newErrors.expiryDate = 'Expiry date is required';
      } else if (!/^\d{2}\/\d{2}$/.test(formData.payment.expiryDate)) {
        newErrors.expiryDate = 'Please enter expiry date in MM/YY format';
      }
      
      if (!formData.payment.cvv.trim()) {
        newErrors.cvv = 'CVV is required';
      } else if (!/^\d{3,4}$/.test(formData.payment.cvv)) {
        newErrors.cvv = 'Please enter a valid CVV';
      }
      
      if (!formData.payment.cardholderName.trim()) {
        newErrors.cardholderName = 'Cardholder name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    updateFormData('payment', { method });
  };

  const handleCardInputChange = (field: string, value: string) => {
    updateFormData('payment', { [field]: value });
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Information</h2>
        
        {/* Payment Method Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>
          <div className="space-y-3">
            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
              <input
                type="radio"
                id="flutterwave"
                name="paymentMethod"
                value="flutterwave"
                checked={formData.payment.method === 'flutterwave'}
                onChange={() => handlePaymentMethodChange('flutterwave')}
                className="mr-3"
              />
              <label htmlFor="flutterwave" className="flex items-center flex-1 cursor-pointer">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <i className="ri-bank-card-line text-white text-sm"></i>
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Flutterwave Payment</h4>
                  <p className="text-sm text-gray-500">Pay with card, bank transfer, or mobile money</p>
                </div>
              </label>
            </div>

            <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
              <input
                type="radio"
                id="bank_transfer"
                name="paymentMethod"
                value="bank_transfer"
                checked={formData.payment.method === 'bank_transfer'}
                onChange={() => handlePaymentMethodChange('bank_transfer')}
                className="mr-3"
              />
              <label htmlFor="bank_transfer" className="flex items-center flex-1 cursor-pointer">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <i className="ri-bank-line text-white text-sm"></i>
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Bank Transfer</h4>
                  <p className="text-sm text-gray-500">Pay via bank transfer with proof upload</p>
                </div>
              </label>
            </div>
          </div>
          {errors.paymentMethod && (
            <p className="text-red-500 text-sm mt-1">{errors.paymentMethod}</p>
          )}
        </div>

        {/* Payment Method Specific Forms */}
        {formData.payment.method === 'flutterwave' && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <i className="ri-information-line text-blue-600"></i>
              <span className="text-sm font-medium text-blue-900">Flutterwave Payment</span>
            </div>
            <p className="text-sm text-blue-700">
              You will be redirected to Flutterwave's secure payment page to complete your transaction. 
              {isEbookOnly && ' Digital books will be available immediately after payment.'}
            </p>
          </div>
        )}

        {formData.payment.method === 'bank_transfer' && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <i className="ri-information-line text-green-600"></i>
              <span className="text-sm font-medium text-green-900">Bank Transfer Instructions</span>
            </div>
            <div className="text-sm text-green-700 space-y-2">
              <p>1. Transfer the exact amount to our bank account</p>
              <p>2. Upload proof of payment in the next step</p>
              <p>3. Your order will be processed after verification</p>
              {isEbookOnly && <p>4. Digital books will be available after payment confirmation</p>}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={isProcessing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Continue to Review'}
          </button>
        </div>
      </div>
    </div>
  );
} 