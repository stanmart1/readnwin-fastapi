import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import ReviewForm from '../../components/ReviewForm';
import { useLibrary } from '../../hooks';
import { getImageUrl } from '../../lib/fileService';

export default function Library() {
  const [filter, setFilter] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const { books, loading, refetch } = useLibrary();

  const { filteredBooks, counts } = useMemo(() => {
    const readingBooks = books.filter(b => b.progress > 0 && b.progress < 100);
    const completedBooks = books.filter(b => b.progress >= 100);
    
    const filtered = (() => {
      switch (filter) {
        case 'reading':
          return readingBooks;
        case 'completed':
          return completedBooks;
        default:
          return books;
      }
    })();

    return {
      filteredBooks: filtered,
      counts: {
        all: books.length,
        reading: readingBooks.length,
        completed: completedBooks.length
      }
    };
  }, [books, filter]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse w-72">
                <div className="aspect-[3/4] bg-gray-200 rounded-2xl mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Library</h1>
            <p className="text-gray-600">{books.length} books in your collection</p>
          </div>
          <Link
            to="/books"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all transform hover:scale-105"
          >
            <i className="ri-add-line mr-2"></i>
            Explore Books
          </Link>
        </div>

        {/* Filter Tabs */}
        {books.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'all', label: 'All Books', icon: 'ri-book-line', count: counts.all },
                { key: 'reading', label: 'Reading', icon: 'ri-play-line', count: counts.reading },
                { key: 'completed', label: 'Completed', icon: 'ri-check-line', count: counts.completed }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`inline-flex items-center px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
                    filter === tab.key
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/25'
                      : 'bg-gray-50 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 hover:shadow-md'
                  }`}
                >
                  <i className={`${tab.icon} mr-2 text-base`}></i>
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                      filter === tab.key ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredBooks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 text-center py-20">
            <div className="w-28 h-28 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
              <i className="ri-book-line text-4xl text-blue-600"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {books.length === 0 ? 'Your Library Awaits' : `No ${filter} Books Found`}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              {books.length === 0 
                ? 'Discover amazing books and start your reading journey today' 
                : `You don't have any ${filter} books at the moment`}
            </p>
            {books.length === 0 && (
              <Link 
                to="/books"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-2xl hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <i className="ri-search-line mr-2 text-lg"></i>
                Explore Books
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-6">
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2 w-full sm:w-72 md:w-80 flex-shrink-0"
              >
                {/* Cover Image */}
                <div className="aspect-[3/5] relative overflow-hidden">
                  <img
                    src={getImageUrl(book.cover_image_url)}
                    alt={book.title || book.book?.title || 'Book cover'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Format Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm shadow-lg ${
                      book.format === 'ebook' 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                        : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                    }`}>
                      {book.format === 'ebook' ? 'Digital' : 'Physical'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {book.progress > 0 && book.format === 'ebook' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-white/20 rounded-full h-1.5">
                          <div 
                            className="bg-white h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${book.progress * 100}%` }}
                          />
                        </div>
                        <span className="text-white text-xs font-medium">{Math.round(book.progress * 100)}%</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-3 flex flex-col">
                  {/* Title - More Prominent */}
                  <h3 className="font-bold text-gray-900 text-base mb-1.5 line-clamp-2 group-hover:text-blue-700 transition-colors leading-snug">
                    {book.title || book.book?.title}
                  </h3>
                  {/* Author */}
                  <p className="text-gray-600 text-xs mb-3 line-clamp-1">
                    <span className="font-semibold">Author:</span> {book.author || book.book?.author_name || book.book?.author}
                  </p>
                  
                  {/* Reading Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    {(book.format || book.book?.format) === 'ebook' && (
                      <span>{Math.round((book.progress || 0) * 100)}%</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {(book.format || book.book?.format) === 'ebook' ? (
                      <Link
                        to={`/reading/${book.book_id}`}
                        className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        <i className={`${book.progress > 0 ? 'ri-play-line' : 'ri-book-open-line'} mr-2 text-base`}></i>
                        {book.progress > 0 ? 'Continue Reading' : 'Start Reading'}
                      </Link>
                    ) : (
                      <div className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-sm font-semibold rounded-xl shadow-lg">
                        <i className="ri-book-line mr-2 text-base"></i>
                        Physical Book
                      </div>
                    )}
                    
                    <button
                      onClick={() => {
                        setSelectedBook(book);
                        setShowReviewModal(true);
                      }}
                      className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <i className="ri-star-line mr-2 text-base"></i>
                      Add Review
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && selectedBook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <ReviewForm
                  bookId={selectedBook.book_id}
                  bookTitle={selectedBook.book?.title}
                  onSuccess={() => {
                    setShowReviewModal(false);
                    setSelectedBook(null);
                    alert('Review submitted successfully!');
                  }}
                  onCancel={() => {
                    setShowReviewModal(false);
                    setSelectedBook(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
