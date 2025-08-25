'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useCheckoutValidation } from '@/hooks/useCheckoutValidation';
import { useCheckoutNotifications } from '@/hooks/useCheckoutNotifications';
import { 
  ProgressIndicator,
  ErrorDisplay,
  SuccessState,
  FieldFeedback,
  LoadingState,
  SecurityBadge,
  PaymentInfo,
  ConfirmationDialog
} from './CheckoutFeedback';
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

// Types
interface CartItem {
  id: number;
  book_id: number;
  quantity: number;
  book_title?: string;
  book_author?: string;
  book_price?: number;
  book_original_price?: number;
  book_cover?: string;
  book_format?: string;
  book_category?: string;
  book_stock_quantity?: number;
  book_is_active?: boolean;
  book_inventory_enabled?: boolean;
  book?: {
    id: number;
    title: string;
    price: number;
    format: 'ebook' | 'physical' | 'both';
    is_active?: boolean;
    inventory_enabled?: boolean;
    stock_quantity?: number;
  };
}

interface ShippingMethod {
  id: number;
  name: string;
  base_cost: number;
  cost_per_item: number;
  estimated_days_min: number;
  estimated_days_max: number;
  free_shipping_threshold?: number;
  description: string;
}

interface PaymentGateway {
  gateway_id: string;
  name: string;
  description: string;
  enabled: boolean;
  test_mode: boolean;
}

