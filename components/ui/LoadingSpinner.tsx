'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray' | 'blue' | 'green' | 'red';
  text?: string;
  className?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'primary', 
  text,
  className = '',
  variant = 'spinner'
}: LoadingSpinnerProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-8 h-8';
      case 'xl':
        return 'w-12 h-12';
      default:
        return 'w-6 h-6';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'white':
        return 'text-white';
      case 'gray':
        return 'text-gray-500';
      case 'blue':
        return 'text-blue-600';
      case 'green':
        return 'text-green-600';
      case 'red':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            <div className={`w-2 h-2 bg-current rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`w-2 h-2 bg-current rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
            <div className={`w-2 h-2 bg-current rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          </div>
        );
      case 'pulse':
        return (
          <div className={`${getSizeClasses()} bg-current rounded-full animate-pulse`}></div>
        );
      case 'bars':
        return (
          <div className="flex space-x-1">
            <div className={`w-1 h-4 bg-current animate-pulse`} style={{ animationDelay: '0ms' }}></div>
            <div className={`w-1 h-4 bg-current animate-pulse`} style={{ animationDelay: '150ms' }}></div>
            <div className={`w-1 h-4 bg-current animate-pulse`} style={{ animationDelay: '300ms' }}></div>
          </div>
        );
      default:
        return (
          <div className={`${getSizeClasses()} ${getColorClasses()} animate-spin`}>
            <i className="ri-loader-4-line text-xl"></i>
          </div>
        );
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center space-x-2">
        {renderSpinner()}
        {text && (
          <span className="text-sm text-gray-600">{text}</span>
        )}
      </div>
    </div>
  );
}

export function LoadingOverlay({ 
  text = 'Loading...',
  className = '',
  variant = 'spinner'
}: { 
  text?: string; 
  className?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
}) {
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <LoadingSpinner size="lg" text={text} variant={variant} />
      </div>
    </div>
  );
}

export function LoadingButton({ 
  loading, 
  children, 
  className = '',
  disabled = false,
  loadingText = 'Loading...',
  ...props 
}: {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  loadingText?: string;
  [key: string]: any;
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`relative ${className} ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" color="white" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : ''}>
        {children}
      </span>
    </button>
  );
}

export function SkeletonLoader({ 
  className = '',
  lines = 1,
  height = 'h-4',
  width = 'w-full'
}: {
  className?: string;
  lines?: number;
  height?: string;
  width?: string;
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 rounded ${height} ${width} mb-2`}
          style={{ 
            width: index === lines - 1 ? '60%' : '100%',
            animationDelay: `${index * 100}ms`
          }}
        ></div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-20 bg-gray-200 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4, className = '' }: { 
  rows?: number; 
  columns?: number; 
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <div className="animate-pulse">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, index) => (
              <div
                key={index}
                className="h-4 bg-gray-200 rounded"
                style={{ width: `${100 / columns}%` }}
              ></div>
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b border-gray-100 px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 bg-gray-200 rounded"
                  style={{ 
                    width: `${100 / columns}%`,
                    animationDelay: `${rowIndex * 100}ms`
                  }}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressiveLoader({ 
  steps, 
  currentStep = 0,
  className = ''
}: {
  steps: string[];
  currentStep?: number;
  className?: string;
}) {
  return (
    <div className={`${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index < currentStep ? (
                  <i className="ri-check-line"></i>
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <span 
              key={index} 
              className={`text-sm ${index <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-500'}`}
            >
              {step}
            </span>
          ))}
        </div>
      </div>
      {currentStep < steps.length && (
        <div className="text-center">
          <LoadingSpinner size="sm" text={`Processing: ${steps[currentStep]}`} />
        </div>
      )}
    </div>
  );
} 