import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks';
import { useCheckout } from '../hooks/useCheckout';
import api from '../lib/api';
import { validateCheckoutData, formatCheckoutRequest, validateCartItems } from '../utils/checkoutValidation';

export default function CheckoutFlow({ cartItems, onComplete, onCancel }) {
  const { user, getUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = sessionStorage.getItem('checkoutStep');
    return saved ? parseInt(saved) : 1;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem('checkoutFormData');
    return saved ? JSON.parse(saved) : {
      shipping: {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'Nigeria'
      },
      billing: {
        sameAsShipping: true
      },
      payment: {
        method: 'flutterwave'
      }
    };
  });

  // Autofill user details only once when component mounts
  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        shipping: {
          ...prev.shipping,
          first_name: currentUser.first_name || prev.shipping.first_name,
          last_name: currentUser.last_name || prev.shipping.last_name,
          email: currentUser.email || prev.shipping.email,
          phone: currentUser.phone || prev.shipping.phone,
          address: currentUser.address || prev.shipping.address,
          city: currentUser.city || prev.shipping.city,
          state: currentUser.state || prev.shipping.state,
          zip_code: currentUser.zip_code || prev.shipping.zip_code,
          country: currentUser.country || prev.shipping.country
        }
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Analyze cart first to determine if ebook-only
  const analyzeCart = useCallback(() => {
    if (!cartItems || cartItems.length === 0) return null;

    const ebooks = cartItems.filter(item => item.book?.format === 'ebook');
    const physical = cartItems.filter(item => item.book?.format === 'physical');
    const isEbookOnly = ebooks.length > 0 && physical.length === 0;
    
    const subtotal = cartItems.reduce((sum, item) => 
      sum + (parseFloat(item.book?.price || 0) * parseInt(item.quantity || 0)), 0
    );
    
    const shipping = isEbookOnly ? 0 : parseFloat(formData.shipping_method?.base_cost || 0);
    const tax = Math.round(subtotal * 0.075);
    const total = subtotal + shipping + tax;

    return { isEbookOnly, subtotal, shipping, tax, total, totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0) };
  }, [cartItems, formData.shipping_method]);

  const analytics = analyzeCart();
  
  const { shippingMethods, paymentGateways, isLoading: isLoadingCheckoutData, error: checkoutDataError } = useCheckout(analytics?.isEbookOnly);
  
  // Handle checkout data loading errors
  useEffect(() => {
    if (checkoutDataError) {
      setError(`Failed to load checkout data: ${checkoutDataError}`);
    }
  }, [checkoutDataError]);

  const generateSteps = useCallback(() => {
    if (!analytics) return [];
    const steps = [
      { id: 1, title: 'Customer Information', description: 'Contact details', icon: 'ri-user-line' }
    ];
    if (!analytics.isEbookOnly) {
      steps.push(
        { id: 2, title: 'Shipping Address', description: 'Delivery information', icon: 'ri-map-pin-line' },
        { id: 3, title: 'Shipping Method', description: 'Delivery option', icon: 'ri-truck-line' }
      );
    }
    steps.push({ id: steps.length + 1, title: 'Payment', description: 'Complete purchase', icon: 'ri-bank-card-line' });
    return steps;
  }, [analytics]);



  const updateFormData = (section, data) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [section]: { ...prev[section], ...data }
      };
      sessionStorage.setItem('checkoutFormData', JSON.stringify(updated));
      return updated;
    });
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return !!(formData.shipping.first_name && formData.shipping.last_name && formData.shipping.email);
      case 2:
        if (analytics?.isEbookOnly) return true;
        return !!(formData.shipping.address && formData.shipping.city && formData.shipping.state);
      case 3:
        if (analytics?.isEbookOnly) return true;
        return !!formData.shipping_method;
      default:
        return true;
    }
  };

  const nextStep = () => {
    const steps = generateSteps();
    if (validateStep(currentStep) && currentStep < steps.length) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      sessionStorage.setItem('checkoutStep', newStep.toString());
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      sessionStorage.setItem('checkoutStep', newStep.toString());
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate cart items
      const cartErrors = validateCartItems(cartItems);
      if (cartErrors.length > 0) {
        throw new Error(cartErrors.join(', '));
      }

      // Validate checkout data
      const validationErrors = validateCheckoutData(formData, analytics);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const checkoutData = formatCheckoutRequest(formData, analytics);
      
      const response = await api.post('/checkout', checkoutData);

      if (response.data.success) {
        sessionStorage.removeItem('checkoutStep');
        sessionStorage.removeItem('checkoutFormData');
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

  if (!analytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <i className="ri-loader-4-line animate-spin text-blue-600 text-2xl mr-2"></i>
        <span>Loading checkout...</span>
      </div>
    );
  }

  const steps = generateSteps();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-600">
          {analytics.isEbookOnly ? 'Complete your digital purchase' : 'Complete your order'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep === step.id ? 'border-blue-600 bg-blue-600 text-white' :
              currentStep > step.id ? 'border-green-600 bg-green-600 text-white' :
              'border-gray-300 bg-gray-100 text-gray-500'
            }`}>
              {currentStep > step.id ? (
                <i className="ri-check-line"></i>
              ) : (
                <i className={step.icon}></i>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${
                currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-4 ${
                currentStep > step.id ? 'bg-green-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <i className="ri-alert-line text-red-600 mr-2"></i>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Cart Type Indicator */}
      <div className={`border-2 rounded-lg p-4 mb-6 ${
        analytics.isEbookOnly 
          ? 'bg-green-50 border-green-200' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {analytics.isEbookOnly ? (
              <>
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                  <i className="ri-download-cloud-line text-green-600 text-xl"></i>
                </div>
                <div>
                  <span className="text-green-900 font-semibold block">Digital Purchase</span>
                  <span className="text-green-700 text-sm">Instant delivery • No shipping fees</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  <i className="ri-truck-line text-blue-600 text-xl"></i>
                </div>
                <div>
                  <span className="text-blue-900 font-semibold block">Physical Delivery</span>
                  <span className="text-blue-700 text-sm">Shipping required • Address needed</span>
                </div>
              </>
            )}
          </div>
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              analytics.isEbookOnly 
                ? 'bg-green-200 text-green-800' 
                : 'bg-blue-200 text-blue-800'
            }`}>
              {analytics.isEbookOnly ? 'Digital Only' : 'Physical Books'}
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {currentStep === 1 && (
          <CustomerInformationStep formData={formData} updateFormData={updateFormData} />
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
            isLoading={isLoadingCheckoutData}
          />
        )}
        
        {(currentStep === steps.length || (analytics.isEbookOnly && currentStep === 2)) && (
          <PaymentStep 
            formData={formData}
            updateFormData={updateFormData}
            paymentGateways={paymentGateways}
            analytics={analytics}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={currentStep === 1 ? onCancel : prevStep}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <i className="ri-arrow-left-line mr-2"></i>
          {currentStep === 1 ? 'Back to Cart' : 'Previous'}
        </button>

        {currentStep < steps.length && (!analytics.isEbookOnly || currentStep < 2) ? (
          <button
            onClick={nextStep}
            disabled={!validateStep(currentStep)}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <i className="ri-arrow-right-line ml-2"></i>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading || !validateStep(currentStep)}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Processing...
              </>
            ) : (
              <>
                Complete Order
                <i className="ri-arrow-right-line ml-2"></i>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function CustomerInformationStep({ formData, updateFormData }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.shipping.first_name}
            onChange={(e) => updateFormData('shipping', { first_name: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.shipping.last_name}
            onChange={(e) => updateFormData('shipping', { last_name: e.target.value })}
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
        <div className="relative">
          <i className="ri-mail-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
          <input
            type="email"
            inputMode="email"
            required
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.shipping.email}
            onChange={(e) => updateFormData('shipping', { email: e.target.value })}
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
        <div className="relative">
          <i className="ri-phone-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
          <input
            type="text"
            inputMode="tel"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.shipping.phone}
            onChange={(e) => updateFormData('shipping', { phone: e.target.value })}
            placeholder="+234 801 234 5678"
          />
        </div>
      </div>
    </div>
  );
}

function ShippingAddressStep({ formData, updateFormData }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
        <div className="relative">
          <i className="ri-home-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
          <input
            type="text"
            required
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.shipping.address}
            onChange={(e) => updateFormData('shipping', { address: e.target.value })}
            placeholder="123 Main Street, Apartment 4B"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
          <div className="relative">
            <i className="ri-building-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            <input
              type="text"
              required
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.shipping.city}
              onChange={(e) => updateFormData('shipping', { city: e.target.value })}
              placeholder="Lagos"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.shipping.state}
            onChange={(e) => updateFormData('shipping', { state: e.target.value })}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ZIP/Postal Code</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.shipping.zip_code}
            onChange={(e) => updateFormData('shipping', { zip_code: e.target.value })}
            placeholder="Optional"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.shipping.country}
            onChange={(e) => updateFormData('shipping', { country: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function ShippingMethodStep({ formData, updateFormData, shippingMethods, analytics, isLoading }) {
  const activeShippingMethods = shippingMethods?.filter(method => method.is_active !== false) || [];
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Shipping Method</h3>
        <div className="flex items-center justify-center p-8">
          <i className="ri-loader-4-line animate-spin text-blue-600 text-2xl mr-2"></i>
          <span className="text-gray-600">Loading shipping methods...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Shipping Method</h3>
      
      {!formData.shipping_method && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <i className="ri-information-line text-yellow-600 mr-2"></i>
            <span className="text-sm text-yellow-800">Please select a shipping method to continue</span>
          </div>
        </div>
      )}
      
      {activeShippingMethods.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <i className="ri-truck-line text-gray-400 text-4xl mb-2"></i>
          <p className="text-gray-600">No shipping methods available at the moment.</p>
          <p className="text-sm text-gray-500 mt-1">Please contact support for assistance.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeShippingMethods.map((method) => (
            <div
              key={method.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                formData.shipping_method?.id === method.id 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
              onClick={() => updateFormData('shipping_method', method)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    formData.shipping_method?.id === method.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {formData.shipping_method?.id === method.id && (
                      <i className="ri-check-line text-white text-xs"></i>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{method.name}</h4>
                    <p className="text-sm text-gray-600">{method.description || 'Standard delivery service'}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      <i className="ri-time-line mr-1"></i>
                      Delivery: {method.estimated_days_min}-{method.estimated_days_max} business days
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg text-gray-900">₦{method.base_cost.toLocaleString()}</p>
                  {method.free_shipping_threshold && (
                    <p className="text-xs text-green-600 mt-1">
                      Free over ₦{method.free_shipping_threshold.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentStep({ formData, updateFormData, paymentGateways, analytics }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
      
      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal ({analytics.totalItems} items)</span>
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
        
        {/* Format Breakdown */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Order Type:</span>
            <div className="flex items-center space-x-2">
              {analytics.isEbookOnly ? (
                <>
                  <i className="ri-download-line text-green-600"></i>
                  <span className="text-green-700 font-medium">Digital Only</span>
                </>
              ) : (
                <>
                  <i className="ri-truck-line text-blue-600"></i>
                  <span className="text-blue-700 font-medium">Physical Delivery</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Gateways */}
      <div className="space-y-3">
        {paymentGateways.filter(gateway => gateway.enabled).map((gateway) => (
          <div
            key={gateway.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              formData.payment.method === gateway.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => updateFormData('payment', { method: gateway.id })}
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">{gateway.name}</h4>
                <p className="text-sm text-gray-600">{gateway.description}</p>
              </div>
              <i className={`${gateway.id === 'flutterwave' ? 'ri-bank-card-line' : 'ri-bank-line'} text-2xl ${
                formData.payment.method === gateway.id ? 'text-blue-600' : 'text-gray-400'
              }`}></i>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
