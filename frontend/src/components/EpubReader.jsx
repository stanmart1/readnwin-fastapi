import { useState, useEffect, useRef } from 'react';
import ePub from 'epubjs';
import api from '../lib/api';

export default function EpubReader({ bookId, onClose }) {
  console.log('EpubReader mounted with bookId:', bookId);
  
  const [book, setBook] = useState(null);
  const [rendition, setRendition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [toc, setToc] = useState([]);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [theme, setTheme] = useState('light');
  const [bookInfo, setBookInfo] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const viewerRef = useRef(null);
  const bookRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    console.log('useEffect triggered, viewerRef.current:', viewerRef.current);
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      loadBook();
    }, 100);
    
    return () => {
      clearTimeout(timer);
      if (bookRef.current) {
        bookRef.current.destroy();
      }
    };
  }, [bookId]);

  const loadBook = async () => {
    try {
      setLoading(true);
      isInitialLoadRef.current = true; // Reset for new book load
      
      // Fetch book details from library
      const libraryResponse = await api.get('/user/library');
      const libraryItem = libraryResponse.data.libraryItems.find(
        item => item.book_id === parseInt(bookId)
      );
      
      if (!libraryItem) {
        throw new Error('Book not found in your library');
      }

      console.log('Library item:', libraryItem);
      console.log('Saved location:', libraryItem.last_read_location);
      setBookInfo(libraryItem);

      // Fetch EPUB file as blob
      const response = await fetch(`${api.defaults.baseURL}/ereader/book/${bookId}/file`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch EPUB file');
      }
      
      const blob = await response.blob();
      console.log('EPUB blob loaded:', blob.size, 'bytes');
      
      // Initialize epub.js with blob
      const epubBook = ePub(blob);
      bookRef.current = epubBook;

      // Load the book
      await epubBook.ready;
      console.log('EPUB ready');
      
      // Generate locations for progress tracking
      await epubBook.locations.generate(1024);
      console.log('Locations generated:', epubBook.locations.total);

      // Get table of contents
      const navigation = await epubBook.loaded.navigation;
      setToc(navigation.toc);
      console.log('TOC loaded:', navigation.toc.length, 'chapters');

      console.log('Viewer ready, creating rendition');

      // Create rendition
      const renditionInstance = epubBook.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
        spread: 'none',
        flow: 'paginated'
      });

      console.log('Rendition created');
      setRendition(renditionInstance);

      // Load saved location or start from beginning
      const savedLocation = libraryItem.last_read_location;
      if (savedLocation) {
        await renditionInstance.display(savedLocation);
        
        // Calculate and save progress for the restored location
        const currentLoc = epubBook.locations.locationFromCfi(savedLocation);
        const totalLocs = epubBook.locations.total;
        const progress = currentLoc / totalLocs;
        console.log('Restored to:', currentLoc, '/', totalLocs, '=', (progress * 100).toFixed(2) + '%');
        
        // Save immediately to update backend (bypass throttle)
        await saveProgress(savedLocation, progress, true);
      } else {
        await renditionInstance.display();
      }

      console.log('Display started');

      // Apply theme
      applyTheme(renditionInstance, theme);

      // Track location changes
      renditionInstance.on('relocated', (location) => {
        console.log('Location changed:', location);
        setCurrentLocation(location.start.cfi);
        
        // Skip saving on initial load
        if (isInitialLoadRef.current) {
          console.log('Skipping initial load save');
          isInitialLoadRef.current = false;
          return;
        }
        
        // Calculate progress using book locations
        const currentLocation = epubBook.locations.locationFromCfi(location.start.cfi);
        const totalLocations = epubBook.locations.total;
        const progress = currentLocation / totalLocations;
        
        console.log('Progress:', currentLocation, '/', totalLocations, '=', (progress * 100).toFixed(2) + '%');
        saveProgress(location.start.cfi, progress);
      });

      setBook(epubBook);
      setLoading(false);

    } catch (err) {
      console.error('Error loading EPUB:', err);
      setError(err.message || 'Failed to load book');
      setLoading(false);
    }
  };

  const applyTheme = (renditionInstance, themeName) => {
    renditionInstance.themes.default({
      body: {
        'font-family': 'Georgia, serif !important',
        'line-height': '1.6 !important',
        'padding': '20px !important'
      }
    });

    const themes = {
      light: {
        body: { background: '#ffffff !important', color: '#000000 !important' }
      },
      sepia: {
        body: { background: '#f4ecd8 !important', color: '#5c4a2f !important' }
      },
      dark: {
        body: { background: '#1a1a1a !important', color: '#e0e0e0 !important' }
      }
    };

    renditionInstance.themes.register(themeName, themes[themeName]);
    renditionInstance.themes.select(themeName);
  };

  const saveProgress = async (cfi, percentage, immediate = false) => {
    // If immediate save (on load), don't throttle
    if (immediate) {
      try {
        const progressPercent = (percentage || 0) * 100;
        const response = await api.post(`/ereader/${bookId}/progress`, {
          progress: progressPercent,
          last_read_location: cfi
        });
        console.log('Progress saved:', progressPercent.toFixed(2) + '%', response.data);
      } catch (err) {
        console.error('Error saving progress:', err);
      }
      return;
    }
    
    // Throttle saves - only save every 3 seconds
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (isSaving) return;
      
      try {
        setIsSaving(true);
        const progressPercent = (percentage || 0) * 100;
        const response = await api.post(`/ereader/${bookId}/progress`, {
          progress: progressPercent,
          last_read_location: cfi
        });
        console.log('Progress saved:', progressPercent.toFixed(2) + '%', response.data);
      } catch (err) {
        console.error('Error saving progress:', err);
      } finally {
        setIsSaving(false);
      }
    }, 3000);
  };

  const nextPage = () => {
    if (rendition) rendition.next();
  };

  const prevPage = () => {
    if (rendition) rendition.prev();
  };

  const goToChapter = (href) => {
    if (rendition) {
      rendition.display(href);
      setShowToc(false);
    }
  };

  const changeFontSize = (delta) => {
    const newSize = Math.max(80, Math.min(150, fontSize + delta));
    setFontSize(newSize);
    if (rendition) {
      rendition.themes.fontSize(`${newSize}%`);
    }
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    if (rendition) {
      applyTheme(rendition, newTheme);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {loading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading book...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4">
            <div className="text-center">
              <i className="ri-error-warning-line text-5xl text-red-500 mb-4"></i>
              <h3 className="text-xl font-bold mb-2">Error Loading Book</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back to Library
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <i className="ri-arrow-left-line text-xl"></i>
          </button>
          <div>
            <h1 className="font-semibold text-lg">{bookInfo?.title || 'Reading'}</h1>
            <p className="text-sm text-gray-400">{bookInfo?.author || ''}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowToc(!showToc)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Table of Contents"
          >
            <i className="ri-list-unordered text-xl"></i>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Settings"
          >
            <i className="ri-settings-3-line text-xl"></i>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* EPUB Viewer */}
        <div ref={viewerRef} className="w-full h-full"></div>

        {/* Navigation Buttons */}
        <button
          onClick={prevPage}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
        >
          <i className="ri-arrow-left-s-line text-2xl"></i>
        </button>
        <button
          onClick={nextPage}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
        >
          <i className="ri-arrow-right-s-line text-2xl"></i>
        </button>
      </div>

      {/* Table of Contents Sidebar */}
      {showToc && (
        <div className="absolute top-0 left-0 bottom-0 w-80 bg-white shadow-2xl z-10 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold">Table of Contents</h2>
            <button
              onClick={() => setShowToc(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
          <div className="p-2">
            {toc.map((chapter, index) => (
              <button
                key={index}
                onClick={() => goToChapter(chapter.href)}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <p className="font-medium text-gray-900">{chapter.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 w-80 bg-white rounded-xl shadow-2xl z-10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Reading Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* Font Size */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Font Size</label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => changeFontSize(-10)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <i className="ri-subtract-line"></i>
              </button>
              <span className="flex-1 text-center font-medium">{fontSize}%</span>
              <button
                onClick={() => changeFontSize(10)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <i className="ri-add-line"></i>
              </button>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => changeTheme('light')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="w-full h-8 bg-white border border-gray-300 rounded mb-2"></div>
                <p className="text-xs font-medium">Light</p>
              </button>
              <button
                onClick={() => changeTheme('sepia')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  theme === 'sepia' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="w-full h-8 bg-amber-50 border border-amber-200 rounded mb-2"></div>
                <p className="text-xs font-medium">Sepia</p>
              </button>
              <button
                onClick={() => changeTheme('dark')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="w-full h-8 bg-gray-900 border border-gray-700 rounded mb-2"></div>
                <p className="text-xs font-medium">Dark</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
