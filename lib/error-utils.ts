'use client';

export interface ApiError {
  message: string;
  isAuthError: boolean;
  shouldRetry: boolean;
}

export function handleApiError(error: any, response?: Response): ApiError {
  // Handle 401 Unauthorized - Session expired
  if (response?.status === 401) {
    return {
      message: 'Your session has expired. Please log in again.',
      isAuthError: true,
      shouldRetry: false
    };
  }

  // Handle 403 Forbidden - Access denied
  if (response?.status === 403) {
    return {
      message: 'Access denied. You don\'t have permission to perform this action.',
      isAuthError: true,
      shouldRetry: false
    };
  }

  // Handle 404 Not Found
  if (response?.status === 404) {
    return {
      message: 'The requested resource was not found.',
      isAuthError: false,
      shouldRetry: false
    };
  }

  // Handle 500 Server Error
  if (response?.status === 500) {
    return {
      message: 'Server error. Please try again later.',
      isAuthError: false,
      shouldRetry: true
    };
  }

  // Handle network errors
  if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
    return {
      message: 'Network error. Please check your connection and try again.',
      isAuthError: false,
      shouldRetry: true
    };
  }

  // Handle timeout errors
  if (error?.name === 'AbortError') {
    return {
      message: 'Request timed out. Please try again.',
      isAuthError: false,
      shouldRetry: true
    };
  }

  // Default error message
  return {
    message: 'Something went wrong. Please try again.',
    isAuthError: false,
    shouldRetry: true
  };
}

export function redirectToLogin() {
  // Clear auth data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Redirect to login
  window.location.href = '/login';
}