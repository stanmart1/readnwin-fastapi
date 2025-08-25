'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, Clock, CheckCircle, MapPin, AlertCircle } from 'lucide-react';
import { ShippingMethod, ShippingAddress } from '@/lib/enhanced-shipping-service';

interface EnhancedShippingMethodProps {
  onSelect: (method: ShippingMethod) => void;
  onNext: () => void;
  onBack: () => void;
  selectedMethod?: ShippingMethod | null;
  shippingAddress?: ShippingAddress;
  cartSubtotal: number;
  itemCount: number;
  isEbookOnly?: boolean;
}

interface ShippingCalculation {
  shipping_cost: number;
  free_shipping_threshold?: number;
  estimated_days: string;
  available_methods: ShippingMethod[];
}

export default function EnhancedShippingMethod({ 
  onSelect, 
  onNext, 
  onBack, 
  selectedMethod,
  shippingAddress,
  cartSubtotal,
  itemCount,
  isEbookOnly = false
}: EnhancedShippingMethodProps) {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [calculation, setCalculation] = useState<ShippingCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(
    selectedMethod?.id || null
  );

  useEffect(() => {
    if (!isEbookOnly && shippingAddress) {
      loadShippingCalculation();
    } else {
      loadShippingMethods();
    }
  }, [isEbookOnly, shippingAddress]);

  const loadShippingMethods = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/shipping/enhanced?action=methods');
      if (!response.ok) {
        throw new Error('Failed to fetch shipping methods');
      }

      const data = await response.json();
      let methods = data.methods || [];
      
      // Filter methods based on cart type
      if (isEbookOnly) {
        methods = methods.filter((method: ShippingMethod) => 
          method.name.toLowerCase().includes('digital') || 
          method.name.toLowerCase().includes('instant') ||
          method.description.toLowerCase().includes('digital')
        );
      } else {
        methods = methods.filter((method: ShippingMethod) => 
          !method.name.toLowerCase().includes('digital') &&
          !method.description.toLowerCase().includes('instant digital access')
        );
      }

      setShippingMethods(methods);
      
      // Auto-select first available method if none selected
      if (!selectedMethodId && methods.length > 0) {
        setSelectedMethodId(methods[0].id);
        onSelect(methods[0]);
      }
    } catch (err) {
      console.error('Error loading shipping methods:', err);
      setError('Failed to load shipping methods. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadShippingCalculation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/shipping/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calculate',
          address: shippingAddress,
          cartSubtotal,
          itemCount
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate shipping');
      }

      const data = await response.json();
      const calc = data.calculation;
      
      setCalculation(calc);
      setShippingMethods(calc.available_methods);
      
      // Auto-select first available method if none selected
      if (!selectedMethodId && calc.available_methods.length > 0) {
        setSelectedMethodId(calc.available_methods[0].id);
        onSelect(calc.available_methods[0]);
      }
    } catch (err) {
      console.error('Error calculating shipping:', err);
      setError('Failed to calculate shipping. Please try again.');
      // Fallback to basic method loading
      loadShippingMethods();
    } finally {
      setIsLoading(false);
    }
  };

  const handleMethodSelect = (methodId: number) => {
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

  const getMethodIcon = (method: ShippingMethod) => {
    if (method.name.toLowerCase().includes('express') || method.name.toLowerCase().includes('priority')) {
      return <Package className="w-5 h-5 text-blue-600" />;
    }
    if (method.name.toLowerCase().includes('standard') || method.name.toLowerCase().includes('regular')) {
      return <Truck className="w-5 h-5 text-green-600" />;
    }
    if (method.name.toLowerCase().includes('same day') || method.name.toLowerCase().includes('overnight')) {
      return <Clock className="w-5 h-5 text-red-600" />;
    }
    return <Truck className="w-5 h-5 text-gray-600" />;
  };

  const calculateMethodCost = (method: ShippingMethod) => {
    if (method.free_shipping_threshold && cartSubtotal >= method.free_shipping_threshold) {
      return 0;
    }
    return method.base_cost + (method.cost_per_item * itemCount);
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading shipping options...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Shipping</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={loadShippingMethods}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (shippingMethods.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">No Shipping Methods Available</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Please check your shipping address or contact support for assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Shipping Method</h3>
        <p className="text-sm text-gray-600">
          Select your preferred delivery option. Shipping costs are calculated based on your location and order value.
        </p>
      </div>

      {/* Shipping Summary */}
      {calculation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Shipping to:</span>
          </div>
          <p className="text-sm text-blue-700">
            {shippingAddress?.city}, {shippingAddress?.state}, {shippingAddress?.country}
          </p>
          {calculation.free_shipping_threshold && (
            <p className="text-sm text-blue-600 mt-1">
              Spend ₦{(calculation.free_shipping_threshold - cartSubtotal).toLocaleString()} more for free shipping!
            </p>
          )}
        </div>
      )}

      {/* Shipping Methods */}
      <div className="space-y-3">
        {shippingMethods.map((method) => {
          const methodCost = calculateMethodCost(method);
          const isSelected = selectedMethodId === method.id;
          const isFree = methodCost === 0;
          
          return (
            <div
              key={method.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                isSelected
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
                    checked={isSelected}
                    onChange={() => handleMethodSelect(method.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    {getMethodIcon(method)}
                    <div>
                      <h4 className="font-medium text-gray-900">{method.name}</h4>
                      <p className="text-sm text-gray-600">{method.description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {method.estimated_days_min}-{method.estimated_days_max} business days
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {isFree ? (
                    <div className="text-green-600">
                      <CheckCircle className="inline h-4 w-4 mr-1" />
                      <span className="font-semibold">Free!</span>
                    </div>
                  ) : (
                    <p className="font-semibold text-gray-900">
                      {formatPrice(methodCost)}
                    </p>
                  )}
                  {method.free_shipping_threshold && cartSubtotal < method.free_shipping_threshold && (
                    <p className="text-xs text-gray-500 mt-1">
                      Free over ₦{method.free_shipping_threshold.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
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
