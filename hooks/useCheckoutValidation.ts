'use client';

import { useState, useCallback, useMemo } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
}

interface FormData {
  [key: string]: any;
}

export function useCheckoutValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Validation rules for checkout form
  const defaultRules: ValidationRules = {
    'shipping_address.first_name': {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s'-]+$/
    },
    'shipping_address.last_name': {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s'-]+$/
    },
    'shipping_address.email': {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      custom: (value: string) => {
        if (value.length > 100) return 'Email address is too long';
        return null;
      }
    },
    'shipping_address.phone': {
      required: true,
      pattern: /^[\+]?[0-9\s\-\(\)]{10,15}$/,
      custom: (value: string) => {
        const cleaned = value.replace(/[\s\-\(\)]/g, '');
        if (cleaned.length < 10) return 'Phone number must be at least 10 digits';
        if (cleaned.length > 15) return 'Phone number is too long';
        return null;
      }
    },
    'shipping_address.address': {
      required: true,
      minLength: 10,
      maxLength: 200
    },
    'shipping_address.city': {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s'-]+$/
    },
    'shipping_address.state': {
      required: true
    },
    'shipping_address.zip_code': {
      required: true,
      pattern: /^[0-9]{5,10}$/
    },
    'payment.method': {
      required: true
    }
  };

  const combinedRules = { ...defaultRules, ...rules };

  const validateField = useCallback((fieldPath: string, value: any): ValidationError | null => {
    const rule = combinedRules[fieldPath];
    if (!rule) return null;

    const stringValue = String(value || '').trim();

    // Required validation
    if (rule.required && !stringValue) {
      return {
        field: fieldPath,
        message: getFieldDisplayName(fieldPath) + ' is required',
        type: 'required'
      };
    }

    // Skip other validations if field is empty and not required
    if (!stringValue && !rule.required) return null;

    // Min length validation
    if (rule.minLength && stringValue.length < rule.minLength) {
      return {
        field: fieldPath,
        message: `${getFieldDisplayName(fieldPath)} must be at least ${rule.minLength} characters`,
        type: 'minLength'
      };
    }

    // Max length validation
    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return {
        field: fieldPath,
        message: `${getFieldDisplayName(fieldPath)} must be no more than ${rule.maxLength} characters`,
        type: 'maxLength'
      };
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return {
        field: fieldPath,
        message: getPatternErrorMessage(fieldPath),
        type: 'pattern'
      };
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(stringValue);
      if (customError) {
        return {
          field: fieldPath,
          message: customError,
          type: 'custom'
        };
      }
    }

    return null;
  }, [combinedRules]);

  const validateForm = useCallback((formData: FormData, isEbookOnly: boolean = false): ValidationError[] => {
    const newErrors: ValidationError[] = [];
    
    // Get relevant fields based on cart type
    const fieldsToValidate = getFieldsToValidate(isEbookOnly);
    
    for (const fieldPath of fieldsToValidate) {
      const value = getNestedValue(formData, fieldPath);
      const error = validateField(fieldPath, value);
      if (error) {
        newErrors.push(error);
      }
    }

    setErrors(newErrors);
    return newErrors;
  }, [validateField]);

  const validateSingleField = useCallback((fieldPath: string, value: any): ValidationError | null => {
    const error = validateField(fieldPath, value);
    
    setErrors(prev => {
      const filtered = prev.filter(e => e.field !== fieldPath);
      return error ? [...filtered, error] : filtered;
    });

    return error;
  }, [validateField]);

  const markFieldTouched = useCallback((fieldPath: string) => {
    setTouched(prev => new Set([...prev, fieldPath]));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
    setTouched(new Set());
  }, []);

  const clearFieldError = useCallback((fieldPath: string) => {
    setErrors(prev => prev.filter(e => e.field !== fieldPath));
  }, []);

  // Get error for specific field
  const getFieldError = useCallback((fieldPath: string): ValidationError | null => {
    return errors.find(e => e.field === fieldPath) || null;
  }, [errors]);

  // Check if field has been touched
  const isFieldTouched = useCallback((fieldPath: string): boolean => {
    return touched.has(fieldPath);
  }, [touched]);

  // Check if form is valid
  const isValid = useMemo(() => errors.length === 0, [errors]);

  // Get validation status for a field
  const getFieldStatus = useCallback((fieldPath: string, value: any) => {
    const error = getFieldError(fieldPath);
    const isTouched = isFieldTouched(fieldPath);
    
    if (!isTouched) return 'neutral';
    if (error) return 'error';
    
    // Check if field has value and is valid
    const stringValue = String(value || '').trim();
    if (stringValue && !validateField(fieldPath, value)) {
      return 'success';
    }
    
    return 'neutral';
  }, [getFieldError, isFieldTouched, validateField]);

  return {
    errors,
    isValid,
    validateForm,
    validateSingleField,
    markFieldTouched,
    clearErrors,
    clearFieldError,
    getFieldError,
    isFieldTouched,
    getFieldStatus
  };
}

