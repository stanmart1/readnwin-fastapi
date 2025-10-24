import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export default function EReader({ bookId, onClose }) {
  const [book, setBook] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState('light');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadBook();
  }, [bookId]);

  const loadBook = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch book details
      const bookResponse = await api.get(`/user/library`);
      const libraryItem = bookResponse.data.libraryItems.find(item => item.book_id === parseInt(bookId));
      
      if (!libraryItem) {
        throw new Error('Book not found in your library');
      }

      setBook(libraryItem.book);
      setProgress(libraryItem.progress || 0);

      // Fetch book content
      const contentResponse = await api.get(`/ereader/book/${bookId}/content`);
      setContent(contentResponse.data.content || contentResponse.data.html_content || '');
      
    } catch (err) {
      console.error('Error loading book:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = useCallback(async (newProgress) => {
    try {
      await api.post(`/reading/progress`, {
        book_id: parseInt(bookId),
        progress: newProgress
      });
      setProgress(newProgress);
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  }, [bookId]);

  const handleScroll = useCallback((e) => {
    const element = e.target;
    const scrollPercentage = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
    const newProgress = Math.min(100, Math.max(0, scrollPercentage)) / 100;
    
    if (Math.abs(newProgress - progress) > 0.05) {
      updateProgress(newProgress);
    }
  }, [progress, updateProgress]);

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-900 text-gray-100';
      case 'sepia':
        return 'bg-amber-50 text-amber-900';
      default:
        return 'bg-white text-gray-900';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg font-medium">Loading book...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-line text-2xl text-red-600"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Book</h3>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                Close
              </button>
              <button onClick={loadBook} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className={`fixed inset-0 z-50 ${getThemeClasses()} transition-colors duration-200`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <i className="ri-close-line text-xl"></i>
          </button>
          <div>
            <h1 className="font-semibold text-lg">{book.title}</h1>
            <p className="text-sm opacity-70">by {book.author_name || book.author}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Font Size */}
          <div className="flex items-center space-x-1 border border-gray-300 dark:border-gray-600 rounded-lg px-2">
            <button 
              onClick={() => setFontSize(Math.max(12, fontSize - 2))} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              <i className="ri-font-size-2 text-lg"></i>
            </button>
            <span className="text-sm px-2 min-w-[3rem] text-center">{fontSize}px</span>
            <button 
              onClick={() => setFontSize(Math.min(32, fontSize + 2))} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              <i className="ri-font-size text-lg"></i>
            </button>
          </div>

          {/* Theme Selector */}
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)} 
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="sepia">Sepia</option>
          </select>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div 
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Content */}
      <div 
        className="h-[calc(100vh-5rem)] overflow-y-auto px-4 sm:px-8 md:px-16 lg:px-32 py-8"
        onScroll={handleScroll}
      >
        <div 
          className="max-w-4xl mx-auto prose prose-lg dark:prose-invert"
          style={{ fontSize: `${fontSize}px` }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}
