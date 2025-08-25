// API configuration
const config = {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    TIMEOUT: 30000, // 30 seconds
};

// API endpoints
export const API_ENDPOINTS = {
    CHECKOUT: {
        CREATE: `${config.API_URL}/orders/enhanced/checkout-new`,
        GUEST: `${config.API_URL}/orders/enhanced/guest-checkout`,
    },
    SHIPPING: {
        METHODS: `${config.API_URL}/shipping/methods`,
        ESTIMATE: (orderId: string) => `${config.API_URL}/shipping/estimate/${orderId}`,
    },
    PAYMENT: {
        GATEWAYS: `${config.API_URL}/payment-gateways`,
    },
    ORDERS: {
        TRACKING: (orderId: string) => `${config.API_URL}/orders/enhanced/${orderId}/tracking`,
        CONFIRM: (orderId: string) => `${config.API_URL}/orders/enhanced/${orderId}/confirmation`,
    },
};

// Error messages
export const API_ERRORS = {
    NETWORK: 'Network error occurred. Please check your connection.',
    SERVER: 'Server error occurred. Please try again later.',
    VALIDATION: 'Please check your input and try again.',
    UNAUTHORIZED: 'Please log in to continue.',
    NOT_FOUND: 'The requested resource was not found.',
};

// Helper to format API errors
export const formatApiError = (error: any): string => {
    if (error.response) {
        // Server responded with error
        const message = error.response.data?.detail || error.response.data?.message;
        return message || API_ERRORS.SERVER;
    } else if (error.request) {
        // Request made but no response
        return API_ERRORS.NETWORK;
    } else {
        // Error in request setup
        return error.message || API_ERRORS.SERVER;
    }
};
