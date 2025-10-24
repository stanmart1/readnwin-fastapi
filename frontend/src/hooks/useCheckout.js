import { useState, useEffect } from 'react';
import api from '../lib/api';

export function useCheckout(isEbookOnly) {
  const [shippingMethods, setShippingMethods] = useState([]);
  const [paymentGateways, setPaymentGateways] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        if (!isEbookOnly) {
          const shippingRes = await api.get('/shipping/methods');
          setShippingMethods(shippingRes.data.methods || []);
        }

        const paymentRes = await api.get('/payment-gateways');
        setPaymentGateways(paymentRes.data.gateways || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [isEbookOnly]);

  return { shippingMethods, paymentGateways, isLoading, error };
}
