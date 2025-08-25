"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import { useCart } from "@/contexts/CartContextNew";

interface CartItem {
  id: number;
  book_id: number;
  quantity: number;
  book_title?: string;
  book_author?: string;
  book_price?: number;
  book_original_price?: number;
  book_cover?: string;
  book_format?: string;
  book_category?: string;
  book_is_active?: boolean;
  book_inventory_enabled?: boolean;
  book_stock_quantity?: number;
  book?: {
    id: number;
    title: string;
    author_name: string;
    price: number;
    original_price?: number;
    cover_image_url: string;
    category_name?: string;
    format?: "ebook" | "physical" | "both";
    is_active?: boolean;
    inventory_enabled?: boolean;
    stock_quantity?: number;
  };
}

export default function CartPage() {
  const { user, isAuthenticated, status } = useAuth();
  const router = useRouter();
  const {
    cartItems,
    isLoading,
    updateQuantity,
    removeFromCart,
    isEbookOnly,
    isPhysicalOnly,
    isMixedCart,
    analytics,
    refreshCart,
  } = useCart();

  // Redirect to login if not authenticated and refresh cart when page loads
  useEffect(() => {
    if (status === "loading") return;

    if (!isAuthenticated) {
      router.push("/login?callbackUrl=" + encodeURIComponent("/cart"));
      return;
    }
    
    // Refresh cart to ensure synchronization with backend
    refreshCart();
  }, [isAuthenticated, status, router, refreshCart]);

  const handleUpdateQuantity = async (bookId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    await updateQuantity(bookId, newQuantity);
  };

  const handleRemoveItem = async (bookId: number) => {
    await removeFromCart(bookId);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.book_price || item.book?.price || 0;
      return total + price * item.quantity;
    }, 0);
  };

  const calculateDiscount = () => {
    return cartItems.reduce((total, item) => {
      const originalPrice = item.book_original_price || item.book?.original_price;
      const currentPrice = item.book_price || item.book?.price || 0;
      if (originalPrice && typeof originalPrice === "number" && originalPrice > currentPrice) {
        return total + (originalPrice - currentPrice) * item.quantity;
      }
      return total;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handleCheckout = async () => {
    // Check if cart has items
    if (cartItems.length === 0) {
      alert(
        "Your cart is empty. Please add items before proceeding to checkout.",
      );
      return;
    }

    // Redirect to the checkout-new page
    router.push("/checkout-new");
  };

  // Get cart analytics
  const cartAnalytics = analytics;

  // Get cart type message
  const getCartTypeMessage = () => {
    if (isEbookOnly()) {
      return {
        title: "Digital Books Only",
        message: "Your cart contains only digital books. No shipping required!",
        icon: "ri-download-line",
        color: "text-blue-600",
      };
    } else if (isPhysicalOnly()) {
      return {
        title: "Physical Books Only",
        message:
          "Your cart contains physical books. Shipping address will be required.",
        icon: "ri-truck-line",
        color: "text-orange-600",
      };
    } else if (isMixedCart()) {
      return {
        title: "Mixed Cart",
        message: "Your cart contains both digital and physical books.",
        icon: "ri-shopping-bag-line",
        color: "text-purple-600",
      };
    } else {
      return {
        title: "Empty Cart",
        message: "Your cart is empty. Add some books to get started!",
        icon: "ri-shopping-cart-line",
        color: "text-gray-600",
      };
    }
  };

  const cartTypeInfo = getCartTypeMessage();

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Shopping Cart
            </h1>
            <p className="text-gray-600">
              Review your items and proceed to checkout
            </p>
          </div>

          {cartItems.length === 0 ? (
            /* Empty Cart State */
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-shopping-cart-line text-3xl text-gray-400"></i>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Your cart is empty
              </h2>
              <p className="text-gray-600 mb-8">
                Looks like you haven't added any books to your cart yet.
              </p>
              <Link
                href="/books"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
              >
                <i className="ri-book-line text-lg"></i>
                <span>Browse Books</span>
              </Link>
            </div>
          ) : (
            <>
              {/* Cart Type Indicator - Only show when cart has items */}
              {cartItems.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center ${cartTypeInfo.color}`}
                    >
                      <i className={`${cartTypeInfo.icon} text-xl`}></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {cartTypeInfo.title}
                      </h3>
                      <p className="text-gray-600">{cartTypeInfo.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cart Analytics - Only show when cart has items */}
              {cartItems.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {cartAnalytics.totalItems}
                      </p>
                      <p className="text-sm text-gray-600">Total Items</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {cartAnalytics.ebookCount}
                      </p>
                      <p className="text-sm text-gray-600">Digital Books</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {cartAnalytics.physicalCount}
                      </p>
                      <p className="text-sm text-gray-600">Physical Books</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        ₦{cartAnalytics.totalValue.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Total Value</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  {cartItems.map((item) => {
                    // Use direct fields or fallback to book object
                    const title = item.book_title || item.book?.title;
                    const author = item.book_author || item.book?.author_name;
                    const price = item.book_price || item.book?.price || 0;
                    const originalPrice = item.book_original_price || item.book?.original_price;
                    const cover = item.book_cover || item.book?.cover_image_url;
                    const category = item.book_category || item.book?.category_name;
                    const format = item.book_format || item.book?.format;
                    const isActive = item.book_is_active ?? item.book?.is_active ?? true;
                    
                    if (!title) return null;

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-start space-x-4">
                          {/* Book Cover */}
                          <div className="flex-shrink-0">
                            <img
                              src={cover?.startsWith('http') 
                                ? cover 
                                : cover ? `${process.env.NEXT_PUBLIC_API_URL}/${cover}` : '/placeholder-book.jpg'}
                              alt={title}
                              className="w-20 h-28 object-cover rounded-lg shadow-md"
                            />
                          </div>

                          {/* Book Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {title}
                                  {!isActive && (
                                    <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                      Unavailable
                                    </span>
                                  )}
                                </h3>
                                <p className="text-gray-600 mb-2">
                                  by {author}
                                </p>
                                <div className="flex items-center space-x-2 mb-3">
                                  {category && (
                                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                      {category}
                                    </span>
                                  )}
                                  {format && (
                                    <span
                                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                        format === "ebook"
                                          ? "bg-green-100 text-green-800"
                                          : format === "physical"
                                            ? "bg-orange-100 text-orange-800"
                                            : "bg-purple-100 text-purple-800"
                                      }`}
                                    >
                                      {format === "ebook"
                                        ? "Digital"
                                        : format === "physical"
                                          ? "Physical"
                                          : format === "both"
                                            ? "Both Formats"
                                            : format}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Remove Button */}
                              <button
                                onClick={() => handleRemoveItem(item.book_id)}
                                className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-1"
                                title="Remove item"
                              >
                                <i className="ri-close-line text-lg"></i>
                              </button>
                            </div>

                            {/* Price and Quantity */}
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        item.book_id,
                                        item.quantity - 1,
                                      )
                                    }
                                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
                                  >
                                    <i className="ri-subtract-line text-sm"></i>
                                  </button>
                                  <span className="w-12 text-center font-medium">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        item.book_id,
                                        item.quantity + 1,
                                      )
                                    }
                                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
                                  >
                                    <i className="ri-add-line text-sm"></i>
                                  </button>
                                </div>
                              </div>

                              <div className="text-right">
                                {originalPrice &&
                                  typeof originalPrice === "number" &&
                                  originalPrice > price && (
                                    <p className="text-sm text-gray-500 line-through">
                                      ₦{originalPrice.toLocaleString()}
                                    </p>
                                  )}
                                <p className="text-lg font-semibold text-gray-900">
                                  ₦{(price * item.quantity).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Order Summary
                    </h2>

                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between text-gray-600">
                        <span>
                          Subtotal (
                          {cartItems.reduce(
                            (total, item) => total + item.quantity,
                            0,
                          )}{" "}
                          items)
                        </span>
                        <span>₦{calculateSubtotal().toLocaleString()}</span>
                      </div>

                      {calculateDiscount() > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>-₦{calculateDiscount().toLocaleString()}</span>
                        </div>
                      )}

                      {/* Shipping Info */}
                      {isEbookOnly() ? (
                        <div className="flex justify-between text-green-600">
                          <span>Shipping</span>
                          <span>Free (Digital)</span>
                        </div>
                      ) : (
                        <div className="flex justify-between text-gray-600">
                          <span>Shipping</span>
                          <span>Calculated at checkout</span>
                        </div>
                      )}

                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between text-lg font-semibold text-gray-900">
                          <span>Total</span>
                          <span>₦{calculateTotal().toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckout}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                    >
                      <i className="ri-lock-line text-lg"></i>
                      <span>Proceed to Checkout</span>
                    </button>

                    <div className="mt-4 text-center">
                      <Link
                        href="/books"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
                      >
                        Continue Shopping
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
