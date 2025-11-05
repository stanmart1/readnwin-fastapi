import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { queueProgressUpdate, syncQueuedUpdates, isOnline } from '../lib/offlineSync';

export default function EReader({ bookId, onClose }) {
  const [book, setBook] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState('Georgia');
  const [theme, setTheme] = useState('light');
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedText, setSelectedText] = useState(null);
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [activeTab, setActiveTab] = useState('notes');
  const [editingNote, setEditingNote] = useState(null);
  const [toast, setToast] = useState(null);
  const [toc, setToc] = useState([]);
  const [showToc, setShowToc] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [totalHeight, setTotalHeight] = useState(0);

  const contentRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  useEffect(() => {
    loadBook();
    loadHighlights();
    loadNotes();

    // Keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollDown();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollUp();
      }
    };

    // Sync queued updates when online
    const handleOnline = () => {
      console.log('📡 Back online, syncing queued updates...');
      syncQueuedUpdates(api);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('online', handleOnline);

    // Try to sync on mount if online
    if (isOnline()) {
      syncQueuedUpdates(api);
    }

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('online', handleOnline);
      const styleElement = document.getElementById(`ereader-styles-${bookId}`);
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [bookId]);

  useEffect(() => {
    // Handle text selection
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (text && text.length > 0 && contentRef.current?.contains(selection.anchorNode)) {
        setSelectedText({
          text,
          range: selection.getRangeAt(0)
        });
        setShowSelectionMenu(true);
      } else {
        setShowSelectionMenu(false);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  const loadBook = async () => {
    try {
      setLoading(true);
      setError(null);

      const bookResponse = await api.get(`/user/library`);
      const libraryItem = bookResponse.data.libraryItems.find(item => item.book_id === parseInt(bookId));

      if (!libraryItem) {
        throw new Error('Book not found in your library');
      }

      console.log('Library item:', libraryItem);
      console.log('Library item.book:', libraryItem.book);

      // Use libraryItem.book if it exists, otherwise use libraryItem itself
      const bookData = libraryItem.book || libraryItem;
      setBook(bookData);
      setProgress(libraryItem.progress || 0);

      const contentResponse = await api.get(`/ereader/${bookId}/content`);
      let htmlContent = contentResponse.data.content || contentResponse.data.html_content || '';
      console.log('HTML content loaded:', htmlContent ? `${htmlContent.length} characters` : 'empty');

      // Extract and inject styles into document head
      const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
      const styles = [];
      let match;

      while ((match = styleRegex.exec(htmlContent)) !== null) {
        styles.push(match[1]);
      }

      // Remove style tags from content
      htmlContent = htmlContent.replace(styleRegex, '');

      // Inject styles into document head
      if (styles.length > 0) {
        const styleElement = document.createElement('style');
        styleElement.id = `ereader-styles-${bookId}`;
        styleElement.textContent = styles.join('\n');

        // Remove old styles if they exist
        const oldStyles = document.getElementById(`ereader-styles-${bookId}`);
        if (oldStyles) {
          oldStyles.remove();
        }

        document.head.appendChild(styleElement);
      }

      setContent(htmlContent);

      // Extract TOC from HTML headings
      setTimeout(() => {
        if (contentRef.current) {
          const headings = contentRef.current.querySelectorAll('h1, h2, h3');
          const tocItems = Array.from(headings).map((heading, index) => ({
            id: `heading-${index}`,
            label: heading.textContent,
            element: heading
          }));
          setToc(tocItems);

          // Add IDs to headings for navigation
          headings.forEach((heading, index) => {
            heading.id = `heading-${index}`;
          });
        }
      }, 500);

    } catch (err) {
      console.error('Error loading book:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load book');
    } finally {
      setLoading(false);
    }
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

  const updateProgress = useCallback(async (newProgress) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const progressData = {
        progress: newProgress * 100,
        last_read_location: `scroll:${newProgress}`
      };

      try {
        if (isOnline()) {
          await api.post(`/ereader/${bookId}/progress`, progressData);
        } else {
          queueProgressUpdate(bookId, progressData);
        }
        setProgress(newProgress);
      } catch (err) {
        console.error('Error updating progress:', err);
        queueProgressUpdate(bookId, progressData);
      }
    }, 2000);
  }, [bookId]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleScroll = useCallback((e) => {
    const element = e.target;
    const scrollPercentage = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
    const newProgress = Math.min(100, Math.max(0, scrollPercentage)) / 100;

    setScrollPosition(element.scrollTop);
    setTotalHeight(element.scrollHeight - element.clientHeight);

    if (Math.abs(newProgress - progress) > 0.02) {
      updateProgress(newProgress);
    }
  }, [progress, updateProgress]);

  const scrollUp = () => {
    if (contentRef.current) {
      contentRef.current.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
    }
  };

  const scrollDown = () => {
    if (contentRef.current) {
      contentRef.current.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    touchEndY.current = e.changedTouches[0].clientY;
    handleSwipe();
  };

  const handleSwipe = () => {
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        scrollDown();
      } else {
        scrollUp();
      }
    }
  };

  const goToHeading = (headingId) => {
    const element = document.getElementById(headingId);
    if (element && contentRef.current) {
      const headerHeight = 80;
      const elementPosition = element.offsetTop;
      contentRef.current.scrollTo({ top: elementPosition - headerHeight, behavior: 'smooth' });
      setShowToc(false);
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

      setHighlights([...highlights, response.data.highlight]);
      setShowSelectionMenu(false);
      setSelectedText(null);
      showToast('Highlight created!');
    } catch (err) {
      console.error('Error creating highlight:', err);
      showToast('Failed to create highlight', 'error');
    }
  };

  const deleteHighlight = async (highlightId) => {
    try {
      await api.delete(`/ereader/${bookId}/highlights/${highlightId}`);
      setHighlights(highlights.filter(h => h.id !== highlightId));
      showToast('Highlight deleted');
    } catch (err) {
      console.error('Error deleting highlight:', err);
      showToast('Failed to delete highlight', 'error');
    }
  };

  const createNote = async () => {
    if (!noteContent.trim()) return;

    try {
      const response = await api.post(`/ereader/${bookId}/notes`, {
        book_id: parseInt(bookId),
        content: noteContent,
        highlight_id: null,
        position: Math.floor(progress * 100)
      });

      setNotes([...notes, response.data.note]);
      setNoteContent('');
      setShowNoteInput(false);
      setShowSelectionMenu(false);
      showToast('Note created!');
    } catch (err) {
      console.error('Error creating note:', err);
      showToast('Failed to create note', 'error');
    }
  };

  const updateNote = async (noteId, content) => {
    try {
      await api.put(`/ereader/${bookId}/notes/${noteId}`, null, {
        params: { content }
      });
      setNotes(notes.map(n => n.id === noteId ? { ...n, content } : n));
      setEditingNote(null);
      showToast('Note updated!');
    } catch (err) {
      console.error('Error updating note:', err);
      showToast('Failed to update note', 'error');
    }
  };

  const deleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return;

    try {
      await api.delete(`/ereader/${bookId}/notes/${noteId}`);
      setNotes(notes.filter(n => n.id !== noteId));
      showToast('Note deleted');
    } catch (err) {
      console.error('Error deleting note:', err);
      showToast('Failed to delete note', 'error');
    }
  };

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

  if (!book) {
    console.log('Book is null, not rendering');
    return null;
  }

  console.log('Rendering EReader with book:', book);
  console.log('Content length:', content?.length);

  const currentPage = Math.floor((scrollPosition / totalHeight) * 100) || 0;
  const estimatedPages = Math.ceil(totalHeight / (window.innerHeight * 0.8)) || 1;
  const currentEstimatedPage = Math.floor((scrollPosition / (window.innerHeight * 0.8))) + 1;
  
  // Calculate time remaining
  const pagesRemaining = estimatedPages - currentEstimatedPage;
  const minutesRemaining = Math.ceil(pagesRemaining * 2); // Assume 2 minutes per page
  
  const formatTimeRemaining = (minutes) => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className={`fixed inset-0 z-50 ${getThemeClasses()} transition-colors duration-200 flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
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
          <button
            onClick={() => setShowToc(!showToc)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Table of Contents"
          >
            <i className="ri-list-unordered text-xl"></i>
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Settings"
          >
            <i className="ri-settings-3-line text-xl"></i>
          </button>

          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            title="Annotations"
          >
            <i className="ri-sticky-note-line text-xl"></i>
            {(notes.length + highlights.length) > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notes.length + highlights.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-16 lg:px-32 py-8 pb-24"
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {content ? (
            <div
              className="max-w-4xl mx-auto prose prose-lg dark:prose-invert"
              style={{ fontSize: `${fontSize}px`, fontFamily: fontFamily }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="max-w-4xl mx-auto text-center py-20">
              <p className="text-gray-500">No content available</p>
            </div>
          )}
        </div>

        {/* Annotations Panel */}
        {showAnnotations && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Annotations</h3>
                <button
                  onClick={() => setShowAnnotations(false)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <i className="ri-close-line"></i>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'notes'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                >
                  Notes ({notes.length})
                </button>
                <button
                  onClick={() => setActiveTab('highlights')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${activeTab === 'highlights'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                >
                  Highlights ({highlights.length})
                </button>
              </div>

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowNoteInput(!showNoteInput)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <i className="ri-add-line mr-1"></i>
                    Add Note
                  </button>

                  {showNoteInput && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Write your note..."
                        className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowNoteInput(false)}
                          className="flex-1 px-3 py-1 text-sm border rounded-lg hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={createNote}
                          className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  {notes.map((note) => (
                    <div key={note.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {editingNote === note.id ? (
                        <div>
                          <textarea
                            defaultValue={note.content}
                            className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
                            rows={3}
                            onBlur={(e) => updateNote(note.id, e.target.value)}
                          />
                        </div>
                      ) : (
                        <p className="text-sm mb-2">{note.content}</p>
                      )}
                      <div className="flex items-center justify-between text-xs opacity-70">
                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingNote(note.id)}
                            className="hover:text-blue-600"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="hover:text-red-600"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {notes.length === 0 && (
                    <p className="text-sm text-center opacity-70 py-8">No notes yet</p>
                  )}
                </div>
              )}

              {/* Highlights Tab */}
              {activeTab === 'highlights' && (
                <div className="space-y-3">
                  {highlights.map((highlight) => (
                    <div key={highlight.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: highlight.color }}
                        />
                        <p className="text-sm flex-1">{highlight.text}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs opacity-70">
                        <span>{new Date(highlight.created_at).toLocaleDateString()}</span>
                        <button
                          onClick={() => deleteHighlight(highlight.id)}
                          className="hover:text-red-600"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                  ))}

                  {highlights.length === 0 && (
                    <p className="text-sm text-center opacity-70 py-8">No highlights yet</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex-shrink-0 bg-gradient-to-t from-gray-900 to-gray-900/95 text-white shadow-2xl">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={scrollUp}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Scroll up"
          >
            <i className="ri-arrow-up-s-line text-2xl"></i>
          </button>
          
          <div className="flex-1 mx-4 max-w-md">
            <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
              <span>{currentPage}% complete</span>
              <span>{formatTimeRemaining(minutesRemaining)} left</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
                style={{ width: `${currentPage}%` }}
              />
            </div>
          </div>
          
          <button
            onClick={scrollDown}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Scroll down"
          >
            <i className="ri-arrow-down-s-line text-2xl"></i>
          </button>
        </div>
      </div>

      {/* TOC Sidebar */}
      {showToc && (
        <div className="absolute top-0 left-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-2xl z-10 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Table of Contents</h2>
            <button
              onClick={() => setShowToc(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
          <div className="p-2">
            {toc.length > 0 ? toc.map((item) => (
              <button
                key={item.id}
                onClick={() => goToHeading(item.id)}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-900 dark:text-gray-100"
              >
                <p className="font-medium">{item.label}</p>
              </button>
            )) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">No chapters found</p>
            )}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Reading Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">Font Size</label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
              >
                <i className="ri-subtract-line"></i>
              </button>
              <span className="flex-1 text-center font-medium text-gray-900 dark:text-gray-100">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
              >
                <i className="ri-add-line"></i>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">Font Family</label>
            <div className="grid grid-cols-2 gap-2">
              {['Georgia', 'Arial', 'Times New Roman', 'Verdana'].map(font => (
                <button
                  key={font}
                  onClick={() => setFontFamily(font)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    fontFamily === font
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 text-gray-900 dark:text-gray-100'
                  }`}
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="w-full h-8 bg-white border border-gray-300 rounded mb-2"></div>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Light</p>
              </button>
              <button
                onClick={() => setTheme('sepia')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  theme === 'sepia' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="w-full h-8 bg-amber-50 border border-amber-200 rounded mb-2"></div>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Sepia</p>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="w-full h-8 bg-gray-900 border border-gray-700 rounded mb-2"></div>
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Dark</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Menu */}
      {showSelectionMenu && selectedText && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 flex gap-2 z-50">
          <button
            onClick={() => createHighlight('#ffeb3b')}
            className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Yellow"
          >
            <div className="w-6 h-6 bg-yellow-300 rounded"></div>
          </button>
          <button
            onClick={() => createHighlight('#4caf50')}
            className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Green"
          >
            <div className="w-6 h-6 bg-green-400 rounded"></div>
          </button>
          <button
            onClick={() => createHighlight('#2196f3')}
            className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Blue"
          >
            <div className="w-6 h-6 bg-blue-400 rounded"></div>
          </button>
          <button
            onClick={() => createHighlight('#f44336')}
            className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Red"
          >
            <div className="w-6 h-6 bg-red-400 rounded"></div>
          </button>
          <button
            onClick={() => createHighlight('#9c27b0')}
            className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Purple"
          >
            <div className="w-6 h-6 bg-purple-400 rounded"></div>
          </button>
          <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
          <button
            onClick={() => {
              setShowNoteInput(true);
              setShowAnnotations(true);
              setActiveTab('notes');
              setShowSelectionMenu(false);
            }}
            className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Add note"
          >
            <i className="ri-sticky-note-line text-lg"></i>
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          <i className={`${toast.type === 'success' ? 'ri-check-line' : 'ri-error-warning-line'} text-xl`}></i>
          <span>{toast.message}</span>
        </motion.div>
      )}
    </div>
  );
}
