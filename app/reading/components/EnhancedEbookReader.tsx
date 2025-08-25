'use client';

import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, BookOpenIcon, ClockIcon, DocumentTextIcon, Cog6ToothIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError, redirectToLogin } from '@/lib/error-utils';

interface EnhancedEbookReaderProps {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  onClose: () => void;
}

interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  estimatedReadingTime: number;
  metadata: Record<string, any>;
}

interface BookContent {
  id: string;
  title: string;
  bookType: string;
  contentType: string;
  wordCount: number;
  estimatedReadingTime: number;
  pageCount: number;
  chapterCount: number;
  contentStructure: any;
}

export default function EnhancedEbookReader({
  bookId,
  bookTitle,
  bookAuthor,
  onClose
}: EnhancedEbookReaderProps) {
  const { user, isAuthenticated } = useAuth();
  const [bookContent, setBookContent] = useState<BookContent | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTOC, setShowTOC] = useState(false);
  
  // Reading settings
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [fontFamily, setFontFamily] = useState('serif');
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [currentBookmark, setCurrentBookmark] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'toc' | 'notes' | 'highlights'>('toc');
  const [notes, setNotes] = useState<Array<{id: string, chapterIndex: number, text: string, note: string, position: number}>>([]);
  const [highlights, setHighlights] = useState<Array<{id: string, chapterIndex: number, text: string, color: string, position: number}>>([]);
  const [selectedText, setSelectedText] = useState<string>('');
  const [showTextModal, setShowTextModal] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState<number>(0);
  
  // Reading progress
  const [readingProgress, setReadingProgress] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [noteText, setNoteText] = useState('');
  const [highlightColor, setHighlightColor] = useState('#ffeb3b');
  
  const contentRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBookContent();
    setStartTime(new Date());
    
    // Restore reading position from localStorage
    const savedPosition = localStorage.getItem(`reading-position-${bookId}`);
    if (savedPosition) {
      const position = parseInt(savedPosition, 10);
      if (!isNaN(position) && position >= 0) {
        setCurrentChapter(position);
      }
    }
  }, [bookId]);

  const loadBookContent = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📖 Loading book content for book:', bookId);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/ereader/file/${bookId}?format=text`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const apiError = handleApiError(null, response);
        if (apiError.isAuthError) {
          redirectToLogin();
          return;
        }
        throw new Error(apiError.message);
      }

      const data = await response.json();
      
      if (data.success && data.content) {
        const content = data.content;
        const metadata = content.metadata || {};
        const chapters = content.chapters || [];
        
        // Transform API data to component format
        const transformedChapters = chapters.map((chapter: any, index: number) => ({
          id: chapter.id || `chapter_${index}`,
          number: index + 1,
          title: chapter.title || `Chapter ${index + 1}`,
          content: chapter.content || '',
          wordCount: estimateWordCount(chapter.content || ''),
          estimatedReadingTime: Math.ceil(estimateWordCount(chapter.content || '') / 200),
          metadata: {}
        }));
        
        const totalWordCount = transformedChapters.reduce((sum, ch) => sum + ch.wordCount, 0);
        
        setBookContent({
          id: bookId,
          title: metadata.title || bookTitle,
          bookType: 'ebook',
          contentType: 'epub',
          wordCount: totalWordCount,
          estimatedReadingTime: Math.ceil(totalWordCount / 200),
          pageCount: chapters.length,
          chapterCount: chapters.length,
          contentStructure: content
        });
        
        setChapters(transformedChapters);
        
        console.log('✅ Book content loaded successfully:', {
          title: metadata.title || bookTitle,
          chapters: transformedChapters.length,
          wordCount: totalWordCount
        });
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('❌ Error loading book content:', err);
      const apiError = handleApiError(err);
      if (apiError.isAuthError) {
        redirectToLogin();
        return;
      }
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };
  
  const estimateWordCount = (text: string): number => {
    // Remove HTML tags and count words
    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return cleanText ? cleanText.split(' ').length : 0;
  };

  const handleChapterChange = (chapterIndex: number) => {
    setCurrentChapter(chapterIndex);
    setShowTOC(false);
    
    // Save current position to localStorage
    localStorage.setItem(`reading-position-${bookId}`, chapterIndex.toString());
    
    // Calculate reading progress
    const progress = ((chapterIndex + 1) / chapters.length) * 100;
    setReadingProgress(progress);
    
    // Save reading progress
    saveReadingProgress(chapterIndex, progress);
  };

  const saveReadingProgress = async (chapterIndex: number, progress: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const currentChapter = chapters[chapterIndex];
      const wordsRead = chapters
        .slice(0, chapterIndex + 1)
        .reduce((sum, ch) => sum + ch.wordCount, 0);

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/ereader/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          book_id: parseInt(bookId),
          current_page: chapterIndex + 1,
          total_pages: chapters.length,
          progress_percentage: progress,
          reading_time_minutes: 0
        }),
      });
    } catch (error) {
      console.error('Error saving reading progress:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        handleChapterChange(currentChapter - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        handleChapterChange(currentChapter + 1);
        break;
      case 't':
      case 'T':
        if (e.ctrlKey) {
          e.preventDefault();
          setShowTOC(!showTOC);
        }
        break;
      case 's':
      case 'S':
        if (e.ctrlKey) {
          e.preventDefault();
          setShowSettings(!showSettings);
        }
        break;
      case 'b':
      case 'B':
        if (e.ctrlKey) {
          e.preventDefault();
          handleAddBookmark();
        }
        break;
    }
  };

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(Math.max(12, Math.min(24, newSize)));
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'sepia') => {
    setTheme(newTheme);
  };

  const handleFontFamilyChange = (newFont: string) => {
    setFontFamily(newFont);
  };

  const handleLineHeightChange = (newHeight: number) => {
    setLineHeight(Math.max(1.2, Math.min(2.0, newHeight)));
  };

  const handleAddBookmark = () => {
    const newBookmark = currentChapter;
    if (!bookmarks.includes(newBookmark)) {
      setBookmarks([...bookmarks, newBookmark]);
      setCurrentBookmark(newBookmark);
    }
  };

  const handleRemoveBookmark = (chapterIndex: number) => {
    setBookmarks(bookmarks.filter(b => b !== chapterIndex));
    if (currentBookmark === chapterIndex) {
      setCurrentBookmark(null);
    }
  };

  const handleGoToBookmark = (chapterIndex: number) => {
    handleChapterChange(chapterIndex);
    setCurrentBookmark(chapterIndex);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
      setSelectionPosition(currentChapter);
      setShowTextModal(true);
    }
  };

  const handleAddNote = () => {
    if (selectedText && noteText.trim()) {
      const newNote = {
        id: Date.now().toString(),
        chapterIndex: selectionPosition,
        text: selectedText,
        note: noteText.trim(),
        position: selectionPosition
      };
      setNotes([...notes, newNote]);
      setNoteText('');
      setShowTextModal(false);
      setSelectedText('');
    }
  };

  const handleAddHighlight = () => {
    if (selectedText) {
      const newHighlight = {
        id: Date.now().toString(),
        chapterIndex: selectionPosition,
        text: selectedText,
        color: highlightColor,
        position: selectionPosition
      };
      setHighlights([...highlights, newHighlight]);
      setShowTextModal(false);
      setSelectedText('');
    }
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const handleDeleteHighlight = (id: string) => {
    setHighlights(highlights.filter(highlight => highlight.id !== id));
  };

  const calculateReadingProgress = () => {
    if (chapters.length === 0) return 0;
    return ((currentChapter + 1) / chapters.length) * 100;
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

  const getHeaderClasses = () => {
    return 'bg-white text-gray-900 border-gray-200';
  };

  const getSidebarClasses = () => {
    return 'bg-gray-50 text-gray-900 border-gray-200';
  };

  const getButtonClasses = (variant: 'primary' | 'secondary' = 'secondary') => {
    if (variant === 'primary') {
      return 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600';
    }
    return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300';
  };

  const formatReadingTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatWordCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Book</h3>
            <p className="text-gray-600">Please wait while we prepare your reading experience...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <XMarkIcon className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Book</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={loadBookContent}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentChapterData = chapters[currentChapter];

  return (
    <div 
      ref={readerRef}
      className={`fixed inset-0 ${getThemeClasses()} flex flex-col z-50`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${getHeaderClasses()}`}>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => { setShowTOC(!showTOC); setActiveTab('toc'); }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 hover:text-gray-900"
            title="Table of Contents (Ctrl+T)"
          >
            <BookOpenIcon className="w-5 h-5" />
          </button>

          {/* Bookmark Button */}
          <button
            onClick={handleAddBookmark}
            className={`p-2 rounded-lg transition-colors ${
              bookmarks.includes(currentChapter)
                ? 'bg-yellow-100 text-yellow-700'
                : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
            }`}
            title="Add Bookmark (Ctrl+B)"
          >
            <BookmarkIcon className="w-5 h-5" />
          </button>
          
          <div>
            <h1 className="font-semibold text-lg">{bookTitle}</h1>
            <p className="text-sm text-gray-600">{bookAuthor}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Reading Stats */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ClockIcon className="w-4 h-4" />
            <span>{formatReadingTime(bookContent?.estimatedReadingTime || 0)}</span>
            <DocumentTextIcon className="w-4 h-4" />
            <span>{formatWordCount(bookContent?.wordCount || 0)} words</span>
          </div>

          {/* Progress */}
          <div className="text-sm text-gray-600">
            {currentChapter + 1} of {chapters.length}
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 hover:text-gray-900"
            title="Reading Settings (Ctrl+S)"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 hover:text-gray-900"
            title="Close Reader"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Table of Contents Sidebar */}
        {showTOC && (
          <div className={`w-80 border-r overflow-y-auto ${getSidebarClasses()}`}>
            <div className="p-4">
              {/* Tab Navigation */}
              <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('toc')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'toc' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  TOC
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'notes' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Notes ({notes.length})
                </button>
                <button
                  onClick={() => setActiveTab('highlights')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === 'highlights' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Highlights ({highlights.length})
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'toc' && (
                <div>
                  <h2 className="font-semibold text-lg mb-4">Table of Contents</h2>
                  <div className="space-y-2">
                    {chapters.map((chapter, index) => (
                      <button
                        key={chapter.id}
                        onClick={() => handleChapterChange(index)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          index === currentChapter
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'hover:bg-gray-100 text-gray-800'
                        }`}
                      >
                        <div className="font-medium">{chapter.title}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {formatReadingTime(chapter.estimatedReadingTime)} • {formatWordCount(chapter.wordCount)} words
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div>
                  <h2 className="font-semibold text-lg mb-4">Notes</h2>
                  <div className="space-y-3">
                    {notes.length > 0 ? notes.map((note) => (
                      <div key={note.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-gray-500">Page {note.chapterIndex + 1}</span>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            ×
                          </button>
                        </div>
                        <p className="text-sm text-gray-700 mb-2 italic">"{note.text}"</p>
                        <p className="text-sm text-gray-900">{note.note}</p>
                        <button
                          onClick={() => handleChapterChange(note.chapterIndex)}
                          className="text-xs text-blue-600 hover:underline mt-2"
                        >
                          Go to page
                        </button>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-500">No notes yet. Select text to add notes.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'highlights' && (
                <div>
                  <h2 className="font-semibold text-lg mb-4">Highlights</h2>
                  <div className="space-y-3">
                    {highlights.length > 0 ? highlights.map((highlight) => (
                      <div key={highlight.id} className="p-3 bg-gray-50 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-gray-500">Page {highlight.chapterIndex + 1}</span>
                          <button
                            onClick={() => handleDeleteHighlight(highlight.id)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            ×
                          </button>
                        </div>
                        <p 
                          className="text-sm text-gray-900 p-2 rounded"
                          style={{ backgroundColor: highlight.color + '40' }}
                        >
                          "{highlight.text}"
                        </p>
                        <button
                          onClick={() => handleChapterChange(highlight.chapterIndex)}
                          className="text-xs text-blue-600 hover:underline mt-2"
                        >
                          Go to page
                        </button>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-500">No highlights yet. Select text to add highlights.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reading Area */}
        <div className="flex-1 flex flex-col">
          {/* Chapter Navigation */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <button
              onClick={() => handleChapterChange(currentChapter - 1)}
              disabled={currentChapter === 0}
              className={`px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${getButtonClasses()}`}
            >
              Previous Page
            </button>

            <div className="text-center">
              <h2 className="font-semibold text-lg">{currentChapterData?.title}</h2>
              <p className="text-sm text-gray-600">
                Page {currentChapter + 1} of {chapters.length}
              </p>
            </div>

            <button
              onClick={() => handleChapterChange(currentChapter + 1)}
              disabled={currentChapter === chapters.length - 1}
              className={`px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${getButtonClasses()}`}
            >
              Next Page
            </button>
          </div>

          {/* Chapter Content */}
          <div 
            ref={contentRef}
            className="flex-1 overflow-y-auto p-8"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
              fontFamily: fontFamily
            }}
          >
            <style jsx>{`
              .prose p, .prose div, .prose span {
                color: #111827 !important;
              }
              .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
                color: #000000 !important;
              }
            `}</style>
            {currentChapterData ? (
              <div 
                className="max-w-4xl mx-auto prose prose-lg prose-gray"
                style={{ color: '#1f2937' }}
                onMouseUp={handleTextSelection}
                dangerouslySetInnerHTML={{ __html: currentChapterData.content }}
              />
            ) : (
              <div className="text-center text-gray-500">
                <p>No content available for this chapter.</p>
              </div>
            )}
          </div>

          {/* Reading Progress Bar */}
          <div className="h-1 bg-gray-200">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${calculateReadingProgress()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reading Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 hover:text-gray-900"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Font Size Control */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size: {fontSize}px
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleFontSizeChange(fontSize - 1)}
                  disabled={fontSize <= 12}
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800"
                >
                  A-
                </button>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={fontSize}
                  onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                  className="flex-1"
                />
                <button
                  onClick={() => handleFontSizeChange(fontSize + 1)}
                  disabled={fontSize >= 24}
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Font Family Control */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Family
              </label>
              <select
                value={fontFamily}
                onChange={(e) => handleFontFamilyChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="serif">Serif</option>
                <option value="sans-serif">Sans Serif</option>
                <option value="monospace">Monospace</option>
              </select>
            </div>

            {/* Line Height Control */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Line Height: {lineHeight.toFixed(1)}
              </label>
              <input
                type="range"
                min="1.2"
                max="2.0"
                step="0.1"
                value={lineHeight}
                onChange={(e) => handleLineHeightChange(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Theme Control */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    theme === 'light'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full h-4 bg-white rounded mb-1"></div>
                  <span className="text-xs">Light</span>
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    theme === 'dark'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full h-4 bg-gray-800 rounded mb-1"></div>
                  <span className="text-xs">Dark</span>
                </button>
                <button
                  onClick={() => handleThemeChange('sepia')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    theme === 'sepia'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full h-4 bg-amber-50 rounded mb-1"></div>
                  <span className="text-xs">Sepia</span>
                </button>
              </div>
            </div>

            {/* Bookmarks */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bookmarks ({bookmarks.length})
              </label>
              {bookmarks.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {bookmarks.map((chapterIndex) => (
                    <div key={chapterIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <button
                        onClick={() => handleGoToBookmark(chapterIndex)}
                        className="text-sm text-blue-600 hover:underline font-medium"
                      >
                        Page {chapterIndex + 1}: {chapters[chapterIndex]?.title}
                      </button>
                      <button
                        onClick={() => handleRemoveBookmark(chapterIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No bookmarks yet. Use Ctrl+B to add bookmarks.</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${getButtonClasses('primary')}`}
              >
                Apply Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Selection Modal */}
      {showTextModal && selectedText && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Selected Text</h3>
              <button
                onClick={() => { setShowTextModal(false); setSelectedText(''); setNoteText(''); }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 hover:text-gray-900"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-700 italic">"{selectedText}"</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Note (Optional)
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your note here..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Highlight Color
              </label>
              <div className="flex space-x-2">
                {['#ffeb3b', '#4caf50', '#2196f3', '#ff9800', '#e91e63'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setHighlightColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      highlightColor === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowTextModal(false); setSelectedText(''); setNoteText(''); }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddHighlight}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Highlight
              </button>
              {noteText.trim() && (
                <button
                  onClick={handleAddNote}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${getButtonClasses('primary')}`}
                >
                  Add Note
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
