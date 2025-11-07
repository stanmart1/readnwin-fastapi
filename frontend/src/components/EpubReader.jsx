import { useState, useEffect, useRef } from 'react';
import ePub from 'epubjs';
import api from '../lib/api';
import { getCachedEpub, cacheEpub, cacheLocations } from '../lib/epubCache';
import { queueProgressUpdate, syncQueuedUpdates, isOnline } from '../lib/offlineSync';
import EReaderTour from './EReaderTour';

export default function EpubReader({ bookId, onClose }) {
  const [book, setBook] = useState(null);
  const [rendition, setRendition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [toc, setToc] = useState([]);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(120);
  const [fontFamily, setFontFamily] = useState('Georgia');
  const [theme, setTheme] = useState('light');
  const [bookInfo, setBookInfo] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [notes, setNotes] = useState([]);
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [showHighlightColors, setShowHighlightColors] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const [showAnnotationsPanel, setShowAnnotationsPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' or 'highlights'
  const [noteContent, setNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState(null);
  const [isDeletingHighlight, setIsDeletingHighlight] = useState(null);

  // Progress tracking states
  const [progressData, setProgressData] = useState({
    currentPage: 0,
    totalPages: 0,
    percentage: 0,
    currentChapter: '',
    timeRemaining: 0
  });
  const [readingStartTime, setReadingStartTime] = useState(null);
  const [totalReadingTime, setTotalReadingTime] = useState(0);

  const viewerRef = useRef(null);
  const bookRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    let isMounted = true;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (isMounted) {
        loadBook();
      }
    }, 100);

    // Sync queued updates when online
    const handleOnline = () => {
      console.log('📡 Back online, syncing queued updates...');
      syncQueuedUpdates(api);
    };

    window.addEventListener('online', handleOnline);

    // Try to sync on mount if online
    if (isOnline()) {
      syncQueuedUpdates(api);
    }

    return () => {
      isMounted = false;
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      if (viewerRef.current) {
        viewerRef.current.removeEventListener('touchstart', handleTouchStart);
        viewerRef.current.removeEventListener('touchend', handleTouchEnd);
      }
      if (bookRef.current) {
        try {
          bookRef.current.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
        bookRef.current = null;
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [bookId]);

  const loadBook = async () => {
    // Prevent multiple loads
    if (bookRef.current) {
      return;
    }

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

      setBookInfo(libraryItem);

      // Try to get cached EPUB first
      let blob;
      let cachedData = await getCachedEpub(bookId);

      if (cachedData && cachedData.blob) {
        console.log('📖 Using cached EPUB');
        blob = cachedData.blob;
      } else {
        console.log('📥 Downloading EPUB from server');
        // Fetch EPUB file as blob
        const response = await fetch(`${api.defaults.baseURL}/ereader/book/${bookId}/file`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('EPUB fetch failed:', response.status, errorText);
          throw new Error(`Failed to fetch EPUB file: ${response.status} - ${errorText}`);
        }

        blob = await response.blob();
        console.log('EPUB blob received:', blob.size, 'bytes, type:', blob.type);

        // Cache the EPUB for next time (don't await, do in background)
        cacheEpub(bookId, blob).catch(err => {
          console.warn('Failed to cache EPUB:', err);
        });
      }

      // Initialize epub.js with blob
      const epubBook = ePub(blob);
      bookRef.current = epubBook;

      // Load the book
      await epubBook.ready;

      // Check if we have cached locations
      if (cachedData && cachedData.locations) {
        console.log('📍 Using cached locations');
        try {
          epubBook.locations.load(cachedData.locations);
        } catch (err) {
          console.warn('Failed to load cached locations, regenerating:', err);
          await epubBook.locations.generate(1024);
          // Cache the new locations
          cacheLocations(bookId, epubBook.locations.save()).catch(err => {
            console.warn('Failed to cache locations:', err);
          });
        }
      } else {
        console.log('🔄 Generating locations...');
        // Generate locations for progress tracking
        await epubBook.locations.generate(1024);

        // Cache the locations (don't await, do in background)
        cacheLocations(bookId, epubBook.locations.save()).catch(err => {
          console.warn('Failed to cache locations:', err);
        });
      }

      // Get table of contents
      const navigation = await epubBook.loaded.navigation;
      setToc(navigation.toc);

      // Create rendition with single-page view
      const renditionInstance = epubBook.renderTo(viewerRef.current, {
        width: '100%',
        height: '100%',
        spread: 'none',
        flow: 'paginated'
      });

      setRendition(renditionInstance);

      // Apply theme BEFORE displaying content to prevent re-render position shift
      applyTheme(renditionInstance, theme);

      // Load saved location or start from beginning
      const savedLocation = libraryItem.last_read_location;
      if (savedLocation) {
        // Display the saved location
        await renditionInstance.display(savedLocation);

        // Calculate and save progress for the restored location
        const currentLoc = epubBook.locations.locationFromCfi(savedLocation);
        const totalLocs = epubBook.locations.total;
        const progress = currentLoc / totalLocs;

        // Save immediately to update backend (bypass throttle)
        await saveProgress(savedLocation, progress, true);
      } else {
        await renditionInstance.display();
      }

      // Track location changes
      renditionInstance.on('relocated', (location) => {
        setCurrentLocation(location.start.cfi);

        // Calculate progress data
        updateProgressData(epubBook, location);

        // Skip saving on initial load
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          return;
        }

        // Calculate progress using book locations
        const currentLocation = epubBook.locations.locationFromCfi(location.start.cfi);
        const totalLocations = epubBook.locations.total;
        const progress = currentLocation / totalLocations;

        saveProgress(location.start.cfi, progress);
      });

      // Handle text selection for highlights and notes
      renditionInstance.on('selected', (cfiRange, contents) => {
        const selection = contents.window.getSelection();
        const text = selection.toString().trim();

        if (text && text.length > 0) {
          setSelectedText({
            text,
            cfiRange,
            contents
          });
          setShowSelectionMenu(true);
          setShowHighlightColors(false);
          setShowNoteInput(false);
        }
      });

      // Load existing highlights and notes
      loadHighlights();
      loadNotes();

      setBook(epubBook);
      setLoading(false);

      // Check if user has completed tour
      const tourCompleted = localStorage.getItem('ereader_tour_completed');
      if (!tourCompleted) {
        setTimeout(() => setShowTour(true), 1000);
      }

      // Add touch event listeners for swipe gestures on the viewer container
      if (viewerRef.current) {
        viewerRef.current.addEventListener('touchstart', handleTouchStart, { passive: true });
        viewerRef.current.addEventListener('touchend', handleTouchEnd, { passive: true });
      }

    } catch (err) {
      console.error('Error loading EPUB:', err);
      console.error('Error stack:', err.stack);
      setError(err.message || 'Failed to load EPUB file');
      setLoading(false);
    }
  };

  const applyTheme = (renditionInstance, themeName, font = fontFamily) => {
    const themes = {
      light: {
        'background': '#ffffff',
        'color': '#000000'
      },
      sepia: {
        'background': '#f4ecd8',
        'color': '#75603fff'
      },
      dark: {
        'background': '#1a1a1a',
        'color': '#e0e0e0'
      }
    };

    const selectedTheme = themes[themeName];

    // Override body styles
    renditionInstance.themes.override('color', selectedTheme.color, true);
    renditionInstance.themes.override('background', selectedTheme.background, true);
    renditionInstance.themes.override('font-family', `${font}, serif`, true);
    renditionInstance.themes.override('line-height', '1.6', true);
    renditionInstance.themes.override('padding', '20px', true);
  };

  const saveProgress = async (cfi, percentage, immediate = false) => {
    const progressData = {
      progress: (percentage || 0) * 100,
      last_read_location: cfi
    };

    // If immediate save (on load), don't throttle
    if (immediate) {
      try {
        if (isOnline()) {
          await api.post(`/ereader/${bookId}/progress`, progressData);
        } else {
          queueProgressUpdate(bookId, progressData);
        }
      } catch (err) {
        console.error('Error saving progress:', err);
        queueProgressUpdate(bookId, progressData);
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
        if (isOnline()) {
          await api.post(`/ereader/${bookId}/progress`, progressData);
        } else {
          queueProgressUpdate(bookId, progressData);
        }
      } catch (err) {
        console.error('Error saving progress:', err);
        queueProgressUpdate(bookId, progressData);
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

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next page
        nextPage();
      } else {
        // Swipe right - previous page
        prevPage();
      }
    }
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
      const currentCfi = rendition.currentLocation()?.start?.cfi;
      applyTheme(rendition, newTheme, fontFamily);
      // Refresh the current page to apply theme properly
      if (currentCfi) {
        rendition.display(currentCfi);
      }
    }
  };

  const changeFontFamily = (newFont) => {
    setFontFamily(newFont);
    if (rendition) {
      const currentCfi = rendition.currentLocation()?.start?.cfi;
      applyTheme(rendition, theme, newFont);
      // Refresh the current page to apply font properly
      if (currentCfi) {
        rendition.display(currentCfi);
      }
    }
  };

  const updateProgressData = (epubBook, location) => {
    if (!epubBook || !epubBook.locations || !location) return;

    try {
      // Get current location
      const currentLoc = epubBook.locations.locationFromCfi(location.start.cfi);
      const totalLocs = epubBook.locations.total;

      // Calculate percentage
      const percentage = Math.round((currentLoc / totalLocs) * 100);

      // Get current chapter from TOC
      const currentChapter = getCurrentChapter(location.start.href);

      // Calculate pages (estimate based on locations)
      const currentPage = currentLoc;
      const totalPages = totalLocs;

      // Calculate time remaining
      const pagesRemaining = totalPages - currentPage;
      const timeRemaining = calculateTimeRemaining(pagesRemaining);

      setProgressData({
        currentPage,
        totalPages,
        percentage,
        currentChapter,
        timeRemaining
      });
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  const getCurrentChapter = (href) => {
    if (!toc || toc.length === 0) return '';

    // Find the current chapter from TOC
    for (let i = 0; i < toc.length; i++) {
      if (href.includes(toc[i].href)) {
        return toc[i].label;
      }
    }
    return toc[0]?.label || '';
  };

  const calculateTimeRemaining = (pagesRemaining) => {
    // Calculate average reading speed
    // Assume 250 words per page, 200-250 words per minute average reading speed
    const wordsPerPage = 250;
    const wordsPerMinute = 225; // Average reading speed

    const wordsRemaining = pagesRemaining * wordsPerPage;
    const minutesRemaining = Math.ceil(wordsRemaining / wordsPerMinute);

    return minutesRemaining;
  };

  const formatTimeRemaining = (minutes) => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 1) return mins > 0 ? `1 hr ${mins} min` : '1 hr';
    return mins > 0 ? `${hours} hrs ${mins} min` : `${hours} hrs`;
  };

  // Track reading time
  useEffect(() => {
    if (!loading && !error) {
      setReadingStartTime(Date.now());

      const interval = setInterval(() => {
        setTotalReadingTime(prev => prev + 1);
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [loading, error]);

  const formatReadingTime = (minutes) => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 1) return mins > 0 ? `1h ${mins}m` : '1h';
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const loadHighlights = async () => {
    try {
      const response = await api.get(`/ereader/${bookId}/highlights`);
      setHighlights(response.data.highlights || []);
    } catch (err) {
      console.error('Error loading highlights:', err);
    }
  };

  const loadNotes = async () => {
    try {
      const response = await api.get(`/ereader/${bookId}/notes`);
      setNotes(response.data.notes || []);
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  };

  const createHighlight = async (color) => {
    if (!selectedText) return;

    try {
      const response = await api.post(`/ereader/${bookId}/highlights`, {
        book_id: parseInt(bookId),
        text: selectedText.text,
        color: color,
        start_offset: 0,
        end_offset: selectedText.text.length,
        context: selectedText.text
      });

      // Add visual highlight to rendition
      if (rendition) {
        rendition.annotations.highlight(
          selectedText.cfiRange,
          {},
          (e) => {
            console.log('Highlight clicked', e);
          },
          `highlight-${color}`,
          {
            fill: color,
            'fill-opacity': '0.3',
            'mix-blend-mode': 'multiply'
          }
        );
      }

      setHighlights([...highlights, response.data.highlight]);
      setShowSelectionMenu(false);
      setShowHighlightColors(false);
      setSelectedText(null);
    } catch (err) {
      console.error('Error creating highlight:', err);
      alert('Failed to create highlight');
    }
  };

  const deleteHighlight = async (highlightId) => {
    try {
      setIsDeletingHighlight(highlightId);
      await api.delete(`/ereader/${bookId}/highlights/${highlightId}`);
      setHighlights(highlights.filter(h => h.id !== highlightId));
    } catch (err) {
      console.error('Error deleting highlight:', err);
      alert('Failed to delete highlight');
    } finally {
      setIsDeletingHighlight(null);
    }
  };

  const createNote = async (content = noteContent) => {
    if (!content.trim()) return;

    try {
      setIsSavingNote(true);
      const response = await api.post(`/ereader/${bookId}/notes`, {
        book_id: parseInt(bookId),
        content: content,
        highlight_id: null,
        position: 0
      });

      setNotes([...notes, response.data.note]);
      setNoteContent('');
      setShowNoteInput(false);
      setShowSelectionMenu(false);
      setSelectedText(null);
    } catch (err) {
      console.error('Error creating note:', err);
      alert('Failed to create note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const updateNote = async (noteId, content) => {
    try {
      await api.put(`/ereader/${bookId}/notes/${noteId}`, null, {
        params: { content }
      });
      setNotes(notes.map(n => n.id === noteId ? { ...n, content } : n));
      setEditingNote(null);
      alert('Note updated successfully!');
    } catch (err) {
      console.error('Error updating note:', err);
      alert('Failed to update note');
    }
  };

  const deleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return;

    try {
      setIsDeletingNote(noteId);
      await api.delete(`/ereader/${bookId}/notes/${noteId}`);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note');
    } finally {
      setIsDeletingNote(null);
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
              <h3 className="text-xl font-bold mb-2">Unable to Load Book</h3>
              <p className="text-gray-600 mb-2">{error}</p>
              {error.includes('400') && (
                <p className="text-sm text-gray-500 mb-6">This book may not be in EPUB format or the file is missing.</p>
              )}
              {error.includes('404') && (
                <p className="text-sm text-gray-500 mb-6">The book file could not be found on the server.</p>
              )}
              {error.includes('403') && (
                <p className="text-sm text-gray-500 mb-6">You don't have access to this book.</p>
              )}
              {!error.includes('400') && !error.includes('404') && !error.includes('403') && (
                <p className="text-sm text-gray-500 mb-6">Please try again or contact support if the problem persists.</p>
              )}
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
      <div className="bg-gray-800 text-white shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              data-tour="close-button"
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
              onClick={() => setShowTour(true)}
              className="px-3 py-1.5 text-sm hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
              title="Show Tour"
            >
              <i className="ri-question-line text-lg"></i>
              <span className="hidden sm:inline">Show Tour</span>
            </button>
            <button
              data-tour="toc-button"
              onClick={() => setShowToc(!showToc)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Table of Contents"
            >
              <i className="ri-list-unordered text-xl"></i>
            </button>
            <button
              data-tour="annotations-button"
              onClick={() => setShowAnnotationsPanel(!showAnnotationsPanel)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors relative"
              title="Notes & Highlights"
            >
              <i className="ri-sticky-note-line text-xl"></i>
              {(notes.length + highlights.length) > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notes.length + highlights.length}
                </span>
              )}
            </button>
            <button
              data-tour="settings-button"
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Settings"
            >
              <i className="ri-settings-3-line text-xl"></i>
            </button>
          </div>
        </div>


      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex flex-col">
        {/* EPUB Viewer */}
        <div ref={viewerRef} className="flex-1 w-full pb-20"></div>

        {/* Navigation Buttons - Desktop Only */}
        <button
          data-tour="prev-button"
          onClick={prevPage}
          className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all z-10"
        >
          <i className="ri-arrow-left-s-line text-2xl"></i>
        </button>
        <button
          data-tour="next-button"
          onClick={nextPage}
          className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all z-10"
        >
          <i className="ri-arrow-right-s-line text-2xl"></i>
        </button>

        {/* Footer Navigation */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-gray-900/95 text-white shadow-2xl z-20">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={prevPage}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Previous page"
            >
              <i className="ri-arrow-left-s-line text-2xl"></i>
            </button>
            
            <div className="flex-1 mx-4 max-w-md">
              <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
                <span>{progressData.percentage}% complete</span>
                <span>{formatTimeRemaining(progressData.timeRemaining)} left</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
                  style={{ width: `${progressData.percentage}%` }}
                />
              </div>
            </div>
            
            <button
              onClick={nextPage}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Next page"
            >
              <i className="ri-arrow-right-s-line text-2xl"></i>
            </button>
          </div>
        </div>
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

      {/* Selection Menu - Choose Note or Highlight */}
      {showSelectionMenu && selectedText && !showHighlightColors && !showNoteInput && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-20 p-6 min-w-[320px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Selected Text</h3>
            <button
              onClick={() => {
                setShowSelectionMenu(false);
                setSelectedText(null);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-6 max-w-md line-clamp-3 italic">"{selectedText.text}"</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowNoteInput(true)}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <i className="ri-sticky-note-line text-lg"></i>
              Add Note
            </button>
            <button
              onClick={() => setShowHighlightColors(true)}
              className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
            >
              <i className="ri-mark-pen-line text-lg"></i>
              Highlight
            </button>
          </div>
        </div>
      )}

      {/* Highlight Color Picker */}
      {showHighlightColors && selectedText && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-20 p-6 min-w-[320px]">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowHighlightColors(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <i className="ri-arrow-left-line text-xl"></i>
            </button>
            <h3 className="font-bold text-gray-900">Choose Color</h3>
            <button
              onClick={() => {
                setShowSelectionMenu(false);
                setShowHighlightColors(false);
                setSelectedText(null);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4 max-w-md line-clamp-3 italic">"{selectedText.text}"</p>
          <div className="grid grid-cols-5 gap-3">
            <button
              onClick={() => createHighlight('#ffeb3b')}
              className="w-12 h-12 rounded-full bg-yellow-300 hover:ring-4 ring-yellow-500 transition-all"
              title="Yellow"
            />
            <button
              onClick={() => createHighlight('#4caf50')}
              className="w-12 h-12 rounded-full bg-green-400 hover:ring-4 ring-green-600 transition-all"
              title="Green"
            />
            <button
              onClick={() => createHighlight('#2196f3')}
              className="w-12 h-12 rounded-full bg-blue-400 hover:ring-4 ring-blue-600 transition-all"
              title="Blue"
            />
            <button
              onClick={() => createHighlight('#f44336')}
              className="w-12 h-12 rounded-full bg-red-400 hover:ring-4 ring-red-600 transition-all"
              title="Red"
            />
            <button
              onClick={() => createHighlight('#9c27b0')}
              className="w-12 h-12 rounded-full bg-purple-400 hover:ring-4 ring-purple-600 transition-all"
              title="Purple"
            />
          </div>
        </div>
      )}

      {/* Note Input */}
      {showNoteInput && selectedText && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-20 p-6 min-w-[400px]">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowNoteInput(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <i className="ri-arrow-left-line text-xl"></i>
            </button>
            <h3 className="font-bold text-gray-900">Add Note</h3>
            <button
              onClick={() => {
                setShowSelectionMenu(false);
                setShowNoteInput(false);
                setSelectedText(null);
                setNoteContent('');
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4 max-w-md line-clamp-3 italic bg-gray-50 p-3 rounded">"{selectedText.text}"</p>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Write your note about this text..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            rows="4"
            autoFocus
          />
          <button
            onClick={() => createNote()}
            disabled={!noteContent.trim() || isSavingNote}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSavingNote ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <i className="ri-save-line"></i>
                Save Note
              </>
            )}
          </button>
        </div>
      )}

      {/* Annotations Panel with Tabs */}
      {showAnnotationsPanel && (
        <div className="absolute top-0 right-0 bottom-0 w-96 bg-white shadow-2xl z-10 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <h2 className="text-lg font-bold">Annotations</h2>
            <button
              onClick={() => setShowAnnotationsPanel(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 px-4 py-3 font-semibold transition-colors relative ${activeTab === 'notes'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <i className="ri-sticky-note-line"></i>
                Notes
                {notes.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'notes' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                    {notes.length}
                  </span>
                )}
              </div>
              {activeTab === 'notes' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('highlights')}
              className={`flex-1 px-4 py-3 font-semibold transition-colors relative ${activeTab === 'highlights'
                ? 'text-yellow-600 bg-yellow-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <i className="ri-mark-pen-line"></i>
                Highlights
                {highlights.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'highlights' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                    {highlights.length}
                  </span>
                )}
              </div>
              {activeTab === 'highlights' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-600"></div>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div>

                {/* Add Note Section */}
                <div className="p-4 border-b border-gray-200 bg-blue-50">
                  <h3 className="font-semibold mb-2 text-sm text-gray-700">Add New Note</h3>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write your note here..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                  <button
                    onClick={() => createNote()}
                    disabled={!noteContent.trim() || isSavingNote}
                    className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSavingNote ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="ri-save-line"></i>
                        Save Note
                      </>
                    )}
                  </button>
                </div>

                {/* Notes List */}
                {notes.length > 0 && (
                  <div className="p-4">
                    <h3 className="font-semibold mb-3 text-sm text-gray-700 flex items-center">
                      <i className="ri-sticky-note-line mr-2"></i>
                      Notes ({notes.length})
                    </h3>
                    <div className="space-y-3">
                      {notes.map(note => (
                        <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          {editingNote === note.id ? (
                            <div>
                              <textarea
                                defaultValue={note.content}
                                className="w-full p-2 border border-gray-300 rounded resize-none"
                                rows="3"
                                id={`note-edit-${note.id}`}
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => {
                                    const content = document.getElementById(`note-edit-${note.id}`).value;
                                    updateNote(note.id, content);
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingNote(null)}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                <span>{new Date(note.created_at).toLocaleDateString()}</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditingNote(note.id)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <i className="ri-edit-line"></i>
                                  </button>
                                  <button
                                    onClick={() => deleteNote(note.id)}
                                    disabled={isDeletingNote === note.id}
                                    className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isDeletingNote === note.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                    ) : (
                                      <i className="ri-delete-bin-line"></i>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {notes.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <i className="ri-sticky-note-line text-4xl mb-2"></i>
                    <p className="text-sm">No notes yet</p>
                    <p className="text-xs mt-1">Select text and choose "Add Note"</p>
                  </div>
                )}
              </div>
            )}

            {/* Highlights Tab */}
            {activeTab === 'highlights' && (
              <div>
                {/* Highlights List */}
                {highlights.length > 0 ? (
                  <div className="p-4">
                    <div className="space-y-3">
                      {highlights.map(highlight => (
                        <div key={highlight.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-2">
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                              style={{ backgroundColor: highlight.color }}
                            />
                            <div className="flex-1">
                              <p className="text-sm text-gray-800">"{highlight.text}"</p>
                              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                <span>{new Date(highlight.created_at).toLocaleDateString()}</span>
                                <button
                                  onClick={() => deleteHighlight(highlight.id)}
                                  disabled={isDeletingHighlight === highlight.id}
                                  className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isDeletingHighlight === highlight.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                  ) : (
                                    <i className="ri-delete-bin-line"></i>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <i className="ri-mark-pen-line text-4xl mb-2"></i>
                    <p className="text-sm">No highlights yet</p>
                    <p className="text-xs mt-1">Select text and choose "Highlight"</p>
                  </div>
                )}
              </div>
            )}
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

          {/* Font Family */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Font Family</label>
            <div className="grid grid-cols-2 gap-2">
              {['Georgia', 'Arial', 'Times New Roman', 'Verdana'].map(font => (
                <button
                  key={font}
                  onClick={() => changeFontFamily(font)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${fontFamily === font
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => changeTheme('light')}
                className={`p-3 rounded-lg border-2 transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
              >
                <div className="w-full h-8 bg-white border border-gray-300 rounded mb-2"></div>
                <p className="text-xs font-medium">Light</p>
              </button>
              <button
                onClick={() => changeTheme('sepia')}
                className={`p-3 rounded-lg border-2 transition-all ${theme === 'sepia' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
              >
                <div className="w-full h-8 bg-amber-50 border border-amber-200 rounded mb-2"></div>
                <p className="text-xs font-medium">Sepia</p>
              </button>
              <button
                onClick={() => changeTheme('dark')}
                className={`p-3 rounded-lg border-2 transition-all ${theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
              >
                <div className="w-full h-8 bg-gray-900 border border-gray-700 rounded mb-2"></div>
                <p className="text-xs font-medium">Dark</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tour Guide */}
      {showTour && <EReaderTour onComplete={() => setShowTour(false)} />}
    </div>
  );
}
