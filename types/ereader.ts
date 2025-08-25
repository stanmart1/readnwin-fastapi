// E-Reader TypeScript Interfaces

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  content?: string; // Markdown or HTML content
  contentType: 'markdown' | 'html';
  format?: string; // Book format (epub, pdf, etc.)
  fileUrl?: string; // URL to the book file
  totalPages?: number;
  wordCount?: number;
  category?: string;
  description?: string;
  publishedDate?: string;
  isbn?: string;
  language?: string;
  currentPage?: number;
  lastReadAt?: string;
  progress?: number; // Reading progress percentage
}

export interface ReadingProgress {
  bookId: string;
  userId: string;
  currentPosition: number; // Scroll position or page
  progressPercentage: number;
  lastReadAt: Date;
  totalTimeSpent: number; // in seconds
  sessionCount: number;
  pagesRead: number;
  wordsRead: number;
}

export interface Highlight {
  id: string;
  bookId: string;
  userId: string;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'orange' | 'purple';
  note?: string;
  pageNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  bookId: string;
  userId: string;
  content: string;
  type: 'general' | 'summary' | 'question' | 'insight' | 'quote';
  pageNumber?: number;
  position?: number; // Character position in text
  relatedHighlightId?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Bookmark {
  id: string;
  bookId: string;
  userId: string;
  title: string;
  description?: string;
  position: number; // Scroll position or page
  pageNumber?: number;
  createdAt: Date;
}

export interface ReaderSettings {
  fontSize: number; // 12-24px
  fontFamily: string;
  lineHeight: number; // 1.2-2.0
  theme: 'light' | 'dark' | 'sepia';
  readingWidth: number; // Percentage of screen width
  marginHorizontal: number;
  marginVertical: number;
  autoTheme: boolean; // Follow system theme
  textAlign: 'left' | 'center' | 'justify';
  columnCount: number; // For multi-column layout
}

export interface ReadingAnalytics {
  userId: string;
  dailyReadingTime: Record<string, number>; // Date -> minutes
  readingStreak: number;
  longestStreak: number;
  totalBooksRead: number;
  totalPagesRead: number;
  averageReadingSpeed: number; // Words per minute
  weeklyGoal: number; // Minutes per week
  monthlyGoal: number; // Minutes per month
  favoriteGenres: Record<string, number>;
  readingHeatmap: Record<string, number>; // Date -> reading intensity
}

export interface TextToSpeechSettings {
  enabled: boolean;
  voice?: string;
  rate: number; // 0.5-2.0
  pitch: number; // 0.5-2.0
  volume: number; // 0.0-1.0
  highlightCurrentSentence: boolean;
  autoPlay: boolean;
}

export interface ReadingSession {
  id: string;
  bookId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  startPosition: number;
  endPosition: number;
  wordsRead: number;
  pagesRead: number;
  deviceInfo: {
    userAgent: string;
    screenSize: string;
    orientation: 'portrait' | 'landscape';
  };
}

// Drawer-related interfaces
export interface DrawerState {
  leftDrawerOpen: boolean;
  rightDrawerOpen: boolean;
  activeLeftTab: 'notes' | 'highlights' | 'bookmarks';
  activeRightTab: 'display' | 'reading' | 'audio' | 'general';
}

// Content processing interfaces
export interface ProcessedContent {
  html: string;
  plainText: string;
  wordCount: number;
  estimatedReadingTime: number; // in minutes
  tableOfContents: TableOfContentsItem[];
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  level: number; // Heading level (1-6)
  position: number; // Character position
  children?: TableOfContentsItem[];
}

// Analytics and performance interfaces
export interface ReadingMetrics {
  sessionDuration: number;
  wordsPerMinute: number;
  pagesPerHour: number;
  comprehensionScore?: number;
  engagementLevel: number; // Based on interactions
}

export interface PerformanceMetrics {
  renderTime: number;
  scrollPerformance: number;
  memoryUsage: number;
  batteryImpact: number;
}

// Error handling
export interface ReaderError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: any;
  timestamp: Date;
} 