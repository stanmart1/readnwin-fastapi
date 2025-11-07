import axios from 'axios';

// Get API base URL from environment variable or default to localhost
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Remove trailing slash to prevent double slashes
API_BASE_URL = API_BASE_URL.replace(/\/$/, '');

// Force HTTPS in production to prevent mixed content errors
if (window.location.protocol === 'https:') {
  // Always use HTTPS when site is accessed over HTTPS
  if (API_BASE_URL.startsWith('http://')) {
    API_BASE_URL = API_BASE_URL.replace('http://', 'https://');
  }
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 50000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      const isLoginPage = window.location.pathname === '/login';
      const isAuthMeEndpoint = error.config?.url?.includes('/auth/me');
      const isCartEndpoint = error.config?.url?.includes('/cart');
      
      // Don't redirect for /auth/me (handled by ProtectedRoute)
      // Don't clear token for cart operations (might be guest cart transfer)
      if (token && !isLoginPage && !isAuthMeEndpoint && !isCartEndpoint) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
