'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  StickyNote, 
  Highlighter, 
  Bookmark, 
  Search,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Calendar,
  Filter
} from 'lucide-react';
import { useReaderStore } from '@/stores/readerStore';

interface LeftDrawerProps {
  onClose: () => void;
}

export default function LeftDrawer({ onClose }: LeftDrawerProps) {
  const {
    drawerState,
    setLeftDrawerTab,
    notes,
    highlights,
    bookmarks,
    currentBook,
    settings,
    deleteNote,
    deleteHighlight,
    deleteBookmark,
    updateNote,
    updateHighlight,
  } = useReaderStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  const themeClasses = {
    light: 'bg-white text-gray-900 border-gray-200',
    dark: 'bg-gray-800 text-gray-100 border-gray-700',
    sepia: 'bg-amber-50 text-amber-900 border-amber-200',
  };

  const tabClasses = {
    light: 'text-gray-600 hover:text-gray-900 border-gray-300',
    dark: 'text-gray-400 hover:text-gray-100 border-gray-600',
    sepia: 'text-amber-600 hover:text-amber-900 border-amber-300',
  };

  // Filter items based on search query
  const filteredNotes = notes.filter(note =>
    currentBook && note.bookId === currentBook.id &&
    (note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
     note.type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredHighlights = highlights.filter(highlight =>
    currentBook && highlight.bookId === currentBook.id &&
    highlight.selectedText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBookmarks = bookmarks.filter(bookmark =>
    currentBook && bookmark.bookId === currentBook.id &&
    (bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (bookmark.description && bookmark.description.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Navigate to position in text
  const navigateToPosition = (position: number) => {
    // Implementation would scroll to position in the reading content
    // This is a placeholder - actual implementation would require coordination with parent
    console.log('Navigate to position:', position);
    onClose();
  };

  // Start editing note
  const startEditingNote = (note: any) => {
    setEditingNote(note.id);
    setEditingNoteContent(note.content);
  };

  // Save note edit
  const saveNoteEdit = () => {
    if (!editingNote) return;
    
    updateNote(editingNote, {
      content: editingNoteContent,
    });
    
    setEditingNote(null);
    setEditingNoteContent('');
  };

  // Cancel note edit
  const cancelNoteEdit = () => {
    setEditingNote(null);
    setEditingNoteContent('');
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // Get highlight color classes
  const getHighlightColorClass = (color: string) => {
    const colorMap = {
      yellow: 'bg-yellow-200 border-yellow-400',
      green: 'bg-green-200 border-green-400',
      blue: 'bg-blue-200 border-blue-400',
      pink: 'bg-pink-200 border-pink-400',
      orange: 'bg-orange-200 border-orange-400',
      purple: 'bg-purple-200 border-purple-400',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.yellow;
  };

  // Get note type color
  const getNoteTypeColor = (type: string) => {
    const typeMap = {
      general: 'bg-gray-100 text-gray-800',
      summary: 'bg-blue-100 text-blue-800',
      question: 'bg-orange-100 text-orange-800',
      insight: 'bg-green-100 text-green-800',
      quote: 'bg-purple-100 text-purple-800',
    };
    return typeMap[type as keyof typeof typeMap] || typeMap.general;
  };

  return (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -320, opacity: 0 }}
      transition={{ type: 'tween', duration: 0.3 }}
      className={`fixed left-0 top-16 bottom-0 w-80 ${themeClasses[settings.theme]} border-r shadow-lg z-40 flex flex-col`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Reading Tools</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
              settings.theme === 'light'
                ? 'border-gray-300 bg-white'
                : settings.theme === 'dark'
                ? 'border-gray-600 bg-gray-700'
                : 'border-amber-300 bg-amber-100'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'notes', label: 'Notes', icon: StickyNote, count: filteredNotes.length },
          { id: 'highlights', label: 'Highlights', icon: Highlighter, count: filteredHighlights.length },
          { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, count: filteredBookmarks.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setLeftDrawerTab(tab.id as any)}
            className={`flex-1 flex flex-col items-center py-3 px-2 border-b-2 transition-colors ${
              drawerState.activeLeftTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : `${tabClasses[settings.theme]} border-transparent`
            }`}
          >
            <tab.icon className="w-4 h-4 mb-1" />
            <span className="text-xs font-medium">{tab.label}</span>
            {tab.count > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mt-1">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Notes Tab */}
        {drawerState.activeLeftTab === 'notes' && (
          <div className="p-4 space-y-4">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-8">
                <StickyNote className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">No notes yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Select text and add notes while reading
                </p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg border ${
                    settings.theme === 'light'
                      ? 'bg-gray-50 border-gray-200'
                      : settings.theme === 'dark'
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-amber-100 border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded ${getNoteTypeColor(note.type)}`}>
                      {note.type}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => startEditingNote(note)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => note.position && navigateToPosition(note.position)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  {editingNote === note.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingNoteContent}
                        onChange={(e) => setEditingNoteContent(e.target.value)}
                        className="w-full p-2 text-sm rounded border resize-none"
                        rows={3}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={saveNoteEdit}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelNoteEdit}
                          className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm mb-2">{note.content}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(note.createdAt)}
                    </span>
                    {note.pageNumber && (
                      <span>Page {note.pageNumber}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Highlights Tab */}
        {drawerState.activeLeftTab === 'highlights' && (
          <div className="p-4 space-y-4">
            {filteredHighlights.length === 0 ? (
              <div className="text-center py-8">
                <Highlighter className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">No highlights yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Select text to create highlights
                </p>
              </div>
            ) : (
              filteredHighlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className={`p-3 rounded-lg border ${
                    settings.theme === 'light'
                      ? 'bg-gray-50 border-gray-200'
                      : settings.theme === 'dark'
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-amber-100 border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-4 h-4 rounded ${getHighlightColorClass(highlight.color)}`} />
                    <div className="flex space-x-1">
                      <button
                        onClick={() => navigateToPosition(highlight.startOffset)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteHighlight(highlight.id)}
                        className="p-1 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm mb-2 italic">
                    "{highlight.selectedText.substring(0, 100)}
                    {highlight.selectedText.length > 100 ? '...' : ''}"
                  </p>
                  
                  {highlight.note && (
                    <p className="text-xs text-gray-600 mb-2 p-2 bg-gray-100 dark:bg-gray-600 rounded">
                      {highlight.note}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(highlight.createdAt)}
                    </span>
                    {highlight.pageNumber && (
                      <span>Page {highlight.pageNumber}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Bookmarks Tab */}
        {drawerState.activeLeftTab === 'bookmarks' && (
          <div className="p-4 space-y-4">
            {filteredBookmarks.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">No bookmarks yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Add bookmarks to save important locations
                </p>
              </div>
            ) : (
              filteredBookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                    settings.theme === 'light'
                      ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      : settings.theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-amber-100 border-amber-200 hover:bg-amber-200'
                  }`}
                  onClick={() => navigateToPosition(bookmark.position)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{bookmark.title}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBookmark(bookmark.id);
                      }}
                      className="p-1 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {bookmark.description && (
                    <p className="text-xs text-gray-600 mb-2">
                      {bookmark.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(bookmark.createdAt)}
                    </span>
                    {bookmark.pageNumber && (
                      <span>Page {bookmark.pageNumber}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
} 