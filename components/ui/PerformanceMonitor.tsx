"use client";

import { useEffect } from 'react';

interface PerformanceMonitorProps {
  pageName: string;
  onMetrics?: (metrics: PerformanceMetrics) => void;
}

interface PerformanceMetrics {
  pageName: string;
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
}

export default function PerformanceMonitor({ pageName, onMetrics }: PerformanceMonitorProps) {
  useEffect(() => {
    const measurePerformance = () => {
      if (typeof window === 'undefined') return;

      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const metrics: PerformanceMetrics = {
        pageName,
        loadTime: navigation.loadEventEnd - navigation.navigationStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
      };

      // Get paint metrics if available
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = entry.startTime;
        }
      });

      // Get LCP if available
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              metrics.largestContentfulPaint = lastEntry.startTime;
            }
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Stop observing after 10 seconds
          setTimeout(() => observer.disconnect(), 10000);
        } catch (e) {
          // LCP not supported
        }
      }

      // Log metrics for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Performance Metrics for ${pageName}:`, {
          'Load Time': `${metrics.loadTime.toFixed(0)}ms`,
          'DOM Content Loaded': `${metrics.domContentLoaded.toFixed(0)}ms`,
          'First Contentful Paint': metrics.firstContentfulPaint ? `${metrics.firstContentfulPaint.toFixed(0)}ms` : 'N/A',
          'Largest Contentful Paint': metrics.largestContentfulPaint ? `${metrics.largestContentfulPaint.toFixed(0)}ms` : 'N/A',
        });
      }

      // Call callback if provided
      if (onMetrics) {
        onMetrics(metrics);
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, [pageName, onMetrics]);

  return null; // This component doesn't render anything
}