"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApi, handleApiError, isAuthenticated } from "./utils/api";
import { useAuth } from "../../hooks/useAuth";

import { adminCache } from "../../lib/admin-cache";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

function OverviewStatsContent() {
  const router = useRouter();
  const {
    isAuthenticated: authStatus,
    isLoading: authLoading,
    user,
  } = useAuth();

  const [stats, setStats] = useState([
    {
      title: "Total Users",
      value: "0",
      change: "+0%",
      changeType: "positive",
      icon: "ri-user-line",
      color: "bg-blue-500",
      tabId: "users",
    },
    {
      title: "Total Books",
      value: "0",
      change: "+0%",
      changeType: "positive",
      icon: "ri-book-line",
      color: "bg-green-500",
      tabId: "content",
    },
    {
      title: "Monthly Sales",
      value: "₦0",
      change: "+0%",
      changeType: "positive",
      icon: "ri-money-dollar-circle-line",
      color: "bg-purple-500",
      tabId: "orders",
    },
    {
      title: "Total Orders",
      value: "0",
      change: "+0%",
      changeType: "positive",
      icon: "ri-shopping-cart-line",
      color: "bg-yellow-500",
      tabId: "orders",
    },
  ]);

  const [trendData, setTrendData] = useState([]);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleCardClick = (tabId: string) => {
    const url = `/admin?tab=${tabId}`;
    router.push(url);
  };

  useEffect(() => {
    if (!authLoading && authStatus && isAuthenticated() && user) {
      const hasAdminAccess =
        user.role?.name === "admin" ||
        user.role?.name === "super_admin" ||
        user.permissions?.includes("admin_access");

      if (hasAdminAccess) {
        // Defer analytics loading slightly to allow page to render first
        setTimeout(fetchAllAnalytics, 50);
      } else {
        setError("Insufficient permissions");
        setLoading(false);
      }
    }
  }, [authLoading, authStatus, user]);

  const fetchAllAnalytics = async () => {
    if (!authStatus || !isAuthenticated() || !user) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    const hasAdminAccess =
      user.role?.name === "admin" ||
      user.role?.name === "super_admin" ||
      user.permissions?.includes("admin_access");

    if (!hasAdminAccess) {
      setError("Insufficient permissions");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const startTime = Date.now();

      // Check cache first for immediate display
      let overviewData = adminCache.get('admin:overview_stats');
      
      if (!overviewData) {
        // Load essential overview stats if not cached
        overviewData = await adminApi.getOverviewStats().catch(() => ({
          total_users: 0,
          total_books: 0,
          total_revenue: 0,
          total_orders: 0
        }));
        
        // Cache for 2 minutes
        adminCache.set('admin:overview_stats', overviewData, 2);
      }
      
      // Update stats immediately with basic data
      const totalUsers = overviewData.total_users || 0;
      const totalBooks = overviewData.total_books || 0;
      const totalRevenue = overviewData.total_revenue || 0;
      const totalOrders = overviewData.total_orders || 0;

      setStats([
        {
          title: "Total Users",
          value: totalUsers.toLocaleString(),
          change: "+0%",
          changeType: "positive",
          icon: "ri-user-line",
          color: "bg-blue-500",
          tabId: "users",
        },
        {
          title: "Total Books",
          value: totalBooks.toLocaleString(),
          change: "+0%",
          changeType: "positive",
          icon: "ri-book-line",
          color: "bg-green-500",
          tabId: "content",
        },
        {
          title: "Monthly Sales",
          value: `₦${totalRevenue.toLocaleString()}`,
          change: "+0%",
          changeType: "positive",
          icon: "ri-money-dollar-circle-line",
          color: "bg-purple-500",
          tabId: "orders",
        },
        {
          title: "Total Orders",
          value: totalOrders.toLocaleString(),
          change: "+0%",
          changeType: "positive",
          icon: "ri-shopping-cart-line",
          color: "bg-yellow-500",
          tabId: "orders",
        },
      ]);

      setLoading(false); // Stop loading immediately after basic stats

      // Load additional data in background without blocking UI
      setTimeout(() => {
        const loadBackgroundData = async () => {
          // Check cache for each data type
          let growthData = adminCache.get('admin:growth_metrics');
          let monthlyTrendsData = adminCache.get('admin:monthly_trends');
          let dailyActivityData = adminCache.get('admin:daily_activity');
          let recentActivitiesData = adminCache.get('admin:recent_activities');
          
          // Load only uncached data
          const promises = [];
          if (!growthData) promises.push(adminApi.getGrowthMetrics().catch(() => null));
          if (!monthlyTrendsData) promises.push(adminApi.getMonthlyTrends().catch(() => null));
          if (!dailyActivityData) promises.push(adminApi.getDailyActivity().catch(() => null));
          if (!recentActivitiesData) promises.push(adminApi.getRecentActivities(5).catch(() => null));
          
          if (promises.length > 0) {
            const results = await Promise.all(promises);
            let resultIndex = 0;
            
            if (!growthData && results[resultIndex]) {
              growthData = results[resultIndex];
              adminCache.set('admin:growth_metrics', growthData, 5);
              resultIndex++;
            }
            if (!monthlyTrendsData && results[resultIndex]) {
              monthlyTrendsData = results[resultIndex];
              adminCache.set('admin:monthly_trends', monthlyTrendsData, 10);
              resultIndex++;
            }
            if (!dailyActivityData && results[resultIndex]) {
              dailyActivityData = results[resultIndex];
              adminCache.set('admin:daily_activity', dailyActivityData, 5);
              resultIndex++;
            }
            if (!recentActivitiesData && results[resultIndex]) {
              recentActivitiesData = results[resultIndex];
              adminCache.set('admin:recent_activities', recentActivitiesData, 2);
            }
          }
          
          return [growthData, monthlyTrendsData, dailyActivityData, recentActivitiesData];
        };
        
        loadBackgroundData().then(([growthData, monthlyTrendsData, dailyActivityData, recentActivitiesData]) => {
          // Update growth percentages if available
          if (growthData) {
            setStats(prevStats => prevStats.map(stat => ({
              ...stat,
              change: growthData[`${stat.title.toLowerCase().replace(' ', '_')}_growth`] || stat.change,
              changeType: growthData[`${stat.title.toLowerCase().replace(' ', '_')}_growth`]?.startsWith("+") ? "positive" : "negative"
            })));
          }
          
          // Update charts if data available
          if (monthlyTrendsData?.monthly_trends) {
            setTrendData(monthlyTrendsData.monthly_trends);
          }
          if (dailyActivityData?.daily_activity) {
            setDailyActivity(dailyActivityData.daily_activity);
          }
          if (recentActivitiesData?.recent_activities) {
            setRecentActivities(recentActivitiesData.recent_activities);
          }
        }).catch(error => {
          console.warn("⚠️ Background data loading failed:", error);
        });
      }, 100); // Small delay to ensure UI renders first

    } catch (error) {
      console.error("❌ Error fetching analytics:", error);
      setError(handleApiError(error));
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Minimal skeleton for faster perceived loading */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <div className="animate-pulse">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <i className="ri-error-warning-line text-red-400 text-xl"></i>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchAllAnalytics}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Refresh Button */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Analytics Overview
            </h2>
            <p className="text-gray-600 mt-1">
              Real-time insights and performance metrics from database
            </p>
          </div>
          <button
            onClick={fetchAllAnalytics}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <i
              className={`ri-refresh-line mr-2 ${loading ? "animate-spin" : ""}`}
            ></i>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:scale-105 transform transition-transform duration-200"
            onClick={() => handleCardClick(stat.tabId)}
          >
            <div className="flex items-center">
              <div
                className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}
              >
                <i className={`${stat.icon} text-white text-xl`}></i>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p
                  className={`text-sm ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}
                >
                  {stat.change} from last month
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Growth Trends (Real Data)
          </h3>
          <div className="h-64">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      name === "sales"
                        ? `₦${value.toLocaleString()}`
                        : value.toLocaleString(),
                      name === "sales"
                        ? "Revenue"
                        : name === "orders"
                          ? "Orders"
                          : "New Users",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="sales"
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="orders"
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    name="users"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No trend data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Daily Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Activity (Past 7 Days)
          </h3>
          <div className="h-64">
            {dailyActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      value.toLocaleString(),
                      name === "active" ? "Active Users" : "Orders",
                    ]}
                  />
                  <Bar dataKey="active" fill="#3B82F6" name="active" />
                  <Bar dataKey="orders" fill="#10B981" name="orders" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">
                  No daily activity data available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Platform Activities (Real-time)
        </h3>
        <div className="space-y-4">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === "user"
                      ? "bg-blue-100 text-blue-600"
                      : activity.type === "book"
                        ? "bg-green-100 text-green-600"
                        : activity.type === "order"
                          ? "bg-purple-100 text-purple-600"
                          : activity.type === "review"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <i
                    className={`${
                      activity.type === "user"
                        ? "ri-user-add-line"
                        : activity.type === "book"
                          ? "ri-book-line"
                          : activity.type === "order"
                            ? "ri-shopping-cart-line"
                            : activity.type === "review"
                              ? "ri-flag-line"
                              : "ri-user-line"
                    } text-sm`}
                  ></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-600">
                    {activity.user && `User: ${activity.user}`}
                    {activity.book && ` • Book: ${activity.book}`}
                    {activity.amount && ` • Amount: ${activity.amount}`}
                  </p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <i className="ri-information-line text-2xl text-gray-400 mb-2"></i>
              <p className="text-gray-600">No recent activities found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OverviewStats() {
  return <OverviewStatsContent />;
}
