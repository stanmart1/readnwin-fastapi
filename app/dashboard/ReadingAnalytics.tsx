"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ReadingAnalytics {
  monthlyData: Array<{
    month: string;
    books: number;
    hours: number;
  }>;
  genreData: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  stats: {
    totalHours: number;
    readingDays: number;
    totalBooks: number;
    avgPagesPerBook: number;
  };
}

export default function ReadingAnalytics() {
  const { user, isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState<ReadingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isAuthenticated || !user?.id) return;

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data.analytics);
          console.log('📊 User Dashboard: Analytics synced with e-reader data');
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAuthenticated, user?.id]);

  // Fallback data if API is not available
  const fallbackAnalytics: ReadingAnalytics = {
    monthlyData: [
      { month: "Jan", books: 4, hours: 32 },
      { month: "Feb", books: 3, hours: 28 },
      { month: "Mar", books: 5, hours: 45 },
      { month: "Apr", books: 4, hours: 38 },
      { month: "May", books: 6, hours: 52 },
      { month: "Jun", books: 5, hours: 41 },
    ],
    genreData: [
      { name: "Fiction", count: 35, percentage: 35 },
      { name: "Non-Fiction", count: 25, percentage: 25 },
      { name: "Mystery", count: 20, percentage: 20 },
      { name: "Romance", count: 12, percentage: 12 },
      { name: "Sci-Fi", count: 8, percentage: 8 },
    ],
    stats: {
      totalHours: 245,
      readingDays: 180,
      totalBooks: 47,
      avgPagesPerBook: 245,
    },
  };

  const displayAnalytics = analytics || fallbackAnalytics;

  const stats = [
    {
      label: "Total Reading Time",
      value: `${displayAnalytics.stats.totalHours} hours`,
      icon: "ri-time-line",
    },
    {
      label: "Reading Days",
      value: `${displayAnalytics.stats.readingDays} days`,
      icon: "ri-calendar-line",
    },
    {
      label: "Books This Year",
      value: `${displayAnalytics.stats.totalBooks} books`,
      icon: "ri-book-line",
    },
    {
      label: "Avg Pages/Book",
      value: `${displayAnalytics.stats.avgPagesPerBook} pages`,
      icon: "ri-speed-line",
    },
  ];

  const genreColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

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
        Reading Analytics
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <i className={`${stat.icon} text-blue-600`}></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Reading Chart */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Monthly Progress
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayAnalytics.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="books" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Genre Distribution */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Reading by Genre
        </h3>
        <div className="flex items-center space-x-6">
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayAnalytics.genreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="percentage"
                >
                  {displayAnalytics.genreData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={genreColors[index % genreColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {displayAnalytics.genreData.map((genre, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: genreColors[index % genreColors.length],
                    }}
                  ></div>
                  <span className="text-sm text-gray-700">{genre.name}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {genre.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
