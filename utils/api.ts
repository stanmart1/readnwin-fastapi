// API configuration
export const API_BASE_URL = 'http://localhost:8000';

// Endpoints
export const ENDPOINTS = {
    SHIPPING: {
        METHODS: `${API_BASE_URL}/shipping/methods`,
        ESTIMATE: (orderId: string) => `${API_BASE_URL}/shipping/estimate/${orderId}`
    },
    ORDERS: {
        CREATE: `${API_BASE_URL}/orders/enhanced/checkout-new`,
        GUEST_CHECKOUT: `${API_BASE_URL}/orders/enhanced/guest-checkout`,
        TRACKING: (orderId: string) => `${API_BASE_URL}/orders/enhanced/${orderId}/tracking`,
        CONFIRMATION: (orderId: string) => `${API_BASE_URL}/orders/enhanced/${orderId}/confirmation`,
        GUEST_ORDERS: (guestId: string) => `${API_BASE_URL}/orders/enhanced/guest/${guestId}`
    }
};

// Helper function to add auth header if session exists
export const getAuthHeaders = (session: any) => ({
    'Content-Type': 'application/json',
    ...(session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : {})
});

// API request helpers
export const fetchShippingMethods = async (session?: any) => {
    const response = await fetch(ENDPOINTS.SHIPPING.METHODS, {
        headers: getAuthHeaders(session)
    });
    if (!response.ok) throw new Error('Failed to fetch shipping methods');
    return response.json();
};

export const createOrder = async (orderData: any, session?: any) => {
    const response = await fetch(ENDPOINTS.ORDERS.CREATE, {
        method: 'POST',
        headers: getAuthHeaders(session),
        body: JSON.stringify({
            items: orderData.items.map((item: any) => ({
                book_id: item.id,
                quantity: item.quantity
            })),
            shipping_address: orderData.shippingAddress,
            billing_address: orderData.billingAddress,
            shipping_method: orderData.shippingMethod,
            payment_method: orderData.paymentMethod,
            email: orderData.email,
            phone: orderData.phone,
            notes: orderData.notes
        })
    });
    if (!response.ok) throw new Error('Failed to create order');
    return response.json();
};

export const createGuestOrder = async (orderData: any) => {
    const response = await fetch(ENDPOINTS.ORDERS.GUEST_CHECKOUT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            items: orderData.items.map((item: any) => ({
                book_id: item.id,
                quantity: item.quantity
            })),
            shipping_address: orderData.shippingAddress,
            billing_address: orderData.billingAddress,
            shipping_method: orderData.shippingMethod,
            payment_method: orderData.paymentMethod,
            email: orderData.email,
            phone: orderData.phone,
            notes: orderData.notes
        })
    });
    if (!response.ok) throw new Error('Failed to create guest order');
    return response.json();
};

export const getOrderTracking = async (orderId: string, session?: any) => {
    const response = await fetch(ENDPOINTS.ORDERS.TRACKING(orderId), {
        headers: getAuthHeaders(session)
    });
    if (!response.ok) throw new Error('Failed to fetch order tracking');
    return response.json();
};

export const confirmOrder = async (orderId: string, session?: any) => {
    const response = await fetch(ENDPOINTS.ORDERS.CONFIRMATION(orderId), {
        method: 'POST',
        headers: getAuthHeaders(session)
    });
    if (!response.ok) throw new Error('Failed to confirm order');
    return response.json();
};
