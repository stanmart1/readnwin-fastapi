import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { BookCardSkeleton } from '../../components/SkeletonLoader';

export default function Library() {
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const books = [
    { 
      id: 1, 
      title: 'The Great Gatsby', 
      author: 'F. Scott Fitzgerald', 
      status: 'reading', 
      progress: 75,
      format: 'ebook',
      readingTime: 450 // minutes
    },
    { 
      id: 2, 
      title: '1984', 
      author: 'George Orwell', 
      status: 'reading', 
      progress: 45,
      format: 'physical',
      readingTime: 320
    },
    { 
      id: 3, 
      title: 'To Kill a Mockingbird', 
      author: 'Harper Lee', 
      status: 'completed', 
      progress: 100,
      format: 'ebook',
      readingTime: 680
    },
    { 
      id: 4, 
      title: 'Pride and Prejudice', 
      author: 'Jane Austen', 
      status: 'completed', 
      progress: 100,
      format: 'hybrid',
      readingTime: 720
    },
    { 
      id: 5, 
      title: 'The Catcher in the Rye', 
      author: 'J.D. Salinger', 
      status: 'not-started', 
      progress: 0,
      format: 'physical',
      readingTime: 0
    }
  ];

  const filteredBooks = filter === 'all' ? books : books.filter(b => b.status === filter);

  const getFormatBadge = (format) => {
    const badges = {
      ebook: { label: 'E-Book', color: 'bg-blue-100 text-blue-800' },
      physical: { label: 'Physical', color: 'bg-green-100 text-green-800' },
      hybrid: { label: 'Hybrid', color: 'bg-purple-100 text-purple-800' }
    };
    return badges[format] || badges.ebook;
  };

  const formatReadingTime = (minutes) => {
    if (minutes === 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Library</h1>
            <p className="text-gray-600">{books.length} books in your collection</p>
          </div>
          <Link
            to="/books"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg"
          >
            <i className="ri-add-line mr-2"></i>
            Add Books
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          {[
            { label: 'All Books', value: 'all' },
            { label: 'Reading', value: 'reading' },
            { label: 'Completed', value: 'completed' },
            { label: 'Not Started', value: 'not-started' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === tab.value
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="h-48 bg-gradient-to-br from-blue-600 to-purple-600 relative">
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getFormatBadge(book.format).color}`}>
                      {getFormatBadge(book.format).label}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{book.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{book.author}</p>
                  
                  {/* Reading Time */}
                  {book.readingTime > 0 && (
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                      <i className="ri-time-line"></i>
                      <span>{formatReadingTime(book.readingTime)} read</span>
                    </div>
                  )}
                  
                  {book.status !== 'not-started' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold">{book.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                          style={{ width: `${book.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg text-sm font-semibold hover:shadow-md">
                      {book.status === 'not-started' ? 'Start Reading' : 'Continue'}
                    </button>
                    <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <i className="ri-more-line"></i>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {filteredBooks.length === 0 && !loading && (
          <div className="text-center py-20">
            <i className="ri-book-line text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No books found</h3>
            <p className="text-gray-500 mb-6">Start building your library today</p>
            <Link
              to="/books"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Browse Books
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
