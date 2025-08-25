# E-Reader Implementation Task Guide for AI Assistant

## Project Overview
Create a mobile-first e-reader in FastAPI with support for HTML files, reading progress tracking, analytics, customization options, highlighting, and note-taking.

## Task 2: Core File Processing System
- Create HTML sanitization and rendering system
- Build file upload/import system for both markdown and HTML files
- Implement word count calculation for analytics
- Create content preprocessing for better text selection and highlighting

## Task 3: State Management Setup
- Design Zustand store with sections for: current book, user settings, highlights, notes, reading progress, analytics
- Implement localStorage persistence for all user data
- Create actions for: loading/saving books, updating settings, managing highlights/notes, tracking progress
- Add session management for reading time tracking
- Implement data synchronization between components

## Task 4: Mobile-First Reader Component with Drawer Integration
- Create responsive reader container with proper mobile viewport handling
- Design main content area that adjusts when drawers are open
- Implement drawer toggle buttons in fixed header/navigation
- Create swipe gesture system for both page navigation and drawer controls
- Ensure proper touch event handling doesn't conflict between content and drawer gestures
- Design floating action buttons for quick access to highlighting and note-taking
- Implement smooth scrolling with progress tracking
- Add proper mobile keyboard handling for note-taking

## Task 5: Reading Progress System
- Track scroll position and convert to reading percentage
- Implement intersection observer to track which section is currently being read
- Calculate and store time spent reading per session
- Create visual progress indicator (progress bar at top)
- Save progress automatically every 30 seconds or on scroll stop
- Restore reading position when reopening a book

## Task 6: Text Highlighting Feature (Left Drawer Integration)
- Implement text selection detection across nHTML content
- Create highlight overlay system with different color options in right drawer
- Store highlight positions using text offsets or DOM ranges
- Build highlight management UI in left drawer's "Highlights" tab
- Display highlights list with color-coded organization and quick navigation
- Add highlight editing options (color change, delete) from left drawer
- Ensure highlights persist across sessions and content re-renders
- Handle highlights in both markdown and HTML content types
- Create click-to-navigate functionality from highlight list to text position

## Task 7: Note-Taking System (Left Drawer Integration)
- Create floating note creation interface triggered by text selection
- Store notes and display them in left drawer's "Notes" tab
- Build comprehensive note management in left drawer (list, search, edit, delete)
- Design note attachment to specific text positions with quick navigation
- Implement note categories or tags system within left drawer
- Add note-to-highlight conversion feature
- Create date-based organization and filtering in notes tab
- Add export functionality for notes accessible from left drawer

## Task 8: Font and Display Customization (Right Drawer)
- Move all customization controls to right side drawer settings panel
- Create organized sections: Typography, Display, Layout, Theme
- Implement sliders for font size (12px-24px range) with live preview
- Add font family selector with web-safe and Google Fonts options
- Include line height adjustment (1.2x-2.0x range)
- Create margin/padding controls for reading comfort
- Add reading width adjustment for different screen sizes
- Implement live preview that updates main reader content as user adjusts
- Store all preferences in localStorage with drawer state persistence

## Task 9: Theme System (Right Drawer Integration)
- Integrate theme selector into right drawer settings
- Design three themes: Light, Dark, and Sepia with preview thumbnails
- Create CSS custom properties for easy theme switching
- Implement smooth transitions between themes that apply to drawers too
- Ensure proper contrast ratios for accessibility in all themes
- Apply consistent theming to drawers, reader content, highlights, and notes
- Add system theme detection and auto-switching option in drawer settings

## Task 10: Text-to-Speech Integration (Right Drawer Controls)
- Integrate Web Speech API controls into right drawer settings
- Create dedicated Audio section in right drawer with playback controls
- Implement play, pause, stop buttons with current position indicator
- Add voice selection dropdown if multiple voices available
- Create speed control slider (0.5x to 2x) in drawer
- Add sentence-by-sentence highlighting during playbook in main content
- Handle pause/resume functionality with position memory
- Include audio settings persistence in drawer state

