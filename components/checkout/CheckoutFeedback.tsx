'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Loader2, 
  X, 
  RefreshCw,
  Clock,
  Shield,
  CreditCard,
  Package,
  Download,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

// Enhanced Progress Indicator
interface CheckoutStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  icon?: React.ReactNode;
}

interface ProgressIndicatorProps {
  steps: CheckoutStep[];
  currentStep: number;
  className?: string;
}

export function ProgressIndicator({ steps, currentStep, className = '' }: ProgressIndicatorProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                ${step.status === 'completed' ? 'bg-green-500 text-white' :
                  step.status === 'active' ? 'bg-blue-500 text-white animate-pulse' :
                  step.status === 'error' ? 'bg-red-500 text-white' :
                  'bg-gray-200 text-gray-500'}
              `}>
                {step.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : step.status === 'error' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : step.status === 'active' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  step.icon || step.id
                )}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-xs font-medium ${
                  step.status === 'active' ? 'text-blue-600' :
                  step.status === 'completed' ? 'text-green-600' :
                  step.status === 'error' ? 'text-red-600' :
                  'text-gray-500'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-400 mt-1">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`
                flex-1 h-0.5 mx-4 transition-all duration-300
                ${step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}
              `} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Enhanced Error Display
interface CheckoutError {
  type: 'validation' | 'network' | 'payment' | 'server' | 'auth';
  message: string;
  field?: string;
  code?: string;
  suggestions?: string[];
  retryable?: boolean;
}

interface ErrorDisplayProps {
  error: CheckoutError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorDisplay({ error, onRetry, onDismiss, className = '' }: ErrorDisplayProps) {
  const getErrorConfig = (type: CheckoutError['type']) => {
    switch (type) {
      case 'validation':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          color: 'border-yellow-200 bg-yellow-50 text-yellow-800',
          iconColor: 'text-yellow-500'
        };
      case 'network':
        return {
          icon: <RefreshCw className="w-5 h-5" />,
          color: 'border-orange-200 bg-orange-50 text-orange-800',
          iconColor: 'text-orange-500'
        };
      case 'payment':
        return {
          icon: <CreditCard className="w-5 h-5" />,
          color: 'border-red-200 bg-red-50 text-red-800',
          iconColor: 'text-red-500'
        };
      case 'auth':
        return {
          icon: <Shield className="w-5 h-5" />,
          color: 'border-purple-200 bg-purple-50 text-purple-800',
          iconColor: 'text-purple-500'
        };
      default:
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          color: 'border-red-200 bg-red-50 text-red-800',
          iconColor: 'text-red-500'
        };
    }
  };

  const config = getErrorConfig(error.type);

  return (
    <div className={`border rounded-lg p-4 ${config.color} ${className}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          {config.icon}
        </div>
        <div className="ml-3 flex-1">
          <h4 className="font-medium">
            {error.type === 'validation' && 'Please check your information'}
            {error.type === 'network' && 'Connection problem'}
            {error.type === 'payment' && 'Payment issue'}
            {error.type === 'auth' && 'Authentication required'}
            {error.type === 'server' && 'Server error'}
          </h4>
          <p className="text-sm mt-1">{error.message}</p>
          
          {error.suggestions && error.suggestions.length > 0 && (
            <ul className="text-sm mt-2 space-y-1">
              {error.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center space-x-3 mt-3">
            {error.retryable && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center text-sm font-medium hover:underline"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Try Again
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="inline-flex items-center text-sm font-medium hover:underline"
              >
                <X className="w-4 h-4 mr-1" />
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Success State Component
interface SuccessStateProps {
  type: 'order_created' | 'payment_processing' | 'payment_success' | 'ebook_ready';
  title: string;
  message: string;
  nextSteps?: string[];
  actionButton?: {
    text: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

export function SuccessState({ 
  type, 
  title, 
  message, 
  nextSteps, 
  actionButton, 
  className = '' 
}: SuccessStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'order_created':
        return <Package className="w-8 h-8 text-green-500" />;
      case 'payment_processing':
        return <Clock className="w-8 h-8 text-blue-500" />;
      case 'payment_success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'ebook_ready':
        return <Download className="w-8 h-8 text-green-500" />;
      default:
        return <CheckCircle className="w-8 h-8 text-green-500" />;
    }
  };

  return (
    <div className={`bg-white border border-green-200 rounded-lg p-6 text-center ${className}`}>
      <div className="flex justify-center mb-4">
        {getIcon()}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      
      {nextSteps && nextSteps.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">What happens next:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {nextSteps.map((step, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
            actionButton.variant === 'secondary'
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {actionButton.text}
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      )}
    </div>
  );
}

// Form Field Feedback
interface FieldFeedbackProps {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  className?: string;
}

export function FieldFeedback({ type, message, className = '' }: FieldFeedbackProps) {
  const getConfig = () => {
    switch (type) {
      case 'error':
        return { icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-600' };
      case 'warning':
        return { icon: <AlertCircle className="w-4 h-4" />, color: 'text-yellow-600' };
      case 'success':
        return { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600' };
      case 'info':
        return { icon: <Info className="w-4 h-4" />, color: 'text-blue-600' };
    }
  };

  const config = getConfig();

  return (
    <div className={`flex items-center space-x-2 mt-1 ${config.color} ${className}`}>
      {config.icon}
      <span className="text-sm">{message}</span>
    </div>
  );
}

// Loading States
interface LoadingStateProps {
  type: 'form_validation' | 'payment_processing' | 'order_creation' | 'data_loading';
  message?: string;
  progress?: number;
  className?: string;
}

export function LoadingState({ type, message, progress, className = '' }: LoadingStateProps) {
  const getDefaultMessage = () => {
    switch (type) {
      case 'form_validation':
        return 'Validating information...';
      case 'payment_processing':
        return 'Processing payment...';
      case 'order_creation':
        return 'Creating your order...';
      case 'data_loading':
        return 'Loading...';
    }
  };

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-sm text-gray-600">{message || getDefaultMessage()}</p>
        {progress !== undefined && (
          <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Security Badge
export function SecurityBadge({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 ${className}`}>
      <Shield className="w-5 h-5 text-green-600" />
      <div>
        <p className="font-medium">Secure Checkout</p>
        <p className="text-xs text-green-600">Your information is encrypted and protected</p>
      </div>
    </div>
  );
}

// Payment Method Info
interface PaymentInfoProps {
  method: 'flutterwave' | 'bank_transfer';
  isEbookOnly: boolean;
  className?: string;
}

export function PaymentInfo({ method, isEbookOnly, className = '' }: PaymentInfoProps) {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {method === 'flutterwave' ? (
            <CreditCard className="w-5 h-5 text-blue-600" />
          ) : (
            <Package className="w-5 h-5 text-blue-600" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-blue-900 mb-1">
            {method === 'flutterwave' ? 'Flutterwave Payment' : 'Bank Transfer Payment'}
          </h4>
          
          {method === 'flutterwave' ? (
            <div className="text-sm text-blue-700 space-y-1">
              <p>• You'll be redirected to Flutterwave's secure payment page</p>
              <p>• Accept cards, bank transfers, and mobile money</p>
              {isEbookOnly && <p>• Your eBooks will be available immediately after payment</p>}
            </div>
          ) : (
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Transfer the exact amount to our bank account</p>
              <p>• Upload proof of payment for verification</p>
              <p>• Processing takes 1-2 business days</p>
              {isEbookOnly && <p>• Your eBooks will be available after verification</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Confirmation Dialog
interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'warning' | 'danger' | 'info';
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'info'
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'warning':
        return 'text-yellow-600';
      case 'danger':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className={getColors()}>
              {type === 'warning' && <AlertCircle className="w-6 h-6" />}
              {type === 'danger' && <AlertCircle className="w-6 h-6" />}
              {type === 'info' && <Info className="w-6 h-6" />}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
                type === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}