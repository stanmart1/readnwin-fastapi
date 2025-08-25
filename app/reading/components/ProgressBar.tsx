'use client';

import React from 'react';
import { useReaderStore } from '@/stores/readerStore';

export default function ProgressBar() {
  const { currentPosition, processedContent, settings } = useReaderStore();

  if (!processedContent) return null;

  // Calculate progress based on current position
  const contentLength = processedContent.plainText.length;
  const progress = contentLength > 0 ? Math.min(100, (currentPosition / contentLength) * 100) : 0;

  const themeClasses = {
    light: 'bg-gray-200',
    dark: 'bg-gray-700',
    sepia: 'bg-amber-200',
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1">
      <div className={`w-full h-full ${themeClasses[settings.theme]}`}>
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
} 