import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../hooks';
import { useCartContext } from '../context/CartContext';
import { getImageUrl } from '../lib/fileService';
import Header from '../components/Header';

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const hasLoaded = useRef(false);
  
  const {
    cartItems,
    isLoading,
    error,
    updateQuantity,
    removeFromCart,
    isEbookOnly,
    isPhysicalOnly,
    isMixedCart,
    getSubtotal,
    getTotalSavings,
    getTotalItems,
    refreshCart
  } = useCartContext();

  useEffect(() => {
    if (isAuthenticated && !hasLoaded.current) {
      hasLoaded.current = true;
      // Small delay to allow cart transfer to complete
      setTimeout(() => {
        refreshCart();
      }, 500);
    }
  }, [isAuthenticated, refreshCart]);

  const handleUpdateQuantity = async (bookId, newQuantity) => {
    if (newQuantity < 1) return;
    await updateQuantity(bookId, newQuantity);
  };

  const handleRemoveItem = async (bookId) => {
    await removeFromCart(bookId);
  };

  const handleCheckout = () => {
    console.log('Checkout clicked', { cartItems: cartItems.length, isAuthenticated: isAuthenticated() });
    
    if (cartItems.length === 0) {
      alert('Your cart is empty. Please add items before proceeding to checkout.');
      return;
    }

    if (!isAuthenticated()) {
      console.log('Not authenticated, redirecting to login');
      localStorage.setItem('redirectAfterLogin', '/checkout');
      navigate('/login?redirect=/checkout');
      return;
    }

    console.log('Navigating to checkout');
    navigate('/checkout');
  };

  const handleGuestLogin = () => {
    localStorage.setItem('redirectAfterLogin', '/checkout');
    navigate('/login?redirect=/checkout');
  };

  const handleGuestSignup = () => {
    localStorage.setItem('redirectAfterLogin', '/checkout');
    navigate('/signup?redirect=/checkout');
  };

  // Get cart type info
  const getCartTypeInfo = () => {
    if (cartItems.length === 0) {
      return {
        title: "Empty Cart",
        message: "Your cart is empty. Add some books to get started!",
        icon: "ri-shopping-bag-line",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200"
      };
    } else if (isEbookOnly()) {
      return {
        title: "Digital Books Only",
        message: "Your cart contains only digital books. No shipping required!",
        icon: "ri-download-line",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      };
    } else if (isPhysicalOnly()) {
      return {
        title: "Physical Books Only",
        message: "Your cart contains only physical books. Shipping address required.",
        icon: "ri-box-3-line",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
      };
    } else {
      return {
        title: "Mixed Cart",
        message: "Your cart contains both digital and physical books.",
        icon: "ri-shopping-bag-line",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200"
      };
    }
  };

  const cartTypeInfo = getCartTypeInfo();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 sm:pt-24">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex space-x-4">
                    <div className="w-20 h-24 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 sm:pt-24">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <i className="ri-alert-line text-red-400 mr-2 text-xl"></i>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 pt-20 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in your cart
          </p>
        </motion.div>

        {/* Guest User Login/Signup Prompt */}
        {!isAuthenticated() && cartItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start">
              <i className="ri-user-line text-yellow-600 text-2xl mb-2 sm:mb-0 sm:mr-3"></i>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-medium text-yellow-900 mb-2">
                  Sign in to Continue
                </h3>
                <p className="text-sm sm:text-base text-yellow-800 mb-3 sm:mb-4">
                  To proceed with checkout and manage your orders, please sign in to your account or create a new one.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={handleGuestLogin}
                    className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <i className="ri-login-box-line mr-2"></i>
                    Sign In
                  </button>
                  <button
                    onClick={handleGuestSignup}
                    className="inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <i className="ri-user-add-line mr-2"></i>
                    Create Account
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cart Type Info */}
        {cartItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${cartTypeInfo.bgColor} ${cartTypeInfo.borderColor}`}
          >
            <div className="flex items-start sm:items-center">
              <i className={`${cartTypeInfo.icon} ${cartTypeInfo.color} text-xl mr-2 sm:mr-3`}></i>
              <div className="min-w-0">
                <h3 className={`text-sm sm:text-base font-medium ${cartTypeInfo.color}`}>{cartTypeInfo.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{cartTypeInfo.message}</p>
              </div>
            </div>
          </motion.div>
        )}

        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 sm:py-12 px-4"
          >
            <i className="ri-shopping-bag-line text-6xl text-gray-400 mb-4"></i>
            <h3 className="mt-2 text-base sm:text-lg font-medium text-gray-900">Your cart is empty</h3>
            <p className="mt-1 text-sm text-gray-500">Start shopping to add items to your cart.</p>
            <div className="mt-4 sm:mt-6">
              <Link
                to="/books"
                className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                Browse Books
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Cart Items</h2>
                  <AnimatePresence>
                    <div className="space-y-3 sm:space-y-4">
                      {cartItems.map((item) => {
                        // Use same fallback pattern as BookCard component
                        const itemImageUrl = getImageUrl(item.book?.cover_image_url || item.book?.cover_image);
                        return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 sm:p-5 bg-gradient-to-r from-white to-gray-50 border-l-4 border-blue-500 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          {/* Book Cover and Details */}
                          <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                            <div className="flex-shrink-0">
                              <img
                                src={itemImageUrl || '/placeholder-book.jpg'}
                                alt={item.book?.title}
                                className="w-16 h-20 sm:w-20 sm:h-28 rounded-lg object-cover shadow-md"
                                onError={(e) => {
                                  if (e.currentTarget.src !== '/placeholder-book.jpg') {
                                    e.currentTarget.src = '/placeholder-book.jpg';
                                  }
                                }}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 mb-1">
                                {item.book?.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                                by {item.book?.author_name}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  item.book?.format === 'ebook' 
                                    ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' 
                                    : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
                                }`}>
                                  {item.book?.format === 'ebook' ? (
                                    <>
                                      <i className="ri-download-cloud-line mr-1"></i>
                                      Digital
                                    </>
                                  ) : (
                                    <>
                                      <i className="ri-book-3-line mr-1"></i>
                                      Physical
                                    </>
                                  )}
                                </span>
                                {item.book?.original_price && item.book.original_price > (item.book?.price || 0) && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                    <i className="ri-price-tag-3-line mr-1"></i>
                                    {Math.round(((item.book.original_price - item.book.price) / item.book.original_price) * 100)}% OFF
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Price, Quantity, and Actions */}
                          <div className="flex items-center justify-between sm:justify-end sm:space-x-6">
                            {/* Price */}
                            <div className="text-left sm:text-right">
                              <p className="text-base sm:text-lg font-bold text-gray-900">
                                ₦{(item.book?.price || 0).toLocaleString()}
                              </p>
                              {item.book?.original_price && item.book.original_price > (item.book?.price || 0) && (
                                <p className="text-xs sm:text-sm text-gray-500 line-through">
                                  ₦{item.book.original_price.toLocaleString()}
                                </p>
                              )}
                            </div>

                            {/* Quantity Controls and Remove Button */}
                            <div className="flex items-center space-x-3">
                              {/* Quantity Controls */}
                              <div className="flex items-center space-x-1 bg-white border-2 border-gray-200 rounded-lg p-1 shadow-sm">
                                <button
                                  onClick={() => handleUpdateQuantity(item.book_id, item.quantity - 1)}
                                  className="p-2 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={item.quantity <= 1}
                                >
                                  <i className="ri-subtract-line text-lg"></i>
                                </button>
                                <span className="text-sm font-bold text-gray-900 w-8 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleUpdateQuantity(item.book_id, item.quantity + 1)}
                                  className="p-2 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={item.book?.format === 'physical' && (item.book?.stock_quantity || 0) <= item.quantity}
                                >
                                  <i className="ri-add-line text-lg"></i>
                                </button>
                              </div>

                              {/* Remove Button */}
                              <button
                                onClick={() => handleRemoveItem(item.book_id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border-2 border-transparent hover:border-red-200"
                                title="Remove from cart"
                              >
                                <i className="ri-delete-bin-line text-xl"></i>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                        );
                      })}
                    </div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow p-4 sm:p-6 lg:sticky lg:top-8"
              >
                <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Order Summary</h2>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({getTotalItems()} items)</span>
                    <span className="font-medium">₦{getSubtotal().toLocaleString()}</span>
                  </div>
                  
                  {getTotalSavings() > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Savings</span>
                      <span className="font-medium text-green-600">-₦{getTotalSavings().toLocaleString()}</span>
                    </div>
                  )}

                  {!isEbookOnly() && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium text-xs sm:text-sm">
                        {isAuthenticated ? 'Based on delivery address' : 'Requires sign in'}
                      </span>
                    </div>
                  )}

                  <div className="border-t pt-2 sm:pt-3">
                    <div className="flex justify-between text-sm sm:text-base font-medium">
                      <span>Total</span>
                      <span>₦{getSubtotal().toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {isEbookOnly() 
                        ? 'Digital delivery - no shipping fees' 
                        : isAuthenticated() 
                          ? 'Shipping fees added at checkout based on location'
                          : 'Sign in to calculate shipping and final total'
                      }
                    </p>
                  </div>
                </div>

                {isAuthenticated() ? (
                  <button
                    onClick={handleCheckout}
                    disabled={cartItems.length === 0}
                    className="w-full mt-4 sm:mt-6 bg-blue-600 text-white py-3 px-4 rounded-md text-sm sm:text-base font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Proceed to Checkout
                  </button>
                ) : (
                  <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                    <button
                      onClick={handleGuestLogin}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md text-sm sm:text-base font-medium hover:bg-blue-700 transition-colors"
                    >
                      Sign In to Checkout
                    </button>
                    <button
                      onClick={handleGuestSignup}
                      className="w-full bg-gray-100 text-gray-800 py-3 px-4 rounded-md text-sm sm:text-base font-medium hover:bg-gray-200 transition-colors"
                    >
                      Create Account
                    </button>
                  </div>
                )}

                <div className="mt-3 sm:mt-4 text-center">
                  <Link
                    to="/books"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
