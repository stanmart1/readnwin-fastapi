'use client';

import { useEffect } from 'react';

export default function FontLoader() {
  useEffect(() => {
    // Load fonts dynamically to avoid preloading
    const loadFonts = () => {
      // Load Remixicon
      const remixiconLink = document.createElement('link');
      remixiconLink.href = 'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css';
      remixiconLink.rel = 'stylesheet';
      document.head.appendChild(remixiconLink);

      // Load Inter font
      const interLink = document.createElement('link');
      interLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
      interLink.rel = 'stylesheet';
      document.head.appendChild(interLink);
    };

    // Load fonts after a short delay to avoid preloading
    setTimeout(loadFonts, 100);
  }, []);

  return null;
} 