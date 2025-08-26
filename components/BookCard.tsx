
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/contexts/CartContext';
import { useGuestCart } from '@/contexts/GuestCartContext';
import { Book } from '@/types/ecommerce';
import AddToCartButton from '@/components/AddToCartButton';
import OptimizedImage from '@/components/OptimizedImage';
import { constructImageUrl } from '@/lib/imageUtils';

interface BookCardProps {
  id: string | number;
  title: string;
  author?: string;
  author_name?: string; // For API data
  price: number;
  originalPrice?: number;
  original_price?: number; // For API data
  rating?: number;
  reviewCount?: number;
  cover?: string;
  cover_image_url?: string; // For API data
  isAvailable?: boolean;
  progress?: number;
  isWishlisted?: boolean;
  genre?: string;
  hideReadButton?: boolean;
  format?: 'ebook' | 'physical' | 'both';
  category_name?: string;
  author_id?: number;
  category_id?: number;
  language?: string;
  stock_quantity?: number;
  low_stock_threshold?: number;
  is_featured?: boolean;
  is_bestseller?: boolean;
  is_new_release?: boolean;
  status?: 'draft' | 'published' | 'archived' | 'out_of_stock';
  view_count?: number;
  created_at?: string;
  updated_at?: string;
}

export default function BookCard({ 
  id, 
  title, 
  author, 
  author_name,
  price, 
  originalPrice, 
  original_price,
  rating = 0, 
  reviewCount = 0, 
  cover, 
  cover_image_url,
  isAvailable = true,
  progress,
  isWishlisted = false,
  genre,
  hideReadButton = false,
  format = 'ebook',
  category_name,
  author_id = 0,
  category_id = 0,
  language = 'en',
  stock_quantity = 0,
  low_stock_threshold = 5,
  is_featured = false,
  is_bestseller = false,
  is_new_release = false,
  status = 'published',
  view_count = 0,
  created_at = new Date().toISOString(),
  updated_at = new Date().toISOString()
}: BookCardProps) {
  // Use API data if available, fallback to mock data
  const displayAuthor = author_name || author || 'Unknown Author';
  const coverPath = cover_image_url || cover || '';
  const displayCover = constructImageUrl(coverPath);
  const displayOriginalPrice = original_price || originalPrice;
  const displayRating = rating || 0;
  const displayReviewCount = reviewCount || 0;
  const displayIsAvailable = (isAvailable !== undefined ? isAvailable : true) && 
                              (status === 'published');
  const [isHovered, setIsHovered] = useState(false);
  const [wishlistStatus, setWishlistStatus] = useState(isWishlisted);
  const session = null; // Mock session for frontend-only app
  const { addToCart } = useCart();
  const { addToCart: addToGuestCart } = useGuestCart();

  const handleWishlist = () => {
    if (!session) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }
    setWishlistStatus(!wishlistStatus);
  };

  const handleAddToCart = async () => {
    if (!session) {
      // Use guest cart for unauthenticated users
      const bookData: Book = {
        id: typeof id === 'string' ? parseInt(id) : id,
        title,
        author_name: displayAuthor,
        price,
        original_price: displayOriginalPrice,
        cover_image_url: displayCover,
        category_name,
        format,
        author_id,
        category_id,
        language,
        stock_quantity,
        low_stock_threshold,
        is_featured,
        is_bestseller,
        is_new_release,
        status,
        view_count,
        created_at,
        updated_at
      };
      
      try {
        await addToGuestCart(bookData, 1);
        // Show success message
        alert('Item added to cart successfully!');
      } catch (error) {
        alert('Failed to add item to cart');
      }
    } else {
      // Use authenticated cart for logged-in users
      try {
        const success = await addToCart(typeof id === 'string' ? parseInt(id) : id, 1);
        if (success) {
          alert('Item added to cart successfully!');
        } else {
          alert('Failed to add item to cart');
        }
      } catch (error) {
        alert('Failed to add item to cart');
      }
    }
  };

  const handleReadBook = () => {
    if (!session) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }
    
    // Convert to EReaderBook format and open ereader
    const eReaderBook = {
      id: id.toString(),
      title,
      author: displayAuthor,
      cover: displayCover,
      contentType: 'markdown' as const,
      category: category_name || '',
      description: '',
      totalPages: 0,
    };
    
    // Store the book in sessionStorage to be picked up by the ereader
    sessionStorage.setItem('selectedBook', JSON.stringify(eReaderBook));
    
    // Navigate to the ereader page
    window.location.href = '/reading';
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`ri-star-${i <= rating ? 'fill' : 'line'} text-yellow-400`}
        ></i>
      );
    }
    return stars;
  };

  return (
    <div className="group cursor-pointer">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col">
        <div className="relative">
          <OptimizedImage
            src={displayCover}
            alt={title}
            className="w-full h-72 object-cover object-top"
            width={320}
            height={288}
            fallback="/placeholder-book.jpg"
            priority={false}
            showPlaceholderOnError={true}
          />
          
          {/* Book Type Badge */}
          <div className="absolute top-4 right-4 bg-green-800 text-white rounded-full px-3 py-1">
            <span className="text-sm font-medium">
              {format === 'physical' ? 'Physical' : format === 'both' ? 'Both' : 'E-Book'}
            </span>
          </div>

          {/* Discount Badge */}
          {displayOriginalPrice && (
            <div className="absolute top-4 left-4 bg-blue-800 text-white text-xs px-2 py-1 rounded-full font-medium">
              {Math.round(((displayOriginalPrice - price) / displayOriginalPrice) * 100)}% OFF
            </div>
          )}

          {/* Genre Badge */}
          {genre && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                {genre}
              </span>
            </div>
          )}

          {/* Progress Bar for Reading Books */}
          {progress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-300 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-white text-xs">{progress}%</span>
              </div>
            </div>
          )}

          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Link 
              href={`/book/${id}`}
              className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              title="View Details"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <i className="ri-eye-line text-gray-600 text-lg"></i>
              </div>
            </Link>
            {!hideReadButton && (
              <button 
                onClick={handleReadBook}
                className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors cursor-pointer"
                title={session ? (progress !== undefined ? 'Continue Reading' : 'Read Book') : 'Login to Read'}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-book-open-line text-lg"></i>
                </div>
              </button>
            )}
            <button 
              onClick={handleWishlist}
              className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              title={session ? (wishlistStatus ? 'Remove from Wishlist' : 'Add to Wishlist') : 'Login to Wishlist'}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <i className={`ri-heart-${wishlistStatus ? 'fill text-red-500' : 'line text-gray-600'} text-lg`}></i>
              </div>
            </button>
            <AddToCartButton
              bookId={typeof id === 'string' ? parseInt(id) : id}
              book={{
                id: typeof id === 'string' ? parseInt(id) : id,
                title,
                author_name: displayAuthor,
                price,
                original_price: displayOriginalPrice,
                cover_image_url: displayCover,
                category_name,
                format,
                author_id,
                category_id,
                language,
                stock_quantity,
                low_stock_threshold,
                is_featured,
                is_bestseller,
                is_new_release,
                is_active: status === 'published',
                status,
                view_count,
                created_at,
                updated_at
              }}
              quantity={1}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <i className="ri-shopping-cart-line text-lg"></i>
              </div>
            </AddToCartButton>
          </div>

          {/* Availability Badge */}
          {!displayIsAvailable && (
            <div className="absolute top-4 left-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Out of Stock
            </div>
          )}
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          <Link href={`/book/${id}`} className="cursor-pointer flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3.5rem]">
              {title}
            </h3>
          </Link>
          <p className="text-gray-600 mb-4">by {displayAuthor}</p>
          
          {/* Rating */}
          <div className="flex items-center space-x-1 mb-4">
            <div className="flex space-x-1">
              {renderStars(displayRating)}
            </div>
            <span className="text-sm text-gray-500">({displayReviewCount})</span>
          </div>

          {/* Price and Actions */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-blue-600">₦{price}</span>
        {displayOriginalPrice && (
          <span className="text-sm text-gray-500 line-through">₦{displayOriginalPrice}</span>
        )}
              </div>

            </div>
            
            {progress !== undefined ? (
              // Book is in library - show read/continue button
              !hideReadButton ? (
                <button 
                  onClick={handleReadBook}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-full hover:from-green-700 hover:to-teal-700 transition-all duration-300 cursor-pointer whitespace-nowrap font-medium flex items-center justify-center space-x-2"
                >
                  <i className="ri-book-open-line text-lg"></i>
                  <span>{progress > 0 ? 'Continue Reading' : 'Read Book'}</span>
                </button>
              ) : null
            ) : (
              // Book is not in library - show add to cart button
              <AddToCartButton
                bookId={typeof id === 'string' ? parseInt(id) : id}
                book={{
                  id: typeof id === 'string' ? parseInt(id) : id,
                  title,
                  author_name: displayAuthor,
                  price,
                  original_price: displayOriginalPrice,
                  cover_image_url: displayCover,
                  category_name,
                  format,
                  author_id,
                  category_id,
                  language,
                  stock_quantity,
                  low_stock_threshold,
                  is_featured,
                  is_bestseller,
                  is_new_release,
                  is_active: status === 'published',
                  status,
                  view_count,
                  created_at,
                  updated_at
                }}
                quantity={1}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add to Cart
              </AddToCartButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
