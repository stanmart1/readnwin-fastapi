'use client';

import { useState, useCallback } from 'react';
import { ErrorDetails } from '@/components/ui/EnhancedErrorDisplay';
import { errorHandler } from '@/utils/error-handler';

interface UseEnhancedErrorReturn {
  error: ErrorDetails | null;
  setError: (error: any, context?: string) => void;
  clearError: () => void;
  handleAsyncError: <T>(promise: Promise<T>, context?: string) => Promise<T>;
  retryAction: (() => Promise<any>) | null;
  setRetryAction: (action: (() => Promise<any>) | null) => void;
}

export function useEnhancedError(): UseEnhancedErrorReturn {
  const [error, setErrorState] = useState<ErrorDetails | null>(null);
  const [retryAction, setRetryActionState] = useState<(() => Promise<any>) | null>(null);

  const setError = useCallback((error: any, context?: string) => {
    const enhancedError = errorHandler.categorizeError(error);
    errorHandler.logError(enhancedError, context);
    setErrorState(enhancedError);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
    setRetryActionState(null);
  }, []);

  const handleAsyncError = useCallback(async <T>(
    promise: Promise<T>, 
    context?: string
  ): Promise<T> => {
    try {
      const result = await promise;
      clearError();
      return result;
    } catch (error) {
      setError(error, context);
      throw error;
    }
  }, [setError, clearError]);

  const setRetryAction = useCallback((action: (() => Promise<any>) | null) => {
    setRetryActionState(action);
  }, []);

  return {
    error,
    setError,
    clearError,
    handleAsyncError,
    retryAction,
    setRetryAction
  };
}

interface UseAsyncOperationReturn<T> {
  data: T | null;
  loading: boolean;
  error: ErrorDetails | null;
  execute: (...args: any[]) => Promise<T>;
  retry: () => Promise<T>;
  reset: () => void;
}

export function useAsyncOperation<T>(
  operation: (...args: any[]) => Promise<T>,
  context?: string
): UseAsyncOperationReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const { error, setError, clearError, handleAsyncError } = useEnhancedError();

  const execute = useCallback(async (...args: any[]): Promise<T> => {
    setLoading(true);
    clearError();
    
    try {
      const result = await operation(...args);
      setData(result);
      return result;
    } catch (error) {
      setError(error, context);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [operation, setError, clearError, context]);

  const retry = useCallback(async (): Promise<T> => {
    if (!data) {
      throw new Error('No data to retry');
    }
    return execute();
  }, [execute, data]);

  const reset = useCallback(() => {
    setData(null);
    clearError();
  }, [clearError]);

  return {
    data,
    loading,
    error,
    execute,
    retry,
    reset
  };
}

interface UseFormErrorReturn {
  fieldErrors: Record<string, string>;
  generalError: ErrorDetails | null;
  setFieldError: (field: string, message: string) => void;
  setGeneralError: (error: any) => void;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;
  hasErrors: boolean;
}

export function useFormError(): UseFormErrorReturn {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralErrorState] = useState<ErrorDetails | null>(null);
  const { setError } = useEnhancedError();

  const setFieldError = useCallback((field: string, message: string) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: message
    }));
  }, []);

  const setGeneralError = useCallback((error: any) => {
    const enhancedError = errorHandler.categorizeError(error);
    setGeneralErrorState(enhancedError);
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
    setGeneralErrorState(null);
  }, []);

  const hasErrors = Object.keys(fieldErrors).length > 0 || generalError !== null;

  return {
    fieldErrors,
    generalError,
    setFieldError,
    setGeneralError,
    clearFieldError,
    clearAllErrors,
    hasErrors
  };
} 