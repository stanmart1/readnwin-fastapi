'use client';

import { toast } from 'react-hot-toast';

export interface ErrorResponse {
  status: number;
  message: string;
  code?: string;
}

export class AppErrorHandler {
  static handle(error: any, context?: string): ErrorResponse {
    const errorResponse: ErrorResponse = {
      status: 500,
      message: 'An unexpected error occurred'
    };

    // Handle fetch/network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorResponse.status = 0;
      errorResponse.message = 'Connection failed. Please check your internet connection.';
      errorResponse.code = 'NETWORK_ERROR';
      this.showConnectionError();
      return errorResponse;
    }

    // Handle HTTP errors
    if (error.status) {
      errorResponse.status = error.status;
      
      switch (error.status) {
        case 401:
          errorResponse.message = 'Your session has expired. Please log in again.';
          errorResponse.code = 'SESSION_EXPIRED';
          this.handleSessionExpired();
          break;
        case 403:
          errorResponse.message = 'You don\'t have permission to perform this action.';
          errorResponse.code = 'FORBIDDEN';
          toast.error(errorResponse.message);
          break;
        case 404:
          errorResponse.message = 'The requested resource was not found.';
          errorResponse.code = 'NOT_FOUND';
          toast.error(errorResponse.message);
          break;
        case 429:
          errorResponse.message = 'Too many requests. Please wait a moment and try again.';
          errorResponse.code = 'RATE_LIMITED';
          toast.error(errorResponse.message);
          break;
        case 500:
          errorResponse.message = 'Server error. Please try again later.';
          errorResponse.code = 'SERVER_ERROR';
          toast.error(errorResponse.message);
          break;
        default:
          errorResponse.message = error.message || 'An error occurred';
          toast.error(errorResponse.message);
      }
    } else if (error.message) {
      errorResponse.message = error.message;
      toast.error(errorResponse.message);
    }

    console.error(`[${context || 'App'}] Error:`, error);
    return errorResponse;
  }

  static handleSessionExpired() {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Dispatch session expired event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
    
    // Show session expired notification
    toast.error('Your session has expired. Please log in again.', {
      duration: 5000,
      icon: '🔒'
    });

    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 3000);
  }

  static showConnectionError() {
    toast.error('Connection lost. Please check your internet connection.', {
      duration: 5000,
      icon: '📡'
    });
  }

  static showRetryableError(message: string, retryFn?: () => void) {
    if (retryFn) {
      toast.error(`${message} Click to retry.`, {
        duration: 8000,
        onClick: retryFn
      });
    } else {
      toast.error(message, { duration: 8000 });
    }
  }
}