import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const AssignBooksModal = ({ isOpen, onClose, user, onSubmit }) => {
  const [books, setBooks] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBooks();
    }
  }, [isOpen]);

  const fetchBooks = async () => {
    try {
      const response = await api.get('/api/admin/books');
      if (response.data?.success) {
        setBooks(response.data.books || []);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const handleAssign = async () => {
    setLoading(true);
    await onSubmit(user.id, selectedBooks);
    setLoading(false);
    setSelectedBooks([]);
  };

  const filteredBooks = books.filter(book =>
    book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Assigning books to: <span className="font-semibold">{user.first_name} {user.last_name}</span>
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

        {/* Selected Count */}
        {selectedBooks.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              {selectedBooks.length} book(s) selected
            </p>
          </div>
        )}

        {/* Books List */}
        <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedBooks.includes(book.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => {
                if (selectedBooks.includes(book.id)) {
                  setSelectedBooks(selectedBooks.filter(id => id !== book.id));
                } else {
                  setSelectedBooks([...selectedBooks, book.id]);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{book.title}</p>
                  <p className="text-sm text-gray-500">{book.author}</p>
                </div>
                <div className="ml-4">
                  {selectedBooks.includes(book.id) && (
                    <i className="ri-checkbox-circle-fill text-blue-600 text-xl"></i>
                  )}
                </div>
              </div>
            </div>
          ))}
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
            disabled={loading || selectedBooks.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Assigning...' : `Assign ${selectedBooks.length} Book(s)`}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AssignBooksModal;
