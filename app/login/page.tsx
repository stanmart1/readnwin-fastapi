"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [needsVerification, setNeedsVerification] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Optimized redirect - faster authentication check
  useEffect(() => {
    if (isAuthenticated && user?.id && !isSubmitting) {
      const redirect = searchParams.get("redirect") || searchParams.get("callbackUrl");
      if (redirect) {
        router.push(redirect);
        return;
      }
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, router, searchParams, isSubmitting]);

  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      setSuccessMessage(message);
    }
  }, [searchParams]);

  // Simplified verification check - only when needed
  useEffect(() => {
    const checkVerificationStatus = async (email: string) => {
      if (!email || !/\S+@\S+\.\S+/.test(email) || isSubmitting) {
        setNeedsVerification(false);
        setCheckingVerification(false);
        return;
      }

      setCheckingVerification(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl}/auth/check-verification-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          const data = await response.json();
          setNeedsVerification(data.needsVerification);
        } else {
          setNeedsVerification(false);
        }
      } catch (error) {
        setNeedsVerification(false);
      } finally {
        setCheckingVerification(false);
      }
    };

    // Only check if email is complete and valid
    if (email && /\S+@\S+\.\S+/.test(email) && !isSubmitting) {
      const timeoutId = setTimeout(() => {
        checkVerificationStatus(email);
      }, 2000); // Increased delay to 2 seconds

      return () => clearTimeout(timeoutId);
    } else {
      setCheckingVerification(false);
      setNeedsVerification(false);
    }
  }, [email, isSubmitting]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      errors.password = "Password is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    const loginStartTime = Date.now();
    setIsSubmitting(true);
    setIsLoading(true);

    try {
      const success = await login(email, password);
      const loginDuration = Date.now() - loginStartTime;

      console.log(`🔍 Login performance: ${loginDuration}ms`);

      if (success) {
        // Immediate redirect without success message for faster UX
        const redirect = searchParams.get("redirect") || searchParams.get("callbackUrl");
        if (redirect) {
          router.push(redirect);
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(
          "Invalid email or password. Please check your credentials and try again.",
        );
      }
    } catch (error) {
      setError(
        "Invalid email or password. Please check your credentials and try again.",
      );
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  // Show loading only for initial auth check, not during login
  if (authLoading && !isSubmitting) {
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
            Welcome back
          </h2>
          <p className="mt-2 text-gray-600">
            Sign in to your account to continue reading
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
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
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: "" }));
                    }
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    fieldErrors.email
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
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

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-lock-line text-gray-400"></i>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }
                  }}
                  className={`w-full pl-10 pr-12 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    fieldErrors.password
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  disabled={isSubmitting}
                >
                  <i
                    className={`${showPassword ? "ri-eye-off-line" : "ri-eye-line"} text-lg`}
                  ></i>
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <i className="ri-error-warning-line mr-1"></i>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
                <div className="flex">
                  <i className="ri-check-line text-green-400 text-xl"></i>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Success
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      {successMessage}
                    </p>
                    {/* Manual redirect button as fallback */}
                    <button
                      type="button"
                      onClick={() => {
                        const redirect =
                          searchParams.get("redirect") ||
                          searchParams.get("callbackUrl");
                        if (redirect) {
                          router.push(redirect);
                        } else {
                          router.push("/dashboard");
                        }
                      }}
                      className="mt-2 text-sm text-green-600 hover:text-green-800 underline"
                    >
                      Click here if you're not redirected automatically
                    </button>
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
                    <h3 className="text-sm font-medium text-red-800">
                      Login Error
                    </h3>
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
                    <h3 className="text-sm font-medium text-blue-800">
                      Signing in...
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Please wait while we authenticate your account
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <i className="ri-login-circle-line mr-2"></i>
                  Sign In
                </div>
              )}
            </button>

            {/* Links */}
            <div className="flex items-center justify-between text-sm">
              <Link
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                Don't have an account?
              </Link>
              <div className="flex flex-col items-end space-y-1">
                <Link
                  href="/reset-password"
                  className="font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Forgot password?
                </Link>
                {checkingVerification && email && /\S+@\S+\.\S+/.test(email) && (
                  <div className="flex items-center text-xs text-gray-500">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-1"></div>
                    Checking verification status...
                  </div>
                )}
                {needsVerification && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (email) {
                        try {
                          const response = await fetch(
                            "/api/auth/resend-verification",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email }),
                            },
                          );
                          const data = await response.json();
                          if (response.ok) {
                            setSuccessMessage(data.message);
                          } else {
                            setError(data.error);
                          }
                        } catch (error) {
                          setError("Failed to resend verification email");
                        }
                      } else {
                        setError("Please enter your email address first");
                      }
                    }}
                    className="font-medium text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    Resend verification email
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            By signing in, you agree to our{" "}
            <Link
              href="/terms"
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading login page...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