## Task 11: Reading Analytics Dashboard
- Track daily reading time and create streak counters
- Calculate words per minute reading speed
- Create progress charts showing reading habits over time
- Implement daily/weekly/monthly reading goals
- Track books completed and pages read
- Design mobile-friendly analytics visualization using charts

## Task 12: Side Drawer Navigation System
- Create left side drawer with tabbed interface for Notes and Highlights
- Design right side drawer for all e-reader settings and customization options
- Implement swipe gestures to open/close drawers from screen edges
- Add toggle buttons/icons in header for drawer controls
- Create overlay system that dims main content when drawers are open
- Implement proper z-index stacking and drawer animations
- Ensure drawers work properly on different mobile screen sizes
- Add backdrop click-to-close functionality

### Left Drawer (Notes & Highlights)
- Create tabbed interface with "Notes" and "Highlights" tabs
- Design list view for notes with search and filter options
- Create highlight list with color-coded organization
- Add quick navigation to specific note/highlight positions in text
- Implement edit/delete actions for notes and highlights
- Create date-based grouping and sorting options
- Add export functionality for notes and highlights

### Right Drawer (Settings)
- Organize settings into logical sections (Display, Reading, Audio, General)
- Create collapsible sections for better mobile organization
- Implement real-time preview of setting changes
- Add reset to defaults functionality
- Create settings search functionality
- Include theme selector with preview thumbnails
- Add accessibility settings section

## Task 13: Mobile UI/UX Optimization
- Create gesture-based navigation (swipe for pages, pinch for font size)
- Add haptic feedback for interactions (if supported)
- Design thumb-friendly button placement for drawer triggers
- Implement proper mobile keyboard handling
- Add pull-to-refresh for content updates
- Optimize drawer animations for smooth mobile performance

## Task 13: Performance Optimization
- Implement virtual scrolling for very long documents
- Add lazy loading for images in HTML content
- Create content chunking for better memory management
- Optimize re-renders using React.memo and useMemo
- Implement debounced progress saving
- Add loading states and skeleton screens

## Task 14: Data Persistence and Sync
- Create robust localStorage system with data validation
- Implement data backup/restore functionality
- Add export features for highlights and notes (JSON, CSV)
- Create data migration system for future updates
- Handle storage quota exceeded scenarios
- Add data compression for large books

## Task 15: Accessibility Features
- Implement proper ARIA labels and roles
- Add keyboard navigation support
- Create high contrast mode option
- Ensure screen reader compatibility
- Add focus management for mobile users
- Implement voice commands for hands-free reading

## Task 16: Testing and Error Handling
- Add error boundaries for component crashes
- Implement graceful handling of corrupted files
- Create fallbacks for unsupported browser features
- Add loading and error states for all async operations
- Test on various mobile devices and screen sizes
- Implement retry mechanisms for failed operations

## Implementation Priority Order
1. Tasks 1-3: Foundation (setup, file processing, state management)
2. Task 4: Core reader with drawer integration
3. Task 12: Side drawer system implementation  
4. Tasks 5: Reading progress functionality
5. Tasks 6-7: Notes and highlights with left drawer integration
6. Tasks 8-9: Settings and themes with right drawer integration
7. Tasks 10-11: Advanced features (TTS in right drawer, analytics)
8. Tasks 13-16: Polish and optimization

## Key Technical Considerations for Drawer System
- Use CSS transforms for smooth drawer animations
- Implement proper touch event handling to distinguish between drawer swipes and content navigation
- Use z-index layering: backdrop (100), drawers (200), modals (300)
- Handle drawer state in URL or localStorage for better UX
- Optimize drawer content rendering to avoid performance issues
- Ensure drawers work properly in both portrait and landscape orientations
- Add keyboard shortcuts for drawer toggles (accessibility)
- Handle drawer behavior during text-to-speech playback