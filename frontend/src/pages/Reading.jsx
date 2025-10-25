import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EpubReader from '../components/EpubReader';
import EReader from '../components/EReader';
import api from '../lib/api';

export default function Reading() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [bookFormat, setBookFormat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    detectBookFormat();
  }, [bookId]);

  const detectBookFormat = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch book details from library
      const response = await api.get('/user/library');
      const libraryItem = response.data.libraryItems.find(
        item => item.book_id === parseInt(bookId)
      );

      if (!libraryItem) {
        setError('Book not found in your library');
        return;
      }

      const book = libraryItem.book;
      
      // Detect format from file_path or format field
      let format = 'html'; // default
      
      if (book.format) {
        format = book.format.toLowerCase();
      } else if (book.file_path) {
        const extension = book.file_path.split('.').pop().toLowerCase();
        if (extension === 'epub') {
          format = 'epub';
        } else if (extension === 'html' || extension === 'htm') {
          format = 'html';
        }
      }

      setBookFormat(format);
    } catch (err) {
      console.error('Error detecting book format:', err);
      setError(err.message || 'Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/dashboard/library');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading book...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md mx-4">
          <div className="text-center">
            <i className="ri-error-warning-line text-5xl text-red-500 mb-4"></i>
            <h3 className="text-xl font-bold mb-2">Error Loading Book</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Library
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Route to appropriate reader based on format
  if (bookFormat === 'epub') {
    return <EpubReader bookId={bookId} onClose={handleClose} />;
  } else {
    return <EReader bookId={bookId} onClose={handleClose} />;
  }
}
