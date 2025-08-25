'use client';

import React, { forwardRef, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useReaderStore } from '@/stores/readerStore';
import { ProcessedContent } from '@/types/ereader';

interface ReadingContentProps {
  content: ProcessedContent;
  onScroll: () => void;
}

const ReadingContent = forwardRef<HTMLDivElement, ReadingContentProps>(
  ({ content, onScroll }, ref) => {
    const { settings, highlights, currentBook, currentPosition } = useReaderStore();
    const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Handle scroll with debouncing
    const handleScroll = () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      
      scrollTimerRef.current = setTimeout(() => {
        onScroll();
      }, 100);
    };

    useEffect(() => {
      return () => {
        if (scrollTimerRef.current) {
          clearTimeout(scrollTimerRef.current);
        }
      };
    }, []);

    // Scroll to current position when it changes
    useEffect(() => {
      if (contentRef.current && currentPosition > 0) {
        // Calculate approximate scroll position based on current position
        const contentLength = content.plainText.length;
        const scrollPercentage = currentPosition / contentLength;
        const scrollHeight = contentRef.current.scrollHeight - contentRef.current.clientHeight;
        const targetScrollTop = scrollHeight * scrollPercentage;
        
        contentRef.current.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    }, [currentPosition, content.plainText.length]);

    // Apply highlights to content
    const applyHighlights = (text: string) => {
      if (!highlights.length || !currentBook) return text;

      let highlightedText = text;
      const bookHighlights = highlights.filter(h => h.bookId === currentBook.id);
      
      // Sort highlights by position to avoid conflicts
      bookHighlights
        .sort((a, b) => a.startOffset - b.startOffset)
        .forEach((highlight) => {
          const before = highlightedText.substring(0, highlight.startOffset);
          const highlighted = highlightedText.substring(highlight.startOffset, highlight.endOffset);
          const after = highlightedText.substring(highlight.endOffset);
          
          const highlightClass = `bg-${highlight.color}-200 border-l-2 border-${highlight.color}-400 px-1 rounded`;
          
          highlightedText = `${before}<span class="${highlightClass}" data-highlight-id="${highlight.id}">${highlighted}</span>${after}`;
        });

      return highlightedText;
    };

    const themeClasses = {
      light: 'bg-white text-gray-900',
      dark: 'bg-gray-900 text-gray-100',
      sepia: 'bg-amber-50 text-amber-900',
    };

    const contentStyles = {
      fontSize: `${settings.fontSize}px`,
      lineHeight: settings.lineHeight,
      fontFamily: settings.fontFamily,
      textAlign: settings.textAlign as any,
      maxWidth: `${settings.readingWidth}%`,
      paddingLeft: `${settings.marginHorizontal}px`,
      paddingRight: `${settings.marginHorizontal}px`,
      paddingTop: `${settings.marginVertical}px`,
      paddingBottom: `${settings.marginVertical}px`,
    };

    // Custom components for ReactMarkdown
    const markdownComponents = {
      h1: ({ children, ...props }: any) => (
        <h1 
          className="text-3xl font-bold mb-6 mt-8 scroll-mt-20" 
          {...props}
        >
          {children}
        </h1>
      ),
      h2: ({ children, ...props }: any) => (
        <h2 
          className="text-2xl font-semibold mb-4 mt-6 scroll-mt-20" 
          {...props}
        >
          {children}
        </h2>
      ),
      h3: ({ children, ...props }: any) => (
        <h3 
          className="text-xl font-medium mb-3 mt-5 scroll-mt-20" 
          {...props}
        >
          {children}
        </h3>
      ),
      h4: ({ children, ...props }: any) => (
        <h4 
          className="text-lg font-medium mb-2 mt-4 scroll-mt-20" 
          {...props}
        >
          {children}
        </h4>
      ),
      h5: ({ children, ...props }: any) => (
        <h5 
          className="text-base font-medium mb-2 mt-3 scroll-mt-20" 
          {...props}
        >
          {children}
        </h5>
      ),
      h6: ({ children, ...props }: any) => (
        <h6 
          className="text-sm font-medium mb-2 mt-2 scroll-mt-20" 
          {...props}
        >
          {children}
        </h6>
      ),
      p: ({ children, ...props }: any) => (
        <p 
          className="mb-4 leading-relaxed" 
          {...props}
        >
          {children}
        </p>
      ),
      blockquote: ({ children, ...props }: any) => (
        <blockquote 
          className="border-l-4 border-blue-500 pl-4 my-4 italic opacity-80" 
          {...props}
        >
          {children}
        </blockquote>
      ),
      ul: ({ children, ...props }: any) => (
        <ul 
          className="list-disc list-inside mb-4 space-y-1" 
          {...props}
        >
          {children}
        </ul>
      ),
      ol: ({ children, ...props }: any) => (
        <ol 
          className="list-decimal list-inside mb-4 space-y-1" 
          {...props}
        >
          {children}
        </ol>
      ),
      li: ({ children, ...props }: any) => (
        <li 
          className="ml-4" 
          {...props}
        >
          {children}
        </li>
      ),
      code: ({ children, ...props }: any) => (
        <code 
          className={`px-1 py-0.5 rounded text-sm font-mono ${
            settings.theme === 'light' 
              ? 'bg-gray-100 text-gray-800' 
              : settings.theme === 'dark'
              ? 'bg-gray-800 text-gray-200'
              : 'bg-amber-100 text-amber-800'
          }`}
          {...props}
        >
          {children}
        </code>
      ),
      pre: ({ children, ...props }: any) => (
        <pre 
          className={`p-4 rounded-lg overflow-x-auto mb-4 ${
            settings.theme === 'light' 
              ? 'bg-gray-100 text-gray-800' 
              : settings.theme === 'dark'
              ? 'bg-gray-800 text-gray-200'
              : 'bg-amber-100 text-amber-800'
          }`}
          {...props}
        >
          {children}
        </pre>
      ),
      img: ({ src, alt, ...props }: any) => (
        <img 
          src={src} 
          alt={alt} 
          className="max-w-full h-auto rounded-lg my-4 mx-auto block"
          loading="lazy"
          {...props}
        />
      ),
      a: ({ href, children, ...props }: any) => (
        <a 
          href={href} 
          className="text-blue-600 hover:text-blue-800 underline"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      ),
      table: ({ children, ...props }: any) => (
        <div className="overflow-x-auto mb-4">
          <table 
            className={`min-w-full border-collapse border ${
              settings.theme === 'light' 
                ? 'border-gray-300' 
                : settings.theme === 'dark'
                ? 'border-gray-600'
                : 'border-amber-300'
            }`}
            {...props}
          >
            {children}
          </table>
        </div>
      ),
      th: ({ children, ...props }: any) => (
        <th 
          className={`border px-4 py-2 text-left font-semibold ${
            settings.theme === 'light' 
              ? 'border-gray-300 bg-gray-50' 
              : settings.theme === 'dark'
              ? 'border-gray-600 bg-gray-800'
              : 'border-amber-300 bg-amber-100'
          }`}
          {...props}
        >
          {children}
        </th>
      ),
      td: ({ children, ...props }: any) => (
        <td 
          className={`border px-4 py-2 ${
            settings.theme === 'light' 
              ? 'border-gray-300' 
              : settings.theme === 'dark'
              ? 'border-gray-600'
              : 'border-amber-300'
          }`}
          {...props}
        >
          {children}
        </td>
      ),
    };

    return (
      <div
        ref={contentRef}
        className={`h-full overflow-y-auto ${themeClasses[settings.theme]} transition-colors duration-300`}
        onScroll={handleScroll}
      >
        <div className="min-h-full">
          <article 
            className="mx-auto prose prose-lg max-w-none"
            style={contentStyles}
          >
            {currentBook?.contentType === 'markdown' ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {content.plainText}
              </ReactMarkdown>
            ) : (
              // Content is already sanitized by ContentProcessor before reaching this component
              <div
                dangerouslySetInnerHTML={{ 
                  __html: applyHighlights(content.html) 
                }}
                className="sanitized-content"
              />
            )}
          </article>
          
          {/* Bottom padding for comfortable reading */}
          <div className="h-32"></div>
        </div>
      </div>
    );
  }
);

ReadingContent.displayName = 'ReadingContent';

export default ReadingContent; 