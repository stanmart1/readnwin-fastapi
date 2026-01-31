import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BookCard from '../components/BookCard';
import Pagination from '../components/Pagination';
import { useBooks } from '../hooks';

export default function Books() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
      setIsSearching(false);
    }, 500);

    if (searchInput !== search) {
      setIsSearching(true);
    }

    return () => clearTimeout(timer);
  }, [searchInput, search]);

  // Reset to page 1 when search or category changes
  const handleSearchChange = useCallback((value) => {
    setSearchInput(value);
  }, []);

  const handleCategoryChange = (value) => {
    setCategory(value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    // Scroll to top of books section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
    setIsSearching(false);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const params = {
    page,
    limit: 12,
    status: 'published',
    ...(category !== 'all' && { category_id: category }),
    ...(search && { search })
  };

  const { books, pagination, loading } = useBooks(params);

  // Debug pagination
  console.log('Books component - pagination:', pagination);
  console.log('Books component - should show pagination:', pagination.pages > 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Discover Your Next Great Read
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Explore thousands of books across all genres
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <i className="ri-search-line text-gray-400 text-xl"></i>
                </div>
                <input
                  type="text"
                  placeholder="Search by title, author, ISBN, or description..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-14 pr-24 py-4 rounded-full text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-16 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                )}
                <button 
                  type="submit"
                  className="absolute right-2 top-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:scale-105"
                >
                  {isSearching ? (
                    <i className="ri-loader-4-line animate-spin"></i>
                  ) : (
                    <i className="ri-search-line"></i>
                  )}
                </button>
              </div>
              
              {/* Search suggestions/hints */}
              {searchInput && searchInput.length > 0 && (
                <div className="mt-3 text-sm text-blue-100 text-center">
                  <span>Search includes: titles, authors, descriptions, and ISBN numbers</span>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </section>

      {/* Books Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Results Header */}
          {search && (
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Search Results for "{search}"
              </h2>
              <p className="text-gray-600">
                {loading ? 'Searching...' : `Found ${pagination.total} book${pagination.total !== 1 ? 's' : ''}`}
              </p>
            </div>
          )}
          
          {loading || isSearching ? (
            <div className="flex justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">{isSearching ? 'Searching...' : 'Loading books...'}</p>
              </div>
            </div>
          ) : books.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map((book, index) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                  >
                    <BookCard book={book} />
                  </motion.div>
                ))}
              </div>
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-12">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    onPageChange={handlePageChange}
                    loading={loading}
                  />
                  <div className="text-center mt-4 text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} books
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <i className="ri-book-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                {search ? 'No books found' : 'No books available'}
              </h3>
              <p className="text-gray-500 mb-4">
                {search 
                  ? `No books match your search for "${search}". Try different keywords or check spelling.`
                  : 'Try adjusting your search or filters'
                }
              </p>
              {search && (
                <button
                  onClick={clearSearch}
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <i className="ri-refresh-line"></i>
                  <span>Clear Search</span>
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
