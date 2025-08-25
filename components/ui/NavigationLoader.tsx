'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export function NavigationLoader() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);

  useEffect(() => {
    // Reset loading state when pathname changes (navigation complete)
    if (pathname && loadingPath && pathname !== loadingPath) {
      setIsLoading(false);
      setLoadingPath(null);
    }
  }, [pathname, loadingPath]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href) {
        const url = new URL(link.href);
        const currentUrl = new URL(window.location.href);
        
        // Only show loader for internal navigation (same domain)
        if (url.origin === currentUrl.origin && url.pathname !== currentUrl.pathname) {
          // Don't show loader for admin pages or dashboard pages
          if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/dashboard')) {
            setIsLoading(true);
            setLoadingPath(url.pathname);
          }
        }
      }
    };

    // Add click listener to document
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-xl">
        <LoadingSpinner size="lg" text="Loading page..." />
      </div>
    </div>
  );
} 