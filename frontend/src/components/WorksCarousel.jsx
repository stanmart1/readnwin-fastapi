import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../lib/fileService';
import { useWorks } from '../hooks';
import ProgressiveImage from './ProgressiveImage';

export default function WorksCarousel() {
  const { works, loading } = useWorks();
  const [selectedWork, setSelectedWork] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const autoPlayRef = useRef(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => prev - 1);
  }, []);

  const goToSlide = (index) => {
    // Offset by works.length to use middle set
    setCurrentIndex(works.length + index);
  };

  // Initialize to middle set for infinite scrolling
  useEffect(() => {
    if (works.length > 0) {
      setCurrentIndex(works.length);
    }
  }, [works.length]);

  // Handle infinite loop reset
  useEffect(() => {
    if (works.length === 0) return;

    const cardWidth = 336; // 320px width + 16px gap
    const threshold = cardWidth / 2;

    // Reset to middle section when reaching boundaries
    if (currentIndex * cardWidth >= works.length * 2 * cardWidth - threshold) {
      setCurrentIndex(currentIndex - works.length);
    } else if (currentIndex * cardWidth <= threshold) {
      setCurrentIndex(currentIndex + works.length);
    }
  }, [currentIndex, works.length]);

  // Auto-play every 5 seconds
  useEffect(() => {
    if (!isPaused && works.length > 0) {
      autoPlayRef.current = setInterval(nextSlide, 5000);
    }
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isPaused, nextSlide, works.length]);

  // Touch gesture handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-4">
            <i className="ri-briefcase-line mr-2"></i>
            Our Portfolio
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Some of Our Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore our innovative projects and solutions that are transforming the digital reading experience
          </p>
        </motion.div>

        {/* Carousel */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : works.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <i className="ri-image-line text-6xl mb-4"></i>
            <p>No works available</p>
          </div>
        ) : (
          <div 
            className="relative overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg rounded-full p-2 md:p-3 hover:bg-white transition-all"
              aria-label="Previous slide"
            >
              <i className="ri-arrow-left-line text-lg md:text-xl text-gray-700"></i>
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg rounded-full p-2 md:p-3 hover:bg-white transition-all"
              aria-label="Next slide"
            >
              <i className="ri-arrow-right-line text-lg md:text-xl text-gray-700"></i>
            </button>

            {/* Carousel Container */}
            <div className="relative overflow-hidden px-4 md:px-12">
              <motion.div
                animate={{ x: `-${currentIndex * 336}px` }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 300, 
                  damping: 30
                }}
                className="flex gap-6"
              >
                {[...works, ...works, ...works].map((work, index) => (
                  <motion.div
                    key={`${work.id}-${index}`}
                    className="flex-shrink-0 w-80 bg-white rounded-xl shadow-lg overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300"
                    onClick={() => setSelectedWork(work)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <WorkCard work={work} />
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {works.map((_, index) => {
                const activeIndex = currentIndex % works.length;
                return (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === activeIndex
                        ? 'w-8 bg-blue-600' 
                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Modal */}
        {selectedWork && (() => {
          const stripHtml = (html) => {
            if (typeof window === 'undefined') return html;
            const tmp = document.createElement('DIV');
            tmp.innerHTML = html || '';
            return tmp.textContent || tmp.innerText || '';
          };
          const plainDescription = stripHtml(selectedWork.description);
          
          return (
            <div
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedWork(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative h-64">
                  <ProgressiveImage
                    src={getImageUrl(selectedWork.image_path)}
                    alt={selectedWork.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <button
                    onClick={() => setSelectedWork(null)}
                    className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 shadow-lg"
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>
                <div className="p-6 sm:p-8">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                    {selectedWork.title}
                  </h3>
                  <p className="text-gray-600 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                    {plainDescription}
                  </p>
                  {selectedWork.category && (
                    <div className="mt-6">
                      <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
                        {selectedWork.category}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </div>

    </section>
  );
}

// WorkCard Component
function WorkCard({ work }) {
  // Strip HTML tags from description
  const stripHtml = (html) => {
    if (typeof window === 'undefined') return html;
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
  };
  const plainDescription = stripHtml(work.description);

  return (
    <>
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <ProgressiveImage
          src={getImageUrl(work.image_path)}
          alt={work.alt_text || work.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-4 left-4 right-4">
            <button className="w-full bg-white text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all">
              View Details
            </button>
          </div>
        </div>
        {work.category && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            {work.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {work.title}
        </h3>
        <p className="text-gray-600 line-clamp-3">
          {plainDescription}
        </p>
      </div>
    </>
  );
}