interface CheckoutFormData {
  shipping_address: {
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
  billing_address: {
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
  payment: {
    method: 'flutterwave' | 'bank_transfer';
    gateway: 'flutterwave' | 'bank_transfer';
  };
  shipping_method?: ShippingMethod;
  notes?: string;
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

interface UnifiedCheckoutFlowProps {
  cartItems: CartItem[];
  onComplete: (orderData: any) => void;
  onCancel: () => void;
}

// Utility function to sanitize input for display
const sanitizeForDisplay = (input: string): string => {
  return input.replace(/[<>]/g, '');
};

// Nigerian states for dropdown
const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 
  'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export default function UnifiedCheckoutFlow({ 
  cartItems, 
  onComplete, 
  onCancel 
}: UnifiedCheckoutFlowProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  
  // Form validation and notifications
  const validation = useCheckoutValidation({});
  const notifications = useCheckoutNotifications();
  
  // Form data with proper initialization
  const [formData, setFormData] = useState<CheckoutFormData>({
    shipping_address: {
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
    billing_address: {
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
      method: 'flutterwave',
      gateway: 'flutterwave'
    },
    notes: ''
  });

  // Memoized cart analytics to prevent recalculation
  const analytics = useMemo((): CartAnalytics => {
    if (!cartItems || cartItems.length === 0) {
      return {
        hasEbooks: false,
        hasPhysicalBooks: false,
        isEbookOnly: false,
        isPhysicalOnly: false,
        isMixedCart: false,
        totalItems: 0,
        subtotal: 0,
        estimatedShipping: 0,
        tax: 0,
        total: 0
      };
    }

    const ebooks = cartItems.filter(item => {
      const format = item.book_format || item.book?.format;
      return format === 'ebook' || format === 'both';
    });
    const physicalBooks = cartItems.filter(item => {
      const format = item.book_format || item.book?.format;
      return format === 'physical' || format === 'both';
    });

    const hasEbooks = ebooks.length > 0;
    const hasPhysicalBooks = physicalBooks.length > 0;
    const isEbookOnly = hasEbooks && !hasPhysicalBooks;
    const isPhysicalOnly = hasPhysicalBooks && !hasEbooks;
    const isMixedCart = hasEbooks && hasPhysicalBooks;

    const subtotal = cartItems.reduce((sum, item) => {
      const price = item.book_price || item.book?.price || 0;
      return sum + (price * item.quantity);
    }, 0);

    const estimatedShipping = isEbookOnly ? 0 : (formData.shipping_method?.base_cost || 3000);
    const tax = Math.round(subtotal * 0.075); // 7.5% VAT
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
  }, [cartItems, formData.shipping_method]);

  // Generate checkout steps based on cart contents
  const steps = useMemo(() => {
    const stepList = [
      {
        id: 1,
        title: 'Customer Information',
        description: 'Contact details',
        icon: <User className="w-5 h-5" />,
        required: true
      }
    ];

    // Add shipping steps only for physical books
    if (!analytics.isEbookOnly) {
      stepList.push(
        {
          id: 2,
          title: 'Shipping Address',
          description: 'Delivery information',
          icon: <MapPin className="w-5 h-5" />,
          required: true
        },
        {
          id: 3,
          title: 'Shipping Method',
          description: 'Delivery option',
          icon: <Truck className="w-5 h-5" />,
          required: true
        }
      );
    }

    // Payment step
    stepList.push({
      id: stepList.length + 1,
      title: 'Payment',
      description: 'Complete purchase',
      icon: <CreditCard className="w-5 h-5" />,
      required: true
    });

    return stepList;
  }, [analytics.isEbookOnly]);

  // Load checkout data on mount
  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      setIsLoading(true);
      
      // Set default shipping methods if needed
      if (!analytics.isEbookOnly) {
        setShippingMethods([
          {
            id: 1,
            name: 'Express Shipping',
            base_cost: 3000,
            cost_per_item: 0,
            estimated_days_min: 2,
            estimated_days_max: 3,
            description: 'Fast delivery within 2-3 business days'
          },
          {
            id: 2,
            name: 'Standard Shipping',
            base_cost: 1500,
            cost_per_item: 0,
            estimated_days_min: 5,
            estimated_days_max: 7,
            description: 'Regular delivery within 5-7 business days'
          }
        ]);
      }

      // Set default payment gateways
      setPaymentGateways([
        {
          gateway_id: 'flutterwave',
          name: 'Flutterwave',
          description: 'Pay with cards, bank transfer, or mobile money',
          enabled: true,
          test_mode: false
        },
        {
          gateway_id: 'bank_transfer',
          name: 'Bank Transfer',
          description: 'Direct bank transfer with manual verification',
          enabled: true,
          test_mode: false
        }
      ]);
    } catch (error) {
      console.error('Error loading checkout data:', error);
      setError('Failed to load checkout options');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = useCallback((section: keyof CheckoutFormData, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1: // Customer Information
        return !!(
          formData.shipping_address.first_name && 
          formData.shipping_address.last_name && 
          formData.shipping_address.email
        );
      
      case 2: // Shipping Address (only for physical books)
        if (analytics.isEbookOnly) return true;
        return !!(
          formData.shipping_address.address && 
          formData.shipping_address.city && 
          formData.shipping_address.state && 
          formData.shipping_address.zip_code
        );
      
      case 3: // Shipping Method (only for physical books)
        if (analytics.isEbookOnly) return true;
        return !!formData.shipping_method;
      
      case 4: // Payment
        return !!formData.payment.method;
      
      default:
        return false;
    }
  }, [formData, analytics.isEbookOnly]);

  const nextStep = () => {
    // Validate current step before proceeding
    const stepErrors = validation.validateForm(formData, analytics.isEbookOnly);
    const currentStepFields = getCurrentStepFields(currentStep, analytics.isEbookOnly);
    const currentStepErrors = stepErrors.filter(error => 
      currentStepFields.some(field => error.field === field)
    );
    
    if (currentStepErrors.length === 0 && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      setError(null);
      
      // Show progress notification
      const stepNames = ['Customer Information', 'Shipping Address', 'Shipping Method', 'Payment'];
      if (currentStep <= stepNames.length) {
        notifications.showStepProgress(stepNames[currentStep - 1]);
      }
    } else if (currentStepErrors.length > 0) {
      setError({
        type: 'validation',
        message: 'Please fix the errors below before continuing',
        suggestions: currentStepErrors.map(e => e.message)
      });
      notifications.showValidationError('Please fix the errors below before continuing');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Final validation
    const validationErrors = validation.validateForm(formData, analytics.isEbookOnly);
    if (validationErrors.length > 0) {
      setError({
        type: 'validation',
        message: 'Please fix all errors before submitting',
        suggestions: validationErrors.map(e => e.message)
      });
      notifications.showValidationError('Please fix all errors before submitting');
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    try {
      setIsSubmitting(true);
      setShowConfirmDialog(false);
      setError(null);

      // Prepare checkout data with ebook-only handling
      const checkoutData = {
        shipping_address: {
          first_name: formData.shipping_address.first_name,
          last_name: formData.shipping_address.last_name,
          email: formData.shipping_address.email,
          phone: analytics.isEbookOnly ? '' : (formData.shipping_address.phone || ''),
          address: analytics.isEbookOnly ? '' : (formData.shipping_address.address || ''),
          city: analytics.isEbookOnly ? '' : (formData.shipping_address.city || ''),
          state: analytics.isEbookOnly ? '' : (formData.shipping_address.state || ''),
          zip_code: analytics.isEbookOnly ? '' : (formData.shipping_address.zip_code || ''),
          country: formData.shipping_address.country || 'NG'
        },
        billing_address: {
          same_as_shipping: true,
          first_name: formData.shipping_address.first_name,
          last_name: formData.shipping_address.last_name,
          email: formData.shipping_address.email,
          phone: analytics.isEbookOnly ? '' : (formData.shipping_address.phone || ''),
          address: analytics.isEbookOnly ? '' : (formData.shipping_address.address || ''),
          city: analytics.isEbookOnly ? '' : (formData.shipping_address.city || ''),
          state: analytics.isEbookOnly ? '' : (formData.shipping_address.state || ''),
          zip_code: analytics.isEbookOnly ? '' : (formData.shipping_address.zip_code || ''),
          country: formData.shipping_address.country || 'NG'
        },
        payment: {
          method: formData.payment.method,
          gateway: formData.payment.gateway
        },
        shipping_method: analytics.isEbookOnly ? null : (formData.shipping_method ? {
          id: formData.shipping_method.id,
          name: formData.shipping_method.name,
          base_cost: formData.shipping_method.base_cost,
          cost_per_item: formData.shipping_method.cost_per_item || 0,
          estimated_days_min: formData.shipping_method.estimated_days_min,
          estimated_days_max: formData.shipping_method.estimated_days_max,
          free_shipping_threshold: formData.shipping_method.free_shipping_threshold || null
        } : null),
        cart_items: cartItems.map(item => ({
          book_id: item.book_id,
          quantity: item.quantity,
          price: item.book_price || item.book?.price || 0,
          format: item.book_format || item.book?.format || 'ebook',
          title: item.book_title || item.book?.title || 'Unknown'
        })),
        notes: formData.notes || '',
        is_ebook_only: analytics.isEbookOnly
      };

      console.log('Sending checkout data:', JSON.stringify(checkoutData, null, 2));
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/checkout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(checkoutData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Checkout validation errors:', errorData);
        
        let errorType = 'server';
        let errorMessage = 'Checkout failed';
        let suggestions: string[] = [];
        
        if (response.status === 400) {
          errorType = 'validation';
          if (errorData.detail && Array.isArray(errorData.detail)) {
            suggestions = errorData.detail.map((err: any) => 
              `${err.loc?.join('.')} - ${err.msg}`
            );
            errorMessage = 'Please check your information and try again';
          }
        } else if (response.status === 401) {
          errorType = 'auth';
          errorMessage = 'Please log in again to continue';
          suggestions = ['Your session may have expired', 'Try refreshing the page'];
        } else if (response.status >= 500) {
          errorType = 'server';
          errorMessage = 'Server error occurred';
          suggestions = ['Try again in a few minutes', 'Contact support if the problem persists'];
        } else if (response.status === 0) {
          errorType = 'network';
          errorMessage = 'Network connection failed';
          suggestions = ['Check your internet connection', 'Try again in a moment'];
        }
        
        throw {
          type: errorType,
          message: errorMessage,
          suggestions,
          retryable: response.status >= 500
        };
      }

      const result = await response.json();
      
      if (result.success) {
        notifications.showOrderCreated(result.order_id, formData.payment.method);
        onComplete(result);
      } else {
        throw new Error(result.message || 'Payment processing failed');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorObj = error.type ? error : {
        type: 'server',
        message: error.message || 'An unexpected error occurred',
        retryable: true,
        suggestions: ['Please try again', 'Contact support if the problem persists']
      };
      
      setError(errorObj);
      
      // Show appropriate notification
      switch (errorObj.type) {
        case 'validation':
          notifications.showValidationError(errorObj.message);
          break;
        case 'network':
          notifications.showNetworkError(errorObj.message);
          break;
        case 'payment':
          notifications.showPaymentError(errorObj.message);
          break;
        case 'auth':
          notifications.showWarning(errorObj.message, 'Authentication Required');
          break;
        default:
          notifications.showServerError(errorObj.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!analytics || isLoading) {
    return <LoadingState type="data_loading" message="Loading checkout options..." />;
  }

  if (isSubmitting) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <LoadingState 
          type="order_creation" 
          message="Processing your order... Please don't close this page."
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Secure Checkout</h1>
        <p className="text-gray-600">
          {analytics.isEbookOnly ? 'Complete your digital purchase' : 
           analytics.isPhysicalOnly ? 'Complete your book order' : 
           'Complete your order'}
        </p>
      </div>

      {/* Progress Steps */}
      <ProgressIndicator 
        steps={steps.map(step => ({
          ...step,
          status: currentStep > step.id ? 'completed' : 
                 currentStep === step.id ? 'active' : 'pending'
        }))}
        currentStep={currentStep}
        className="mb-8"
      />

      {/* Error Display */}
      {error && (
        <ErrorDisplay 
          error={error}
          onRetry={error.retryable ? () => setError(null) : undefined}
          onDismiss={() => setError(null)}
          className="mb-6"
        />
      )}

      {/* Security Badge */}
      <SecurityBadge className="mb-6" />

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
            validation={validation}
          />
        )}
        
        {currentStep === 2 && !analytics.isEbookOnly && (
          <ShippingAddressStep 
            formData={formData}
            updateFormData={updateFormData}
            validation={validation}
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
        
        {currentStep === steps.length && (
          <PaymentStep 
            formData={formData}
            updateFormData={updateFormData}
            paymentGateways={paymentGateways}
            analytics={analytics}
            validation={validation}
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

        {currentStep < steps.length ? (
          <button
            onClick={nextStep}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
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

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        title="Confirm Your Order"
        message={`You are about to place an order for ₦${analytics.total.toLocaleString()}. ${analytics.isEbookOnly ? 'Your eBooks will be available immediately after payment.' : 'Your items will be shipped to the provided address.'}`}
        confirmText="Place Order"
        cancelText="Review Order"
        onConfirm={confirmSubmit}
        onCancel={() => setShowConfirmDialog(false)}
        type="info"
      />
    </div>
  );
}

// Helper function to get current step fields
function getCurrentStepFields(step: number, isEbookOnly: boolean): string[] {
  switch (step) {
    case 1:
      return ['shipping_address.first_name', 'shipping_address.last_name', 'shipping_address.email'];
    case 2:
      return isEbookOnly ? [] : ['shipping_address.phone', 'shipping_address.address', 'shipping_address.city', 'shipping_address.state', 'shipping_address.zip_code'];
    case 3:
      return isEbookOnly ? [] : ['shipping_method'];
    case 4:
      return ['payment.method'];
    default:
      return [];
  }
}

// Step Components
function CustomerInformationStep({ formData, updateFormData, validation }: {
  formData: CheckoutFormData;
  updateFormData: (section: keyof CheckoutFormData, data: any) => void;
  validation: any;
}) {
  const handleFieldChange = (field: string, value: string) => {
    updateFormData('shipping_address', { [field]: value });
    validation.markFieldTouched(`shipping_address.${field}`);
    validation.validateSingleField(`shipping_address.${field}`, value);
  };

  const getFieldClassName = (fieldPath: string, value: string) => {
    const status = validation.getFieldStatus(fieldPath, value);
    const baseClass = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors";
    
    switch (status) {
      case 'error':
        return `${baseClass} border-red-300 focus:ring-red-500 focus:border-red-500`;
      case 'success':
        return `${baseClass} border-green-300 focus:ring-green-500 focus:border-green-500`;
      default:
        return `${baseClass} border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
    }
  };

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
            maxLength={50}
            className={getFieldClassName('shipping_address.first_name', formData.shipping_address.first_name)}
            value={formData.shipping_address.first_name}
            onChange={(e) => handleFieldChange('first_name', e.target.value)}
            onBlur={() => validation.markFieldTouched('shipping_address.first_name')}
          />
          {validation.getFieldError('shipping_address.first_name') && validation.isFieldTouched('shipping_address.first_name') && (
            <FieldFeedback 
              type="error" 
              message={validation.getFieldError('shipping_address.first_name').message} 
            />
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            maxLength={50}
            className={getFieldClassName('shipping_address.last_name', formData.shipping_address.last_name)}
            value={formData.shipping_address.last_name}
            onChange={(e) => handleFieldChange('last_name', e.target.value)}
            onBlur={() => validation.markFieldTouched('shipping_address.last_name')}
          />
          {validation.getFieldError('shipping_address.last_name') && validation.isFieldTouched('shipping_address.last_name') && (
            <FieldFeedback 
              type="error" 
              message={validation.getFieldError('shipping_address.last_name').message} 
            />
          )}
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
            className={`pl-10 pr-3 ${getFieldClassName('shipping_address.email', formData.shipping_address.email).replace('px-3', '')}`}
            value={formData.shipping_address.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            onBlur={() => validation.markFieldTouched('shipping_address.email')}
          />
        </div>
        {validation.getFieldError('shipping_address.email') && validation.isFieldTouched('shipping_address.email') && (
          <FieldFeedback 
            type="error" 
            message={validation.getFieldError('shipping_address.email').message} 
          />
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number *
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="tel"
            maxLength={15}
            className={`pl-10 pr-3 ${getFieldClassName('shipping_address.phone', formData.shipping_address.phone).replace('px-3', '')}`}
            value={formData.shipping_address.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            onBlur={() => validation.markFieldTouched('shipping_address.phone')}
            placeholder="+234 801 234 5678"
          />
        </div>
        {validation.getFieldError('shipping_address.phone') && validation.isFieldTouched('shipping_address.phone') && (
          <FieldFeedback 
            type="error" 
            message={validation.getFieldError('shipping_address.phone').message} 
          />
        )}
      </div>
    </div>
  );
}

function ShippingAddressStep({ formData, updateFormData, validation }: {
  formData: CheckoutFormData;
  updateFormData: (section: keyof CheckoutFormData, data: any) => void;
  validation: any;
}) {
  const handleFieldChange = (field: string, value: string) => {
    updateFormData('shipping_address', { [field]: value });
    validation.markFieldTouched(`shipping_address.${field}`);
    validation.validateSingleField(`shipping_address.${field}`, value);
  };

  const getFieldClassName = (fieldPath: string, value: string) => {
    const status = validation.getFieldStatus(fieldPath, value);
    const baseClass = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors";
    
    switch (status) {
      case 'error':
        return `${baseClass} border-red-300 focus:ring-red-500 focus:border-red-500`;
      case 'success':
        return `${baseClass} border-green-300 focus:ring-green-500 focus:border-green-500`;
      default:
        return `${baseClass} border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
    }
  };

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
            maxLength={200}
            className={`pl-10 pr-3 ${getFieldClassName('shipping_address.address', formData.shipping_address.address).replace('px-3', '')}`}
            value={formData.shipping_address.address}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            onBlur={() => validation.markFieldTouched('shipping_address.address')}
            placeholder="123 Main Street, Apartment 4B"
          />
        </div>
        {validation.getFieldError('shipping_address.address') && validation.isFieldTouched('shipping_address.address') && (
          <FieldFeedback 
            type="error" 
            message={validation.getFieldError('shipping_address.address').message} 
          />
        )}
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
              maxLength={50}
              className={`pl-10 pr-3 ${getFieldClassName('shipping_address.city', formData.shipping_address.city).replace('px-3', '')}`}
              value={formData.shipping_address.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              onBlur={() => validation.markFieldTouched('shipping_address.city')}
              placeholder="Lagos"
            />
          </div>
          {validation.getFieldError('shipping_address.city') && validation.isFieldTouched('shipping_address.city') && (
            <FieldFeedback 
              type="error" 
              message={validation.getFieldError('shipping_address.city').message} 
            />
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State *
          </label>
          <select
            className={getFieldClassName('shipping_address.state', formData.shipping_address.state)}
            value={formData.shipping_address.state}
            onChange={(e) => handleFieldChange('state', e.target.value)}
            onBlur={() => validation.markFieldTouched('shipping_address.state')}
          >
            <option value="">Select State</option>
            {NIGERIAN_STATES.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          {validation.getFieldError('shipping_address.state') && validation.isFieldTouched('shipping_address.state') && (
            <FieldFeedback 
              type="error" 
              message={validation.getFieldError('shipping_address.state').message} 
            />
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ZIP/Postal Code *
          </label>
          <input
            type="text"
            maxLength={10}
            className={getFieldClassName('shipping_address.zip_code', formData.shipping_address.zip_code)}
            value={formData.shipping_address.zip_code}
            onChange={(e) => handleFieldChange('zip_code', e.target.value)}
            onBlur={() => validation.markFieldTouched('shipping_address.zip_code')}
            placeholder="100001"
          />
          {validation.getFieldError('shipping_address.zip_code') && validation.isFieldTouched('shipping_address.zip_code') && (
            <FieldFeedback 
              type="error" 
              message={validation.getFieldError('shipping_address.zip_code').message} 
            />
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country *
          </label>
          <select
            className={getFieldClassName('shipping_address.country', formData.shipping_address.country)}
            value={formData.shipping_address.country}
            onChange={(e) => handleFieldChange('country', e.target.value)}
          >
            <option value="NG">Nigeria</option>
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
        {shippingMethods.map((method) => (
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
                <h4 className="font-medium text-gray-900">{sanitizeForDisplay(method.name)}</h4>
                <p className="text-sm text-gray-600">{sanitizeForDisplay(method.description)}</p>
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
      
      {shippingMethods.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          No shipping methods available. Please contact support.
        </div>
      )}
    </div>
  );
}

function PaymentStep({ formData, updateFormData, paymentGateways, analytics, validation }: {
  formData: CheckoutFormData;
  updateFormData: (section: keyof CheckoutFormData, data: any) => void;
  paymentGateways: PaymentGateway[];
  analytics: CartAnalytics;
  validation: any;
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
                <h4 className="font-medium text-gray-900">{sanitizeForDisplay(gateway.name)}</h4>
                <p className="text-sm text-gray-600">{sanitizeForDisplay(gateway.description)}</p>
                
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
        <PaymentInfo 
          method={formData.payment.gateway as 'flutterwave' | 'bank_transfer'}
          isEbookOnly={analytics.isEbookOnly}
        />
      )}
      
      {/* Payment Method Validation */}
      {validation.getFieldError('payment.method') && validation.isFieldTouched('payment.method') && (
        <FieldFeedback 
          type="error" 
          message={validation.getFieldError('payment.method').message} 
        />
      )}
      
      {paymentGateways.filter(gateway => gateway.enabled).length === 0 && (
        <div className="text-center py-6 text-gray-500">
          No payment methods available. Please contact support.
        </div>
      )}
    </div>
  );
}