// Helper functions
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function getFieldDisplayName(fieldPath: string): string {
  const fieldNames: { [key: string]: string } = {
    'shipping_address.first_name': 'First name',
    'shipping_address.last_name': 'Last name',
    'shipping_address.email': 'Email address',
    'shipping_address.phone': 'Phone number',
    'shipping_address.address': 'Street address',
    'shipping_address.city': 'City',
    'shipping_address.state': 'State',
    'shipping_address.zip_code': 'ZIP code',
    'payment.method': 'Payment method'
  };
  
  return fieldNames[fieldPath] || fieldPath.split('.').pop() || fieldPath;
}

function getPatternErrorMessage(fieldPath: string): string {
  const messages: { [key: string]: string } = {
    'shipping_address.first_name': 'First name can only contain letters, spaces, hyphens, and apostrophes',
    'shipping_address.last_name': 'Last name can only contain letters, spaces, hyphens, and apostrophes',
    'shipping_address.email': 'Please enter a valid email address',
    'shipping_address.phone': 'Please enter a valid phone number',
    'shipping_address.city': 'City name can only contain letters, spaces, hyphens, and apostrophes',
    'shipping_address.zip_code': 'ZIP code must contain only numbers'
  };
  
  return messages[fieldPath] || 'Please enter a valid value';
}

function getFieldsToValidate(isEbookOnly: boolean): string[] {
  const baseFields = [
    'shipping_address.first_name',
    'shipping_address.last_name',
    'shipping_address.email',
    'payment.method'
  ];

  if (!isEbookOnly) {
    baseFields.push(
      'shipping_address.phone',
      'shipping_address.address',
      'shipping_address.city',
      'shipping_address.state',
      'shipping_address.zip_code'
    );
  }

  return baseFields;
}

// Real-time validation hook for individual fields
export function useFieldValidation(fieldPath: string, rules: ValidationRules) {
  const [error, setError] = useState<ValidationError | null>(null);
  const [touched, setTouched] = useState(false);

  const validate = useCallback((value: any) => {
    const rule = rules[fieldPath];
    if (!rule) return null;

    const stringValue = String(value || '').trim();

    if (rule.required && !stringValue) {
      const newError = {
        field: fieldPath,
        message: getFieldDisplayName(fieldPath) + ' is required',
        type: 'required' as const
      };
      setError(newError);
      return newError;
    }

    if (!stringValue && !rule.required) {
      setError(null);
      return null;
    }

    if (rule.minLength && stringValue.length < rule.minLength) {
      const newError = {
        field: fieldPath,
        message: `${getFieldDisplayName(fieldPath)} must be at least ${rule.minLength} characters`,
        type: 'minLength' as const
      };
      setError(newError);
      return newError;
    }

    if (rule.maxLength && stringValue.length > rule.maxLength) {
      const newError = {
        field: fieldPath,
        message: `${getFieldDisplayName(fieldPath)} must be no more than ${rule.maxLength} characters`,
        type: 'maxLength' as const
      };
      setError(newError);
      return newError;
    }

    if (rule.pattern && !rule.pattern.test(stringValue)) {
      const newError = {
        field: fieldPath,
        message: getPatternErrorMessage(fieldPath),
        type: 'pattern' as const
      };
      setError(newError);
      return newError;
    }

    if (rule.custom) {
      const customError = rule.custom(stringValue);
      if (customError) {
        const newError = {
          field: fieldPath,
          message: customError,
          type: 'custom' as const
        };
        setError(newError);
        return newError;
      }
    }

    setError(null);
    return null;
  }, [fieldPath, rules]);

  const markTouched = useCallback(() => {
    setTouched(true);
  }, []);

  const clear = useCallback(() => {
    setError(null);
    setTouched(false);
  }, []);

  return {
    error,
    touched,
    validate,
    markTouched,
    clear,
    isValid: !error
  };
}