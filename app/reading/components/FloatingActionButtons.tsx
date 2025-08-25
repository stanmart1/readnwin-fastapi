'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Highlighter, 
  StickyNote, 
  Bookmark, 
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useReaderStore } from '@/stores/readerStore';

export default function FloatingActionButtons() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [isTextToSpeechActive, setIsTextToSpeechActive] = useState(false);
  
  const { 
    currentBook,
    addHighlight,
    addNote,
    addBookmark,
    currentPosition,
    settings,
    navigateToPreviousPage,
    navigateToNextPage,
    getCurrentPage,
    getTotalPages
  } = useReaderStore();

  // Get current page and total pages
  const currentPage = getCurrentPage();
  const totalPages = getTotalPages();

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
      setIsExpanded(true);
    }
  };

  // Add highlight from selected text
  const handleAddHighlight = () => {
    if (!selectedText.trim() || !currentBook) return;

    addHighlight({
      bookId: currentBook.id,
      userId: '', // Will be set by the store
      startOffset: 0, // Would be calculated from selection
      endOffset: selectedText.length,
      selectedText,
      color: 'yellow',
      pageNumber: Math.floor(currentPosition / 1000), // Approximate page
    });

    setSelectedText('');
    setIsExpanded(false);
    window.getSelection()?.removeAllRanges();
  };

  // Add note
  const handleAddNote = () => {
    if (!currentBook) return;

    const noteContent = selectedText || 'Quick note';
    addNote({
      bookId: currentBook.id,
      userId: '', // Will be set by the store
      content: noteContent,
      type: 'general',
      position: currentPosition,
      pageNumber: Math.floor(currentPosition / 1000), // Approximate page
    });

    setSelectedText('');
    setIsExpanded(false);
    window.getSelection()?.removeAllRanges();
  };

  // Add bookmark
  const handleAddBookmark = () => {
    if (!currentBook) return;

    addBookmark({
      bookId: currentBook.id,
      userId: '', // Will be set by the store
      title: `Page ${currentPage}`,
      description: `Bookmark for page ${currentPage}`,
      position: currentPosition,
      pageNumber: currentPage,
    });

    setSelectedText('');
    setIsExpanded(false);
    window.getSelection()?.removeAllRanges();
  };

  // Navigation handlers
  const handlePreviousPage = () => {
    navigateToPreviousPage();
  };

  const handleNextPage = () => {
    navigateToNextPage();
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const themeClasses = {
    light: 'bg-white text-gray-800 shadow-lg',
    dark: 'bg-gray-800 text-gray-200 shadow-lg',
    sepia: 'bg-amber-100 text-amber-800 shadow-lg',
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={containerVariants}
            className="flex flex-col space-y-3 mb-3"
          >
            {/* Navigation Controls */}
            <div className="flex space-x-2">
              <motion.button
                variants={buttonVariants}
                onClick={handlePreviousPage}
                disabled={currentPage <= 1}
                className={`w-12 h-12 rounded-full ${themeClasses[settings.theme]} flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed`}
                whileHover={{ scale: currentPage > 1 ? 1.1 : 1 }}
                whileTap={{ scale: currentPage > 1 ? 0.95 : 1 }}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <motion.button
                variants={buttonVariants}
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className={`w-12 h-12 rounded-full ${themeClasses[settings.theme]} flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed`}
                whileHover={{ scale: currentPage < totalPages ? 1.1 : 1 }}
                whileTap={{ scale: currentPage < totalPages ? 0.95 : 1 }}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Highlight Button */}
            {selectedText && (
              <motion.button
                variants={buttonVariants}
                onClick={handleAddHighlight}
                className={`w-12 h-12 rounded-full ${themeClasses[settings.theme]} flex items-center justify-center hover:scale-110 transition-transform`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Highlighter className="w-5 h-5" />
              </motion.button>
            )}

            {/* Note Button */}
            <motion.button
              variants={buttonVariants}
              onClick={handleAddNote}
              className={`w-12 h-12 rounded-full ${themeClasses[settings.theme]} flex items-center justify-center hover:scale-110 transition-transform`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <StickyNote className="w-5 h-5" />
            </motion.button>

            {/* Bookmark Button */}
            <motion.button
              variants={buttonVariants}
              onClick={handleAddBookmark}
              className={`w-12 h-12 rounded-full ${themeClasses[settings.theme]} flex items-center justify-center hover:scale-110 transition-transform`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bookmark className="w-5 h-5" />
            </motion.button>

            {/* Text-to-Speech Button */}
            <motion.button
              variants={buttonVariants}
              onClick={() => setIsTextToSpeechActive(!isTextToSpeechActive)}
              className={`w-12 h-12 rounded-full ${themeClasses[settings.theme]} flex items-center justify-center hover:scale-110 transition-transform`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isTextToSpeechActive ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-14 h-14 rounded-full ${themeClasses[settings.theme]} flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="w-6 h-6" />
        </motion.div>
      </motion.button>

      {/* Page Indicator */}
      <div className={`absolute -top-12 right-0 ${themeClasses[settings.theme]} px-3 py-1 rounded-lg text-sm font-medium shadow-lg`}>
        {currentPage} / {totalPages}
      </div>
    </div>
  );
} 