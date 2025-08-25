
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EReaderShowcase() {
  const [currentPage, setCurrentPage] = useState(1);
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');

  const benefits = [
    {
      icon: 'ri-eye-line',
      title: 'Eye-Friendly Reading',
      description: 'Advanced e-ink technology with adjustable brightness and blue light filters for comfortable reading in any lighting condition.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: 'ri-settings-3-line',
      title: 'Customizable Experience',
      description: 'Personalize font size, spacing, themes, and reading modes to match your preferences and reading environment.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: 'ri-bookmark-line',
      title: 'Smart Annotations',
      description: 'Highlight, annotate, and bookmark important passages with automatic sync across all your devices.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: 'ri-bar-chart-line',
      title: 'Reading Analytics',
      description: 'Track your reading speed, progress, and habits with detailed insights and goal setting features.',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const sampleText = `In the quiet moments of early morning, when the world is still wrapped in the gentle embrace of dawn, there exists a sacred space where words come alive. This is the realm of the reader, where imagination takes flight and knowledge finds its home.

The digital age has transformed how we consume literature, but the essence of reading remains unchanged. It is still a journey of discovery, a conversation across time and space with authors who share their wisdom, stories, and dreams.

Our advanced e-reader technology bridges the gap between traditional book reading and modern convenience. With features designed to enhance your reading experience, every page becomes an opportunity to learn, grow, and be inspired.`;

  const themes = {
    light: { bg: 'bg-white', text: 'text-gray-900', border: 'border-gray-200' },
    dark: { bg: 'bg-gray-900', text: 'text-gray-100', border: 'border-gray-700' },
    sepia: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200' }
  };

  const currentTheme = themes[theme];

  return (
    <div className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Advanced E-Reader Experience
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of reading with our cutting-edge e-reader technology. 
            Designed for comfort, productivity, and pure reading joy.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Benefits */}
          <div className="space-y-8">
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-white/50 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${benefit.color} shadow-lg flex-shrink-0`}>
                    <i className={`${benefit.icon} text-white text-xl`}></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Column - E-Reader Simulator */}
          <div className="relative">
            <div className={`${currentTheme.bg} ${currentTheme.border} border-2 rounded-2xl shadow-2xl overflow-hidden max-w-md mx-auto`}>
              {/* Reader Header */}
              <div className={`${currentTheme.bg} ${currentTheme.border} border-b px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center space-x-3">
                  <i className="ri-book-line text-lg text-blue-600"></i>
                  <span className={`font-medium ${currentTheme.text}`}>Sample Book</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                    className={`p-1 rounded ${currentTheme.text} hover:bg-gray-100 dark:hover:bg-gray-800`}
                  >
                    <i className="ri-subtract-line"></i>
                  </button>
                  <span className={`text-sm ${currentTheme.text}`}>{fontSize}px</span>
                  <button
                    onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                    className={`p-1 rounded ${currentTheme.text} hover:bg-gray-100 dark:hover:bg-gray-800`}
                  >
                    <i className="ri-add-line"></i>
                  </button>
                </div>
              </div>

              {/* Reader Content */}
              <div className="p-6 min-h-[400px]">
                <div 
                  className={`${currentTheme.text} leading-relaxed`}
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {sampleText}
                </div>
              </div>

              {/* Reader Footer */}
              <div className={`${currentTheme.bg} ${currentTheme.border} border-t px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'sepia' : 'light')}
                    className={`p-2 rounded-lg ${currentTheme.text} hover:bg-gray-100 dark:hover:bg-gray-800`}
                    title="Change theme"
                  >
                    <i className="ri-contrast-2-line"></i>
                  </button>
                  <button className={`p-2 rounded-lg ${currentTheme.text} hover:bg-gray-100 dark:hover:bg-gray-800`} title="Bookmark">
                    <i className="ri-bookmark-line"></i>
                  </button>
                  <button className={`p-2 rounded-lg ${currentTheme.text} hover:bg-gray-100 dark:hover:bg-gray-800`} title="Highlight">
                    <i className="ri-edit-line"></i>
                  </button>
                </div>
                <div className={`text-sm ${currentTheme.text}`}>
                  Page {currentPage} of 156
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <i className="ri-bookmark-line text-white text-lg"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
