'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, Clock, CheckCircle } from 'lucide-react';

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  deliveryTime: string;
  description: string;
  base_cost?: number;
  cost_per_item?: number;
  estimated_days_min?: number;
  estimated_days_max?: number;
  free_shipping_threshold?: number;
}

interface ShippingMethodProps {
  onSelect: (method: ShippingMethod) => void;
  onNext: () => void;
  onBack: () => void;
  selectedMethod?: ShippingMethod | null;
  isEbookOnly?: boolean;
}

export default function ShippingMethod({ 
  onSelect, 
  onNext, 
  onBack, 
  selectedMethod,
  isEbookOnly = false
}: ShippingMethodProps) {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    selectedMethod?.id || ''
  );

  useEffect(() => {
    loadShippingMethods();
  }, []);

  const loadShippingMethods = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Loading shipping methods...');
      const response = await fetch('/api/shipping-methods');
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch shipping methods');
      }

      const data = await response.json();
      console.log('📊 API Response:', data);
      
      let methods = data.methods || [];
      
      // Filter methods based on cart type
      if (isEbookOnly) {
        // For ebook-only carts, only show digital access methods
        methods = methods.filter((method: any) => 
          method.name.toLowerCase().includes('digital') || 
          method.name.toLowerCase().includes('instant') ||
          method.description.toLowerCase().includes('digital')
        );
        console.log('📚 Ebook-only cart - showing digital methods:', methods);
      } else {
        // For physical books, exclude digital-only methods
        methods = methods.filter((method: any) => 
          !method.name.toLowerCase().includes('digital') &&
          !method.description.toLowerCase().includes('instant digital access')
        );
        console.log('📦 Physical book cart - showing shipping methods:', methods);
      }
      
      console.log('📦 Filtered shipping methods:', methods);

      setShippingMethods(methods);
      
      // Auto-select first available shipping method if none selected
      if (!selectedMethodId && methods.length > 0) {
        console.log('✅ Auto-selecting first method:', methods[0]);
        setSelectedMethodId(methods[0].id);
        onSelect(methods[0]);
      }
    } catch (err) {
      console.error('❌ Error loading shipping methods:', err);
      setError('Failed to load shipping methods. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethodId(methodId);
    const method = shippingMethods.find(m => m.id === methodId);
    if (method) {
      onSelect(method);
    }
  };

  const handleNext = () => {
    if (selectedMethodId) {
      onNext();
    }
  };

  const formatDeliveryTime = (method: ShippingMethod) => {
    if (method.estimated_days_min && method.estimated_days_max) {
      return `${method.estimated_days_min}-${method.estimated_days_max} business days`;
    }
    return method.deliveryTime;
  };

  const getMethodIcon = (method: ShippingMethod) => {
    if (method.name.toLowerCase().includes('express') || method.name.toLowerCase().includes('priority')) {
      return <Package className="w-5 h-5 text-blue-600" />;
    }
    if (method.name.toLowerCase().includes('standard') || method.name.toLowerCase().includes('regular')) {
      return <Truck className="w-5 h-5 text-green-600" />;
    }
    return <Truck className="w-5 h-5 text-gray-600" />;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Shipping Method</h2>
          <p className="text-gray-600">Choose your preferred delivery option</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading shipping options...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Shipping Method</h2>
          <p className="text-gray-600">Choose your preferred delivery option</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Shipping Methods</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
        <button
          onClick={loadShippingMethods}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shipping Method</h2>
        <p className="text-gray-600">Choose your preferred delivery option</p>
      </div>

      {/* Shipping Type Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Truck className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-medium text-blue-900">
              {isEbookOnly ? 'Digital Delivery' : 'Physical Book Shipping'}
            </h3>
            <p className="text-sm text-blue-700">
              {isEbookOnly 
                ? 'Your eBooks will be available instantly after payment'
                : 'Select how you want your physical books delivered'
              }
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 mb-6">
        {shippingMethods.map((method) => (
          <div
            key={method.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedMethodId === method.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleMethodSelect(method.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="shippingMethod"
                  value={method.id}
                  checked={selectedMethodId === method.id}
                  onChange={() => handleMethodSelect(method.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-3">
                  {getMethodIcon(method)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{method.name}</h3>
                      {selectedMethodId === method.id && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{method.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDeliveryTime(method)}
                      </span>
                      {method.free_shipping_threshold && (
                        <span className="text-sm text-green-600">
                          Free shipping over ₦{method.free_shipping_threshold.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {method.price === 0 ? (
                    <span className="text-green-600 font-semibold">Free</span>
                  ) : (
                    `₦${method.price.toFixed(0)}`
                  )}
                </p>
                {method.price > 0 && (
                  <p className="text-xs text-gray-500">Shipping fee</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {shippingMethods.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No Shipping Methods Available</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Please check your shipping address or contact support for assistance.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedMethodId || shippingMethods.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
} 