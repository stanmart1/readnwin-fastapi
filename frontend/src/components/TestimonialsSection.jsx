import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { getImageUrl } from '../lib/fileService';
import ProgressiveImage from './ProgressiveImage';

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await api.get('/reviews/featured?limit=10');
      if (response.data) {
        const reviews = response.data.map(review => ({
          id: review.id,
          name: `${review.first_name} ${review.last_name}`.trim(),
          firstName: review.first_name,
          lastName: review.last_name,
          bookTitle: review.book_title,
          bookAuthor: review.book_author,
          bookCover: getImageUrl(review.book_cover),
          title: review.title,
          content: review.review_text,
          rating: review.rating,
          isVerified: review.is_verified_purchase,
          createdAt: review.created_at
        }));
        setTestimonials(reviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAutoPlaying || testimonials.length === 0) return;

    const interval = setInterval(() => {
      if (carouselRef.current) {
        const scrollAmount = carouselRef.current.offsetWidth * 0.8;
        carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        
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
  }, [isAutoPlaying, testimonials.length]);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.offsetWidth * 0.8;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <i
        key={i}
        className={`ri-star-${i < rating ? 'fill' : 'line'} text-yellow-400 text-lg`}
      ></i>
    ));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            What Our Readers Say
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Discover what our community thinks about their favorite books and reading experiences.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-star-line text-4xl text-gray-400"></i>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No reviews available</h3>
            <p className="text-gray-600">Check back soon for reader reviews and testimonials.</p>
          </div>
        ) : (
          <div 
            className="relative"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all border border-gray-200"
            >
              <i className="ri-arrow-left-s-line text-2xl text-gray-700"></i>
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all border border-gray-200"
            >
              <i className="ri-arrow-right-s-line text-2xl text-gray-700"></i>
            </button>

            <div
              ref={carouselRef}
              className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth px-2"
            >
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0 w-80 md:w-96"
                >
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 min-h-[400px] flex flex-col">
                    <div className="p-6 flex flex-col flex-1">
                      {/* Book Info */}
                      <div className="flex items-center mb-4">
                        {testimonial.bookCover && (
                          <div className="w-12 h-16 mr-3 flex-shrink-0">
                            <ProgressiveImage
                              src={testimonial.bookCover}
                              alt={testimonial.bookTitle}
                              className="w-full h-full object-cover rounded-lg shadow-sm"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                            {testimonial.bookTitle}
                          </h3>
                          {testimonial.bookAuthor && (
                            <p className="text-xs text-gray-600">by {testimonial.bookAuthor}</p>
                          )}
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center space-x-1 mb-4">
                        {renderStars(testimonial.rating)}
                      </div>

                      {/* Review Title */}
                      {testimonial.title && (
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                          {testimonial.title}
                        </h4>
                      )}

                      {/* Review Text */}
                      <blockquote className="text-gray-700 mb-6 italic line-clamp-4 flex-1">
                        "{testimonial.content}"
                      </blockquote>

                      {/* Reviewer Info */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {testimonial.firstName.charAt(0)}{testimonial.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {testimonial.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(testimonial.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        {testimonial.isVerified && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <i className="ri-check-line text-sm"></i>
                            <span className="text-xs font-medium">Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
