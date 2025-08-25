'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { formatNaira, calculateVAT } from '@/lib/currency';
import { useCart } from '@/contexts/CartContextNew';
import { useFlutterwaveInline } from '@/hooks/useFlutterwaveInline';
import { AlertCircle, CheckCircle, Loader2, Upload, X, FileText, Image as ImageIcon } from 'lucide-react';

interface OrderConfirmationProps {
  formData: any;
  cartItems: any[];
  onPlaceOrder: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export default function OrderConfirmation({ 
  formData, 
  cartItems, 
  onPlaceOrder, 
  onBack, 
  isLoading 
}: OrderConfirmationProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { isEbookOnly } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [bankTransferData, setBankTransferData] = useState<any>(null);
  const [bankTransferId, setBankTransferId] = useState<number | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  
  // Enhanced loading and processing states
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState(0);

  // Validation states
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Flutterwave inline payment hook
  const { initializePayment } = useFlutterwaveInline({
    onSuccess: (response) => {
      console.log('Payment successful:', response);
      if (response.status === 'successful') {
        router.push(`/order-confirmation/${response.meta?.order_id || 'success'}`);
      } else {
        // Payment was not successful
        const orderNumber = response.meta?.order_number || 'unknown';
        router.push(`/payment/failed?order=${orderNumber}&reason=payment_failed`);
      }
    },
    onClose: () => {
      console.log('Payment modal closed - user cancelled');
      const orderNumber = orderData?.order_number || 'unknown';
      router.push(`/payment/cancelled?order=${orderNumber}`);
    },
    onError: (error) => {
      console.error('Payment error:', error);
      const orderNumber = orderData?.order_number || 'unknown';
      router.push(`/payment/failed?order=${orderNumber}&reason=payment_error`);
    }
  });
  
  // File upload states for bank transfer
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.book?.price || item.price || 0;
      const quantity = item.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  const calculateShipping = () => {
    // Free shipping for digital-only orders
    if (isEbookOnly()) {
      return 0;
    }
    
    // Calculate shipping cost based on selected shipping method
    if (formData.shippingMethod) {
      const method = formData.shippingMethod;
      const subtotal = calculateSubtotal();
      
      // Check if free shipping threshold is met
      if (method.free_shipping_threshold && subtotal >= method.free_shipping_threshold) {
        return 0;
      }
      
      // Calculate shipping cost: base cost + (cost per item × number of physical items)
      const physicalItems = cartItems.filter(item => 
        item.book?.format === 'physical' || item.book?.format === 'both'
      );
      const physicalItemCount = physicalItems.reduce((total, item) => total + item.quantity, 0);
      
      const shippingCost = method.base_cost + (method.cost_per_item * physicalItemCount);
      return shippingCost;
    }
    
    // If no shipping method selected but we have physical items, show estimated shipping
    const physicalItems = cartItems.filter(item => 
      item.book?.format === 'physical' || item.book?.format === 'both'
    );
    
    if (physicalItems.length > 0) {
      // Estimate shipping cost based on typical rates for Nigeria
      const estimatedBaseCost = 500; // Base shipping cost
      const estimatedPerItemCost = 200; // Cost per additional item
      const totalItems = physicalItems.reduce((total, item) => total + item.quantity, 0);
      
      return estimatedBaseCost + (estimatedPerItemCost * (totalItems - 1));
    }
    
    return 0;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return calculateVAT(subtotal);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping() + calculateTax();
  };

  // Enhanced validation function
  const validateOrder = () => {
    const errors: string[] = [];

    // Check if user is authenticated
    if (!isAuthenticated || !user?.id) {
      errors.push('Please log in to continue with payment. Please refresh the page and try again.');
    }

    // Validate shipping information for physical orders
    if (!isEbookOnly()) {
      if (!formData.shipping.firstName?.trim()) {
        errors.push('First name is required');
      }
      if (!formData.shipping.lastName?.trim()) {
        errors.push('Last name is required');
      }
      if (!formData.shipping.email?.trim()) {
        errors.push('Email is required');
      }
      if (!formData.shipping.phone?.trim()) {
        errors.push('Phone number is required');
      }
      if (!formData.shipping.address?.trim()) {
        errors.push('Shipping address is required');
      }
      if (!formData.shipping.city?.trim()) {
        errors.push('City is required');
      }
      if (!formData.shipping.state?.trim()) {
        errors.push('State is required');
      }
    }

    // Validate payment method
    if (!formData.payment.method) {
      errors.push('Please select a payment method');
    }



    setValidationErrors(errors);
    return errors.length === 0;
  };

  // File upload handlers for bank transfer
  const handleFileSelect = (file: File) => {
    // Clear previous errors
    setUploadError(null);
    setValidationErrors(prev => prev.filter(error => !error.includes('proof of payment')));

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('File size too large. Maximum size is 5MB.');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadProofOfPayment = async (bankTransferId: number) => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('bank_transfer_id', bankTransferId.toString());
      formData.append('file', selectedFile);

      const response = await fetch('/api/payment/bank-transfer/upload-proof', {
        method: 'POST',
        credentials: 'include', // Include session cookies
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadSuccess(true);
        setUploadError(null);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setUploadError(errorData.error || 'Upload failed');
      }
    } catch (error) {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      // Clear previous errors
      setOrderError(null);
      setValidationErrors([]);

      // Validate order before proceeding
      if (!validateOrder()) {
        return;
      }

      setIsProcessingOrder(true);
      setProcessingStep('Creating your order...');
      setProcessingProgress(25);

      // Transform form data to match API expectations (camelCase to snake_case)
      const transformedFormData = {
        shipping: {
          first_name: formData.shipping.firstName,
          last_name: formData.shipping.lastName,
          email: formData.shipping.email,
          phone: formData.shipping.phone,
          address: formData.shipping.address,
          city: formData.shipping.city,
          state: formData.shipping.state,
          zip_code: formData.shipping.lga || formData.shipping.zipCode || '',
          country: formData.shipping.country
        },
        billing: {
          sameAsShipping: formData.billing.sameAsShipping,
          first_name: formData.billing.firstName,
          last_name: formData.billing.lastName,
          address: formData.billing.address,
          city: formData.billing.city,
          state: formData.billing.state,
          zip_code: formData.billing.lga || formData.billing.zipCode || '',
          country: formData.billing.country
        },
        payment: formData.payment,
        shippingMethod: formData.shippingMethod
      };

      setProcessingStep('Processing payment...');
      setProcessingProgress(50);

      // Transform data to match backend schema
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const checkoutRequest = {
        shipping_address: {
          first_name: formData.shipping.firstName,
          last_name: formData.shipping.lastName,
          email: formData.shipping.email,
          phone: formData.shipping.phone,
          address: formData.shipping.address,
          city: formData.shipping.city,
          state: formData.shipping.state,
          zip_code: formData.shipping.lga || '',
          country: formData.shipping.country
        },
        billing_address: {
          same_as_shipping: formData.billing.sameAsShipping
        },
        payment: {
          method: formData.payment.method,
          gateway: formData.payment.gateway
        },
        cart_items: cartItems.map(item => ({
          book_id: item.book_id,
          quantity: item.quantity,
          price: (item.book?.price || item.price || 0).toString()
        })),
        shipping_method: formData.shippingMethod ? {
          id: formData.shippingMethod.id,
          name: formData.shippingMethod.name,
          base_cost: formData.shippingMethod.base_cost,
          cost_per_item: formData.shippingMethod.cost_per_item || 0,
          estimated_days_min: formData.shippingMethod.estimated_days_min,
          estimated_days_max: formData.shippingMethod.estimated_days_max,
          free_shipping_threshold: formData.shippingMethod.free_shipping_threshold
        } : null,
        is_ebook_only: isEbookOnly()
      };
      
      console.log('🔍 Sending checkout request:', {
        url: `${process.env.NEXT_PUBLIC_API_URL}/checkout/`,
        hasToken: !!token,
        body: checkoutRequest
      });
      
      const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/checkout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(checkoutRequest),
      });

      setProcessingStep('Finalizing order...');
      setProcessingProgress(75);

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error('❌ Order response error:', {
          status: orderResponse.status,
          statusText: orderResponse.statusText,
          body: errorText
        });
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Failed to create order' };
        }
        
