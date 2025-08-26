'use client';

import { useState } from 'react';
import { useCheckoutService } from './useCheckoutService';
import { useCheckoutError } from './useCheckoutError';

interface UseCheckoutFlowProps {
  isGuest?: boolean;
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
}

export const useCheckoutFlow = ({
  isGuest = false,
  onSuccess,
  onError
}: UseCheckoutFlowProps = {}) => {
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const { error, isProcessing, handleCheckoutError, startProcessing, stopProcessing } = useCheckoutError();
  const { processCheckout, fetchShippingMethods } = useCheckoutService();

  const handleCheckout = async (formData: any) => {
    try {
      startProcessing();
      
      const orderData = {
        ...formData,
        shipping_address: {
          ...formData.shippingAddress,
          email: formData.email || formData.shippingAddress.email
        }
      };

      const response = await processCheckout(orderData, isGuest);
      setCheckoutData(response);
      
      if (onSuccess) {
        onSuccess(response.order_id);
      }
      
      return response;
    } catch (err) {
      handleCheckoutError(err);
      if (onError) {
        onError(error || 'Checkout failed');
      }
      throw err;
    } finally {
      stopProcessing();
    }
  };

  return {
    error,
    isProcessing,
    checkoutData,
    handleCheckout,
    fetchShippingMethods
  };
};
