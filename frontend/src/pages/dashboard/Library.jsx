import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';

export default function Library() {
  const [filter, setFilter] = useState('all');

  const books = [
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', status: 'reading', progress: 75 },
    { id: 2, title: '1984', author: 'George Orwell', status: 'reading', progress: 45 },
    { id: 3, title: 'To Kill a Mockingbird', author: 'Harper Lee', status: 'completed', progress: 100 },
    { id: 4, title: 'Pride and Prejudice', author: 'Jane Austen', status: 'completed', progress: 100 },
    { id: 5, title: 'The Catcher in the Rye', author: 'J.D. Salinger', status: 'not-started', progress: 0 }
  ];

  const filteredBooks = filter === 'all' ? books : books.filter(b => b.status === filter);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="h-48 bg-gradient-to-br from-blue-600 to-purple-600"></div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1">{book.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{book.author}</p>
                
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

        {filteredBooks.length === 0 && (
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
