'use client';

import React, { useState, useEffect, useRef } from 'react';

interface EPUBReaderProps {
  bookId: string;
  fileUrl: string;
  onClose: () => void;
}

interface EPUBContent {
  title: string;
  author: string;
  chapters: Array<{
    title: string;
    content: string;
    id: string;
  }>;
  currentChapter: number;
}

export default function EPUBReader({ bookId, fileUrl, onClose }: EPUBReaderProps) {
  const { user, isAuthenticated } = useAuth();
  const [epubContent, setEpubContent] = useState<EPUBContent | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [showTOC, setShowTOC] = useState(false);
  const [lineHeight, setLineHeight] = useState(1.6);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEPUBContent();
  }, [bookId, fileUrl]);

  const loadEPUBContent = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 EPUBReader: Loading EPUB content...');
      console.log('   Book ID:', bookId);
      console.log('   File URL:', fileUrl);
      console.log('   Session:', session ? 'Available' : 'Not available');
      console.log('   User ID:', user?.id || 'Not available');

      // Check if user is authenticated
      if (!user?.id) {
        throw new Error('User not authenticated. Please log in.');
      }

      // Call the EPUB parsing API
      const response = await fetch(`/api/books/${bookId}/epub-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl }),
      });

      console.log('🔍 EPUBReader: API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 EPUBReader: API error response:', errorText);
        throw new Error(`Failed to load EPUB content: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 EPUBReader: API response data:', {
        success: data.success,
        hasContent: !!data.content,
        contentLength: data.content ? data.content.length : 0,
        chapters: data.content ? data.content.chapters?.length : 0
      });
      
      if (data.success) {
        console.log('🔍 EPUBReader: Setting EPUB content...');
        setEpubContent(data.content);
      } else {
        console.error('🔍 EPUBReader: API returned success: false');
        throw new Error(data.error || 'Failed to parse EPUB');
      }
    } catch (err) {
      console.error('🔍 EPUBReader: Error loading EPUB:', err);
      setError(err instanceof Error ? err.message : 'Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  const handleChapterChange = (chapterIndex: number) => {
    setCurrentChapter(chapterIndex);
    setShowTOC(false);
    
    // Save reading progress
    if (user) {
      saveReadingProgress(chapterIndex);
    }
  };

  const saveReadingProgress = async (chapterIndex: number) => {
    try {
      await fetch(`/api/books/${bookId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentChapter: chapterIndex,
          totalChapters: epubContent?.chapters.length || 0,
          progress: ((chapterIndex + 1) / (epubContent?.chapters.length || 1)) * 100,
        }),
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!epubContent) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (currentChapter > 0) {
          handleChapterChange(currentChapter - 1);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (currentChapter < epubContent.chapters.length - 1) {
          handleChapterChange(currentChapter + 1);
        }
        break;
      case 'Escape':
        setShowTOC(false);
        break;
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

  const renderHTMLContent = (content: string) => {
    // Render original HTML content from EPUB without markdown processing
    return (
      <div 
        className="epub-content prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading EPUB content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold mb-2">Failed to Load Book</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!epubContent) {
    console.log('🔍 EPUBReader: No EPUB content available');
    return null;
  }

  console.log('🔍 EPUBReader: EPUB content structure:', {
    hasTitle: !!epubContent.title,
    hasAuthor: !!epubContent.author,
    hasChapters: !!epubContent.chapters,
    chaptersLength: epubContent.chapters?.length || 0,
    currentChapter: currentChapter
  });

  if (!epubContent.chapters || epubContent.chapters.length === 0) {
    console.log('🔍 EPUBReader: No chapters found in EPUB content');
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold mb-2">No Content Found</h2>
          <p className="text-gray-600 mb-4">This EPUB file contains no readable content.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentChapterContent = epubContent.chapters[currentChapter];
  
  if (!currentChapterContent) {
    console.log('🔍 EPUBReader: Current chapter content not found for index:', currentChapter);
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold mb-2">Chapter Not Found</h2>
          <p className="text-gray-600 mb-4">Chapter {currentChapter + 1} could not be loaded.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={readerRef}
      className={`fixed inset-0 z-50 ${getThemeClasses()} transition-colors duration-200`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            ✕
          </button>
          <div>
            <h1 className="font-semibold">{epubContent.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {epubContent.author} • Chapter {currentChapter + 1} of {epubContent.chapters.length}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTOC(!showTOC)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Table of Contents"
          >
            📋
          </button>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'sepia')}
            className="p-2 border rounded bg-transparent"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="sepia">Sepia</option>
          </select>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="p-2 border rounded bg-transparent"
          >
            <option value={14}>Small</option>
            <option value={16}>Medium</option>
            <option value={18}>Large</option>
            <option value={20}>Extra Large</option>
            <option value={24}>XXL</option>
          </select>
          <select
            value={lineHeight}
            onChange={(e) => setLineHeight(Number(e.target.value))}
            className="p-2 border rounded bg-transparent"
          >
            <option value={1.4}>Tight</option>
            <option value={1.6}>Normal</option>
            <option value={1.8}>Relaxed</option>
            <option value={2.0}>Loose</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-full">
        {/* Table of Contents */}
        {showTOC && (
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto">
            <div className="p-4">
              <h2 className="font-semibold mb-4">Table of Contents</h2>
              <div className="space-y-2">
                {epubContent.chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => handleChapterChange(index)}
                    className={`w-full text-left p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
                      index === currentChapter ? 'bg-blue-100 dark:bg-blue-900' : ''
                    }`}
                  >
                    <div className="font-medium">{chapter.title}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reading Area */}
        <div className="flex-1 flex flex-col">
          {/* Navigation */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleChapterChange(currentChapter - 1)}
              disabled={currentChapter === 0}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded disabled:opacity-50"
            >
              ← Previous
            </button>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentChapter + 1} of {epubContent.chapters.length}
            </div>
            
            <button
              onClick={() => handleChapterChange(currentChapter + 1)}
              disabled={currentChapter === epubContent.chapters.length - 1}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded disabled:opacity-50"
            >
              Next →
            </button>
          </div>

          {/* Chapter Content */}
          <div 
            ref={contentRef}
            className="flex-1 overflow-y-auto p-8"
            style={{ 
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight
            }}
          >
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                {currentChapterContent.title}
              </h2>
              
              <div className="text-content leading-relaxed">
                {renderHTMLContent(currentChapterContent.content)}
              </div>
            </div>
            

          </div>
        </div>
      </div>
    </div>
  );
} 