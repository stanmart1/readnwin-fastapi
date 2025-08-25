"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/dateUtils";

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  helpfulVotes: number;
  recentReviews: Array<{
    id: number;
    book_title: string;
    rating: number;
    review_text: string;
    is_helpful_count: number;
    created_at: string;
  }>;
}

export default function ReviewStats() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviewStats = async () => {
      if (!isAuthenticated || !user?.id) return;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl}/dashboard/review-stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Error fetching review stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewStats();
  }, [isAuthenticated, user?.id]);

  // Fallback stats if API is not available
  const fallbackStats: ReviewStats = {
    totalReviews: 23,
    averageRating: 4.2,
    helpfulVotes: 156,
    recentReviews: [
      {
        id: 1,
        book_title: "The Psychology of Money",
        rating: 5,
        review_text:
          "An excellent book that changed my perspective on money and investing...",
        is_helpful_count: 12,
        created_at: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      {
        id: 2,
        book_title: "Atomic Habits",
        rating: 4,
        review_text:
          "Practical advice on building good habits and breaking bad ones...",
        is_helpful_count: 8,
        created_at: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      {
        id: 3,
        book_title: "The Midnight Library",
        rating: 5,
        review_text:
          "A thought-provoking story about life choices and possibilities...",
        is_helpful_count: 15,
        created_at: new Date(
          Date.now() - 10 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
    ],
  };

  const displayStats = stats || fallbackStats;

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={`ri-star-${i <= rating ? "fill" : "line"} text-yellow-400 text-sm`}
        ></i>,
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Review Impact
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {displayStats.totalReviews}
          </div>
          <div className="text-sm text-gray-600">Reviews Written</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {displayStats.averageRating.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">Avg Rating</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {displayStats.helpfulVotes}
          </div>
          <div className="text-sm text-gray-600">Helpful Votes</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {displayStats.totalReviews > 0 ? Math.round(displayStats.averageRating * displayStats.totalReviews) : 0}
          </div>
          <div className="text-sm text-gray-600">Total Stars</div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Recent Reviews
        </h3>
        <div className="space-y-3">
          {displayStats.recentReviews.map((review) => (
            <div
              key={review.id}
              className="border-l-4 border-blue-500 pl-4 py-2"
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm text-gray-900">
                  {review.book_title}
                </h4>
                <div className="flex items-center space-x-1">
                  {renderStars(review.rating)}
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">{review.review_text}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {formatDate(new Date(review.created_at))}
                </span>
                <div className="flex items-center space-x-1">
                  <i className="ri-thumb-up-line text-xs text-gray-400"></i>
                  <span className="text-xs text-gray-500">
                    {review.is_helpful_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
