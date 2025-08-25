'use client';

import { useState, useCallback, useRef } from 'react';

export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
  type?: 'spinner' | 'skeleton' | 'progress' | 'overlay';
}

export interface UseLoadingStateReturn {
  loadingState: LoadingState;
  startLoading: (message?: string, type?: LoadingState['type']) => void;
  updateProgress: (progress: number, message?: string) => void;
  stopLoading: () => void;
  setLoadingMessage: (message: string) => void;
  setLoadingType: (type: LoadingState['type']) => void;
}

export function useLoadingState(initialState: LoadingState = { isLoading: false }): UseLoadingStateReturn {
  const [loadingState, setLoadingState] = useState<LoadingState>(initialState);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = useCallback((message?: string, type: LoadingState['type'] = 'spinner') => {
    setLoadingState({
      isLoading: true,
      progress: 0,
      message: message || 'Loading...',
      type
    });
  }, []);

  const updateProgress = useCallback((progress: number, message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
      message: message || prev.message
    }));
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState({
      isLoading: false,
      progress: undefined,
      message: undefined,
      type: undefined
    });
  }, []);

  const setLoadingMessage = useCallback((message: string) => {
    setLoadingState(prev => ({
      ...prev,
      message
    }));
  }, []);

  const setLoadingType = useCallback((type: LoadingState['type']) => {
    setLoadingState(prev => ({
      ...prev,
      type
    }));
  }, []);

  return {
    loadingState,
    startLoading,
    updateProgress,
    stopLoading,
    setLoadingMessage,
    setLoadingType
  };
}

export interface UseAsyncLoadingReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
  progress?: number;
  message?: string;
}

export function useAsyncLoading<T>(
  asyncFunction: (...args: any[]) => Promise<T>
): UseAsyncLoadingReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const execute = useCallback(async (...args: any[]): Promise<T> => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setMessage('Starting...');

    try {
      const result = await asyncFunction(...args);
      setData(result);
      setProgress(100);
      setMessage('Completed');
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
      // Clear progress and message after a short delay
      setTimeout(() => {
        setProgress(undefined);
        setMessage(undefined);
      }, 1000);
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setProgress(undefined);
    setMessage(undefined);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    progress,
    message
  };
}

export interface UseMultiStepLoadingReturn {
  currentStep: number;
  totalSteps: number;
  stepMessage: string;
  isLoading: boolean;
  startProcess: (steps: string[]) => void;
  nextStep: (message?: string) => void;
  complete: () => void;
  reset: () => void;
}

export function useMultiStepLoading(): UseMultiStepLoadingReturn {
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [stepMessage, setStepMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);

  const startProcess = useCallback((stepList: string[]) => {
    setSteps(stepList);
    setTotalSteps(stepList.length);
    setCurrentStep(0);
    setStepMessage(stepList[0] || '');
    setIsLoading(true);
  }, []);

  const nextStep = useCallback((message?: string) => {
    setCurrentStep(prev => {
      const next = prev + 1;
      if (next < steps.length) {
        setStepMessage(message || steps[next] || '');
        return next;
      }
      return prev;
    });
  }, [steps]);

  const complete = useCallback(() => {
    setIsLoading(false);
    setCurrentStep(0);
    setTotalSteps(0);
    setStepMessage('');
    setSteps([]);
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setTotalSteps(0);
    setStepMessage('');
    setIsLoading(false);
    setSteps([]);
  }, []);

  return {
    currentStep,
    totalSteps,
    stepMessage,
    isLoading,
    startProcess,
    nextStep,
    complete,
    reset
  };
}

export interface UseSkeletonLoadingReturn {
  isLoading: boolean;
  startSkeleton: (duration?: number) => void;
  stopSkeleton: () => void;
}

export function useSkeletonLoading(): UseSkeletonLoadingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startSkeleton = useCallback((duration = 2000) => {
    setIsLoading(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, duration);
  }, []);

  const stopSkeleton = useCallback(() => {
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    isLoading,
    startSkeleton,
    stopSkeleton
  };
} 