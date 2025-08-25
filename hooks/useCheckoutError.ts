import { useState } from 'react';

interface UseCheckoutErrorProps {
  defaultMessage?: string;
}

export const useCheckoutError = ({ defaultMessage = 'An error occurred during checkout.' }: UseCheckoutErrorProps = {}) => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckoutError = (err: any) => {
    console.error('Checkout error:', err);
    
    if (err.response?.data?.detail) {
      setError(err.response.data.detail);
    } else if (err.message) {
      setError(err.message);
    } else {
      setError(defaultMessage);
    }
    
    setIsProcessing(false);
  };

  const clearError = () => {
    setError(null);
  };

  const startProcessing = () => {
    setIsProcessing(true);
    clearError();
  };

  const stopProcessing = () => {
    setIsProcessing(false);
  };

  return {
    error,
    isProcessing,
    handleCheckoutError,
    clearError,
    startProcessing,
    stopProcessing
  };
};
