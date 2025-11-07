import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getImageUrl } from '../lib/fileService';
import { Link } from 'react-router-dom';
import { useBooks } from '../hooks';
import { useCartContext } from '../context/CartContext';
import ProgressiveImage from './ProgressiveImage';

export default function FeaturedBooks() {
  const [selectedCategory, setSelectedCategory] = useState('featured');
  const [addedToCart, setAddedToCart] = useState(new Set());
  const { addToCart } = useCartContext();
  const desktopCarouselRef = useRef(null);
  const mobileCarouselRef = useRef(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  const params = {
    page: 1,
    limit: 8,
    status: 'published',
    ...(selectedCategory === 'featured' && { is_featured: true }),
    ...(selectedCategory === 'bestsellers' && { is_bestseller: true }),
    ...(selectedCategory === 'new' && { is_new_release: true })
  };

  const { books, loading } = useBooks(params);
  
  // Create infinite loop array by tripling the books
  const infiniteBooks = books.length > 0 ? [...books, ...books, ...books] : [];

  const handleAddToCart = (book, e) => {
    e.preventDefault();
    addToCart({
      id: book.id,
      title: book.title,
      author: book.author_name,
      price: book.price,
      cover_image: book.cover_image_url || book.cover_image,
      quantity: 1
    });

    setAddedToCart(prev => new Set(prev).add(book.id));
    setTimeout(() => {
      setAddedToCart(prev => {
        const newSet = new Set(prev);
        newSet.delete(book.id);
        return newSet;
      });
    }, 2000);
  };

  const categories = [
    { id: 'featured', name: 'Featured Books', icon: 'ri-star-line' },
    { id: 'bestsellers', name: 'Bestsellers', icon: 'ri-fire-line' },
    { id: 'new', name: 'New Releases', icon: 'ri-flashlight-line' }
  ];

  const getBookImage = (book) => {
    return getImageUrl(book.cover_image_url || book.cover_image, `https://picsum.photos/seed/${book.id}/400/600`);
  };

  const scroll = (direction) => {
    const carousel = window.innerWidth >= 640 ? desktopCarouselRef.current : mobileCarouselRef.current;
    if (carousel) {
      const scrollAmount = carousel.offsetWidth * 0.8;
      carousel.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Initialize scroll position to middle section
  useEffect(() => {
    if (books.length > 0) {
      const cardWidth = 296;
      if (desktopCarouselRef.current) {
        desktopCarouselRef.current.scrollLeft = cardWidth * books.length;
      }
      if (mobileCarouselRef.current) {
        mobileCarouselRef.current.scrollLeft = cardWidth * books.length;
      }
    }
  }, [books.length]);

  // Auto-scroll effect with infinite loop
  useEffect(() => {
    if (!isAutoScrolling || books.length === 0) return;

    const interval = setInterval(() => {
      const carousel = window.innerWidth >= 640 ? desktopCarouselRef.current : mobileCarouselRef.current;
      if (carousel) {
        const cardWidth = 296;
        carousel.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoScrolling, books.length]);

  // Handle infinite scroll reset with debouncing
  useEffect(() => {
    const desktopCarousel = desktopCarouselRef.current;
    const mobileCarousel = mobileCarouselRef.current;
    if (books.length === 0) return;

    const handleScroll = (carousel) => () => {
      if (isUserScrolling) return;

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        const cardWidth = 296;
        const { scrollLeft } = carousel;
        const sectionWidth = cardWidth * books.length;

        if (scrollLeft >= sectionWidth * 2 - cardWidth / 2) {
          carousel.style.scrollBehavior = 'auto';
          carousel.scrollLeft = scrollLeft - sectionWidth;
          requestAnimationFrame(() => {
            carousel.style.scrollBehavior = 'smooth';
          });
        }
        else if (scrollLeft <= cardWidth / 2) {
          carousel.style.scrollBehavior = 'auto';
          carousel.scrollLeft = scrollLeft + sectionWidth;
          requestAnimationFrame(() => {
            carousel.style.scrollBehavior = 'smooth';
          });
        }
      }, 150);
    };

    if (desktopCarousel) {
      const handler = handleScroll(desktopCarousel);
      desktopCarousel.addEventListener('scroll', handler);
    }
    if (mobileCarousel) {
      const handler = handleScroll(mobileCarousel);
      mobileCarousel.addEventListener('scroll', handler);
    }

    return () => {
      if (desktopCarousel) {
        desktopCarousel.removeEventListener('scroll', handleScroll(desktopCarousel));
      }
      if (mobileCarousel) {
        mobileCarousel.removeEventListener('scroll', handleScroll(mobileCarousel));
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [books.length, isUserScrolling]);

  // Pause auto-scroll on user interaction
  const handleTouchStart = () => {
    setIsAutoScrolling(false);
    setIsUserScrolling(true);
  };

  const handleTouchEnd = () => {
    // Mark user scrolling as complete after a short delay
    setTimeout(() => {
      setIsUserScrolling(false);
    }, 300);
    
    // Resume auto-scroll after 5 seconds of inactivity
    setTimeout(() => {
      setIsAutoScrolling(true);
    }, 5000);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
            <i className="ri-book-line mr-2"></i>
            Our Collection
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Discover Amazing Books
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore our curated collection of bestsellers, new releases, and featured titles
          </p>
        </motion.div>

        {/* Category Tabs */}
        <div className="flex justify-center mb-12 flex-wrap gap-4">
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all ${selectedCategory === category.id
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                }`}
            >
              <i className={category.icon}></i>
              <span>{category.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Books Grid/Carousel */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20">
            <i className="ri-book-line text-6xl text-gray-300 mb-4"></i>
            <p className="text-xl text-gray-500">No books found in this category</p>
          </div>
        ) : (
          <>
            {/* Desktop Carousel View */}
            <div className="hidden sm:block relative">
              <div
                ref={desktopCarouselRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {infiniteBooks.map((book, index) => (
                  <motion.div
                    key={`${book.id}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: (index % books.length) * 0.05 }}
                    className="flex-shrink-0 w-[280px] bg-white rounded-xl shadow-md overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300"
                  >

                  {/* Book Image */}
                  <div className="relative overflow-hidden h-64">
                    <ProgressiveImage
                      src={getBookImage(book)}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                    />
                    {/* Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                        <Link
                          to={`/books/${book.id}`}
                          className="flex-1 bg-white text-gray-900 py-2 rounded-lg font-semibold text-center hover:bg-gray-100 transition-all text-sm"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={(e) => handleAddToCart(book, e)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all text-white ${addedToCart.has(book.id)
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                          {addedToCart.has(book.id) ? (
                            <>
                              <i className="ri-check-line"></i>
                              <span className="hidden sm:inline ml-1">Added</span>
                            </>
                          ) : (
                            <>
                              <i className="ri-shopping-cart-line"></i>
                              <span className="hidden sm:inline ml-1">Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    {/* Badge */}
                    {book.is_featured && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                        Featured
                      </div>
                    )}
                    {book.is_bestseller && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        Bestseller
                      </div>
                    )}
                    {book.is_new_release && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        New
                      </div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-1">
                      {book.author_name || 'Unknown Author'}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`ri-star-${i < Math.floor(book.rating || 4) ? 'fill' : 'line'} text-yellow-400 text-sm`}
                          ></i>
                        ))}
                        <span className="text-xs text-gray-500 ml-1">
                          ({book.review_count || 0})
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-blue-600 font-bold text-xl">
                          ₦{(book.price || 9.99).toLocaleString('en-NG')}
                        </span>
                        {book.original_price && book.original_price > book.price && (
                          <span className="text-gray-400 text-sm line-through ml-2">
                            ₦{book.original_price.toLocaleString('en-NG')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {book.format || 'eBook'}
                      </span>
                    </div>
                  </div>
                  </motion.div>
                ))}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
              >
                <i className="ri-arrow-left-line text-2xl text-gray-700"></i>
              </button>
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
              >
                <i className="ri-arrow-right-line text-2xl text-gray-700"></i>
              </button>

              {/* Auto-scroll indicator */}
              <div className="flex justify-center mt-6 gap-3 items-center">
                <button
                  onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors shadow-md"
                >
                  <i className={`ri-${isAutoScrolling ? 'pause' : 'play'}-circle-line text-lg`}></i>
                  {isAutoScrolling ? 'Auto-scroll' : 'Paused'}
                </button>
              </div>
            </div>

            {/* Mobile Carousel View */}
            <div className="sm:hidden relative">
              <div
                ref={mobileCarouselRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-2 snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {infiniteBooks.map((book, index) => (
                  <motion.div
                    key={`${book.id}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: (index % books.length) * 0.1 }}
                    className="flex-shrink-0 w-[280px] bg-white rounded-xl shadow-md overflow-hidden snap-center"
                  >
                    {/* Book Image */}
                    <div className="relative overflow-hidden h-64">
                      <img
                        src={getBookImage(book)}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      {/* Badge */}
                      {book.is_featured && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                          Featured
                        </div>
                      )}
                      {book.is_bestseller && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          Bestseller
                        </div>
                      )}
                      {book.is_new_release && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          New
                        </div>
                      )}
                    </div>

                    {/* Book Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                        {book.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-1">
                        {book.author_name || 'Unknown Author'}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`ri-star-${i < Math.floor(book.rating || 4) ? 'fill' : 'line'} text-yellow-400 text-sm`}
                            ></i>
                          ))}
                          <span className="text-xs text-gray-500 ml-1">
                            ({book.review_count || 0})
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-blue-600 font-bold text-xl">
                            ₦{(book.price || 9.99).toLocaleString('en-NG')}
                          </span>
                          {book.original_price && book.original_price > book.price && (
                            <span className="text-gray-400 text-sm line-through ml-2">
                              ₦{book.original_price.toLocaleString('en-NG')}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {book.format || 'eBook'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Link
                          to={`/books/${book.id}`}
                          className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-lg font-semibold text-center hover:bg-gray-200 transition-all text-sm"
                        >
                          View
                        </Link>
                        <button
                          onClick={(e) => handleAddToCart(book, e)}
                          className={`flex-1 py-2 rounded-lg font-semibold transition-all text-white text-sm ${addedToCart.has(book.id)
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                          {addedToCart.has(book.id) ? (
                            <>
                              <i className="ri-check-line"></i> Added
                            </>
                          ) : (
                            <>
                              <i className="ri-shopping-cart-line"></i> Add
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Auto-scroll indicator */}
              <div className="flex justify-center mt-4 gap-3 items-center">
                <button
                  onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <i className={`ri-${isAutoScrolling ? 'pause' : 'play'}-circle-line text-sm`}></i>
                  {isAutoScrolling ? 'Auto-scroll' : 'Paused'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* View All Button */}
        {books.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/books"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span>View All Books</span>
              <i className="ri-arrow-right-line"></i>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}

// Add scrollbar hide styles
const styles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
