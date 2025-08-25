'use client';

import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  showPlaceholderOnError?: boolean;
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  fallback = '/placeholder-book.jpg',
  width,
  height,
  priority = false,
  showPlaceholderOnError = true
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isInView, setIsInView] = useState(priority);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Load image when in view
  useEffect(() => {
    if (!isInView) return;

    const optimizedSrc = getOptimizedImageUrl(src, width, height);
    setImageSrc(optimizedSrc);
  }, [isInView, src, width, height]);

  const getOptimizedImageUrl = (originalSrc: string, w?: number, h?: number) => {
    if (!originalSrc) return '';
    
    // If it's already a full URL or starts with /, return as is
    if (originalSrc.startsWith('http') || originalSrc.startsWith('/')) {
      return originalSrc;
    }
    
    // For optimization, we can add image optimization later
    return originalSrc;
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (showPlaceholderOnError && fallback) {
      setImageSrc(fallback);
    }
  };

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
      
      {/* Show error state without fallback if showPlaceholderOnError is false */}
      {hasError && !showPlaceholderOnError && (
        <div className={`${className} bg-gray-100 flex items-center justify-center`}>
          <div className="text-center text-gray-400">
            <i className="ri-image-line text-2xl mb-2"></i>
            <p className="text-xs">No image</p>
          </div>
        </div>
      )}
    </div>
  );
}