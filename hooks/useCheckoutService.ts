'use client';

import { useState } from 'react';
import { API_ENDPOINTS, formatApiError } from '@/config/api';

interface CheckoutError {
    message: string;
    code?: string;
    field?: string;
}

export const useCheckoutService = () => {
    const [error, setError] = useState<CheckoutError | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchShippingMethods = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shipping/methods`);
            
            if (!response.ok) {
                throw new Error(`Error fetching shipping methods: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (err) {
            const errorMessage = formatApiError(err);
            setError({ message: errorMessage });
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const processCheckout = async (checkoutData: any, isGuest: boolean = false) => {
        try {
            setIsLoading(true);
            setError(null);

            const endpoint = isGuest ? API_ENDPOINTS.CHECKOUT.GUEST : API_ENDPOINTS.CHECKOUT.CREATE;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(checkoutData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Checkout failed');
            }

            return await response.json();
        } catch (err) {
            const errorMessage = formatApiError(err);
            setError({ message: errorMessage });
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const getOrderTracking = async (orderId: string) => {
        try {
            setIsLoading(true);
            const response = await fetch(API_ENDPOINTS.ORDERS.TRACKING(orderId));
            
            if (!response.ok) {
                throw new Error(`Error fetching order tracking: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (err) {
            const errorMessage = formatApiError(err);
            setError({ message: errorMessage });
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const confirmOrder = async (orderId: string) => {
        try {
            setIsLoading(true);
            const response = await fetch(API_ENDPOINTS.ORDERS.CONFIRM(orderId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error confirming order: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (err) {
            const errorMessage = formatApiError(err);
            setError({ message: errorMessage });
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        error,
        isLoading,
        fetchShippingMethods,
        processCheckout,
        getOrderTracking,
        confirmOrder
    };
};
