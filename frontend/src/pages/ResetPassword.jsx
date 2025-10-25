import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  
  const { resetPassword, loading, error } = useAuth();

  useEffect(() => {
    if (!token) {
      setTokenError(true);
    }
  }, [token]);

  const validatePassword = (pwd) => {
    const errors = [];
    if (!pwd || pwd.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(pwd)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      errors.push('Password must contain at least one special character');
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setPasswordErrors(['Passwords do not match']);
      return;
    }

    // Validate password strength
    const errors = validatePassword(password);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors([]);

    // Submit reset
    const result = await resetPassword(token, password);
    if (result) {
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  if (tokenError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-line text-3xl text-red-600"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">
              The password reset link is missing or invalid. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700"
            >
              Request New Reset Link
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Back to Home */}
        <div className="mb-6">
          <Link to="/" className="text-white hover:text-blue-100 inline-flex items-center">
            <i className="ri-arrow-left-line mr-2"></i>
            Back to Home
          </Link>
        </div>

        {/* Reset Password Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">ReadnWin</h1>
            <p className="text-gray-600">Create a new password</p>
          </div>

          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-check-line text-3xl text-green-600"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Password Reset Successful!</h3>
              <p className="text-gray-600 mb-6">
                Your password has been successfully reset. Redirecting to login...
              </p>
              <div className="animate-spin inline-block w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-lock-line text-3xl text-blue-600"></i>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                  <i className="ri-error-warning-line mr-2"></i>
                  {error}
                </div>
              )}

              {passwordErrors.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-100 text-yellow-700 rounded-lg">
                  <p className="font-semibold mb-2">Password requirements:</p>
                  <ul className="text-sm space-y-1">
                    {passwordErrors.map((err, idx) => (
                      <li key={idx} className="flex items-center">
                        <i className="ri-close-line mr-2"></i>
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <i className={`ri-${showPassword ? 'eye-line' : 'eye-off-line'}`}></i>
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Must be at least 8 characters with uppercase, lowercase, number, and special character
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      <i className={`ri-${showConfirmPassword ? 'eye-line' : 'eye-off-line'}`}></i>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-blue-600 hover:text-purple-600 font-semibold">
                  <i className="ri-arrow-left-line mr-2"></i>
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
