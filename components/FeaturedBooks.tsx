
'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import BookCard from './BookCard';
import { constructImageUrl } from '@/lib/imageUtils';

interface Book {
  id: number;
  title: string;
  subtitle?: string;
  author_name: string;
  category_name: string;
  price: number;
  original_price?: number;
  rating?: number;
  review_count?: number;
  cover_image_url: string;
  format: string;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_release: boolean;
  status: string;
}

export default function FeaturedBooks() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState('featured');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);



  const categories = [
    { id: 'featured', name: 'Featured Books', icon: 'ri-star-line' },
    { id: 'bestsellers', name: 'Bestsellers', icon: 'ri-fire-line' },
    { id: 'new', name: 'New Releases', icon: 'ri-flashlight-line' }
  ];

  useEffect(() => {
    loadBooks();
  }, [selectedCategory]);

  // Auto-scroll carousel every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying || books.length === 0) return;

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
  }, [isAutoPlaying, books.length]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: '1',
        limit: '12' // Load more books for carousel
      });

      if (selectedCategory === 'featured') {
        params.append('is_featured', 'true');
      } else if (selectedCategory === 'bestsellers') {
        params.append('is_bestseller', 'true');
      } else if (selectedCategory === 'new') {
        params.append('is_new_release', 'true');
      }

      // Fetch books from API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books/?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const apiResponse = await response.json();
      const apiBooks = apiResponse.books || apiResponse;
      
      // Transform API response to match component interface
      const transformedBooks = apiBooks.map((book: any) => ({
        id: book.id,
        title: book.title,
        author_name: book.author_name || book.author,
        category_name: book.category_name || book.category?.name || 'Uncategorised',
        price: parseFloat(book.price),
        original_price: book.original_price ? parseFloat(book.original_price) : undefined,
        rating: book.rating || 0,
        review_count: book.review_count || 0,
        cover_image_url: book.cover_image_url || book.cover_image || book.cover || '',
        format: book.format || 'ebook',
        is_featured: book.is_featured,
        is_bestseller: book.is_bestseller || false,
        is_new_release: book.is_new_release || false,
        status: book.status || 'published'
      }));
      setBooks(transformedBooks);
    } catch (error) {
      console.error('Error loading featured books:', error);
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Network error: Unable to connect to server');
      } else if (error instanceof Error) {
        setError(`Error loading books: ${error.message}`);
      } else {
        setError('Unable to load books. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const scrollToNext = () => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.offsetWidth * 0.8; // Scroll 80% of container width
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollToPrev = () => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.offsetWidth * 0.8;
      carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6">Featured Books</h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Discover our carefully curated selection of must-read books across all genres
          </p>
        </div>
        
        {/* Category Tabs */}
        <div className="flex justify-center mb-8 md:mb-12">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl max-w-full overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`flex items-center space-x-2 px-3 md:px-6 py-2 md:py-3 rounded-2xl font-medium transition-all duration-300 cursor-pointer whitespace-nowrap text-sm md:text-base ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                }`}
              >
                <i className={`${category.icon} text-base md:text-lg`}></i>
                <span className="hidden sm:inline">{category.name}</span>
                <span className="sm:hidden">{category.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
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
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 md:-translate-x-4 z-10 bg-white rounded-full p-2 md:p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300"
            aria-label="Previous books"
          >
            <i className="ri-arrow-left-s-line text-xl md:text-2xl text-gray-700"></i>
          </button>
          
          <button
            onClick={scrollToNext}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2 md:translate-x-4 z-10 bg-white rounded-full p-2 md:p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300"
            aria-label="Next books"
          >
            <i className="ri-arrow-right-s-line text-xl md:text-2xl text-gray-700"></i>
          </button>
          
          {/* Books Carousel */}
          {loading ? (
            <div className="flex space-x-0 sm:space-x-4 md:space-x-6 overflow-x-auto scrollbar-hide pb-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-full sm:w-72 md:w-80">
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse min-h-[480px]">
                    <div className="w-full h-64 bg-gray-200"></div>
                    <div className="p-6 flex flex-col h-[216px]">
                      <div className="h-6 bg-gray-200 rounded mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
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
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Unable to load books</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadBooks}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-all duration-300"
              >
                <i className="ri-refresh-line"></i>
                <span>Try Again</span>
              </button>
            </div>
          ) : books.length > 0 ? (
            <div 
              ref={carouselRef}
              className="flex space-x-0 sm:space-x-4 md:space-x-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {books.map((book: Book) => (
                <div key={book.id} className="flex-shrink-0 w-full sm:w-72 md:w-80">
                  <BookCard
                    id={book.id.toString()}
                    title={book.title}
                    author_name={book.author_name}
                    price={book.price}
                    original_price={book.original_price}
                    rating={book.rating || 0}
                    reviewCount={book.review_count || 0}
                    cover_image_url={book.cover_image_url}
                    isAvailable={book.status === 'published'}
                    genre={book.category_name}
                    format={book.format as 'ebook' | 'physical' | 'both'}
                    category_name={book.category_name}
                    is_featured={book.is_featured}
                    is_bestseller={book.is_bestseller}
                    is_new_release={book.is_new_release}
                    status={book.status as 'draft' | 'published' | 'archived' | 'out_of_stock'}
                    hideReadButton={true}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-book-line text-4xl text-gray-400"></i>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No books found</h3>
              <p className="text-gray-600">Try selecting a different category</p>
            </div>
          )}
        </div>
        
        <div className="text-center mt-12">
          <Link
            href="/books"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 cursor-pointer whitespace-nowrap"
          >
            <span>Browse All Books</span>
            <i className="ri-arrow-right-line"></i>
          </Link>
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
