'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, Truck, CreditCard, User, MapPin, ArrowLeft, ArrowRight, Package, Download } from 'lucide-react';
import AddressForm from './AddressForm';
import ShippingMethod from './ShippingMethod';
import PaymentForm from './PaymentForm';
import OrderConfirmation from './OrderConfirmation';
import { apiClient } from '@/lib/api-client';

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  deliveryTime: string;
  description: string;
  base_cost: number;
  cost_per_item: number;
  free_shipping_threshold?: number;
  estimated_days_min: number;
  estimated_days_max: number;
}

interface PaymentGateway {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  testMode: boolean;
  supportedCurrencies: string[];
  features: string[];
  status: 'active' | 'inactive' | 'error' | 'testing';
}

interface CheckoutFormData {
  shipping: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    lga: string;
    country: string;
  };
  billing: {
    sameAsShipping: boolean;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    lga: string;
    country: string;
  };
  payment: {
    method: string;
    gateway: string;
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    cardholderName?: string;
  };
  shippingMethod?: ShippingMethod;
}

interface CheckoutStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
}

interface CheckoutFlowProps {
  cartItems: any[];
  isEbookOnly: () => boolean;
  isPhysicalOnly: () => boolean;
  isMixedCart: () => boolean;
  analytics: any;
  onComplete: (orderData: any) => void;
  onBack: () => void;
  clearCart: () => Promise<void>;
}

