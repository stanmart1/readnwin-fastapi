import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    school_name: '',
    school_category: '',
    class_level: '',
    department: '',
    password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signup, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirm_password) {
      alert('Passwords do not match');
      return;
    }

    const { confirm_password, ...signupData } = formData;
    // Clean up empty fields
    Object.keys(signupData).forEach(key => {
      if (signupData[key] === '') {
        signupData[key] = null;
      }
    });
    const success = await signup(signupData);
    
    if (success) {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center px-4 py-12">
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

        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">ReadnWin</h1>
            <p className="text-gray-600">Create your account and start reading!</p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                Username
              </label>
              <div className="relative">
                <i className="ri-user-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="johndoe"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                Email Address
              </label>
              <div className="relative">
                <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                Phone Number
              </label>
              <div className="relative">
                <i className="ri-phone-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="tel"
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
                School Name
              </label>
              <div className="relative">
                <i className="ri-school-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
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

            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                Password
              </label>
              <div className="relative">
                <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                Confirm Password
              </label>
              <div className="relative">
                <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

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
