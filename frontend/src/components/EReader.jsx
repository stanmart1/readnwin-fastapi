import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';

export default function EReader({ bookId, onClose }) {
  const [book, setBook] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fontSize, setFontSize] = useState(18);
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
  
  const contentRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    loadBook();
    loadHighlights();
    loadNotes();
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

      setBook(libraryItem.book);
      setProgress(libraryItem.progress || 0);

      const contentResponse = await api.get(`/ereader/${bookId}/content`);
      setContent(contentResponse.data.content || contentResponse.data.html_content || '');
      
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
      try {
        await api.post(`/ereader/${bookId}/progress`, {
          progress: newProgress * 100,
          last_read_location: `scroll:${newProgress}`
        });
        setProgress(newProgress);
      } catch (err) {
        console.error('Error updating progress:', err);
      }
    }, 2000);
  }, [bookId]);

  const handleScroll = useCallback((e) => {
    const element = e.target;
    const scrollPercentage = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
    const newProgress = Math.min(100, Math.max(0, scrollPercentage)) / 100;
    
    if (Math.abs(newProgress - progress) > 0.02) {
      updateProgress(newProgress);
    }
  }, [progress, updateProgress]);

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
      alert('Highlight created!');
    } catch (err) {
      console.error('Error creating highlight:', err);
      alert('Failed to create highlight');
    }
  };

  const deleteHighlight = async (highlightId) => {
    try {
      await api.delete(`/ereader/${bookId}/highlights/${highlightId}`);
      setHighlights(highlights.filter(h => h.id !== highlightId));
    } catch (err) {
      console.error('Error deleting highlight:', err);
      alert('Failed to delete highlight');
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
      alert('Note created!');
    } catch (err) {
      console.error('Error creating note:', err);
      alert('Failed to create note');
    }
  };

  const updateNote = async (noteId, content) => {
    try {
      await api.put(`/ereader/${bookId}/notes/${noteId}`, null, {
        params: { content }
      });
      setNotes(notes.map(n => n.id === noteId ? { ...n, content } : n));
      setEditingNote(null);
      alert('Note updated!');
    } catch (err) {
      console.error('Error updating note:', err);
      alert('Failed to update note');
    }
  };

  const deleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return;

    try {
      await api.delete(`/ereader/${bookId}/notes/${noteId}`);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note');
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

          {/* Annotations Button */}
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Annotations"
          >
            <i className="ri-sticky-note-line text-xl"></i>
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

      <div className="flex h-[calc(100vh-5rem)]">
        {/* Content */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-16 lg:px-32 py-8"
          onScroll={handleScroll}
        >
          <div 
            className="max-w-4xl mx-auto prose prose-lg dark:prose-invert"
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
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
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                    activeTab === 'notes'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  Notes ({notes.length})
                </button>
                <button
                  onClick={() => setActiveTab('highlights')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                    activeTab === 'highlights'
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

      {/* Selection Menu */}
      {showSelectionMenu && selectedText && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 flex gap-2 z-50">
          <button
            onClick={() => createHighlight('yellow')}
            className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Yellow highlight"
          >
            <div className="w-6 h-6 bg-yellow-300 rounded"></div>
          </button>
          <button
            onClick={() => createHighlight('green')}
            className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Green highlight"
          >
            <div className="w-6 h-6 bg-green-300 rounded"></div>
          </button>
          <button
            onClick={() => createHighlight('blue')}
            className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Blue highlight"
          >
            <div className="w-6 h-6 bg-blue-300 rounded"></div>
          </button>
          <button
            onClick={() => createHighlight('pink')}
            className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Pink highlight"
          >
            <div className="w-6 h-6 bg-pink-300 rounded"></div>
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
    </div>
  );
}
