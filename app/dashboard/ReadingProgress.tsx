"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { EnhancedApiClient } from "@/lib/api-enhanced";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface WeeklyData {
  day: string;
  pages: number;
  hours: number;
  books: number;
}

interface CurrentBook {
  title: string;
  author: string;
  progress: number;
  cover: string;
  currentPage: number;
  totalPages: number;
  lastReadAt: string;
}

export default function ReadingProgress() {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [currentBooks, setCurrentBooks] = useState<CurrentBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = new EnhancedApiClient();

  useEffect(() => {
    const fetchReadingProgress = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Use FastAPI analytics endpoint for reading data
        const analyticsResponse = await api.getReadingAnalytics({
          period: "week",
        });

        setWeeklyData(analyticsResponse.weeklyData || []);
        setCurrentBooks(analyticsResponse.currentlyReading || []);
      } catch (error) {
        console.error("Error fetching reading progress:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load reading progress",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReadingProgress();
  }, [user]);

  const displayWeeklyData = weeklyData;
  const displayCurrentBooks = currentBooks;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-12 h-18 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Reading Progress
        </h2>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">
            <i className="ri-error-warning-line text-2xl"></i>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Reading Progress
      </h2>

      {/* Weekly Chart */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          This Week's Activity
        </h3>
        {displayWeeklyData.length > 0 &&
        displayWeeklyData.some((day) => day.pages > 0) ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayWeeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  formatter={(value: any, name: string) => [
                    name === "pages"
                      ? `${value} pages`
                      : name === "hours"
                        ? `${value} hours`
                        : `${value} books`,
                    name === "pages"
                      ? "Pages Read"
                      : name === "hours"
                        ? "Hours Read"
                        : "Books Read",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="pages"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <i className="ri-bar-chart-line text-3xl mb-2"></i>
              <p className="text-sm">No reading activity this week</p>
              <p className="text-xs">
                Start reading to see your weekly progress
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Current Books */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Currently Reading ({displayCurrentBooks.length})
        </h3>
        {displayCurrentBooks.length > 0 ? (
          <div className="space-y-4">
            {displayCurrentBooks.map((book, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-12 h-18 object-cover object-top rounded shadow-sm"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-gray-900">
                    {book.title}
                  </h4>
                  <p className="text-xs text-gray-600">{book.author}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${book.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {book.progress}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Page {book.currentPage} of {book.totalPages}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <i className="ri-book-open-line text-3xl mb-2"></i>
            <p>No reading progress</p>
            <p className="text-sm">
              Start reading a book to see your progress here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