export default function CheckoutFlow({
  cartItems,
  isEbookOnly,
  isPhysicalOnly,
  isMixedCart,
  analytics,
  onComplete,
  onBack,
  clearCart
}: CheckoutFlowProps) {
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null);
  
  // Initialize form data from localStorage or default values
  const [formData, setFormData] = useState<CheckoutFormData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('checkout-form-data');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (error) {
          console.error('Error parsing saved checkout data:', error);
        }
      }
    }
    
    // Default form data
    return {
      shipping: {
        firstName: '',
        lastName: '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        state: '',
        lga: '',
        country: 'NG'
      },
      billing: {
        sameAsShipping: true,
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        state: '',
        lga: '',
        country: 'NG'
      },
      payment: {
        method: '',
        gateway: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
      }
    };
  });

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && formData) {
      localStorage.setItem('checkout-form-data', JSON.stringify(formData));
      // Show a subtle indicator that data is being saved
      console.log('💾 Checkout progress saved automatically');
    }
  }, [formData]);

  // Save current step to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('checkout-current-step', currentStep.toString());
      console.log(`📝 Checkout step ${currentStep} saved`);
    }
  }, [currentStep]);

  // Load current step from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStep = localStorage.getItem('checkout-current-step');
      if (savedStep) {
        const step = parseInt(savedStep);
        if (step >= 1 && step <= 4) {
          setCurrentStep(step);
        }
      }
    }
  }, []);

  // Recovery mechanism - restore user progress on page load
  useEffect(() => {
    const savedFormData = localStorage.getItem('checkout-form-data');
    const savedStep = localStorage.getItem('checkout-current-step');
    
    if (savedFormData && savedStep) {
      try {
        const parsedFormData = JSON.parse(savedFormData);
        const step = parseInt(savedStep);
        
        // Only restore if we have valid data
        if (parsedFormData && step >= 1 && step <= 4) {
          setFormData(parsedFormData);
          setCurrentStep(step);
          console.log('✅ Checkout progress restored from localStorage');
        }
      } catch (error) {
        console.error('Error restoring checkout progress:', error);
        // Clear invalid data
        clearCheckoutData();
      }
    }
  }, []);

  // Cleanup function to clear localStorage when component unmounts
  useEffect(() => {
    return () => {
      // Don't clear localStorage on unmount to preserve state
      // Only clear when checkout is completed or user explicitly leaves
    };
  }, []);

  // Function to clear checkout data (call this when checkout is completed)
  const clearCheckoutData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('checkout-form-data');
      localStorage.removeItem('checkout-current-step');
    }
  };

  const calculateCartTotal = () => {
    const subtotal = cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    const shippingCost = selectedShippingMethod ? 
      (selectedShippingMethod.base_cost + (selectedShippingMethod.cost_per_item * cartItems.length)) : 0;
    
    const tax = subtotal * 0.075; // 7.5% VAT
    return subtotal + shippingCost + tax;
  };

  const calculateTotal = () => calculateCartTotal();

  // Calculate checkout steps based on cart contents
  const getCheckoutSteps = (): CheckoutStep[] => {
    const steps: CheckoutStep[] = [];

    // Step 1: Customer Information (always required)
    steps.push({
      id: 1,
      title: 'Customer Info',
      description: 'Your details',
      icon: <User className="w-5 h-5" />,
      required: true
    });

    // Only add shipping steps if cart contains physical books
    if (!isEbookOnly()) {
      steps.push({
        id: 2,
        title: 'Shipping Address',
        description: 'Delivery information',
        icon: <MapPin className="w-5 h-5" />,
        required: true
      });
      
      steps.push({
        id: 3,
        title: 'Shipping Method',
        description: 'Choose delivery option',
        icon: <Truck className="w-5 h-5" />,
        required: true
      });
    }

    // Final step: Payment
    steps.push({
      id: steps.length + 1,
      title: 'Payment',
      description: 'Complete your purchase',
      icon: <CreditCard className="w-5 h-5" />,
      required: true
    });

    return steps;
  };

  const steps = getCheckoutSteps();

  // Load checkout data
  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      setIsLoading(true);

      // Load shipping methods if needed
      if (!isEbookOnly()) {
        const shippingData = await apiClient.request('/shipping/methods');
        setShippingMethods(shippingData.methods || []);
      }

      // Load payment gateways
      const paymentData = await apiClient.getPaymentGateways();
      setPaymentGateways(paymentData.gateways || []);
    } catch (error) {
      console.error('Error loading checkout data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (section: keyof CheckoutFormData, data: any) => {
    try {
      setFormData(prev => ({
        ...prev,
        [section]: { ...prev[section], ...data }
      }));
    } catch (error) {
      console.error('Error updating form data:', error);
      // Don't reset the component, just log the error
    }
  };

  const validateCurrentStep = (): boolean => {
    try {
      switch (currentStep) {
        case 1: // Customer Info
          return !!(formData.shipping.firstName && formData.shipping.lastName && formData.shipping.email);
        case 2: // Shipping Address
          return !!(formData.shipping.address && formData.shipping.city && formData.shipping.state);
        case 3: // Shipping Method
          return !!selectedShippingMethod;
        case 4: // Payment
          return !!(formData.payment.method && formData.payment.gateway);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error validating current step:', error);
      return false;
    }
  };

  const handleNext = () => {
    try {
      if (validateCurrentStep()) {
        setCurrentStep(prev => Math.min(prev + 1, 4));
      }
    } catch (error) {
      console.error('Error moving to next step:', error);
      // Don't reset the component, just log the error
    }
  };

  const handleBack = () => {
    try {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    } catch (error) {
      console.error('Error moving to previous step:', error);
      // Don't reset the component, just log the error
    }
  };

  const handleStepClick = (stepId: number) => {
    try {
      // Only allow navigation to completed steps or current step
      const completedSteps = getCompletedSteps();
      if (completedSteps.includes(stepId) || stepId === currentStep) {
        setCurrentStep(stepId);
      }
    } catch (error) {
      console.error('Error navigating to step:', error);
      // Don't reset the component, just log the error
    }
  };

  const getCompletedSteps = (): number[] => {
    const completed: number[] = [];
    
    // Step 1 is always completed if we're past it
    if (currentStep > 1) completed.push(1);
    
    // Step 2 is completed if shipping address is filled
    if (currentStep > 2 && formData.shipping.address && formData.shipping.city && formData.shipping.state) {
      completed.push(2);
    }
    
    // Step 3 is completed if shipping method is selected
    if (currentStep > 3 && selectedShippingMethod) {
      completed.push(3);
    }
    
    // Step 4 is completed if payment method is selected
    if (currentStep > 4 && formData.payment.method && formData.payment.gateway) {
      completed.push(4);
    }
    
    return completed;
  };

  const handleShippingMethodSelect = (method: ShippingMethod) => {
    setSelectedShippingMethod(method);
    setFormData(prev => ({
      ...prev,
      shippingMethod: method
    }));
  };

  const handlePlaceOrder = async (orderData: any) => {
    try {
      setIsLoading(true);
      
      // Transform form data to match backend schema
      const checkoutRequest = {
        shipping_address: {
          first_name: formData.shipping.firstName,
          last_name: formData.shipping.lastName,
          email: formData.shipping.email,
          phone: formData.shipping.phone,
          address: formData.shipping.address,
          city: formData.shipping.city,
          state: formData.shipping.state,
          zip_code: formData.shipping.lga,
          country: formData.shipping.country === 'Nigeria' ? 'NG' : formData.shipping.country
        },
        billing_address: {
          same_as_shipping: formData.billing.sameAsShipping,
          first_name: formData.billing.sameAsShipping ? formData.shipping.firstName : formData.billing.firstName,
          last_name: formData.billing.sameAsShipping ? formData.shipping.lastName : formData.billing.lastName,
          address: formData.billing.sameAsShipping ? formData.shipping.address : formData.billing.address,
          city: formData.billing.sameAsShipping ? formData.shipping.city : formData.billing.city,
          state: formData.billing.sameAsShipping ? formData.shipping.state : formData.billing.state,
          zip_code: formData.billing.sameAsShipping ? formData.shipping.lga : formData.billing.lga,
          country: formData.billing.sameAsShipping ? 
            (formData.shipping.country === 'Nigeria' ? 'NG' : formData.shipping.country) : 
            (formData.billing.country === 'Nigeria' ? 'NG' : formData.billing.country)
        },
        payment: {
          method: formData.payment.method,
          gateway: formData.payment.gateway
        },
        cart_items: cartItems.map(item => ({
          book_id: parseInt(item.book_id.toString()),
          quantity: parseInt(item.quantity.toString()),
          price: parseFloat((item.book?.price || item.price || 0).toString())
        })),
        shipping_method: selectedShippingMethod ? {
          id: parseInt(selectedShippingMethod.id),
          name: selectedShippingMethod.name,
          base_cost: parseFloat(selectedShippingMethod.base_cost.toString()),
          cost_per_item: parseFloat((selectedShippingMethod.cost_per_item || 0).toString()),
          estimated_days_min: parseInt(selectedShippingMethod.estimated_days_min.toString()),
          estimated_days_max: parseInt(selectedShippingMethod.estimated_days_max.toString()),
          free_shipping_threshold: selectedShippingMethod.free_shipping_threshold ? parseFloat(selectedShippingMethod.free_shipping_threshold.toString()) : null
        } : null,
        is_ebook_only: isEbookOnly()
      };
      
      // Create order using unified checkout endpoint
      const result = await apiClient.request('/checkout/', {
        method: 'POST',
        body: JSON.stringify(checkoutRequest),
      });
      
      // NOTE: Cart will be cleared after successful payment completion
      // Do not clear cart here as payment might fail
      
      // Clear checkout data from localStorage
      clearCheckoutData();
      
      // Call the onComplete callback
      onComplete({
        orderId: result.order_id,
        orderNumber: result.order_number,
        total: result.total_amount,
        paymentUrl: result.payment_url,
        bankTransferDetails: result.bank_transfer_details
      });
    } catch (error) {
      console.error('Error placing order:', error);
      // Don't clear checkout data on error - let user retry
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Render customer information step
  const renderCustomerInfoStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Information</h2>
        <p className="text-gray-600">Enter your contact details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={formData.shipping.firstName}
            onChange={(e) => updateFormData('shipping', { firstName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.shipping.lastName}
            onChange={(e) => updateFormData('shipping', { lastName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.shipping.email}
            onChange={(e) => updateFormData('shipping', { email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.shipping.phone}
            onChange={(e) => updateFormData('shipping', { phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Cart Type Indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isEbookOnly() 
              ? 'bg-green-100 text-green-600' 
              : isPhysicalOnly() 
              ? 'bg-blue-100 text-blue-600'
              : 'bg-purple-100 text-purple-600'
          }`}>
            {isEbookOnly() ? (
              <Download className="w-5 h-5" />
            ) : (
              <Package className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {isEbookOnly() ? 'Digital Books Only' :
               isPhysicalOnly() ? 'Physical Books Only' :
               'Mixed Cart'}
            </h3>
            <p className="text-sm text-gray-600">
              {isEbookOnly() 
                ? 'No shipping required - books will be added to your library for reading after payment'
                : isPhysicalOnly() 
                ? 'Physical books will be shipped to your address'
                : 'Physical books will be shipped, eBooks will be added to your library for reading'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render shipping address step
  const renderShippingAddressStep = () => (
    <AddressForm
      formData={formData}
      updateFormData={(section: string, data: any) => updateFormData(section as keyof CheckoutFormData, data)}
      onNext={handleNext}
    />
  );

  // Render shipping method step
  const renderShippingMethodStep = () => (
    <ShippingMethod
      onSelect={(method: any) => handleShippingMethodSelect(method)}
      onNext={handleNext}
      onBack={handleBack}
      selectedMethod={selectedShippingMethod}
      isEbookOnly={isEbookOnly()}
    />
  );

  // Render payment step
  const renderPaymentStep = () => (
    <PaymentForm
      formData={formData}
      updateFormData={(section: string, data: any) => updateFormData(section as keyof CheckoutFormData, data)}
      onNext={() => setCurrentStep(currentStep + 1)}
      onBack={handleBack}
      isEbookOnly={isEbookOnly()}
    />
  );

  // Render order confirmation step
  const renderOrderConfirmation = () => (
    <OrderConfirmation
      formData={formData}
      cartItems={cartItems}
      onPlaceOrder={(orderData) => handlePlaceOrder(orderData || { total: calculateCartTotal() })}
      onBack={handleBack}
      isLoading={isLoading}
    />
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading checkout...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => handleStepClick(step.id)}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                } ${currentStep > step.id ? 'ring-2 ring-blue-200' : ''} ${
                  step.id <= currentStep || (step.id === currentStep + 1 && validateCurrentStep())
                    ? 'cursor-pointer hover:bg-blue-700' 
                    : 'cursor-not-allowed'
                }`}
                disabled={step.id > currentStep && !(step.id === currentStep + 1 && validateCurrentStep())}
              >
                {currentStep > step.id ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  step.icon
                )}
              </button>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step) => (
            <div key={step.id} className="text-center">
              <p className={`text-sm font-medium ${
                currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {currentStep === 1 && renderCustomerInfoStep()}
        {currentStep === 2 && !isEbookOnly() && renderShippingAddressStep()}
        {currentStep === 3 && !isEbookOnly() && renderShippingMethodStep()}
        {currentStep === (isEbookOnly() ? 2 : 4) && renderPaymentStep()}
        {currentStep === (isEbookOnly() ? 3 : 5) && renderOrderConfirmation()}
      </div>

      {/* Navigation */}
      {currentStep < (isEbookOnly() ? 3 : 5) && (
        <div className="flex justify-between mt-6">
          <button
            onClick={handleBack}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Back to Cart' : 'Previous'}
          </button>

          <button
            onClick={handleNext}
            disabled={!validateCurrentStep()}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
} 