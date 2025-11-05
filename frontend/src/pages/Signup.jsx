import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Signup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    is_student: '',
    school_name: '',
    school_category: '',
    class_level: '',
    department: '',
    password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stepErrors, setStepErrors] = useState({});
  const { signup, loading, error } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || localStorage.getItem('redirectAfterLogin');

  useEffect(() => {
    // Clear redirect from localStorage when component unmounts
    return () => {
      if (!redirectPath) {
        localStorage.removeItem('redirectAfterLogin');
      }
    };
  }, [redirectPath]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear field error when user starts typing
    if (stepErrors[e.target.name]) {
      setStepErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
  };

  const validateStep1 = () => {
    const errors = {};
    if (!formData.first_name.trim()) errors.first_name = 'First name is required';
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
    if (!formData.is_student) errors.is_student = 'Please select if you are a student';
    
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!formData.username.trim()) errors.username = 'Username is required';
    
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors = {};
    if (formData.is_student === 'no' && !formData.username.trim()) {
      errors.username = 'Username is required';
    }
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }
    
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      // Skip step 2 if user is not a student
      if (formData.is_student === 'no') {
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    // If on step 3 and user is not a student, go back to step 1
    if (currentStep === 3 && formData.is_student === 'no') {
      setCurrentStep(1);
    } else {
      setCurrentStep(prev => prev - 1);
    }
    setStepErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) return;

    const { confirm_password, is_student, ...signupData } = formData;
    // Clean up empty fields and remove is_student (not needed in backend)
    Object.keys(signupData).forEach(key => {
      if (signupData[key] === '') {
        signupData[key] = null;
      }
    });
    const success = await signup(signupData);
    
    if (success) {
      setSuccess(true);
      // If there's a redirect path, go to login with redirect, otherwise just go to login
      const loginPath = redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : '/login';
      setTimeout(() => {
        localStorage.removeItem('redirectAfterLogin');
        navigate(loginPath);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full"
      >
        {/* Back to Home */}
        <div className="mb-6">
          <Link to="/" className="text-white hover:text-blue-100 inline-flex items-center">
            <i className="ri-arrow-left-line mr-2"></i>
            Back to Home
          </Link>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          {/* Logo/Brand */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">ReadnWin</h1>
            <p className="text-gray-600 text-sm sm:text-base">Create your account and start reading!</p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                  currentStep >= 1 ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > 1 ? <i className="ri-check-line text-lg"></i> : '1'}
                </div>
                {formData.is_student === 'yes' && (
                  <>
                    <div className={`w-8 sm:w-12 h-1 rounded transition-all ${
                      currentStep >= 2 ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                    }`}></div>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                      currentStep >= 2 ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep > 2 ? <i className="ri-check-line text-lg"></i> : '2'}
                    </div>
                  </>
                )}
                <div className={`w-8 sm:w-12 h-1 rounded transition-all ${
                  currentStep >= 3 ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                }`}></div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                  currentStep >= 3 ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
                }`}>
                  {formData.is_student === 'yes' ? '3' : '2'}
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Step {formData.is_student === 'no' && currentStep === 3 ? '2' : currentStep} of {formData.is_student === 'yes' ? '3' : '2'}: {
                  currentStep === 1 ? 'Personal Information' : 
                  currentStep === 2 ? 'Education Details' : 
                  'Security'
                }
              </p>
            </div>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
              <i className="ri-check-line mr-2"></i>
              Account created successfully! Redirecting to login...
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
              <i className="ri-error-warning-line mr-2"></i>
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2 text-sm">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          stepErrors.first_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="John"
                      />
                      {stepErrors.first_name && (
                        <p className="text-red-500 text-xs mt-1">{stepErrors.first_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2 text-sm">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          stepErrors.last_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Doe"
                      />
                      {stepErrors.last_name && (
                        <p className="text-red-500 text-xs mt-1">{stepErrors.last_name}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                      Email Address *
                    </label>
                    <div className="relative">
                      <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          stepErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="john@example.com"
                      />
                    </div>
                    {stepErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{stepErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                      Phone Number
                    </label>
                    <div className="relative">
                      <i className="ri-phone-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                      <input
                        type="text"
                        inputMode="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+234 123 456 7890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                      Are you a student? *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="is_student"
                          value="yes"
                          checked={formData.is_student === 'yes'}
                          onChange={handleChange}
                          className="mr-2 w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="is_student"
                          value="no"
                          checked={formData.is_student === 'no'}
                          onChange={handleChange}
                          className="mr-2 w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">No</span>
                      </label>
                    </div>
                    {stepErrors.is_student && (
                      <p className="text-red-500 text-xs mt-1">{stepErrors.is_student}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    {formData.is_student === 'yes' ? 'Continue to Education Details' : 'Continue to Security'}
                    <i className="ri-arrow-right-line ml-2"></i>
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                      Username *
                    </label>
                    <div className="relative">
                      <i className="ri-user-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          stepErrors.username ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="johndoe"
                      />
                    </div>
                    {stepErrors.username && (
                      <p className="text-red-500 text-xs mt-1">{stepErrors.username}</p>
                    )}
                  </div>
                  {formData.is_student === 'yes' && (
                    <>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2 text-sm">
                          School Category
                        </label>
                        <select
                          name="school_category"
                          value={formData.school_category}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select school category</option>
                          <option value="Primary">Primary</option>
                          <option value="Secondary">Secondary</option>
                          <option value="Tertiary">Tertiary</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold mb-2 text-sm">
                          School Name
                        </label>
                        <div className="relative">
                          <i className="ri-school-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                          <input
                            type="text"
                            name="school_name"
                            value={formData.school_name}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="University of Lagos"
                          />
                        </div>
                      </div>

                      {(formData.school_category === 'Primary' || formData.school_category === 'Secondary') && (
                        <div>
                          <label className="block text-gray-700 font-semibold mb-2 text-sm">
                            Class Level
                          </label>
                          <input
                            type="text"
                            name="class_level"
                            value={formData.class_level}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={formData.school_category === 'Primary' ? 'Primary 1' : 'SS1'}
                          />
                        </div>
                      )}

                      {formData.school_category === 'Tertiary' && (
                        <div>
                          <label className="block text-gray-700 font-semibold mb-2 text-sm">
                            Department
                          </label>
                          <input
                            type="text"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Computer Science"
                          />
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
                    >
                      <i className="ri-arrow-left-line mr-2"></i>
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      Continue to Security
                      <i className="ri-arrow-right-line ml-2"></i>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  {formData.is_student === 'no' && (
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2 text-sm">
                        Username *
                      </label>
                      <div className="relative">
                        <i className="ri-user-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            stepErrors.username ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="johndoe"
                        />
                      </div>
                      {stepErrors.username && (
                        <p className="text-red-500 text-xs mt-1">{stepErrors.username}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                      Password *
                    </label>
                    <div className="relative">
                      <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          stepErrors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                      </button>
                    </div>
                    {stepErrors.password && (
                      <p className="text-red-500 text-xs mt-1">{stepErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          stepErrors.confirm_password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                      </button>
                    </div>
                    {stepErrors.confirm_password && (
                      <p className="text-red-500 text-xs mt-1">{stepErrors.confirm_password}</p>
                    )}
                  </div>

                  <div className="flex items-start">
                    <input type="checkbox" required className="mt-1 mr-2" />
                    <span className="text-sm text-gray-600">
                      I agree to the{' '}
                      <Link to="/terms" className="text-blue-600 hover:text-purple-600">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-blue-600 hover:text-purple-600">
                        Privacy Policy
                      </Link>
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
                    >
                      <i className="ri-arrow-left-line mr-2"></i>
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <i className="ri-check-line"></i>
                          Create Account
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-purple-600 font-semibold">
                Login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}