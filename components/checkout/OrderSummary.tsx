'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CartItem } from '@/types/ecommerce';
import { formatNumber } from '@/lib/dateUtils';

interface OrderSummaryProps {
  cartItems: CartItem[];
  checkoutSummary: any;
  onContinue: () => void;
  isLoading?: boolean;
}

export default function OrderSummary({ 
  cartItems, 
  checkoutSummary, 
  onContinue, 
  isLoading = false 
}: OrderSummaryProps) {
  const router = useRouter();

  const handleContinue = () => {
    onContinue();
  };

  const handleBackToCart = () => {
    router.push('/cart-new');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
        <p className="text-gray-600 mt-1">Review your items before proceeding to payment</p>
      </div>

      {/* Cart Items */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Items ({cartItems.length})</h3>
        
        {cartItems.map((item) => {
          const title = item.book_title || item.book?.title || 'Unknown Book';
          const author = item.book_author || item.book?.author_name || 'Unknown Author';
          const price = item.book_price || item.book?.price || 0;
          const originalPrice = item.book_original_price || item.book?.original_price;
          const cover = item.book_cover || item.book?.cover_image_url;
          const format = item.book_format || item.book?.format;
          const isActive = item.book_is_active ?? item.book?.is_active ?? true;
          
          return (
            <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              {/* Book Cover */}
              <div className="flex-shrink-0">
                <img 
                  src={cover?.startsWith('http') 
                    ? cover 
                    : cover ? `${process.env.NEXT_PUBLIC_API_URL}/${cover}` : '/placeholder-book.png'} 
                  alt={title}
                  className="w-16 h-20 object-cover rounded-md shadow-sm"
                />
              </div>
              
              {/* Book Details */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {title}
                  {!isActive && (
                    <span className="ml-2 text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded">
                      Unavailable
                    </span>
                  )}
                </h4>
                <p className="text-sm text-gray-500">
                  by {author}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    format === 'ebook' 
                      ? 'bg-blue-100 text-blue-800' 
                      : format === 'physical'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {format === 'ebook' ? 'Digital' : format === 'physical' ? 'Physical' : format === 'both' ? 'Both' : format}
                  </span>
                  <span className="text-sm text-gray-500">
                    Qty: {item.quantity}
                  </span>
                </div>
              </div>
              
              {/* Price */}
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-medium text-gray-900">
                  ₦{(price * item.quantity).toLocaleString()}
                </p>
                {originalPrice && originalPrice > price && (
                  <p className="text-xs text-gray-500 line-through">
                    ₦{(originalPrice * item.quantity).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Price Breakdown */}
      {checkoutSummary && (
        <div className="border-t border-gray-200 pt-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₦{checkoutSummary.subtotal.toLocaleString()}</span>
            </div>
            
            {checkoutSummary.tax_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">₦{checkoutSummary.tax_amount.toLocaleString()}</span>
              </div>
            )}

            {checkoutSummary.shipping_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">₦{checkoutSummary.shipping_amount.toLocaleString()}</span>
              </div>
            )}

            {checkoutSummary.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Discount</span>
                <span className="font-medium text-green-600">-₦{checkoutSummary.discount_amount.toLocaleString()}</span>
              </div>
            )}

            <div className="border-t pt-3">
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>₦{checkoutSummary.total_amount.toLocaleString()}</span>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* E-book Benefits - Only show if there are e-books in cart */}
      {cartItems.some(item => {
        const format = item.book_format || item.book?.format;
        return format === 'ebook' || format === 'both';
      }) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <i className="ri-download-line text-blue-600 text-xl"></i>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900">E-book Benefits</h4>
              <ul className="text-sm text-blue-800 mt-1 space-y-1">
                <li>• Instant access after payment</li>
                <li>• No shipping costs</li>
                <li>• Read on any device</li>
                <li>• Lifetime access to your library</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        <button
          onClick={handleContinue}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <i className="ri-arrow-right-line text-lg"></i>
              <span>Continue to Payment</span>
            </>
          )}
        </button>
        
        <button
          onClick={handleBackToCart}
          className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
        >
          Back to Cart
        </button>
      </div>
    </div>
  );
} 