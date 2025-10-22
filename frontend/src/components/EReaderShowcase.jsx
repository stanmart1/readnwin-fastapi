import { useState } from 'react';
import { motion } from 'framer-motion';

export default function EReaderShowcase() {
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState('light');

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

  const cycleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'sepia' : 'light');
  };

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mb-4">
            <i className="ri-tablet-line mr-2"></i>
            E-Reader Technology
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Advanced E-Reader Experience
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of reading with our cutting-edge e-reader technology. 
            Designed for comfort, productivity, and pure reading joy.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Column - Benefits */}
          <div className="space-y-4 md:space-y-6 order-2 lg:order-1">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-4 p-4 rounded-xl hover:bg-white/50 transition-all duration-300"
              >
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
              </motion.div>
            ))}
          </div>
          
          {/* Right Column - E-Reader Simulator */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative order-1 lg:order-2"
          >
            <div className={`${currentTheme.bg} ${currentTheme.border} border-2 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md mx-auto transition-all duration-300`}>
              {/* Reader Header */}
              <div className={`${currentTheme.bg} ${currentTheme.border} border-b px-3 md:px-4 py-2 md:py-3 flex items-center justify-between`}>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <i className="ri-book-line text-base md:text-lg text-blue-600"></i>
                  <span className={`font-medium text-sm md:text-base ${currentTheme.text}`}>Sample Book</span>
                </div>
                <div className="flex items-center space-x-1 md:space-x-2">
                  <button
                    onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                    className={`p-1 rounded text-sm md:text-base ${currentTheme.text} hover:bg-gray-100 transition-colors`}
                  >
                    <i className="ri-subtract-line"></i>
                  </button>
                  <span className={`text-xs md:text-sm ${currentTheme.text}`}>{fontSize}px</span>
                  <button
                    onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                    className={`p-1 rounded text-sm md:text-base ${currentTheme.text} hover:bg-gray-100 transition-colors`}
                  >
                    <i className="ri-add-line"></i>
                  </button>
                </div>
              </div>

              {/* Reader Content */}
              <div className="p-4 md:p-6 h-[300px] md:h-[400px] overflow-y-auto">
                <div 
                  className={`${currentTheme.text} leading-relaxed transition-all duration-300 select-text`}
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {sampleText}
                </div>
              </div>

              {/* Reader Footer */}
              <div className={`${currentTheme.bg} ${currentTheme.border} border-t px-3 md:px-4 py-2 md:py-3 flex items-center justify-between`}>
                <div className="flex items-center space-x-2 md:space-x-4">
                  <button
                    onClick={cycleTheme}
                    className={`p-1.5 md:p-2 rounded-lg text-sm md:text-base ${currentTheme.text} hover:bg-gray-100 transition-colors`}
                    title="Change theme"
                  >
                    <i className="ri-contrast-2-line"></i>
                  </button>
                  <button className={`p-1.5 md:p-2 rounded-lg text-sm md:text-base ${currentTheme.text} hover:bg-gray-100 transition-colors`} title="Bookmark">
                    <i className="ri-bookmark-line"></i>
                  </button>
                  <button className={`p-1.5 md:p-2 rounded-lg text-sm md:text-base ${currentTheme.text} hover:bg-gray-100 transition-colors`} title="Highlight">
                    <i className="ri-edit-line"></i>
                  </button>
                </div>
                <div className={`text-xs md:text-sm ${currentTheme.text}`}>
                  Page 1 of 156
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="hidden md:flex absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full items-center justify-center shadow-lg"
            >
              <i className="ri-bookmark-line text-white text-lg"></i>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
