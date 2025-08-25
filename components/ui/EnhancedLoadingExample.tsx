'use client';

import { useState } from 'react';
import { useEnhancedError, useAsyncOperation } from '@/hooks/useEnhancedError';
import { useLoadingState } from '@/hooks/useLoadingState';
import { EnhancedErrorDisplay } from '@/components/ui/EnhancedErrorDisplay';
import { LoadingSpinner, SkeletonLoader, CardSkeleton } from '@/components/ui/LoadingSpinner';

export default function EnhancedLoadingExample() {
  const [data, setData] = useState<any>(null);
  
  // Enhanced error handling
  const { error, setError, clearError, retryAction, setRetryAction } = useEnhancedError();
  
  // Enhanced loading states
  const { loadingState, startLoading, stopLoading, updateProgress } = useLoadingState();
  
  // Async operation with enhanced error handling
  const fetchDataOperation = useAsyncOperation(
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate random error
      if (Math.random() > 0.7) {
        throw new Error('Network error: Failed to fetch data');
      }
      
      return { message: 'Data loaded successfully!', timestamp: new Date().toISOString() };
    },
    'DataFetching'
  );

  const handleLoadData = async () => {
    try {
      startLoading('Loading data...', 'progress');
      updateProgress(25, 'Connecting to server...');
      
      const result = await fetchDataOperation.execute();
      
      updateProgress(75, 'Processing data...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      updateProgress(100, 'Completed');
      setData(result);
      
      setTimeout(() => stopLoading(), 500);
      
    } catch (error) {
      setError(error, 'loadData');
      stopLoading();
    }
  };

  const handleRetry = () => {
    clearError();
    handleLoadData();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Enhanced Error & Loading Example
        </h2>

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <EnhancedErrorDisplay
              error={error}
              onRetry={handleRetry}
              onDismiss={clearError}
            />
          </div>
        )}

        {/* Loading Overlay */}
        {loadingState.isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <LoadingSpinner 
                size="lg" 
                text={loadingState.message} 
                variant="dots"
              />
              {loadingState.progress !== undefined && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${loadingState.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{Math.round(loadingState.progress)}%</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mb-6">
          <button
            onClick={handleLoadData}
            disabled={loadingState.isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingState.isLoading ? 'Loading...' : 'Load Data'}
          </button>
        </div>

        {/* Data Display */}
        {data ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-800 mb-2">Success!</h3>
            <p className="text-green-700">{data.message}</p>
            <p className="text-sm text-green-600 mt-2">Timestamp: {data.timestamp}</p>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-600">No data loaded yet. Click the button above to load data.</p>
          </div>
        )}

        {/* Skeleton Loading Example */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Skeleton Loading Examples</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Text Skeleton</h4>
              <SkeletonLoader lines={3} />
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Card Skeleton</h4>
              <CardSkeleton />
            </div>
          </div>
        </div>

        {/* Different Loading Variants */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Loading Variants</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <LoadingSpinner size="sm" variant="spinner" />
              <p className="text-xs text-gray-600 mt-2">Spinner</p>
            </div>
            
            <div className="text-center">
              <LoadingSpinner size="sm" variant="dots" />
              <p className="text-xs text-gray-600 mt-2">Dots</p>
            </div>
            
            <div className="text-center">
              <LoadingSpinner size="sm" variant="pulse" />
              <p className="text-xs text-gray-600 mt-2">Pulse</p>
            </div>
            
            <div className="text-center">
              <LoadingSpinner size="sm" variant="bars" />
              <p className="text-xs text-gray-600 mt-2">Bars</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 