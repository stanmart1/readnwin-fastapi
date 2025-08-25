import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

interface ReadingSession {
  sessionId: number;
  startTime: Date;
  currentPage: number;
  wordsRead: number;
  timeSpent: number;
}

interface UseReadingSessionProps {
  bookId: string;
  currentPage: number;
}

export function useReadingSession({
  bookId,
  currentPage,
}: UseReadingSessionProps) {
  const { user, isAuthenticated } = useAuth();
  const [readingSession, setReadingSession] = useState<ReadingSession | null>(
    null,
  );
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [pageStartTime, setPageStartTime] = useState<Date | null>(null);
  const [wordsOnCurrentPage, setWordsOnCurrentPage] = useState(0);
  const [readingSpeed, setReadingSpeed] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const pageStartTimeRef = useRef<Date | null>(null);
  const sessionIdRef = useRef<number | null>(null);

  // Start reading session
  const startSession = useCallback(async () => {
    if (!user?.id || !bookId) return;

    try {
      const response = await fetch("/api/dashboard/reading-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          pageNumber: currentPage,
          action: "start",
          deviceInfo: {
            userAgent: navigator.userAgent,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newSession: ReadingSession = {
          sessionId: data.sessionId,
          startTime: new Date(),
          currentPage,
          wordsRead: 0,
          timeSpent: 0,
        };

        setReadingSession(newSession);
        setSessionStartTime(new Date());
        setPageStartTime(new Date());
        pageStartTimeRef.current = new Date();
        sessionIdRef.current = data.sessionId;
        setIsSessionActive(true);
      }
    } catch (error) {
      console.error("Error starting reading session:", error);
    }
  }, [user?.id, bookId, currentPage]);

  // Update reading progress
  const updateProgress = useCallback(
    async (wordsOnPage: number) => {
      if (
        !isSessionActive ||
        !sessionIdRef.current ||
        !pageStartTimeRef.current
      )
        return;

      const now = new Date();
      const timeSpentSeconds =
        (now.getTime() - pageStartTimeRef.current.getTime()) / 1000;

      if (timeSpentSeconds > 0 && wordsOnPage > 0) {
        const currentSpeed = (wordsOnPage / timeSpentSeconds) * 60; // WPM
        setReadingSpeed(currentSpeed);

        try {
          await fetch("/api/dashboard/reading-sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookId,
              pageNumber: currentPage,
              action: "update",
              sessionId: sessionIdRef.current,
              wordsOnPage,
              timeSpentSeconds,
            }),
          });
        } catch (error) {
          console.error("Error updating reading progress:", error);
        }
      }

      pageStartTimeRef.current = now;
      setPageStartTime(now);
    },
    [isSessionActive, bookId, currentPage],
  );

  // End reading session
  const endSession = useCallback(async () => {
    if (!isSessionActive || !sessionIdRef.current) return;

    try {
      await fetch("/api/dashboard/reading-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          pageNumber: currentPage,
          action: "end",
          sessionId: sessionIdRef.current,
          endPage: currentPage,
        }),
      });

      setIsSessionActive(false);
      setReadingSession(null);
      sessionIdRef.current = null;
    } catch (error) {
      console.error("Error ending reading session:", error);
    }
  }, [isSessionActive, bookId, currentPage]);

  // Calculate words on page
  const calculateWordsOnPage = useCallback((text: string) => {
    const wordCount = text.trim().split(/\s+/).length;
    setWordsOnCurrentPage(wordCount);
    return wordCount;
  }, []);

  // Auto-start session when component mounts
  // Auto start session when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id && bookId && !isSessionActive) {
      startSession();
    }
  }, [isAuthenticated, user?.id, bookId, isSessionActive, startSession]);

  // Update progress when page changes
  useEffect(() => {
    if (isSessionActive && wordsOnCurrentPage > 0) {
      updateProgress(wordsOnCurrentPage);
    }
  }, [currentPage, isSessionActive, wordsOnCurrentPage, updateProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSessionActive) {
        endSession();
      }
    };
  }, [isSessionActive, endSession]);

  return {
    readingSession,
    sessionStartTime,
    pageStartTime,
    wordsOnCurrentPage,
    readingSpeed,
    isSessionActive,
    calculateWordsOnPage,
    startSession,
    updateProgress,
    endSession,
  };
}
