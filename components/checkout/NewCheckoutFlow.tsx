'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  Truck, 
  CreditCard, 
  User, 
  MapPin, 
  ArrowLeft, 
  ArrowRight, 
  Package,
  Download,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  Home,
  Building
} from 'lucide-react';
import { CartItem, Book, ShippingMethod, PaymentGateway } from '@/types/ecommerce';

interface CheckoutFlowProps {
  cartItems: CartItem[];
  onComplete: (orderData: any) => void;
  onCancel: () => void;
}

interface ShippingAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

interface CheckoutFormData {
  shipping: ShippingAddress;
  billing: {
    same_as_shipping: boolean;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  shipping_method?: ShippingMethod;
  payment: {
    gateway: string;
    method: string;
  };
}

interface CheckoutStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  completed: boolean;
}

interface CartAnalytics {
  hasEbooks: boolean;
  hasPhysicalBooks: boolean;
  isEbookOnly: boolean;
  isPhysicalOnly: boolean;
  isMixedCart: boolean;
  totalItems: number;
  subtotal: number;
  estimatedShipping: number;
  tax: number;
  total: number;
}

export default function NewCheckoutFlow({ cartItems, onComplete, onCancel }: CheckoutFlowProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CartAnalytics | null>(null);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    shipping: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'NG'
    },
    billing: {
      same_as_shipping: true,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'NG'
    },
    payment: {
      gateway: 'flutterwave',
      method: 'card'
    }
  });

  // Analyze cart contents to determine checkout flow
  const analyzeCart = useCallback((selectedShippingMethod?: ShippingMethod) => {
    if (!cartItems || cartItems.length === 0) return null;

    const ebooks = cartItems.filter(item => 
      item.book?.format === 'ebook' || item.book?.format === 'both'
    );
    const physicalBooks = cartItems.filter(item => 
      item.book?.format === 'physical' || item.book?.format === 'both'
    );

    const hasEbooks = ebooks.length > 0;
    const hasPhysicalBooks = physicalBooks.length > 0;
    const isEbookOnly = hasEbooks && !hasPhysicalBooks;
    const isPhysicalOnly = hasPhysicalBooks && !hasEbooks;
    const isMixedCart = hasEbooks && hasPhysicalBooks;

    const subtotal = cartItems.reduce((sum, item) => {
      return sum + ((item.book?.price || 0) * item.quantity);
    }, 0);

    // Use selected shipping method cost or default to Express Shipping (₦3,000)
    const estimatedShipping = isEbookOnly ? 0 : (selectedShippingMethod?.base_cost || 3000);
    const tax = subtotal * 0.075; // 7.5% VAT
    const total = subtotal + estimatedShipping + tax;

    return {
      hasEbooks,
      hasPhysicalBooks,
      isEbookOnly,
      isPhysicalOnly,
      isMixedCart,
      totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      estimatedShipping,
      tax,
      total
    };
  }, [cartItems]);

  // Generate checkout steps based on cart contents
  const generateSteps = useCallback((): CheckoutStep[] => {
    const analytics = analyzeCart(formData.shipping_method);
    if (!analytics) return [];

    const steps: CheckoutStep[] = [];

    // Step 1: Customer Information (always required)
    steps.push({
      id: 1,
      title: 'Customer Information',
      description: 'Contact details',
      icon: <User className="w-5 h-5" />,
      required: true,
      completed: false
    });

    // Step 2: Shipping Address (only for physical books)
    if (!analytics.isEbookOnly) {
      steps.push({
        id: 2,
        title: 'Shipping Address',
        description: 'Delivery information',
        icon: <MapPin className="w-5 h-5" />,
        required: true,
        completed: false
      });

      // Step 3: Shipping Method (only for physical books)
      steps.push({
        id: 3,
        title: 'Shipping Method',
        description: 'Delivery option',
        icon: <Truck className="w-5 h-5" />,
        required: true,
        completed: false
      });
    }

    // Final Step: Payment
    steps.push({
      id: steps.length + 1,
      title: 'Payment',
      description: 'Complete purchase',
      icon: <CreditCard className="w-5 h-5" />,
      required: true,
      completed: false
    });

    return steps;
  }, [analyzeCart]);

  // Initialize component
  useEffect(() => {
    const cartAnalytics = analyzeCart(formData.shipping_method);
    setAnalytics(cartAnalytics);
    
    if (cartAnalytics?.isEbookOnly) {
      // For ebook-only checkout, skip shipping steps entirely - go directly to payment
      console.log('🔍 eBook-only cart detected - skipping shipping forms automatically');
      setCurrentStep(2); // Skip shipping, go to payment step
    }
    
    loadCheckoutData();
  }, [cartItems, analyzeCart]);

  const loadCheckoutData = async () => {
    try {
      setIsLoading(true);
      
      // Load shipping methods
      const shippingResponse = await fetch('/api/admin/shipping-methods');
      if (shippingResponse.ok) {
        const shippingData = await shippingResponse.json();
        setShippingMethods(shippingData.methods || []);
      }

      // Load payment gateways
      const paymentResponse = await fetch('/api/payment-gateways');
      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        setPaymentGateways(paymentData.gateways || []);
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
      setError('Failed to load checkout options');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (section: keyof CheckoutFormData, data: any) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [section]: { ...prev[section], ...data }
      };
      
      // If shipping method changed, recalculate analytics
      if (section === 'shipping_method') {
        const newAnalytics = analyzeCart(data);
        if (newAnalytics) {
          setAnalytics(newAnalytics);
        }
      }
      
      return newFormData;
    });
  };

  const validateStep = (step: number): boolean => {
    const steps = generateSteps();
    const currentStepData = steps.find(s => s.id === step);
    
    if (!currentStepData) return false;

    switch (step) {
      case 1: // Customer Information
        return !!(formData.shipping.first_name && 
                 formData.shipping.last_name && 
                 formData.shipping.email);
      
      case 2: // Shipping Address (only for physical books)
        if (analytics?.isEbookOnly) return true;
        return !!(formData.shipping.address && 
                 formData.shipping.city && 
                 formData.shipping.state && 
                 formData.shipping.zip_code);
      
      case 3: // Shipping Method (only for physical books)
        if (analytics?.isEbookOnly) return true;
        return !!formData.shipping_method;
      
      default:
        return true;
    }
  };

  const nextStep = () => {
    const steps = generateSteps();
    if (validateStep(currentStep) && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const checkoutData = {
        formData,
        cartItems,
        analytics
      };

      const response = await fetch('/api/checkout-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Checkout failed');
      }

      const result = await response.json();
      
      // Handle successful checkout
      if (result.success) {
        onComplete(result);
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!analytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading checkout...</span>
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
          {analytics.isEbookOnly ? 'Complete your digital purchase' : 
           analytics.isPhysicalOnly ? 'Complete your book order' : 
           'Complete your order'}
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
                <CheckCircle className="w-5 h-5" />
              ) : (
                step.icon
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
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Cart Type Indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          {analytics.isEbookOnly ? (
            <>
              <Download className="w-5 h-5 text-blue-600" />
              <span className="text-blue-900 font-medium">Digital Purchase</span>
              <span className="text-blue-700">• No shipping required • Instant access</span>
            </>
          ) : analytics.isPhysicalOnly ? (
            <>
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-blue-900 font-medium">Physical Books</span>
              <span className="text-blue-700">• Shipping required • Delivery to your address</span>
            </>
          ) : (
            <>
              <Package className="w-5 h-5 text-blue-600" />
              <Download className="w-5 h-5 text-blue-600" />
              <span className="text-blue-900 font-medium">Mixed Order</span>
              <span className="text-blue-700">• Physical books will be shipped • eBooks available instantly</span>
            </>
          )}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {currentStep === 1 && (
          <CustomerInformationStep 
            formData={formData}
            updateFormData={updateFormData}
          />
        )}
        
        {currentStep === 2 && !analytics.isEbookOnly && (
          <ShippingAddressStep 
            formData={formData}
            updateFormData={updateFormData}
          />
        )}
        
        {currentStep === 3 && !analytics.isEbookOnly && (
          <ShippingMethodStep 
            formData={formData}
            updateFormData={updateFormData}
            shippingMethods={shippingMethods}
            analytics={analytics}
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
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStep === 1 ? 'Back to Cart' : 'Previous'}
        </button>

        {currentStep < steps.length && (!analytics.isEbookOnly || currentStep < 2) ? (
          <button
            onClick={nextStep}
            disabled={!validateStep(currentStep)}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading || !validateStep(currentStep)}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Complete Order
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// Step Components
function CustomerInformationStep({ formData, updateFormData }: {
  formData: CheckoutFormData;
  updateFormData: (section: keyof CheckoutFormData, data: any) => void;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.shipping.first_name}
            onChange={(e) => updateFormData('shipping', { first_name: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            required
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.shipping.email}
            onChange={(e) => updateFormData('shipping', { email: e.target.value })}
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="tel"
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

function ShippingAddressStep({ formData, updateFormData }: {
  formData: CheckoutFormData;
  updateFormData: (section: keyof CheckoutFormData, data: any) => void;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Street Address *
        </label>
        <div className="relative">
          <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State *
          </label>
          <select
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.shipping.state}
            onChange={(e) => updateFormData('shipping', { state: e.target.value })}
          >
            <option value="">Select State</option>
            <option value="Lagos">Lagos</option>
            <option value="Abuja">Abuja (FCT)</option>
            <option value="Kano">Kano</option>
            <option value="Rivers">Rivers</option>
            <option value="Oyo">Oyo</option>
            <option value="Kaduna">Kaduna</option>
            <option value="Ogun">Ogun</option>
            <option value="Imo">Imo</option>
            <option value="Plateau">Plateau</option>
            <option value="Delta">Delta</option>
            {/* Add more Nigerian states as needed */}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ZIP/Postal Code *
          </label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.shipping.zip_code}
            onChange={(e) => updateFormData('shipping', { zip_code: e.target.value })}
            placeholder="100001"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country *
          </label>
          <select
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.shipping.country}
            onChange={(e) => updateFormData('shipping', { country: e.target.value })}
          >
            <option value="NG">Nigeria</option>
            {/* Add more countries as needed */}
          </select>
        </div>
      </div>
    </div>
  );
}

function ShippingMethodStep({ formData, updateFormData, shippingMethods, analytics }: {
  formData: CheckoutFormData;
  updateFormData: (section: keyof CheckoutFormData, data: any) => void;
  shippingMethods: ShippingMethod[];
  analytics: CartAnalytics;
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Shipping Method</h3>
      
      <div className="space-y-3">
        {shippingMethods.filter(method => method.is_active !== false).map((method) => (
          <div
            key={method.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              formData.shipping_method?.id === method.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => updateFormData('shipping_method', method)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{method.name}</h4>
                <p className="text-sm text-gray-600">{method.description}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Delivery: {method.estimated_days_min}-{method.estimated_days_max} business days
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  ₦{method.base_cost.toLocaleString()}
                </p>
                {method.free_shipping_threshold && analytics.subtotal >= method.free_shipping_threshold && (
                  <p className="text-sm text-green-600">Free!</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {shippingMethods.filter(method => method.is_active !== false).length === 0 && (
        <div className="text-center py-6 text-gray-500">
          No shipping methods available. Please contact support.
        </div>
      )}
    </div>
  );
}

function PaymentStep({ formData, updateFormData, paymentGateways, analytics }: {
  formData: CheckoutFormData;
  updateFormData: (section: keyof CheckoutFormData, data: any) => void;
  paymentGateways: PaymentGateway[];
  analytics: CartAnalytics;
}) {
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
              <span>₦{analytics.estimatedShipping.toLocaleString()}</span>
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
        {paymentGateways.filter(gateway => gateway.enabled).map((gateway) => (
          <div
            key={gateway.gateway_id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              formData.payment.gateway === gateway.gateway_id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => updateFormData('payment', { 
              gateway: gateway.gateway_id, 
              method: gateway.gateway_id 
            })}
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">{gateway.name}</h4>
                <p className="text-sm text-gray-600">{gateway.description}</p>
                
                {/* Payment Method Specific Information */}
                {gateway.gateway_id === 'flutterwave' && (
                  <div className="mt-2 text-sm text-blue-700">
                    <p>✓ Credit/Debit Cards • Mobile Money • Bank Transfer</p>
                    <p>✓ Secure payment via Flutterwave</p>
                  </div>
                )}
                
                {gateway.gateway_id === 'bank_transfer' && (
                  <div className="mt-2 text-sm text-green-700">
                    <p>✓ Direct bank transfer with proof upload</p>
                    <p>✓ Manual verification (1-2 business days)</p>
                  </div>
                )}
                
                {gateway.test_mode && (
                  <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                    Test Mode
                  </span>
                )}
              </div>
              <div className="text-right">
                {gateway.gateway_id === 'flutterwave' ? (
                  <CreditCard className="w-8 h-8 text-blue-500" />
                ) : gateway.gateway_id === 'bank_transfer' ? (
                  <Building className="w-8 h-8 text-green-500" />
                ) : (
                  <CreditCard className="w-8 h-8 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Selected Payment Method Info */}
      {formData.payment.gateway && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {formData.payment.gateway === 'flutterwave' ? 'Flutterwave Payment' : 'Bank Transfer Payment'}
            </span>
          </div>
          
          {formData.payment.gateway === 'flutterwave' && (
            <div className="text-sm text-blue-700">
              <p>You will be redirected to Flutterwave's secure payment page to complete your transaction.</p>
              {analytics.isEbookOnly && (
                <p className="mt-1">📚 Your eBooks will be available immediately after successful payment.</p>
              )}
            </div>
          )}
          
          {formData.payment.gateway === 'bank_transfer' && (
            <div className="text-sm text-green-700 space-y-1">
              <p>1. Transfer the exact amount to our bank account</p>
              <p>2. Upload proof of payment on the next page</p>
              <p>3. Your order will be processed after verification (1-2 business days)</p>
              {analytics.isEbookOnly && (
                <p className="mt-1">📚 Your eBooks will be available after payment verification.</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {paymentGateways.filter(gateway => gateway.enabled).length === 0 && (
        <div className="text-center py-6 text-gray-500">
          No payment methods available. Please contact support.
        </div>
      )}
    </div>
  );
} 