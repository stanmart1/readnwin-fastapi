import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import api from '../lib/api';

export const useSessionTimeout = () => {
  const { logout, isAuthenticated } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionTimeout, setSessionTimeout] = useState(40); // Default 40 minutes
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const countdownRef = useRef(null);

  // Fetch session timeout from settings
  useEffect(() => {
    const fetchTimeout = async () => {
      try {
        const response = await api.get('/admin/system-settings/public');
        const timeout = response.data.settings?.session_timeout_minutes || 40;
        setSessionTimeout(timeout);
      } catch (error) {
        console.error('Failed to fetch session timeout:', error);
      }
    };
    fetchTimeout();
  }, []);

  const resetTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowWarning(false);
  }, []);

  const handleLogout = useCallback(() => {
    resetTimers();
    logout();
    window.location.href = '/login?reason=session_expired';
  }, [logout, resetTimers]);

  const extendSession = useCallback(() => {
    resetTimers();
    startTimers();
  }, [resetTimers]);

  const startTimers = useCallback(() => {
    if (!isAuthenticated) return;

    const timeoutMs = sessionTimeout * 60 * 1000;
    const warningMs = timeoutMs - (5 * 60 * 1000); // Warn 5 minutes before

    // Set warning timer
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeRemaining(300); // 5 minutes in seconds

      // Start countdown
      countdownRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningMs);

    // Set logout timer
    timeoutRef.current = setTimeout(handleLogout, timeoutMs);
  }, [isAuthenticated, sessionTimeout, handleLogout]);

  // Start timers on mount and reset on activity
  useEffect(() => {
    if (!isAuthenticated) return;

    startTimers();

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const resetOnActivity = () => {
      if (!showWarning) {
        resetTimers();
        startTimers();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, resetOnActivity);
    });

    return () => {
      resetTimers();
      events.forEach(event => {
        document.removeEventListener(event, resetOnActivity);
      });
    };
  }, [isAuthenticated, startTimers, resetTimers, showWarning]);

  return {
    showWarning,
    timeRemaining,
    extendSession,
    handleLogout
  };
};
