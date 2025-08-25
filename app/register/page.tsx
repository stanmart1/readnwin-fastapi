'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import Link from 'next/link';

function RegisterPageContent() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isAuthenticated) {
      // Transfer guest cart if exists
      const guestCartData = sessionStorage.getItem('guestCheckoutData');
      if (guestCartData) {
        try {
          const checkoutData = JSON.parse(guestCartData);
          localStorage.setItem('transferredCheckoutData', guestCartData);
          sessionStorage.removeItem('guestCheckoutData');
          sessionStorage.removeItem('guestCheckoutStep');
        } catch (error) {
          console.error('Error transferring guest cart:', error);
        }
      }
      
      // Check for redirect parameter first (support both redirect and callbackUrl)
      const redirect = searchParams.get('redirect') || searchParams.get('callbackUrl');
      if (redirect) {
        router.push(redirect);
        return;
      }
      
      router.push('/dashboard');
    }
  }, [isAuthenticated, router, searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }
    
    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!agreedToTerms) {
      errors.terms = 'You must agree to the Terms of Service and Privacy Policy';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          username: formData.username,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requiresVerification) {
          setSuccessMessage('Registration successful! Please check your email to verify your account before signing in.');
          // Redirect to login with verification message and preserve redirect
          const redirect = searchParams.get('redirect') || searchParams.get('callbackUrl');
          const loginUrl = redirect 
            ? `/login?message=Please check your email to verify your account before signing in.&redirect=${encodeURIComponent(redirect)}`
            : '/login?message=Please check your email to verify your account before signing in.';
          setTimeout(() => {
            router.push(loginUrl);
          }, 3000);
        } else if (data.autoLogin) {
          // Auto-login the user after successful registration
          setSuccessMessage('Registration successful! Logging you in...');
          
          try {
            // Use the useAuth hook's login function to authenticate the user
            const loginSuccess = await login(formData.email, formData.password);
            
            if (loginSuccess) {
              setSuccessMessage('Welcome to ReadnWin! Redirecting to your dashboard...');
              // The useEffect will handle the redirect to dashboard
            } else {
              // Fallback to login page if auto-login fails
              setSuccessMessage('Registration successful! Please sign in to continue.');
              const redirect = searchParams.get('redirect') || searchParams.get('callbackUrl');
              const loginUrl = redirect 
                ? `/login?message=Registration successful! Please sign in.&redirect=${encodeURIComponent(redirect)}`
                : '/login?message=Registration successful! Please sign in.';
              setTimeout(() => {
                router.push(loginUrl);
              }, 2000);
            }
          } catch (loginError) {
            console.error('Auto-login failed:', loginError);
            // Fallback to login page
            setSuccessMessage('Registration successful! Please sign in to continue.');
            const redirect = searchParams.get('redirect') || searchParams.get('callbackUrl');
            const loginUrl = redirect 
              ? `/login?message=Registration successful! Please sign in.&redirect=${encodeURIComponent(redirect)}`
              : '/login?message=Registration successful! Please sign in.';
            setTimeout(() => {
              router.push(loginUrl);
            }, 2000);
          }
        } else {
          setSuccessMessage('Registration successful! Redirecting to login...');
          // Registration successful, redirect to login after a short delay and preserve redirect
          const redirect = searchParams.get('redirect') || searchParams.get('callbackUrl');
          const loginUrl = redirect 
            ? `/login?message=Registration successful! Please sign in.&redirect=${encodeURIComponent(redirect)}`
            : '/login?message=Registration successful! Please sign in.';
          setTimeout(() => {
            router.push(loginUrl);
          }, 2000);
        }
      } else {
        setError(data.error || 'Registration failed. Please check your information and try again.');
      }
    } catch (error) {
      setError('An error occurred during registration. Please try again or contact support if the problem persists.');
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-purple-100/20 to-blue-50/40"></div>
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background overlay for better visual appeal */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-purple-100/20 to-blue-50/40"></div>
      
      <div className="max-w-md w-full relative z-10">
        {/* Back to Home Link */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium text-sm"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Back to Home
          </Link>
        </div>

        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
            <i className="ri-book-line text-2xl text-white"></i>
          </div>
          <h1 className="mt-6 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            ReadnWin
          </h1>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-gray-600">
            Join thousands of readers and start your journey
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={formData.firstName}
                  onChange={(e) => {
                    handleInputChange(e);
                    if (fieldErrors.firstName) {
                      setFieldErrors(prev => ({ ...prev, firstName: '' }));
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    fieldErrors.firstName 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="First name"
                  disabled={isSubmitting}
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <i className="ri-error-warning-line mr-1"></i>
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={formData.lastName}
                  onChange={(e) => {
                    handleInputChange(e);
                    if (fieldErrors.lastName) {
                      setFieldErrors(prev => ({ ...prev, lastName: '' }));
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    fieldErrors.lastName 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Last name"
                  disabled={isSubmitting}
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <i className="ri-error-warning-line mr-1"></i>
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-mail-line text-gray-400"></i>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    handleInputChange(e);
                    if (fieldErrors.email) {
                      setFieldErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    fieldErrors.email 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <i className="ri-error-warning-line mr-1"></i>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-user-line text-gray-400"></i>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Choose a username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-lock-line text-gray-400"></i>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-lg`}></i>
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-lock-line text-gray-400"></i>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <i className={`${showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-lg`}></i>
                </button>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-800 transition-colors duration-200">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-800 transition-colors duration-200">
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
                <div className="flex">
                  <i className="ri-check-line text-green-400 text-xl"></i>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
                <div className="flex">
                  <i className="ri-error-warning-line text-red-400 text-xl"></i>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Registration Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isSubmitting && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fade-in">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Creating account...</h3>
                    <p className="text-sm text-blue-700 mt-1">Please wait while we set up your account</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Creating account...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <i className="ri-user-add-line mr-2"></i>
                  Create Account
                </div>
              )}
            </button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link 
                  href="/login" 
                  className="font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading registration page...</p>
        </div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
} 