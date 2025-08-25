'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Using Remix icons for consistency with the design system
import { useGuestCart } from '@/contexts/GuestCartContext';
import { useCheckout } from '@/hooks/useCheckout';
import { useGuestCartTransfer } from '@/hooks/useGuestCartTransfer';
import Header from '@/components/Header';

interface CheckoutStep {
  id: number;
  title: string;
  description: string;
  required: boolean;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface ShippingMethod {
  id: number;
  name: string;
  description: string;
  base_cost: number;
  cost_per_item: number;
  free_shipping_threshold?: number;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
  sort_order: number;
}

const GUEST_SHIPPING_KEY = 'readnwin_guest_shipping';
const GUEST_SHIPPING_METHOD_KEY = 'readnwin_guest_shipping_method';

export default function GuestCheckoutEnhanced() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Handle guest cart transfer after login/registration
  useGuestCartTransfer();
  
  const {
    cartItems,
    isLoading: cartLoading,
    error: cartError,
    getTotalItems,
    clearCart
  } = useGuestCart();

  const { 
    shippingMethods,
    isLoading: checkoutLoading, 
    error: checkoutError,
    processCheckout 
  } = useCheckout(true);
  
  // Shipping data state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nigeria'
  });
  
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Load saved shipping data on mount
  useEffect(() => {
    try {
      const savedAddress = localStorage.getItem(GUEST_SHIPPING_KEY);
      const savedMethod = localStorage.getItem(GUEST_SHIPPING_METHOD_KEY);
      
      if (savedAddress) {
        setShippingAddress(JSON.parse(savedAddress));
      }
      
      if (savedMethod) {
        const method = JSON.parse(savedMethod);
        setSelectedShippingMethod(method);
      }
    } catch (error) {
      console.error('Error loading saved shipping data:', error);
    }
  }, []);

  // Save shipping data to localStorage
  const saveShippingData = () => {
    try {
      localStorage.setItem(GUEST_SHIPPING_KEY, JSON.stringify(shippingAddress));
      if (selectedShippingMethod) {
        localStorage.setItem(GUEST_SHIPPING_METHOD_KEY, JSON.stringify(selectedShippingMethod));
      }
    } catch (error) {
      console.error('Error saving shipping data:', error);
    }
  };

  // Helper functions
  const isEbookOnly = () => {
    return cartItems.every(item => item.book?.format === 'ebook');
  };

  const isPhysicalOnly = () => {
    return cartItems.every(item => item.book?.format === 'physical');
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.book?.price || 0) * item.quantity, 0);
  };

  const getTotalSavings = () => {
    return cartItems.reduce((sum, item) => {
      const book = item.book;
      if (book?.original_price && book.original_price > book.price) {
        return sum + (book.original_price - book.price) * item.quantity;
      }
      return sum;
    }, 0);
  };

  // Calculate checkout steps based on cart contents
  const getCheckoutSteps = (): CheckoutStep[] => {
    const steps: CheckoutStep[] = [];

    if (!isEbookOnly()) {
      steps.push({
        id: 1,
        title: 'Shipping Address',
        description: 'Enter delivery information',
        required: true
      });
      
      steps.push({
        id: 2,
        title: 'Shipping Method',
        description: 'Choose delivery option',
        required: true
      });
    }

    steps.push({
      id: steps.length + 1,
      title: 'Account & Payment',
      description: 'Sign up or sign in to complete purchase',
      required: true
    });

    return steps;
  };

  const steps = getCheckoutSteps();

  // Redirect to cart if empty
  useEffect(() => {
    if (cartItems.length === 0 && !cartLoading) {
      router.push('/cart-new');
      return;
    }
  }, [cartItems, cartLoading, router]);

  // Validate shipping address
  const validateShippingAddress = (): boolean => {
    const errors: { [key: string]: string } = {};
    
    if (!shippingAddress.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!shippingAddress.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!shippingAddress.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(shippingAddress.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!shippingAddress.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    if (!shippingAddress.addressLine1.trim()) {
      errors.addressLine1 = 'Address is required';
    }
    
    if (!shippingAddress.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!shippingAddress.state.trim()) {
      errors.state = 'State is required';
    }
    
    if (!shippingAddress.postalCode.trim()) {
      errors.postalCode = 'Postal code is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddressInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleContinueFromAddress = () => {
    if (validateShippingAddress()) {
      saveShippingData();
      setCurrentStep(2);
    }
  };

  const handleContinueFromShipping = () => {
    if (!selectedShippingMethod) {
      alert('Please select a shipping method');
      return;
    }
    saveShippingData();
    setCurrentStep(isEbookOnly() ? 1 : 3);
  };

  const handleContinueToAuth = () => {
    // Store shipping data and checkout step
    saveShippingData();
    sessionStorage.setItem('guestCheckoutStep', currentStep.toString());
    sessionStorage.setItem('guestCheckoutData', JSON.stringify({
      shippingAddress,
      selectedShippingMethod,
      cartItems
    }));
    router.push('/login?redirect=/checkout-new');
  };

  const handleSignUp = () => {
    // Store shipping data and checkout step
    saveShippingData();
    sessionStorage.setItem('guestCheckoutStep', currentStep.toString());
    sessionStorage.setItem('guestCheckoutData', JSON.stringify({
      shippingAddress,
      selectedShippingMethod,
      cartItems
    }));
    router.push('/register?redirect=/checkout-new');
  };

  const getShippingTotal = () => {
    return selectedShippingMethod ? selectedShippingMethod.base_cost : 0;
  };

  const getFinalTotal = () => {
    return getSubtotal() - getTotalSavings() + getShippingTotal();
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <i className="ri-error-warning-line text-red-400 text-xl mr-2"></i>
              <span className="text-red-800">{cartError}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to regular checkout if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/checkout-new');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Guest Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your purchase without creating an account</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((stepData, index) => (
              <div key={stepData.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  currentStep >= stepData.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                } ${currentStep > stepData.id ? 'ring-2 ring-blue-200' : ''}`}>
                  {currentStep > stepData.id ? <i className="ri-check-line text-lg"></i> : stepData.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    currentStep > stepData.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((stepData) => (
              <div key={stepData.id} className="text-center">
                <p className={`text-sm font-medium ${currentStep >= stepData.id ? 'text-blue-600' : 'text-gray-500'}`}>
                  {stepData.title}
                </p>
                <p className="text-xs text-gray-400">{stepData.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Type Indicator */}
        {cartItems.length > 0 && (
          <div className="mb-6 p-4 rounded-lg border bg-blue-50 border-blue-200">
            <div className="flex items-center">
              {isEbookOnly() ? (
                <i className="ri-download-line text-green-600 text-xl mr-3"></i>
              ) : isPhysicalOnly() ? (
                <i className="ri-box-3-line text-blue-600 text-xl mr-3"></i>
              ) : (
                <i className="ri-shopping-bag-line text-purple-600 text-xl mr-3"></i>
              )}
              <div>
                <h3 className="font-medium text-blue-600">
                  {isEbookOnly() ? 'Digital Books Only' : isPhysicalOnly() ? 'Physical Books Only' : 'Mixed Cart'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isEbookOnly() 
                    ? 'Your cart contains only digital books. No shipping required!' 
                    : isPhysicalOnly() 
                    ? 'Your cart contains physical books. Please provide shipping details.'
                    : 'Your cart contains both digital and physical books.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Steps */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Step 1: Shipping Address */}
              {currentStep === 1 && !isEbookOnly() && (
                <div className="space-y-6">
                  <div className="flex items-center mb-6">
                    <i className="ri-map-pin-line text-blue-600 text-2xl mr-3"></i>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Shipping Address</h2>
                      <p className="text-gray-600">
                        Please provide your shipping address for physical book delivery.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.firstName}
                        onChange={(e) => handleAddressInputChange('firstName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          validationErrors.firstName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter first name"
                      />
                      {validationErrors.firstName && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.firstName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.lastName}
                        onChange={(e) => handleAddressInputChange('lastName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          validationErrors.lastName ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter last name"
                      />
                      {validationErrors.lastName && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={shippingAddress.email}
                        onChange={(e) => handleAddressInputChange('email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          validationErrors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter email address"
                      />
                      {validationErrors.email && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={(e) => handleAddressInputChange('phone', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          validationErrors.phone ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter phone number"
                      />
                      {validationErrors.phone && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.addressLine1}
                      onChange={(e) => handleAddressInputChange('addressLine1', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        validationErrors.addressLine1 ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Street address, P.O. box, company name"
                    />
                    {validationErrors.addressLine1 && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.addressLine1}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.addressLine2}
                      onChange={(e) => handleAddressInputChange('addressLine2', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      placeholder="Apartment, suite, unit, building, floor, etc."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => handleAddressInputChange('city', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          validationErrors.city ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="City"
                      />
                      {validationErrors.city && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.city}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => handleAddressInputChange('state', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          validationErrors.state ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="State"
                      />
                      {validationErrors.state && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.state}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postal Code *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.postalCode}
                        onChange={(e) => handleAddressInputChange('postalCode', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          validationErrors.postalCode ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Postal code"
                      />
                      {validationErrors.postalCode && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.postalCode}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      value={shippingAddress.country}
                      onChange={(e) => handleAddressInputChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      <option value="Nigeria">Nigeria</option>
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleContinueFromAddress}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Continue to Shipping Method
                      <i className="ri-arrow-right-line ml-2 text-sm"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Shipping Method */}
              {currentStep === 2 && !isEbookOnly() && (
                <div className="space-y-6">
                  <div className="flex items-center mb-6">
                    <i className="ri-truck-line text-blue-600 text-2xl mr-3"></i>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Shipping Method</h2>
                      <p className="text-gray-600">
                        Choose your preferred shipping method for delivery.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {shippingMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedShippingMethod?.id === method.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedShippingMethod(method)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              checked={selectedShippingMethod?.id === method.id}
                              onChange={() => setSelectedShippingMethod(method)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-gray-900">
                                {method.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {method.description}
                              </p>
                              <p className="text-sm text-gray-500">
                                {method.estimated_days_min}-{method.estimated_days_max} business days
                              </p>
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            ₦{method.base_cost.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="inline-flex items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <i className="ri-arrow-left-line mr-2 text-sm"></i>
                      Back to Address
                    </button>
                    <button
                      onClick={handleContinueFromShipping}
                      disabled={!selectedShippingMethod}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Continue to Account
                      <i className="ri-arrow-right-line ml-2 text-sm"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Final Step: Account Required */}
              {(currentStep === 1 && isEbookOnly()) || (currentStep === 3 && !isEbookOnly()) ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <i className="ri-lock-line mx-auto text-blue-600 text-6xl mb-4 block"></i>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Required</h2>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      To complete your purchase and access your digital books, you need to create an account or sign in to your existing account.
                    </p>
                    {!isEbookOnly() && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-green-800">
                          ✓ Shipping address saved<br />
                          ✓ Shipping method selected<br />
                          Your information will be transferred to complete the order.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sign Up Option */}
                    <div className="bg-white border-2 border-blue-200 rounded-lg p-6 text-center hover:border-blue-300 transition-colors">
                      <i className="ri-user-add-line mx-auto text-blue-600 text-5xl mb-4 block"></i>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Account</h3>
                      <p className="text-gray-600 mb-4">
                        Sign up for a new account to complete your purchase and access your digital library.
                      </p>
                      <button
                        onClick={handleSignUp}
                        className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <i className="ri-user-add-line mr-2"></i>
                        Sign Up
                      </button>
                    </div>

                    {/* Sign In Option */}
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 transition-colors">
                      <i className="ri-login-box-line mx-auto text-gray-600 text-5xl mb-4 block"></i>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign In</h3>
                      <p className="text-gray-600 mb-4">
                        Already have an account? Sign in to complete your purchase.
                      </p>
                      <button
                        onClick={handleContinueToAuth}
                        className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <i className="ri-login-box-line mr-2"></i>
                        Sign In
                      </button>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Your cart items and shipping information will be saved and transferred to your account.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-3 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    {item.book?.cover_image_url ? (
                      <img
                        src={item.book.cover_image_url.startsWith('http') 
                          ? item.book.cover_image_url
                          : `${process.env.NEXT_PUBLIC_API_URL}/${item.book.cover_image_url}`
                        }
                        alt={item.book?.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <i className="ri-book-line text-gray-400"></i>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.book?.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ₦{((item.book?.price || 0) * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address Summary */}
              {!isEbookOnly() && shippingAddress.firstName && (
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Shipping To:</h3>
                  <p className="text-sm text-gray-600">
                    {shippingAddress.firstName} {shippingAddress.lastName}<br />
                    {shippingAddress.addressLine1}<br />
                    {shippingAddress.addressLine2 && `${shippingAddress.addressLine2}\n`}
                    {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                  </p>
                </div>
              )}

              {/* Order Totals */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">₦{getSubtotal().toLocaleString()}</span>
                </div>
                {getTotalSavings() > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Savings</span>
                    <span className="text-green-600">-₦{getTotalSavings().toLocaleString()}</span>
                  </div>
                )}
                {selectedShippingMethod && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping ({selectedShippingMethod.name})</span>
                    <span className="text-gray-900">₦{selectedShippingMethod.base_cost.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">₦{getFinalTotal().toLocaleString()}</span>
                </div>
              </div>

              {/* Guest Notice */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <i className="ri-information-line text-yellow-600 text-lg mr-2"></i>
                  <span className="text-sm text-yellow-800">
                    Guest checkout - account required to complete purchase
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 