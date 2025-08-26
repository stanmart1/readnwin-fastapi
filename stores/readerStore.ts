'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  Book, 
  ReadingProgress, 
  Highlight, 
  Note, 
  Bookmark, 
  ReaderSettings, 
  ReadingAnalytics, 
  TextToSpeechSettings,
  DrawerState,
  ReadingSession,
  ProcessedContent
} from '@/types/ereader';

interface ReaderStore {
  // Current state
  currentBook: Book | null;
  processedContent: ProcessedContent | null;
  currentPosition: number;
  isLoading: boolean;
  error: string | null;

  // Settings
  settings: ReaderSettings;
  ttsSettings: TextToSpeechSettings;
  
  // Drawer state
  drawerState: DrawerState;
  
  // Reading session
  currentSession: ReadingSession | null;
  sessionStartTime: Date | null;
  
  // Annotations
  highlights: Highlight[];
  notes: Note[];
  bookmarks: Bookmark[];
  
  // Progress tracking
  readingProgress: Record<string, ReadingProgress>; // bookId -> progress
  
  // Analytics
  analytics: ReadingAnalytics | null;
  
  // Actions - Book Management
  setCurrentBook: (book: Book | null) => void;
  setProcessedContent: (content: ProcessedContent | null) => void;
  updateCurrentPosition: (position: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions - Settings
  updateSettings: (settings: Partial<ReaderSettings>) => void;
  updateTTSSettings: (settings: Partial<TextToSpeechSettings>) => void;
  resetSettings: () => void;
  
  // Actions - Drawer Management
  toggleLeftDrawer: () => void;
  toggleRightDrawer: () => void;
  setLeftDrawerTab: (tab: 'notes' | 'highlights' | 'bookmarks') => void;
  setRightDrawerTab: (tab: 'display' | 'reading' | 'audio' | 'general') => void;
  closeAllDrawers: () => void;
  
  // Actions - Reading Session
  startSession: (book: Book) => void;
  endSession: () => void;
  updateSessionProgress: (position: number, wordsRead: number) => void;
  
  // Actions - Annotations
  addHighlight: (highlight: Omit<Highlight, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateHighlight: (id: string, updates: Partial<Highlight>) => void;
  deleteHighlight: (id: string) => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  deleteBookmark: (id: string) => void;
  
  // Actions - Progress
  updateReadingProgress: (bookId: string, progress: Partial<ReadingProgress>) => void;
  getBookProgress: (bookId: string) => ReadingProgress | null;
  
  // Actions - Navigation
  navigateToPreviousPage: () => void;
  navigateToNextPage: () => void;
  goToPage: (pageNumber: number) => void;
  getCurrentPage: () => number;
  getTotalPages: () => number;
  
  // Actions - Analytics
  updateAnalytics: (analytics: Partial<ReadingAnalytics>) => void;
  
  // Utility actions
  clearBookData: () => void;
  exportData: () => string;
  importData: (data: string) => void;
}

// Default settings
const defaultSettings: ReaderSettings = {
  fontSize: 16,
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  lineHeight: 1.6,
  theme: 'light',
  readingWidth: 70,
  marginHorizontal: 20,
  marginVertical: 20,
  autoTheme: false,
  textAlign: 'left',
  columnCount: 1,
};

const defaultTTSSettings: TextToSpeechSettings = {
  enabled: false,
  rate: 1.0,
  pitch: 1.0,
  volume: 0.8,
  highlightCurrentSentence: true,
  autoPlay: false,
};

const defaultDrawerState: DrawerState = {
  leftDrawerOpen: false,
  rightDrawerOpen: false,
  activeLeftTab: 'notes',
  activeRightTab: 'display',
};

export const useReaderStore = create<ReaderStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentBook: null,
      processedContent: null,
      currentPosition: 0,
      isLoading: false,
      error: null,
      
      settings: defaultSettings,
      ttsSettings: defaultTTSSettings,
      drawerState: defaultDrawerState,
      
      currentSession: null,
      sessionStartTime: null,
      
      highlights: [],
      notes: [],
      bookmarks: [],
      readingProgress: {},
      analytics: null,

      // Book Management Actions
      setCurrentBook: (book) => set({ currentBook: book }),
      
      setProcessedContent: (content) => set({ processedContent: content }),
      
      updateCurrentPosition: (position) => {
        set({ currentPosition: position });
        
        // Update reading progress for current book and sync with backend
        const { currentBook, readingProgress } = get();
        if (currentBook) {
          const existingProgress = readingProgress[currentBook.id] || {
            bookId: currentBook.id,
            userId: '',
            currentPosition: 0,
            progressPercentage: 0,
            lastReadAt: new Date(),
            totalTimeSpent: 0,
            sessionCount: 0,
            pagesRead: 0,
            wordsRead: 0,
          };

          const totalLength = get().processedContent?.plainText.length || 1;
          const progressPercentage = Math.min(100, (position / totalLength) * 100);

          set({
            readingProgress: {
              ...readingProgress,
              [currentBook.id]: {
                ...existingProgress,
                currentPosition: position,
                progressPercentage,
                lastReadAt: new Date(),
              }
            }
          });
          
          // Sync with backend
          try {
            const token = localStorage.getItem('token');
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/books/${currentBook.id}/progress`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                currentChapter: Math.floor(position / 1000),
                totalChapters: Math.floor(totalLength / 1000),
                progress: progressPercentage,
                currentPosition: position
              }),
            });
          } catch (error) {
            console.error('Failed to sync progress:', error);
          }
        }
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Settings Actions
      updateSettings: (newSettings) => 
        set((state) => ({ 
          settings: { ...state.settings, ...newSettings } 
        })),
        
      updateTTSSettings: (newSettings) =>
        set((state) => ({
          ttsSettings: { ...state.ttsSettings, ...newSettings }
        })),
        
      resetSettings: () => 
        set({ 
          settings: defaultSettings,
          ttsSettings: defaultTTSSettings 
        }),

      // Drawer Actions
      toggleLeftDrawer: () => 
        set((state) => ({
          drawerState: {
            ...state.drawerState,
            leftDrawerOpen: !state.drawerState.leftDrawerOpen,
            rightDrawerOpen: false, // Close other drawer
          }
        })),
        
      toggleRightDrawer: () =>
        set((state) => ({
          drawerState: {
            ...state.drawerState,
            rightDrawerOpen: !state.drawerState.rightDrawerOpen,
            leftDrawerOpen: false, // Close other drawer
          }
        })),
        
      setLeftDrawerTab: (tab) =>
        set((state) => ({
          drawerState: { ...state.drawerState, activeLeftTab: tab }
        })),
        
      setRightDrawerTab: (tab) =>
        set((state) => ({
          drawerState: { ...state.drawerState, activeRightTab: tab }
        })),
        
      closeAllDrawers: () =>
        set((state) => ({
          drawerState: {
            ...state.drawerState,
            leftDrawerOpen: false,
            rightDrawerOpen: false,
          }
        })),

      // Session Actions
      startSession: (book) => {
        const sessionId = `session_${Date.now()}_${Math.random()}`;
        const session: ReadingSession = {
          id: sessionId,
          bookId: book.id,
          userId: '', // Will be updated with actual user ID
          startTime: new Date(),
          duration: 0,
          startPosition: get().currentPosition,
          endPosition: get().currentPosition,
          wordsRead: 0,
          pagesRead: 0,
          deviceInfo: {
            userAgent: navigator.userAgent,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
          }
        };
        
        set({ 
          currentSession: session,
          sessionStartTime: new Date()
        });
      },
      
      endSession: () => {
        const { currentSession, sessionStartTime } = get();
        if (currentSession && sessionStartTime) {
          const endTime = new Date();
          const duration = Math.floor((endTime.getTime() - sessionStartTime.getTime()) / 1000);
          
          set({
            currentSession: null,
            sessionStartTime: null,
          });
          
          // Here you would typically save the session to the backend
        }
      },
      
      updateSessionProgress: (position, wordsRead) => {
        const { currentSession } = get();
        if (currentSession) {
          set({
            currentSession: {
              ...currentSession,
              endPosition: position,
              wordsRead: currentSession.wordsRead + wordsRead,
            }
          });
        }
      },

      // Annotation Actions
      addHighlight: (highlightData) => {
        const highlight: Highlight = {
          ...highlightData,
          id: `highlight_${Date.now()}_${Math.random()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          highlights: [...state.highlights, highlight]
        }));
      },
      
      updateHighlight: (id, updates) =>
        set((state) => ({
          highlights: state.highlights.map(h => 
            h.id === id ? { ...h, ...updates, updatedAt: new Date() } : h
          )
        })),
        
      deleteHighlight: (id) =>
        set((state) => ({
          highlights: state.highlights.filter(h => h.id !== id)
        })),
        
      addNote: (noteData) => {
        const note: Note = {
          ...noteData,
          id: `note_${Date.now()}_${Math.random()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          notes: [...state.notes, note]
        }));
      },
      
      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map(n => 
            n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n
          )
        })),
        
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter(n => n.id !== id)
        })),
        
      addBookmark: (bookmarkData) => {
        const bookmark: Bookmark = {
          ...bookmarkData,
          id: `bookmark_${Date.now()}_${Math.random()}`,
          createdAt: new Date(),
        };
        
        set((state) => ({
          bookmarks: [...state.bookmarks, bookmark]
        }));
      },
      
      deleteBookmark: (id) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter(b => b.id !== id)
        })),

      // Progress Actions
      updateReadingProgress: (bookId, progressUpdate) =>
        set((state) => ({
          readingProgress: {
            ...state.readingProgress,
            [bookId]: {
              ...state.readingProgress[bookId],
              ...progressUpdate,
            }
          }
        })),
        
      getBookProgress: (bookId) => {
        const { readingProgress } = get();
        return readingProgress[bookId] || null;
      },

      // Navigation Actions
      navigateToPreviousPage: () => {
        const { currentPosition, processedContent } = get();
        if (!processedContent) return;
        
        // Calculate page size (approximate)
        const pageSize = Math.floor(processedContent.plainText.length / 100); // 100 pages per book
        const currentPage = Math.floor(currentPosition / pageSize);
        const newPage = Math.max(1, currentPage - 1);
        const newPosition = newPage * pageSize;
        
        set({ currentPosition: newPosition });
      },
      
      navigateToNextPage: () => {
        const { currentPosition, processedContent } = get();
        if (!processedContent) return;
        
        // Calculate page size (approximate)
        const pageSize = Math.floor(processedContent.plainText.length / 100); // 100 pages per book
        const currentPage = Math.floor(currentPosition / pageSize);
        const newPage = Math.min(100, currentPage + 1);
        const newPosition = newPage * pageSize;
        
        set({ currentPosition: newPosition });
      },
      
      goToPage: (pageNumber) => {
        const { processedContent } = get();
        if (!processedContent) return;
        
        const pageSize = Math.floor(processedContent.plainText.length / 100);
        const newPosition = (pageNumber - 1) * pageSize;
        
        set({ currentPosition: newPosition });
      },
      
      getCurrentPage: () => {
        const { currentPosition, processedContent } = get();
        if (!processedContent) return 1;
        
        const pageSize = Math.floor(processedContent.plainText.length / 100);
        return Math.floor(currentPosition / pageSize) + 1;
      },
      
      getTotalPages: () => {
        const { processedContent } = get();
        if (!processedContent) return 1;
        
        return 100; // Fixed total pages for now
      },

      // Analytics Actions
      updateAnalytics: (analyticsUpdate) =>
        set((state) => ({
          analytics: state.analytics 
            ? { ...state.analytics, ...analyticsUpdate }
            : analyticsUpdate as ReadingAnalytics
        })),

      // Utility Actions
      clearBookData: () => set({
        currentBook: null,
        processedContent: null,
        currentPosition: 0,
        currentSession: null,
        sessionStartTime: null,
        error: null,
      }),
      
      exportData: () => {
        const state = get();
        return JSON.stringify({
          highlights: state.highlights,
          notes: state.notes,
          bookmarks: state.bookmarks,
          readingProgress: state.readingProgress,
          settings: state.settings,
          ttsSettings: state.ttsSettings,
          analytics: state.analytics,
        });
      },
      
      importData: (data) => {
        try {
          const parsed = JSON.parse(data);
          set({
            highlights: parsed.highlights || [],
            notes: parsed.notes || [],
            bookmarks: parsed.bookmarks || [],
            readingProgress: parsed.readingProgress || {},
            settings: { ...defaultSettings, ...parsed.settings },
            ttsSettings: { ...defaultTTSSettings, ...parsed.ttsSettings },
            analytics: parsed.analytics || null,
          });
        } catch (error) {
          console.error('Failed to import data:', error);
          set({ error: 'Failed to import data' });
        }
      },
    }),
    {
      name: 'reader-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        ttsSettings: state.ttsSettings,
        highlights: state.highlights,
        notes: state.notes,
        bookmarks: state.bookmarks,
        readingProgress: state.readingProgress,
        analytics: state.analytics,
      }),
    }
  )
); 