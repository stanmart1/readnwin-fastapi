'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import BookCard from '@/components/BookCard';

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
  pages?: number;
  publication_date?: string;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_release: boolean;
  status: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load books and categories on component mount
  useEffect(() => {
    loadBooks();
    loadCategories();
  }, [page, selectedGenre, selectedFormat, selectedPriceRange, selectedRating, sortBy, searchQuery]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });

      if (selectedGenre !== 'all') {
        // Find category ID by name
        const category = categories.find(cat => cat.name.toLowerCase() === selectedGenre.toLowerCase());
        if (category) {
          params.append('category_id', category.id.toString());
        }
      }

      if (selectedFormat !== 'all') {
        params.append('format', selectedFormat);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (selectedPriceRange !== 'all') {
        switch (selectedPriceRange) {
          case 'under-10':
            params.append('max_price', '10');
            break;
          case '10-20':
            params.append('min_price', '10');
            params.append('max_price', '20');
            break;
          case '20-30':
            params.append('min_price', '20');
            params.append('max_price', '30');
            break;
          case 'over-30':
            params.append('min_price', '30');
            break;
        }
      }

      if (selectedRating !== 'all') {
        const minRating = selectedRating === '4-plus' ? '4' : selectedRating === '3-plus' ? '3' : '2';
        params.append('min_rating', minRating);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books/?${params}`);
      
      if (response.ok) {
        const apiResponse = await response.json();
        const books = apiResponse.books || apiResponse;
        if (page === 1) {
          setBooks(books);
        } else {
          setBooks(prev => [...prev, ...books]);
        }
        setHasMore(books.length === 12); // If we got 12 books, there might be more
      }
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books/categories/`);
      if (response.ok) {
        const categories = await response.json();
        setCategories(categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleFilterChange = () => {
    setPage(1);
    setBooks([]);
  };

  const formats = ['all', 'ebook', 'physical', 'audiobook'];
  const priceRanges = ['all', 'under-10', '10-20', '20-30', 'over-30'];
  const ratings = ['all', '4-plus', '3-plus', '2-plus'];
  const sortOptions = ['featured', 'price-low', 'price-high', 'rating', 'newest', 'bestsellers'];

  const filteredBooks = books.filter(book => {
    // Filter by rating if needed
    if (selectedRating !== 'all') {
      const minRating = selectedRating === '4-plus' ? 4 : selectedRating === '3-plus' ? 3 : 2;
      if (!book.rating || book.rating < minRating) return false;
    }

    return true;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'newest':
        return new Date(b.publication_date || '').getTime() - new Date(a.publication_date || '').getTime();
      case 'bestsellers':
        return (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0);
      default:
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Discover Your Next Great Read</h1>
          <p className="text-xl text-gray-600">Explore thousands of books across all genres and formats</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-search-line text-gray-400"></i>
                </div>
                <input
                  type="text"
                  placeholder="Search books, authors, or keywords..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Genre Filter */}
            <div>
              <select
                value={selectedGenre}
                onChange={(e) => {
                  setSelectedGenre(e.target.value);
                  handleFilterChange();
                }}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Genres</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Format Filter */}
            <div>
              <select
                value={selectedFormat}
                onChange={(e) => {
                  setSelectedFormat(e.target.value);
                  handleFilterChange();
                }}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {formats.map(format => (
                  <option key={format} value={format}>
                    {format === 'all' ? 'All Formats' : format.charAt(0).toUpperCase() + format.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select
                value={selectedPriceRange}
                onChange={(e) => {
                  setSelectedPriceRange(e.target.value);
                  handleFilterChange();
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {priceRanges.map(range => (
                  <option key={range} value={range}>
                    {range === 'all' ? 'Any Price' : 
                             range === 'under-10' ? 'Under ₦1,000' :
        range === '10-20' ? '₦1,000 - ₦2,000' :
        range === '20-30' ? '₦2,000 - ₦3,000' : 'Over ₦3,000'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <select
                value={selectedRating}
                onChange={(e) => {
                  setSelectedRating(e.target.value);
                  handleFilterChange();
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {ratings.map(rating => (
                  <option key={rating} value={rating}>
                    {rating === 'all' ? 'Any Rating' : 
                     rating === '4-plus' ? '4+ Stars' :
                     rating === '3-plus' ? '3+ Stars' : '2+ Stars'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  handleFilterChange();
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option} value={option}>
                    {option === 'featured' ? 'Featured' :
                     option === 'price-low' ? 'Price: Low to High' :
                     option === 'price-high' ? 'Price: High to Low' :
                     option === 'rating' ? 'Highest Rated' :
                     option === 'newest' ? 'Newest First' : 'Bestsellers'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg border transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <i className="ri-grid-line"></i>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg border transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <i className="ri-list-check"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{sortedBooks.length}</span> books
            {loading && <span className="ml-2">Loading...</span>}
          </p>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Quick Filters:</span>
            <button
              onClick={() => {
                setSelectedGenre('all');
                setSelectedFormat('all');
                setSelectedPriceRange('all');
                setSelectedRating('all');
                setSearchQuery('');
                setPage(1);
                handleFilterChange();
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Books Grid */}
        {loading && page === 1 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : sortedBooks.length > 0 ? (
          <div className={`grid gap-8 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {sortedBooks.map((book) => (
              <BookCard
                key={book.id}
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
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-book-line text-4xl text-gray-400"></i>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No books found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
            <button
              onClick={() => {
                setSelectedGenre('all');
                setSelectedFormat('all');
                setSelectedPriceRange('all');
                setSelectedRating('all');
                setSearchQuery('');
                setPage(1);
                handleFilterChange();
              }}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Load More Button */}
        {sortedBooks.length > 0 && hasMore && (
          <div className="text-center mt-12">
            <button 
              onClick={handleLoadMore}
              disabled={loading}
              className="btn-primary text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Load More Books'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 