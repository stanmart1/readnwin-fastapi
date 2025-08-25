'use client';

import { useCallback } from 'react';
import { useNotifications } from '@/components/ui/Notification';

export function useCheckoutNotifications() {
  const { addNotification } = useNotifications();

  const showValidationError = useCallback((message: string, field?: string) => {
    addNotification({
      type: 'error',
      title: 'Validation Error',
      message: field ? `${field}: ${message}` : message,
      duration: 5000
    });
  }, [addNotification]);

  const showNetworkError = useCallback((message?: string) => {
    addNotification({
      type: 'error',
      title: 'Connection Problem',
      message: message || 'Please check your internet connection and try again',
      duration: 7000
    });
  }, [addNotification]);

  const showPaymentError = useCallback((message: string) => {
    addNotification({
      type: 'error',
      title: 'Payment Issue',
      message,
      duration: 8000
    });
  }, [addNotification]);

  const showServerError = useCallback((message?: string) => {
    addNotification({
      type: 'error',
      title: 'Server Error',
      message: message || 'Something went wrong on our end. Please try again.',
      duration: 6000
    });
  }, [addNotification]);

  const showSuccess = useCallback((message: string, title?: string) => {
    addNotification({
      type: 'success',
      title: title || 'Success',
      message,
      duration: 4000
    });
  }, [addNotification]);

  const showInfo = useCallback((message: string, title?: string) => {
    addNotification({
      type: 'info',
      title: title || 'Information',
      message,
      duration: 5000
    });
  }, [addNotification]);

  const showWarning = useCallback((message: string, title?: string) => {
    addNotification({
      type: 'warning',
      title: title || 'Warning',
      message,
      duration: 6000
    });
  }, [addNotification]);

  const showStepProgress = useCallback((stepName: string) => {
    addNotification({
      type: 'info',
      title: 'Progress Update',
      message: `Completed: ${stepName}`,
      duration: 3000
    });
  }, [addNotification]);

  const showOrderCreated = useCallback((orderId: string, paymentMethod: string) => {
    const message = paymentMethod === 'flutterwave' 
      ? `Order #${orderId} created! Redirecting to payment...`
      : paymentMethod === 'bank_transfer'
      ? `Order #${orderId} created! Please complete the bank transfer.`
      : `Order #${orderId} has been successfully created!`;

    addNotification({
      type: 'success',
      title: 'Order Created',
      message,
      duration: 5000
    });
  }, [addNotification]);

  const showFormSaved = useCallback(() => {
    addNotification({
      type: 'success',
      title: 'Information Saved',
      message: 'Your information has been saved automatically',
      duration: 3000
    });
  }, [addNotification]);

  const showSessionWarning = useCallback(() => {
    addNotification({
      type: 'warning',
      title: 'Session Expiring',
      message: 'Your session will expire soon. Please complete your order.',
      duration: 8000
    });
  }, [addNotification]);

  return {
    showValidationError,
    showNetworkError,
    showPaymentError,
    showServerError,
    showSuccess,
    showInfo,
    showWarning,
    showStepProgress,
    showOrderCreated,
    showFormSaved,
    showSessionWarning
  };
}