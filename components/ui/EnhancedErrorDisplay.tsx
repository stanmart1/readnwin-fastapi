'use client';

import { useState } from 'react';

export interface ErrorDetails {
  code?: string;
  message: string;
  details?: string;
  suggestions?: string[];
  retryAction?: () => void;
  timestamp?: string;
}

interface EnhancedErrorDisplayProps {
  error: ErrorDetails;
  onRetry?: () => void;
  onDismiss?: () => void;
  onReport?: () => void;
  className?: string;
  showDetails?: boolean;
}

export function EnhancedErrorDisplay({
  error,
  onRetry,
  onDismiss,
  onReport,
  className = '',
  showDetails = false
}: EnhancedErrorDisplayProps) {
  const [showFullDetails, setShowFullDetails] = useState(showDetails);

  const getErrorIcon = (code?: string) => {
    if (code?.startsWith('NETWORK')) return 'ri-wifi-off-line';
    if (code?.startsWith('VALIDATION')) return 'ri-error-warning-line';
    if (code?.startsWith('AUTH')) return 'ri-shield-check-line';
    if (code?.startsWith('PERMISSION')) return 'ri-lock-line';
    if (code?.startsWith('SERVER')) return 'ri-server-line';
    return 'ri-error-warning-line';
  };

  const getErrorColor = (code?: string) => {
    if (code?.startsWith('NETWORK')) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (code?.startsWith('VALIDATION')) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (code?.startsWith('AUTH')) return 'text-red-600 bg-red-50 border-red-200';
    if (code?.startsWith('PERMISSION')) return 'text-purple-600 bg-purple-50 border-purple-200';
    if (code?.startsWith('SERVER')) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getErrorTitle = (code?: string) => {
    if (code?.startsWith('NETWORK')) return 'Connection Error';
    if (code?.startsWith('VALIDATION')) return 'Validation Error';
    if (code?.startsWith('AUTH')) return 'Authentication Error';
    if (code?.startsWith('PERMISSION')) return 'Permission Denied';
    if (code?.startsWith('SERVER')) return 'Server Error';
    return 'Error';
  };

  const getDefaultSuggestions = (code?: string) => {
    if (code?.startsWith('NETWORK')) {
      return [
        'Check your internet connection',
        'Try refreshing the page',
        'Check if the service is available'
      ];
    }
    if (code?.startsWith('VALIDATION')) {
      return [
        'Please check your input and try again',
        'Make sure all required fields are filled',
        'Verify the format of your data'
      ];
    }
    if (code?.startsWith('AUTH')) {
      return [
        'Please log in again',
        'Check your credentials',
        'Contact support if the problem persists'
      ];
    }
    if (code?.startsWith('PERMISSION')) {
      return [
        'You may not have permission to perform this action',
        'Contact your administrator',
        'Check your account privileges'
      ];
    }
    if (code?.startsWith('SERVER')) {
      return [
        'The server is experiencing issues',
        'Try again in a few minutes',
        'Contact support if the problem persists'
      ];
    }
    return [
      'Try refreshing the page',
      'Check your internet connection',
      'Contact support if the problem persists'
    ];
  };

  const suggestions = error.suggestions || getDefaultSuggestions(error.code);

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${getErrorColor(error.code)} ${className}`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <i className={`${getErrorIcon(error.code)} text-xl`}></i>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium">
              {getErrorTitle(error.code)}
            </h3>
            <p className="text-sm mt-1">{error.message}</p>
            
            {suggestions.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-medium mb-2">Suggestions:</h4>
                <ul className="text-xs space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <i className="ri-refresh-line mr-1"></i>
                  Try Again
                </button>
              )}
              
              {error.retryAction && (
                <button
                  onClick={error.retryAction}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <i className="ri-refresh-line mr-1"></i>
                  Retry
                </button>
              )}

              {onReport && (
                <button
                  onClick={onReport}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <i className="ri-bug-line mr-1"></i>
                  Report Issue
                </button>
              )}

              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <i className="ri-close-line mr-1"></i>
                  Dismiss
                </button>
              )}
            </div>

            {(error.details || error.code || error.timestamp) && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                  Error Details
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-xs font-mono text-gray-800">
                  {error.code && (
                    <div className="mb-1">
                      <strong>Code:</strong> {error.code}
                    </div>
                  )}
                  {error.timestamp && (
                    <div className="mb-1">
                      <strong>Time:</strong> {error.timestamp}
                    </div>
                  )}
                  {error.details && (
                    <div>
                      <strong>Details:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">{error.details}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ErrorAlert({
  error,
  onRetry,
  onDismiss,
  className = ''
}: {
  error: ErrorDetails;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm ${className}`}>
      <EnhancedErrorDisplay
        error={error}
        onRetry={onRetry}
        onDismiss={onDismiss}
      />
    </div>
  );
} 