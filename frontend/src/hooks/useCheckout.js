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
        setError(null);
        
        // Only fetch shipping methods if not ebook-only
        if (!isEbookOnly) {
          try {
            const shippingRes = await api.get('/shipping/methods');
            setShippingMethods(shippingRes.data.methods || shippingRes.data || []);
          } catch (shippingErr) {
            console.error('Failed to load shipping methods:', shippingErr);
            // Don't fail the entire checkout if shipping fails
            setShippingMethods([]);
          }
        } else {
          setShippingMethods([]);
        }

        // Always fetch payment gateways
        try {
          const paymentRes = await api.get('/payment-gateways');
          setPaymentGateways(paymentRes.data.gateways || paymentRes.data || []);
        } catch (paymentErr) {
          console.error('Failed to load payment gateways:', paymentErr);
          // Provide fallback payment options
          setPaymentGateways([
            { id: 'flutterwave', name: 'Flutterwave', description: 'Pay with card or bank transfer', enabled: true },
            { id: 'bank_transfer', name: 'Bank Transfer', description: 'Direct bank transfer', enabled: true }
          ]);
        }
      } catch (err) {
        console.error('Checkout data loading error:', err);
        setError(err.response?.data?.detail || err.message || 'Failed to load checkout data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [isEbookOnly]);

  return { shippingMethods, paymentGateways, isLoading, error };
}
