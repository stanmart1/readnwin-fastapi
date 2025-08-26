'use client';

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { EnhancedApiClient } from "@/lib/api-enhanced";

interface ReadingProgress {
  currentPage: number;
  totalPages: number;
  completion: number;
  lastReadAt: string;
  readingTime: number;
}

interface UseReadingProgressOptions {
  bookId: string;
  onProgressUpdate?: (progress: ReadingProgress) => void;
  autoSync?: boolean;
  syncInterval?: number;
}

export function useReadingProgress({
  bookId,
  onProgressUpdate,
  autoSync = true,
  syncInterval = 30000, // 30 seconds
}: UseReadingProgressOptions) {
  const { user, isAuthenticated } = useAuth();
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = new EnhancedApiClient();

  const fetchProgress = useCallback(async () => {
    if (!user?.id || !bookId) return;

    setIsLoading(true);
    try {
      const data = await api.getReadingProgress(Number(bookId));

      const newProgress: ReadingProgress = {
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        completion: data.completion,
        lastReadAt: data.lastReadAt,
        readingTime: data.readingTime,
      };

      setProgress(newProgress);
      onProgressUpdate?.(newProgress);
      setError(null);
    } catch (err) {
      console.error("Error fetching reading progress:", err);
      setError("Failed to load reading progress");
    } finally {
      setIsLoading(false);
    }
  }, [bookId, user, api, onProgressUpdate]);

  const updateProgress = useCallback(
    async (currentPage: number) => {
      if (!user || !progress) return;

      try {
        const updatedProgress = {
          ...progress,
          currentPage,
          lastReadAt: new Date().toISOString(),
        };

        await api.updateReadingProgress(Number(bookId), {
          currentChapter: currentPage,
          totalChapters: progress.totalPages,
          progress: (currentPage / progress.totalPages) * 100
        });
        setProgress(updatedProgress);
        onProgressUpdate?.(updatedProgress);
        setError(null);
      } catch (err) {
        console.error("Error updating reading progress:", err);
        setError("Failed to update reading progress");
      }
    },
    [bookId, user, progress, api, onProgressUpdate],
  );

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchProgress();
    }
  }, [fetchProgress, isAuthenticated, user?.id]);

  // Auto-sync if enabled
  useEffect(() => {
    if (!autoSync || !progress) return;

    const syncIntervalId = setInterval(() => {
      if (progress) {
        updateProgress(progress.currentPage);
      }
    }, syncInterval);

    return () => clearInterval(syncIntervalId);

    return () => clearInterval(syncInterval);
  }, [autoSync, progress, syncInterval, updateProgress]);

  return {
    progress,
    isLoading,
    error,
    updateProgress,
    fetchProgress,
  };
}
