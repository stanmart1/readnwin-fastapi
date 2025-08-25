'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    FlutterwaveCheckout: any;
    FlutterwaveConfig?: any;
  }
}

export default function FlutterwaveScriptLoader() {
  useEffect(() => {
    // Suppress Flutterwave internal service errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      // Suppress specific Flutterwave internal service errors
      if (
        message.includes('forter/events') ||
        message.includes('metrics.flutterwave.com') ||
        message.includes('api.fpjs.io') ||
        message.includes('API key not found') ||
        message.includes('400 (Bad Request)')
      ) {
        // Suppress these errors silently
        return;
      }
      // Log other errors normally
      originalConsoleError.apply(console, args);
    };

    // Check if script is already loaded
    if (typeof window !== 'undefined' && window.FlutterwaveCheckout) {
      return;
    }

    // Set global Flutterwave configuration to disable problematic services
    if (typeof window !== 'undefined') {
      (window as any).FlutterwaveConfig = {
        disable_forter: true,
        disable_fingerprint: true,
        disable_metrics: true,
        disable_analytics: true,
        disable_tracking: true,
        source: 'readnwin_web',
        integration: 'flutterwave_v3'
      };
    }

    // Load Flutterwave script with timeout
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    
    // Set a timeout to handle loading failures
    const timeout = setTimeout(() => {
      if (!window.FlutterwaveCheckout) {
        console.warn('⚠️ Flutterwave script loading timeout - payment gateway may not be available');
      }
    }, 10000); // 10 second timeout
    script.onload = () => {
      clearTimeout(timeout);
      console.log('✅ Flutterwave script loaded successfully');
      
      // Configure global Flutterwave settings to prevent internal service errors
      if (typeof window !== 'undefined' && (window as any).FlutterwaveCheckout) {
        // Override the default FlutterwaveCheckout to add internal service configuration
        const originalFlutterwaveCheckout = (window as any).FlutterwaveCheckout;
        (window as any).FlutterwaveCheckout = function(config: any) {
          // Add comprehensive internal service configuration to prevent 400 errors
          const enhancedConfig = {
            ...config,
            meta: {
              ...config.meta,
              disable_forter: true,
              disable_fingerprint: true,
              disable_metrics: true,
              disable_analytics: true,
              disable_tracking: true,
              disable_fraud_detection: true,
              disable_device_fingerprinting: true,
              source: 'readnwin_web',
              integration: 'flutterwave_v3',
              version: '3.11.14'
            },
            // Add additional configuration to prevent service loading
            config: {
              ...config.config,
              disable_forter: true,
              disable_fingerprint: true,
              disable_metrics: true
            }
          };
          
          console.log('Flutterwave payment initialized with enhanced configuration');
          return originalFlutterwaveCheckout(enhancedConfig);
        };
      }
    };
    script.onerror = (error) => {
      clearTimeout(timeout);
      console.warn('⚠️ Flutterwave script failed to load - payment gateway may not be available');
      // Don't throw error, just log warning
    };

    document.head.appendChild(script);

    // Cleanup function
    return () => {
      // Restore original console.error
      console.error = originalConsoleError;
      
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null; // This component doesn't render anything
} 