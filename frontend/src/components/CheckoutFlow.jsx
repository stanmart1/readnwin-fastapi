import { useState, useCallback } from 'react';
import { useAuth } from '../hooks';
import { useCheckout } from '../hooks/useCheckout';
import api from '../lib/api';

export default function CheckoutFlow({ cartItems, onComplete, onCancel }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    shipping: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Nigeria'
    },
    billing: {
      same_as_shipping: true
    },
    shipping_method: null,
    payment: {
      method: 'flutterwave'
    }
  });

  // Analyze cart
  const analyzeCart = useCallback(() => {
    const ebooks = cartItems.filter(item => item.book?.format === 'ebook');
    const physical = cartItems.filter(item => item.book?.format === 'physical');
    const isEbookOnly = ebooks.length > 0 && physical.length === 0;
    
    const subtotal = cartItems.reduce((sum, item) => 
      sum + (parseFloat(item.book?.price || 0) * parseInt(item.quantity || 0)), 0
    );
    
    const shipping = isEbookOnly ? 0 : parseFloat(formData.shipping_method?.base_cost || 0);
    const tax = Math.round(subtotal * 0.075);
    const total = subtotal + shipping + tax;

    return { isEbookOnly, subtotal, shipping, tax, total };
  }, [cartItems, formData.shipping_method]);

  const analytics = analyzeCart();
  const { shippingMethods, paymentGateways, isLoading: dataLoading, error: dataError } = useCheckout(analytics.isEbookOnly);

  const updateFormData = (section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return !!(formData.shipping.first_name && formData.shipping.last_name && formData.shipping.email);
      case 2:
        if (analytics.isEbookOnly) return true;
        return !!(formData.shipping.address && formData.shipping.city && formData.shipping.state);
      case 3:
        if (analytics.isEbookOnly) return true;
        return !!formData.shipping_method;
      case 4:
        return !!formData.payment.method;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post('/checkout', {
        formData: {
          shipping: formData.shipping,
          billing: formData.billing,
          payment: { method: formData.payment.method },
          shippingMethod: formData.shipping_method
        },
        cartItems,
        total: analytics.total
      });

      if (response.data.success) {
        onComplete(response.data);
      } else {
        throw new Error(response.data.error || 'Checkout failed');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.detail || err.message || 'Checkout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Customer Info', icon: '👤' },
    ...(!analytics.isEbookOnly ? [
      { id: 2, title: 'Shipping Address', icon: '📍' },
      { id: 3, title: 'Shipping Method', icon: '🚚' }
    ] : []),
    { id: analytics.isEbookOnly ? 2 : 4, title: 'Payment', icon: '💳' }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= step.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step.icon}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {steps.map(step => (
            <div key={step.id} className="text-center">
              <p className={`text-sm font-medium ${
                currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Type Indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-2">{analytics.isEbookOnly ? '📥' : '📦'}</span>
          <div>
            <h4 className="text-blue-900 font-medium">
              {analytics.isEbookOnly ? 'Digital Purchase' : 'Physical Books'}
            </h4>
            <p className="text-blue-700 text-sm">
              {analytics.isEbookOnly ? 'No shipping required • Instant access' : 'Shipping required • Delivery to your address'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        {currentStep === 1 && (
          <CustomerInfoStep formData={formData} updateFormData={updateFormData} />
        )}
        
        {currentStep === 2 && !analytics.isEbookOnly && (
          <ShippingAddressStep formData={formData} updateFormData={updateFormData} />
        )}
        
        {currentStep === 3 && !analytics.isEbookOnly && (
          <ShippingMethodStep 
            formData={formData} 
            updateFormData={updateFormData}
            shippingMethods={shippingMethods}
            analytics={analytics}
          />
        )}
        
        {currentStep === (analytics.isEbookOnly ? 2 : 4) && (
          <PaymentStep 
            formData={formData}
            updateFormData={updateFormData}
            paymentGateways={paymentGateways}
            analytics={analytics}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={currentStep === 1 ? onCancel : prevStep}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          ← {currentStep === 1 ? 'Back to Cart' : 'Previous'}
        </button>

        {currentStep < steps[steps.length - 1].id ? (
          <button
            onClick={nextStep}
            disabled={!validateStep(currentStep)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading || !validateStep(currentStep)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Complete Order'}
          </button>
        )}
      </div>
    </div>
  );
}

// Step Components
function CustomerInfoStep({ formData, updateFormData }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.shipping.first_name}
            onChange={(e) => updateFormData('shipping', { first_name: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.shipping.last_name}
            onChange={(e) => updateFormData('shipping', { last_name: e.target.value })}
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
        <input
          type="email"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={formData.shipping.email}
          onChange={(e) => updateFormData('shipping', { email: e.target.value })}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
        <input
          type="tel"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={formData.shipping.phone}
          onChange={(e) => updateFormData('shipping', { phone: e.target.value })}
          placeholder="+234 801 234 5678"
        />
      </div>
    </div>
  );
}

function ShippingAddressStep({ formData, updateFormData }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Shipping Address</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
        <input
          type="text"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={formData.shipping.address}
          onChange={(e) => updateFormData('shipping', { address: e.target.value })}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.shipping.city}
            onChange={(e) => updateFormData('shipping', { city: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.shipping.state}
            onChange={(e) => updateFormData('shipping', { state: e.target.value })}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.shipping.zip_code}
            onChange={(e) => updateFormData('shipping', { zip_code: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.shipping.country}
            onChange={(e) => updateFormData('shipping', { country: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function ShippingMethodStep({ formData, updateFormData, shippingMethods, analytics }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Choose Shipping Method</h3>
      
      <div className="space-y-3">
        {shippingMethods.map(method => (
          <div
            key={method.id}
            className={`border rounded-lg p-4 cursor-pointer ${
              formData.shipping_method?.id === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => updateFormData('shipping_method', method)}
          >
            <div className="flex justify-between">
              <div>
                <h4 className="font-medium">{method.name}</h4>
                <p className="text-sm text-gray-600">{method.description}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Delivery: {method.estimated_days_min}-{method.estimated_days_max} days
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">₦{method.base_cost.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentStep({ formData, updateFormData, paymentGateways, analytics }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
      
      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-3">Order Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₦{analytics.subtotal.toLocaleString()}</span>
          </div>
          {!analytics.isEbookOnly && (
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>₦{analytics.shipping.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax (7.5%)</span>
            <span>₦{analytics.tax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Total</span>
            <span>₦{analytics.total.toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      {/* Payment Gateways */}
      <div className="space-y-3">
        {paymentGateways.filter(g => g.enabled).map(gateway => (
          <div
            key={gateway.id}
            className={`border rounded-lg p-4 cursor-pointer ${
              formData.payment.method === gateway.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => updateFormData('payment', { method: gateway.id })}
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">{gateway.name}</h4>
                <p className="text-sm text-gray-600">{gateway.description}</p>
              </div>
              <div className="text-2xl">
                {gateway.id === 'flutterwave' ? '💳' : '🏦'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
