'use client';

import { useEffect } from 'react';

export default function PreloadDisabler() {
  useEffect(() => {
    // Disable preloading at the browser level
    const disablePreloading = () => {
      // Remove all existing preload links with error handling
      const preloadLinks = document.querySelectorAll('link[rel="preload"], link[rel="prefetch"], link[rel="dns-prefetch"]');
      preloadLinks.forEach(link => {
        try {
          if (link.parentNode && document.contains(link)) {
            link.remove();
          }
        } catch (error) {
          // Silently ignore removal errors
          console.debug('PreloadDisabler: Could not remove preload link:', error);
        }
      });

      // Override fetch to prevent preloading
      const originalFetch = window.fetch;
      window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input : (input as Request).url;
        
        // Block preload requests
        if (init?.headers && (init.headers as any)['purpose'] === 'prefetch') {
          return Promise.resolve(new Response('', { status: 404 }));
        }
        
        return originalFetch.call(this, input, init);
      };

      // Disable automatic preloading
      if ('requestIdleCallback' in window) {
        const originalRequestIdleCallback = (window as any).requestIdleCallback;
        (window as any).requestIdleCallback = function(callback: any, options?: any) {
          // Skip preload-related callbacks
          if (callback.toString().includes('preload') || callback.toString().includes('prefetch')) {
            return;
          }
          return originalRequestIdleCallback.call(this, callback, options);
        };
      }

      // Monitor and remove new preload links
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'LINK') {
                const link = element as HTMLLinkElement;
                if (link.rel.includes('preload') || link.rel.includes('prefetch') || link.rel.includes('dns-prefetch')) {
                  // Check if the element still exists and has a parent before removing
                  if (link.parentNode && document.contains(link)) {
                    try {
                      link.remove();
                    } catch (error) {
                      // Silently ignore removal errors (element might already be removed by other scripts)
                      console.debug('PreloadDisabler: Element already removed by another script');
                    }
                  }
                }
              }
            }
          });
        });
      });

      observer.observe(document.head, {
        childList: true,
        subtree: true
      });

      // Cleanup function
      return () => {
        observer.disconnect();
        window.fetch = originalFetch;
      };
    };

    // Run after a longer delay to ensure DOM is ready and other scripts have loaded
    setTimeout(disablePreloading, 500);
  }, []);

  return null;
} 