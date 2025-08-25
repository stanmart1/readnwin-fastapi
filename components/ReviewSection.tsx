'use client';

import { useRef, useState, useEffect } from 'react';
import OptimizedImage from '@/components/OptimizedImage';

interface Review {
  id: number;
  rating: number;
  title?: string;
  review_text?: string;
  is_verified_purchase: boolean;
  is_helpful_count: number;
  created_at: string;
  first_name: string;
  last_name: string;
  book_title: string;
  book_cover?: string;
  book_author?: string;
}

export default function ReviewSection() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  // Auto-scroll carousel every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying || reviews.length === 0) return;

    const interval = setInterval(() => {
      if (carouselRef.current) {
        const scrollAmount = carouselRef.current.offsetWidth * 0.8;
        carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        
        // Reset to beginning when reaching the end
        setTimeout(() => {
          if (carouselRef.current) {
            const isAtEnd = carouselRef.current.scrollLeft + carouselRef.current.offsetWidth >= carouselRef.current.scrollWidth - 10;
            if (isAtEnd) {
              carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            }
          }
        }, 500);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, reviews.length]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/featured?limit=10`);
      if (response.ok) {
        const reviews = await response.json();
        setReviews(reviews);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Error loading reviews');
    } finally {
      setLoading(false);
    }
  };

  const scrollToNext = () => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.offsetWidth * 0.8;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollToPrev = () => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.offsetWidth * 0.8;
      carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <i
            key={i}
            className={`ri-star-${i < rating ? 'fill' : 'line'} text-yellow-400 text-lg`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            What Our Readers Say
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Discover what our community thinks about their favorite books and reading experiences.
          </p>
        </div>
        
        {/* Carousel Container */}
        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Navigation Buttons */}
          <button
            onClick={scrollToPrev}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300"
            aria-label="Previous reviews"
          >
            <i className="ri-arrow-left-s-line text-2xl text-gray-700"></i>
          </button>
          
          <button
            onClick={scrollToNext}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300"
            aria-label="Next reviews"
          >
            <i className="ri-arrow-right-s-line text-2xl text-gray-700"></i>
          </button>
          
          {/* Reviews Carousel */}
          {loading ? (
            <div className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-80 md:w-96">
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse min-h-[520px]">
                    <div className="p-6 flex flex-col h-[520px]">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full mr-3"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="flex justify-between mt-auto">
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-error-warning-line text-4xl text-gray-400"></i>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Unable to load reviews</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchReviews}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-all duration-300"
              >
                <i className="ri-refresh-line"></i>
                <span>Try Again</span>
              </button>
            </div>
          ) : reviews.length > 0 ? (
            <div 
              ref={carouselRef}
              className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {reviews.map((review) => (
                <div key={review.id} className="flex-shrink-0 w-80 md:w-96">
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 w-full min-h-[520px] flex flex-col">
                    <div className="p-6 flex flex-col flex-1">
                      {/* Book Info */}
                      <div className="flex items-center mb-4">
                        {review.book_cover && (
                          <OptimizedImage
                            src={review.book_cover}
                            alt={review.book_title}
                            className="w-12 h-16 object-cover rounded-lg shadow-sm mr-3"
                            width={48}
                            height={64}
                            fallback="/placeholder-book.jpg"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                            {review.book_title}
                          </h3>
                          {review.book_author && (
                            <p className="text-xs text-gray-600">by {review.book_author}</p>
                          )}
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="mb-4">
                        {getRatingStars(review.rating)}
                      </div>

                      {/* Review Title */}
                      {review.title && (
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                          {review.title}
                        </h4>
                      )}

                      {/* Review Text */}
                      {review.review_text && (
                        <blockquote className="text-gray-700 mb-6 italic line-clamp-4 flex-1">
                          "{review.review_text}"
                        </blockquote>
                      )}

                      {/* Reviewer Info */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {review.first_name.charAt(0)}{review.last_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {review.first_name} {review.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(review.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        {review.is_verified_purchase && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <i className="ri-check-line text-sm"></i>
                            <span className="text-xs font-medium">Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-star-line text-4xl text-gray-400"></i>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No reviews available</h3>
              <p className="text-gray-600">Check back soon for reader reviews and testimonials.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Custom CSS for hiding scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
} 