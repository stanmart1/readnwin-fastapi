import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface FlutterwaveInlinePaymentData {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options: string;
  customer: {
    email: string;
    phone_number: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo: string;
  };
  callback: (response: any) => void;
  onClose: () => void;
}

interface UseFlutterwaveInlineOptions {
  onSuccess?: (response: any) => void;
  onClose?: () => void;
  onError?: (error: any) => void;
}

interface PaymentData {
  amount: number;
  currency: string;
  email: string;
  phone_number?: string;
  tx_ref: string;
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  meta?: Record<string, any>;
}

export const useFlutterwaveInline = (options: UseFlutterwaveInlineOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Flutterwave script is loaded
  useEffect(() => {
    const checkScript = () => {
      if (typeof window !== 'undefined' && (window as any).FlutterwaveCheckout) {
        setIsScriptLoaded(true);
      } else {
        // Wait a bit and check again (script might still be loading)
        setTimeout(checkScript, 100);
      }
    };

    checkScript();
  }, []);

  const initializePayment = useCallback(async (paymentData: PaymentData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get inline payment data from API using cached client
      const result = await apiClient.createFlutterwavePayment(paymentData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to prepare payment');
      }

      // Initialize inline payment using the data from API
      const inlineData: FlutterwaveInlinePaymentData = {
        ...result.paymentData,
        callback: (response: any) => {
          console.log('Payment callback received:', response);
          if (options.onSuccess) {
            options.onSuccess(response);
          }
        },
        onClose: () => {
          console.log('Payment modal closed');
          if (options.onClose) {
            options.onClose();
          }
        }
      };

      // Check if Flutterwave script is loaded
      if (typeof window !== 'undefined' && (window as any).FlutterwaveCheckout) {
        (window as any).FlutterwaveCheckout(inlineData);
      } else {
        throw new Error('Flutterwave script not loaded');
      }

    } catch (err) {
      console.error('Payment initialization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Payment initialization failed';
      setError(errorMessage);
      if (options.onError) {
        options.onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  return {
    initializePayment,
    isLoading,
    isScriptLoaded,
    error,
    clearError: () => setError(null)
  };
}; 