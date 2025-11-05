import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const AssignBooksModal = ({ isOpen, onClose, user, onSubmit }) => {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('ebook');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [userLibrary, setUserLibrary] = useState([]);

  useEffect(() => {
    if (isOpen && user) {
      fetchBooks();
      fetchUserLibrary();
    }
  }, [isOpen, user]);

  const fetchBooks = async () => {
    try {
      const response = await api.get('/admin/books');
      setBooks(response.data.books || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const fetchUserLibrary = async () => {
    try {
      const response = await api.get('/admin/library-assignments', {
        params: { user_id: user.id, limit: 1000 }
      });
      setUserLibrary(response.data.assignments || []);
    } catch (error) {
      console.error('Error fetching user library:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedBook) return;
    
    setLoading(true);
    try {
      await api.post('/admin/user-library', {
        user_id: user.id,
        book_id: selectedBook,
        format: selectedFormat
      });
      alert('Book assigned successfully!');
      setSelectedBook(null);
      setSelectedFormat('ebook');
      await fetchUserLibrary();
    } catch (error) {
      alert('Failed to assign book: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const isBookAssigned = (bookId) => {
    return userLibrary.some(item => item.book_id === bookId);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Assign Books</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            Assigning book to: <span className="font-semibold">{user.first_name} {user.last_name}</span>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Current library: {userLibrary.length} book(s)
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Format Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Book Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedFormat('ebook')}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedFormat === 'ebook'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <i className="ri-smartphone-line text-xl mb-1 block"></i>
              <span className="text-sm font-medium">Ebook</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedFormat('physical')}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedFormat === 'physical'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <i className="ri-book-line text-xl mb-1 block"></i>
              <span className="text-sm font-medium">Physical</span>
            </button>
          </div>
        </div>

        {/* Books List */}
        <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
          {filteredBooks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="ri-book-line text-4xl mb-2"></i>
              <p>No books found</p>
            </div>
          ) : (
            filteredBooks.map((book) => {
              const assigned = isBookAssigned(book.id);
              return (
                <div
                  key={book.id}
                  className={`p-3 border rounded-lg transition-colors ${
                    assigned
                      ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                      : selectedBook === book.id
                      ? 'border-blue-500 bg-blue-50 cursor-pointer'
                      : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!assigned) {
                      setSelectedBook(selectedBook === book.id ? null : book.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{book.title}</p>
                        {assigned && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            Assigned
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{book.author_name}</p>
                    </div>
                    <div className="ml-4">
                      {selectedBook === book.id && !assigned && (
                        <i className="ri-checkbox-circle-fill text-blue-600 text-xl"></i>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || !selectedBook}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <i className="ri-loader-4-line animate-spin"></i>
                Assigning...
              </>
            ) : (
              <>
                <i className="ri-check-line"></i>
                Assign Book
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AssignBooksModal;
