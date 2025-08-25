"use client";

import { useEffect, useState } from "react";
import { EnhancedApiClient } from "@/lib/api-enhanced";

interface AuthUser {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role: {
    id: number;
    name: string;
    display_name: string;
  } | null;
  permissions: string[];
}

interface WelcomeHeaderProps {
  user: AuthUser | null;
}

interface UserStats {
  booksRead: number;
  completedBooks: number;
  currentlyReading: number;
  totalBooks: number;
  totalPagesRead: number;
  totalHours: number;
  streak: number;
  avgProgress: number;
  favoriteBooks: number;
  recentPurchases: number;
  totalGoals: number;
  completedGoals: number;
  avgGoalProgress: number;
}

export default function WelcomeHeader({ user }: WelcomeHeaderProps) {
  const [userStats, setUserStats] = useState<UserStats>({
    booksRead: 0,
    completedBooks: 0,
    currentlyReading: 0,
    totalBooks: 0,
    totalPagesRead: 0,
    totalHours: 0,
    streak: 0,
    avgProgress: 0,
    favoriteBooks: 0,
    recentPurchases: 0,
    totalGoals: 0,
    completedGoals: 0,
    avgGoalProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        const api = new EnhancedApiClient();
        // Ensure the API client has the current token
        const token = localStorage.getItem("token");
        if (token) {
          api.setToken(token);
        }

        const data = await api.request("/dashboard/stats");
        setUserStats(data.stats);
      } catch (error) {
        console.error("Error fetching user stats:", error);
        setError("Failed to load user statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  const formatHours = (pages: number) => {
    // Estimate 1 hour per 50 pages
    return Math.round(pages / 50);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getUserInitials = () => {
    const firstName = user?.first_name || "";
    const lastName = user?.last_name || "";

    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();

    return firstInitial + lastInitial;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-white/20 rounded w-1/2 mb-6"></div>
          <div className="flex items-center space-x-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-8 bg-white/20 rounded w-12 mb-2"></div>
                <div className="h-3 bg-white/20 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {getGreeting()}, {user?.first_name || "Reader"}!
            </h1>
            <p className="text-red-100 mb-4">
              Unable to load your reading statistics
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">
            {getGreeting()}, {user?.first_name || "Reader"}!
          </h1>
          <p className="text-blue-100 mb-4">
            Ready to continue your reading journey?
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{userStats.booksRead}</div>
              <div className="text-sm text-blue-100">Books Read</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {userStats.currentlyReading}
              </div>
              <div className="text-sm text-blue-100">Currently Reading</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatHours(userStats.totalPagesRead)}
              </div>
              <div className="text-sm text-blue-100">Hours Read</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{userStats.totalBooks}</div>
              <div className="text-sm text-blue-100">Total Books</div>
            </div>
          </div>

          {/* Additional stats for larger screens */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <div className="text-lg font-bold">
                {userStats.completedBooks}
              </div>
              <div className="text-xs text-blue-100">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{userStats.favoriteBooks}</div>
              <div className="text-xs text-blue-100">Favorites</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{userStats.totalGoals}</div>
              <div className="text-xs text-blue-100">Goals</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {Math.round(userStats.avgProgress)}%
              </div>
              <div className="text-xs text-blue-100">Avg Progress</div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-4 ml-6">
          <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {getUserInitials()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
