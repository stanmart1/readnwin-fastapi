"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Using Remix icons for consistency with the design system
import { useCart } from "@/contexts/CartContextNew";
import { useGuestCart } from "@/contexts/GuestCartContext";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { constructImageUrl } from "@/lib/imageUtils";

export default function CartPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Use appropriate cart context based on authentication status
  const {
    cartItems: authCartItems,
    isLoading: authIsLoading,
    error: authError,
    analytics: authAnalytics,
    updateQuantity: authUpdateQuantity,
    removeFromCart: authRemoveFromCart,
    isEbookOnly: authIsEbookOnly,
    isPhysicalOnly: authIsPhysicalOnly,
    isMixedCart: authIsMixedCart,
    getSubtotal: authGetSubtotal,
    getTotalSavings: authGetTotalSavings,
    getTotalItems: authGetTotalItems,
    addToCart: authAddToCart,
  } = useCart();

  const {
    cartItems: guestCartItems,
    isLoading: guestIsLoading,
    error: guestError,
    analytics: guestAnalytics,
    updateQuantity: guestUpdateQuantity,
    removeFromCart: guestRemoveFromCart,
    isEbookOnly: guestIsEbookOnly,
    isPhysicalOnly: guestIsPhysicalOnly,
    isMixedCart: guestIsMixedCart,
    getSubtotal: guestGetSubtotal,
    getTotalSavings: guestGetTotalSavings,
    getTotalItems: guestGetTotalItems,
  } = useGuestCart();

  // Use appropriate cart data based on authentication status
  const cartItems = isAuthenticated ? authCartItems : guestCartItems;
  const isLoading = isAuthenticated ? authIsLoading : guestIsLoading;
  const error = isAuthenticated ? authError : guestError;
  const analytics = isAuthenticated ? authAnalytics : guestAnalytics;
  const updateQuantity = isAuthenticated
    ? authUpdateQuantity
    : guestUpdateQuantity;
  const removeFromCart = isAuthenticated
    ? authRemoveFromCart
    : guestRemoveFromCart;
  const isEbookOnly = isAuthenticated ? authIsEbookOnly : guestIsEbookOnly;
  const isPhysicalOnly = isAuthenticated
    ? authIsPhysicalOnly
    : guestIsPhysicalOnly;
  const isMixedCart = isAuthenticated ? authIsMixedCart : guestIsMixedCart;
  const getSubtotal = isAuthenticated ? authGetSubtotal : guestGetSubtotal;
  const getTotalSavings = isAuthenticated
    ? authGetTotalSavings
    : guestGetTotalSavings;
  const getTotalItems = isAuthenticated
    ? authGetTotalItems
    : guestGetTotalItems;

  const handleUpdateQuantity = async (bookId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    await updateQuantity(bookId, newQuantity);
  };

  const handleRemoveItem = async (bookId: number) => {
    await removeFromCart(bookId);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    if (!isAuthenticated) {
      router.push("/checkout-guest");
      return;
    }

    router.push("/checkout-unified");
  };

  const handleGuestCheckout = () => {
    router.push("/checkout-guest");
  };

  // Get cart type message
  const cartTypeInfo = useMemo(() => {
    if (cartItems.length === 0) {
      return {
        title: "Empty Cart",
        message: "Your cart is empty. Add some books to get started!",
        icon: "ri-shopping-bag-line",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
      };
    } else if (isEbookOnly()) {
      return {
        title: "Digital Books Only",
        message: "Your cart contains only digital books. Books will be added to your library for reading after payment!",
        icon: "ri-download-line",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      };
    } else if (isPhysicalOnly()) {
      return {
        title: "Physical Books Only",
        message:
          "Your cart contains only physical books. Shipping address required.",
        icon: "ri-box-3-line",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      };
    } else {
      return {
        title: "Mixed Cart",
        message: "Your cart contains both digital and physical books. eBooks will be added to your library for reading.",
        icon: "ri-shopping-bag-line",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
      };
    }
  }, [cartItems.length, isEbookOnly, isPhysicalOnly]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
              <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            </div>
            <div className="space-y-4">
              {Array.from({ length: Math.min(getTotalItems() || 3, 5) }).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="flex space-x-4">
                    <div className="w-20 h-24 bg-gray-300 rounded-lg animate-pulse"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/4 animate-pulse"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
                <i className="ri-error-warning-line text-white text-xl"></i>
              </div>
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error Loading Cart</h3>
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <i className="ri-shopping-cart-line text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-gray-600">
                {getTotalItems()} item{getTotalItems() !== 1 ? "s" : ""} in your cart
              </p>
            </div>
          </div>
        </div>

        {/* Guest Checkout Info */}
        {!isAuthenticated && cartItems.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                <i className="ri-information-line text-white text-lg"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900">
                  Guest Checkout Available
                </h3>
                <p className="text-blue-800 text-sm mt-1">
                  You can checkout as a guest or sign in to your account for faster checkout and order tracking.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cart Type Info - Only show when cart has items */}
        {cartItems.length > 0 && (
          <div className={`mb-6 p-4 rounded-xl border ${cartTypeInfo.bgColor} ${cartTypeInfo.borderColor} shadow-sm`}>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                cartTypeInfo.color === 'text-green-600' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                cartTypeInfo.color === 'text-blue-600' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                cartTypeInfo.color === 'text-purple-600' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                'bg-gradient-to-r from-gray-500 to-slate-500'
              }`}>
                <i className={`${cartTypeInfo.icon} text-white text-lg`}></i>
              </div>
              <div>
                <h3 className={`font-semibold ${cartTypeInfo.color}`}>
                  {cartTypeInfo.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{cartTypeInfo.message}</p>
              </div>
            </div>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-shopping-bag-line text-gray-400 text-4xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Discover amazing books and start building your digital library today.
            </p>
            <Link
              href="/books"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <i className="ri-book-line"></i>
              <span>Browse Books</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <i className="ri-list-check text-white text-lg"></i>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Cart Items
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-gray-50"
                      >
                        {/* Book Cover */}
                        <div className="flex-shrink-0">
                          <img
                            src={constructImageUrl(item.book?.cover_image_url)}
                            alt={item.book?.title}
                            className="w-16 h-20 object-cover rounded"
                          />
                        </div>

                        {/* Book Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {item.book?.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            by {item.book?.author_name}
                          </p>
                          <div className="flex items-center mt-1">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                item.book?.format === "ebook"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {item.book?.format === "ebook" ? (
                                <>
                                  <i className="ri-download-line text-xs mr-1"></i>
                                  Digital
                                </>
                              ) : (
                                <>
                                  <i className="ri-box-3-line text-xs mr-1"></i>
                                  Physical
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ₦{(item.book?.price || 0).toLocaleString()}
                          </p>
                          {item.book?.original_price &&
                            item.book.original_price >
                              (item.book?.price || 0) && (
                              <p className="text-sm text-gray-500 line-through">
                                ₦{item.book.original_price.toLocaleString()}
                              </p>
                            )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(
                                item.book_id,
                                item.quantity - 1,
                              )
                            }
                            className="p-2 rounded-md hover:bg-white hover:shadow-sm transition-all duration-200 disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            <i className="ri-subtract-line text-gray-600 text-sm"></i>
                          </button>
                          <span className="text-sm font-semibold text-gray-900 w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(
                                item.book_id,
                                item.quantity + 1,
                              )
                            }
                            className="p-2 rounded-md hover:bg-white hover:shadow-sm transition-all duration-200 disabled:opacity-50"
                            disabled={
                              item.book?.format === "physical" &&
                              (item.book?.stock_quantity || 0) <= item.quantity
                            }
                          >
                            <i className="ri-add-line text-gray-600 text-sm"></i>
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.book_id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <i className="ri-delete-bin-line text-lg"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <i className="ri-calculator-line text-white text-lg"></i>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Order Summary
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Subtotal ({getTotalItems()} items)
                    </span>
                    <span className="font-medium">
                      ₦{getSubtotal().toLocaleString()}
                    </span>
                  </div>

                  {getTotalSavings() > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Savings</span>
                      <span className="font-medium text-green-600">
                        -₦{getTotalSavings().toLocaleString()}
                      </span>
                    </div>
                  )}

                  {!isEbookOnly() && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">
                        Calculated at checkout
                      </span>
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between text-lg font-semibold bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
                      <span className="text-gray-900">Total</span>
                      <span className="text-blue-600">₦{getSubtotal().toLocaleString()}</span>
                    </div>
                    {!isEbookOnly() && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        + Shipping (calculated at checkout)
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <i className="ri-secure-payment-line"></i>
                    <span>{isAuthenticated ? 'Proceed to Checkout' : 'Guest Checkout'}</span>
                  </div>
                </button>

                <div className="mt-4 text-center">
                  <Link
                    href="/books"
                    className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    <i className="ri-arrow-left-line"></i>
                    <span>Continue Shopping</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
