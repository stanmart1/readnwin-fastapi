'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  Moon, 
  Type 
} from 'lucide-react';

interface UnifiedEbookReaderProps {
  bookId: string;
  fileUrl: string;
  bookTitle: string;
  bookAuthor: string;
  bookFormat: string;
  onClose: () => void;
}

interface EPUBContent {
  title: string;
  author: string;
  format: string;
  chapters: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  currentChapter: number;
  totalChapters: number;
}

export default function UnifiedEbookReader({
  bookId,
  fileUrl,
  bookTitle,
  bookAuthor,
  bookFormat,
  onClose
}: UnifiedEbookReaderProps) {
  const { user } = useAuth();
  
  const [epubContent, setEpubContent] = useState<EPUBContent | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [showTOC, setShowTOC] = useState(false);
  const [lineHeight, setLineHeight] = useState(1.6);
  
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bookId && user?.id) {
      loadEPUBContent();
    }
  }, [bookId, user?.id]);

  const loadEPUBContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books/${bookId}/epub-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ fileUrl: fileUrl || bookId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to load book: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.content) {
        setEpubContent(data.content);
        setCurrentChapter(data.content.currentChapter || 0);
      } else {
        throw new Error(data.error || 'Failed to load book content');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  const handleChapterChange = async (chapterIndex: number) => {
    if (!epubContent || chapterIndex < 0 || chapterIndex >= epubContent.chapters.length) {
      return;
    }

    setCurrentChapter(chapterIndex);
    setShowTOC(false);
    
    // Save progress to FastAPI
    await saveReadingProgress(chapterIndex);
  };

  const saveReadingProgress = async (chapterIndex: number) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const progress = ((chapterIndex + 1) / (epubContent?.totalChapters || 1)) * 100;

      // Save progress to e-reader endpoint
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/books/${bookId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentChapter: chapterIndex,
          totalChapters: epubContent?.totalChapters || 0,
          progress: progress,
          currentPosition: 0,
          wordsRead: 0
        }),
      });

      // Also update dashboard reading session for analytics sync
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/reading-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId: bookId,
          pageNumber: chapterIndex + 1,
          action: 'update',
          wordsOnPage: 250, // Estimate words per chapter
          timeSpentSeconds: 60 // Estimate time per chapter change
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading book content...</p>
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

  if (!epubContent || !epubContent.chapters || epubContent.chapters.length === 0) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold mb-2">No Content Found</h2>
          <p className="text-gray-600 mb-4">This book contains no readable content.</p>
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

  return (
    <div 
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
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold">{epubContent.title || bookTitle}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {epubContent.author || bookAuthor} • Chapter {currentChapter + 1} of {epubContent.chapters.length}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTOC(!showTOC)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Table of Contents"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'sepia' : 'light')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Theme"
          >
            {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="p-2 border rounded bg-transparent text-sm"
            title="Font Size"
          >
            <option value={14}>Small</option>
            <option value={16}>Medium</option>
            <option value={18}>Large</option>
            <option value={20}>XL</option>
            <option value={24}>XXL</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-full">
        {/* Table of Contents */}
        <AnimatePresence>
          {showTOC && (
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto"
            >
              <div className="p-4">
                <h2 className="font-semibold mb-4">Table of Contents</h2>
                <div className="space-y-2">
                  {epubContent.chapters.map((chapter, index) => (
                    <button
                      key={chapter.id}
                      onClick={() => handleChapterChange(index)}
                      className={`w-full text-left p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                        index === currentChapter ? 'bg-blue-100 dark:bg-blue-900' : ''
                      }`}
                    >
                      <div className="font-medium text-sm">{chapter.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reading Area */}
        <div className="flex-1 flex flex-col">
          {/* Navigation */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleChapterChange(currentChapter - 1)}
              disabled={currentChapter === 0}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded disabled:opacity-50 flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentChapter + 1} of {epubContent.chapters.length}
            </div>
            
            <button
              onClick={() => handleChapterChange(currentChapter + 1)}
              disabled={currentChapter === epubContent.chapters.length - 1}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded disabled:opacity-50 flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
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
              
              <div 
                className="prose prose-lg max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ __html: currentChapterContent.content }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}