        throw new Error(errorData.detail || errorData.error || `HTTP ${orderResponse.status}: ${errorText}`);
      }

      const orderResult = await orderResponse.json();
      console.log('🔍 Order result received:', JSON.stringify(orderResult, null, 2));
      
      setProcessingStep('Completing order...');
      setProcessingProgress(90);
      
      // Handle the response from unified checkout endpoint
      if (orderResult.success) {
        setOrderData({
          id: orderResult.order_id,
          order_number: orderResult.order_number,
          total_amount: orderResult.total_amount
        });

        // Handle different payment methods based on the response
        if (orderResult.payment_method === 'bank_transfer') {
          console.log('🔍 Processing bank transfer response');
          console.log('🔍 Bank transfer details:', orderResult.bank_transfer_details);
          
          // Bank transfer details from unified checkout
          setBankTransferData(orderResult.bank_transfer_details);
          
          setOrderPlaced(true);
        } else if (orderResult.payment_method === 'flutterwave') {
          // Flutterwave payment URL from unified checkout
          if (orderResult.payment_url) {
            setProcessingStep('Redirecting to payment gateway...');
            window.location.href = orderResult.payment_url;
          } else {
            throw new Error('Failed to get payment URL from Flutterwave');
          }
        } else {
          // Direct order confirmation
          setOrderPlaced(true);
        }

        setProcessingProgress(100);
        setProcessingStep('Order completed successfully!');
      } else {
        throw new Error(orderResult.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      const errorMessage = error instanceof Error ? error.message : 'There was an error processing your order. Please try again.';
      setOrderError(errorMessage);
      // Clear error after 8 seconds
      setTimeout(() => setOrderError(null), 8000);
    } finally {
      setIsProcessingOrder(false);
      setProcessingStep('');
      setProcessingProgress(0);
    }
  };

  const handleInlinePayment = async (orderResult: any) => {
    try {
      console.log('🔍 Order result for inline payment:', JSON.stringify(orderResult, null, 2));
      
      // Redirect to Flutterwave Rave Pay website
      if (orderResult.flutterwavePaymentUrl) {
        window.location.href = orderResult.flutterwavePaymentUrl;
      } else {
        throw new Error('Flutterwave payment URL not provided');
      }
    } catch (error) {
      console.error('Flutterwave redirection error:', error);
      setOrderError('Failed to redirect to payment gateway. Please try again.');
    }
  };

  const handleBankTransferContinue = () => {
    console.log('🔍 handleBankTransferContinue called');
    console.log('🔍 orderData:', orderData);
    console.log('🔍 bankTransferData:', bankTransferData);
    
    if (orderData?.id) {
      console.log('🔍 Navigating to bank transfer page:', `/payment/bank-transfer/${orderData.id}`);
      router.push(`/payment/bank-transfer/${orderData.id}`);
    } else {
      console.error('Order ID is not available');
      setOrderError('Order ID is not available. Please try again.');
    }
  };

  // Processing overlay
  if (isProcessingOrder) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Your Order</h3>
            <p className="text-gray-600 mb-4">{processingStep}</p>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
            
            <p className="text-sm text-gray-500">{processingProgress}% complete</p>
          </div>
        </div>
      </div>
    );
  }

  if (orderPlaced && bankTransferData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your order has been created and bank transfer initiated.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Bank Transfer Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Amount:</span>
                  <span className="font-semibold text-blue-900">{formatNaira(bankTransferData.bank_transfer_details?.amount || orderData?.total_amount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Reference:</span>
                  <span className="font-mono text-blue-900">{bankTransferData.bank_transfer_details?.reference || orderData?.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Expires:</span>
                  <span className="text-blue-900">
                    {bankTransferData.bank_transfer_details?.expires_at ? 
                      new Date(bankTransferData.bank_transfer_details.expires_at).toLocaleString() :
                      'Within 24 hours'
                    }
                  </span>
                </div>
                {bankTransferData.bank_transfer_details?.bank_account && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Bank Account Details</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Bank:</span>
                        <span className="text-blue-900">{bankTransferData.bank_transfer_details.bank_account.bank_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Account Number:</span>
                        <span className="font-mono text-blue-900">{bankTransferData.bank_transfer_details.bank_account.account_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Account Name:</span>
                        <span className="text-blue-900">{bankTransferData.bank_transfer_details.bank_account.account_name}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleBankTransferContinue}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Continue to Bank Transfer
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Order</h2>
        <p className="text-gray-600">Please review your order details before placing your order</p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-red-800 font-medium mb-2">Please fix the following issues:</h4>
              <ul className="text-red-700 text-sm space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2"></span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Order Items */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
        <div className="space-y-3">
          {cartItems.map((item, index) => {
            const book = item.book || item;
            const price = book.price || 0;
            const quantity = item.quantity || 1;
            const totalPrice = price * quantity;
            
            return (
              <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                <img 
                  src={(book.cover_image_url || book.cover)?.startsWith('http') 
                    ? (book.cover_image_url || book.cover) 
                    : `${process.env.NEXT_PUBLIC_API_URL}/${book.cover_image_url || book.cover}`} 
                  alt={book.title}
                  className="w-16 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{book.title}</h4>
                  <p className="text-sm text-gray-600">by {book.author_name || book.author}</p>
                  <p className="text-sm text-gray-500">Quantity: {quantity}</p>
                  {book.format && (
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      book.format === 'ebook' 
                        ? 'bg-green-100 text-green-800' 
                        : book.format === 'physical'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {book.format === 'ebook' ? 'Digital' : 
                       book.format === 'physical' ? 'Physical' : 
                       book.format === 'both' ? 'Both Formats' : book.format}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatNaira(totalPrice)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipping Address - Only show for physical orders */}
      {!isEbookOnly() && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <p className="font-medium text-gray-900">
              {formData.shipping.firstName} {formData.shipping.lastName}
            </p>
            <p className="text-gray-600">{formData.shipping.address}</p>
            <p className="text-gray-600">
              {formData.shipping.city}, {formData.shipping.state} {formData.shipping.zipCode}
            </p>
            <p className="text-gray-600">{formData.shipping.country}</p>
            <p className="text-gray-600 mt-2">
              Email: {formData.shipping.email}
            </p>
            <p className="text-gray-600">
              Phone: {formData.shipping.phone}
            </p>
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              formData.payment.method === 'flutterwave' ? 'bg-blue-600' : 'bg-green-600'
            }`}>
              <i className={`${
                formData.payment.method === 'flutterwave' ? 'ri-bank-card-line' : 'ri-bank-line'
              } text-white text-sm`}></i>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {formData.payment.method === 'flutterwave' ? 'Flutterwave Payment' : 'Bank Transfer'}
              </p>
              <p className="text-sm text-gray-600">
                {formData.payment.method === 'flutterwave' 
                  ? 'Pay with card, bank transfer, or mobile money. eBooks available immediately after payment.' 
                  : 'Pay via bank transfer with proof upload. eBooks available after payment confirmation.'}
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* Order Summary */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal ({cartItems.length} items)</span>
            <span className="font-semibold text-gray-900">{formatNaira(calculateSubtotal())}</span>
          </div>
          
          {isEbookOnly() ? (
            <div className="flex justify-between text-green-600">
              <span>Shipping</span>
              <span>Free (Digital)</span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="font-semibold text-gray-900">{formatNaira(calculateShipping())}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-600">VAT (7.5%)</span>
            <span className="font-semibold text-gray-900">{formatNaira(calculateTax())}</span>
          </div>
          
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between text-lg font-semibold text-gray-900">
              <span>Total</span>
              <span>{formatNaira(calculateTotal())}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {orderError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-red-800 font-medium mb-1">Order Processing Error</h4>
              <p className="text-red-700 text-sm">{orderError}</p>
              <p className="text-red-600 text-xs mt-2">
                Please check your information and try again. If the problem persists, contact support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          disabled={isProcessingOrder}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          onClick={handlePlaceOrder}
          disabled={isProcessingOrder || validationErrors.length > 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isProcessingOrder ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <span>Place Order</span>
          )}
        </button>
      </div>
    </div>
  );
} 