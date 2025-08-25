import { useEffect, useState } from 'react';
import { useCheckoutService } from './useCheckoutService';

interface ShippingMethod {
    id: string;
    name: string;
    price: number;
    description: string;
    estimated_days: string;
}

export const useCheckout = (isGuest = false) => {
    const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
    const { error, isLoading, fetchShippingMethods, processCheckout } = useCheckoutService();

    useEffect(() => {
        loadShippingMethods();
    }, []);

    const loadShippingMethods = async () => {
        try {
            const response = await fetchShippingMethods();
            setShippingMethods(response.methods || []);
        } catch (error) {
            console.error('Error loading shipping methods:', error);
        }
    };

    const handleCheckout = async (orderData: any) => {
        return processCheckout(orderData, isGuest);
    };

    return {
        shippingMethods,
        isLoading,
        error,
        processCheckout: handleCheckout
    };
};
