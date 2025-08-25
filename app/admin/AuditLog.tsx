"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/dateUtils";
import { adminApi } from "./utils/api";

interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  resource_type?: string;
  resource_id?: number;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function AuditLog() {
  const { user, isAuthenticated } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filters, setFilters] = useState({
    userId: "",
    action: "",
    resourceType: "",
    startDate: "",
    endDate: "",
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLogDetails, setSelectedLogDetails] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch audit logs
  const fetchAuditLogs = async (page: number = 1) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (filters.userId) params.append("user_id", filters.userId);
      if (filters.action) params.append("action", filters.action);
      if (filters.resourceType)
        params.append("resource_type", filters.resourceType);
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/audit-logs?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setAuditLogs(data.logs || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalLogs(data.pagination?.total || 0);
        setCurrentPage(data.pagination?.page || 1);
      } else {
        setError("Failed to fetch audit logs");
        setAuditLogs([]);
      }
    } catch (error) {
      setError("Error fetching audit logs");
      setAuditLogs([]);
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAuditLogs();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAuditLogs(1);
    }
  }, [filters, isAuthenticated]);

  const getActionColor = (action: string) => {
    if (action.includes("create"))
      return "bg-gradient-to-r from-green-500 to-teal-500";
    if (action.includes("update"))
      return "bg-gradient-to-r from-blue-500 to-cyan-500";
    if (action.includes("delete"))
      return "bg-gradient-to-r from-red-500 to-pink-500";
    if (action.includes("login"))
      return "bg-gradient-to-r from-purple-500 to-pink-500";
    if (action.includes("logout"))
      return "bg-gradient-to-r from-gray-500 to-gray-600";
    return "bg-gradient-to-r from-yellow-500 to-orange-500";
  };

  const getActionIcon = (action: string) => {
    if (action.includes("create")) return "ri-add-circle-line";
    if (action.includes("update")) return "ri-edit-line";
    if (action.includes("delete")) return "ri-delete-bin-line";
    if (action.includes("login")) return "ri-login-circle-line";
    if (action.includes("logout")) return "ri-logout-circle-line";
    if (action.includes("read")) return "ri-eye-line";
    return "ri-information-line";
  };

  const getActionDisplayName = (action: string) => {
    // User authentication actions
    if (action.includes("login")) return "User Login";
    if (action.includes("logout")) return "User Logout";
    if (action.includes("register")) return "User Registration";
    if (action.includes("password_reset")) return "Password Reset";

    // CRUD operations with resource context
    if (action.includes("create")) {
      if (action.includes("book")) return "Book Created";
      if (action.includes("order")) return "Order Created";
      if (action.includes("user")) return "User Created";
      if (action.includes("review")) return "Review Created";
      return "Resource Created";
    }

    if (action.includes("update")) {
      if (action.includes("book")) return "Book Updated";
      if (action.includes("order")) return "Order Updated";
      if (action.includes("user")) return "User Updated";
      if (action.includes("review")) return "Review Updated";
      if (action.includes("profile")) return "Profile Updated";
      return "Resource Updated";
    }

    if (action.includes("delete")) {
      if (action.includes("book")) return "Book Deleted";
      if (action.includes("order")) return "Order Deleted";
      if (action.includes("user")) return "User Deleted";
      if (action.includes("review")) return "Review Deleted";
      return "Resource Deleted";
    }

    if (action.includes("read") || action.includes("view")) {
      if (action.includes("book")) return "Book Viewed";
      if (action.includes("order")) return "Order Viewed";
      if (action.includes("user")) return "User Profile Viewed";
      if (action.includes("review")) return "Review Viewed";
      return "Resource Viewed";
    }

    // Payment and order actions
    if (action.includes("payment")) return "Payment Processed";
    if (action.includes("order_status")) return "Order Status Changed";
    if (action.includes("shipping")) return "Shipping Updated";

    // Admin actions
    if (action.includes("admin")) return "Admin Action";
    if (action.includes("export")) return "Data Exported";
    if (action.includes("import")) return "Data Imported";

    // Default: capitalize and format the action
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getResourceTypeDisplayName = (resourceType: string) => {
    if (!resourceType) return "N/A";

    // Common resource types
    const resourceTypeMap: { [key: string]: string } = {
      book: "Book",
      books: "Book",
      order: "Order",
      orders: "Order",
      user: "User",
      users: "User",
      review: "Review",
      reviews: "Review",
      category: "Category",
      categories: "Category",
      payment: "Payment",
      payments: "Payment",
      shipping: "Shipping",
      inventory: "Inventory",
      audit_log: "Audit Log",
      audit_logs: "Audit Log",
      system: "System",
      profile: "User Profile",
      session: "User Session",
      auth: "Authentication",
      admin: "Admin Panel",
    };

    const lowerResourceType = resourceType.toLowerCase();
    return (
      resourceTypeMap[lowerResourceType] ||
      resourceType
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  };

  const formatDetails = (details: any) => {
    if (!details) return "No details available";

    if (typeof details === "string") {
      // If it's already a formatted string, return as is
      if (details.length < 100) return details;
      // For longer strings, truncate and add ellipsis
      return details.length > 100 ? details.substring(0, 100) + "..." : details;
    }

    if (typeof details === "object") {
      try {
        // Handle common audit log detail structures
        if (details.changes) {
          const changes = Object.entries(details.changes)
            .map(([field, values]: [string, any]) => {
              if (Array.isArray(values) && values.length === 2) {
                return `${field}: "${values[0]}" → "${values[1]}"`;
              }
              return `${field}: ${JSON.stringify(values)}`;
            })
            .join(", ");
          return changes || "Field changes recorded";
        }

        if (details.fields) {
          return Object.entries(details.fields)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ");
        }

        if (details.message) {
          return details.message;
        }

        if (details.error) {
          return `Error: ${details.error}`;
        }

        // For simple objects, create a readable summary
        const entries = Object.entries(details);
        if (entries.length <= 3) {
          return entries
            .map(([key, value]) => {
              const formattedKey = key
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
              const formattedValue =
                typeof value === "string" ? value : JSON.stringify(value);
              return `${formattedKey}: ${formattedValue}`;
            })
            .join(", ");
        }

        // For complex objects, provide a summary
        return `${entries.length} data fields recorded`;
      } catch {
        return "Complex data structure";
      }
    }

    return String(details);
  };

  const formatAuditDetails = (details: any): string => {
    if (!details) return "No details available";

    if (typeof details === "string") {
      return details;
    }

    if (typeof details === "object") {
      const formattedDetails: string[] = [];

      Object.entries(details).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          // Format the key to be more readable
          const formattedKey = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

          if (typeof value === "object") {
            if (Array.isArray(value)) {
              if (value.length === 2 && key === "changes") {
                // Handle before/after changes
                formattedDetails.push(
                  `${formattedKey}: "${value[0]}" → "${value[1]}"`,
                );
              } else {
                formattedDetails.push(`${formattedKey}: ${value.length} items`);
              }
            } else if (
              value &&
              typeof value === "object" &&
              "message" in value
            ) {
              formattedDetails.push(
                `${formattedKey}: ${(value as any).message}`,
              );
            } else {
              const subEntries = Object.entries(value);
              if (subEntries.length <= 2) {
                const subDetails = subEntries
                  .map(([subKey, subValue]) => `${subKey}: ${subValue}`)
                  .join(", ");
                formattedDetails.push(`${formattedKey}: ${subDetails}`);
              } else {
                formattedDetails.push(
                  `${formattedKey}: ${subEntries.length} fields`,
                );
              }
            }
          } else {
            // Format common field types
            if (key === "ip_address") {
              formattedDetails.push(`IP Address: ${value}`);
            } else if (key === "user_agent" && typeof value === "string") {
              formattedDetails.push(
                `Browser: ${value.substring(0, 50)}${value.length > 50 ? "..." : ""}`,
              );
            } else if (key === "timestamp" && typeof value === "string") {
              formattedDetails.push(
                `Time: ${new Date(value).toLocaleString()}`,
              );
            } else {
              formattedDetails.push(`${formattedKey}: ${value}`);
            }
          }
        }
      });

      return formattedDetails.join("\n");
    }

    return String(details);
  };

  const handleExport = () => {
    // Implementation for CSV export
    const csvContent = [
      [
        "ID",
        "Action",
        "User",
        "Resource Type",
        "Resource ID",
        "IP Address",
        "Timestamp",
        "Details",
      ],
      ...(auditLogs || []).map((log) => [
        log.id,
        log.action,
        log.user ? `${log.user.first_name} ${log.user.last_name}` : "System",
        getResourceTypeDisplayName(log.resource_type || ""),
        log.resource_id || "N/A",
        log.ip_address || "N/A",
        formatDateTime(log.created_at),
        formatDetails(log.details),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLogDetails(log);
    setShowDetailsModal(true);
  };

  const clearFilters = () => {
    setFilters({
      userId: "",
      action: "",
      resourceType: "",
      startDate: "",
      endDate: "",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-red-600">
              <i className="ri-error-warning-line text-4xl mb-4"></i>
              <p>Authentication required to view audit logs</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && auditLogs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading audit logs...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <i className="ri-error-warning-line text-red-400 text-xl"></i>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Audit Log
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              System activity and security audit trail
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => fetchAuditLogs(currentPage)}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <i
                className={`ri-refresh-line mr-2 ${loading ? "animate-spin" : ""}`}
              ></i>
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
            >
              <i className="ri-download-line mr-2"></i>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters Toggle */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <i className={`ri-${showFilters ? "eye-off" : "eye"}-line`}></i>
            <span>{showFilters ? "Hide" : "Show"} Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  value={filters.userId}
                  onChange={(e) =>
                    setFilters({ ...filters, userId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by user ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action
                </label>
                <input
                  type="text"
                  value={filters.action}
                  onChange={(e) =>
                    setFilters({ ...filters, action: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by action"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource Type
                </label>
                <input
                  type="text"
                  value={filters.resourceType}
                  onChange={(e) =>
                    setFilters({ ...filters, resourceType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Filter by resource type"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audit Logs - Mobile Cards */}
      <div className="xl:hidden space-y-4">
        {(auditLogs || []).map((log) => (
          <div
            key={log.id}
            className="bg-white rounded-lg shadow-md p-4 space-y-3"
          >
            {/* Action Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 ${getActionColor(log.action)} rounded-full flex items-center justify-center`}
                >
                  <i
                    className={`${getActionIcon(log.action)} text-white text-lg`}
                  ></i>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 break-words">
                    {getActionDisplayName(log.action)}
                  </div>
                  <div className="text-sm text-gray-500 break-words">
                    {log.action}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 break-words">
                  {formatDateTime(log.created_at)}
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="border-t pt-3">
              <div className="text-sm">
                <span className="font-medium text-gray-700">User:</span>
                <span className="ml-2 text-gray-900 break-words">
                  {log.user
                    ? `${log.user.first_name} ${log.user.last_name}`
                    : "System"}
                </span>
              </div>
              {log.user && (
                <div className="text-sm text-gray-500 mt-1 break-words">
                  {log.user.email}
                </div>
              )}
            </div>

            {/* Resource Info */}
            <div className="border-t pt-3">
              <div className="text-sm">
                <span className="font-medium text-gray-700">Resource:</span>
                <span className="ml-2 text-gray-900 break-words">
                  {getResourceTypeDisplayName(log.resource_type || "")}
                </span>
              </div>
              {log.resource_id && (
                <div className="text-sm text-gray-500 mt-1 break-words">
                  ID: {log.resource_id}
                </div>
              )}
            </div>

            {/* IP Address */}
            <div className="border-t pt-3">
              <div className="text-sm">
                <span className="font-medium text-gray-700">IP Address:</span>
                <span className="ml-2 text-gray-900 break-words">
                  {log.ip_address || "N/A"}
                </span>
              </div>
            </div>

            {/* Details */}
            {log.details && (
              <div className="border-t pt-3">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Details:</span>
                  <div
                    className="mt-1 text-gray-900 break-words"
                    title={formatDetails(log.details)}
                  >
                    {formatDetails(log.details)}
                  </div>
                  <button
                    onClick={() => handleViewDetails(log)}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap"
                  >
                    View Full Details
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Audit Logs - Desktop Table */}
      <div className="hidden xl:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(auditLogs || []).map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 ${getActionColor(log.action)} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}
                      >
                        <i
                          className={`${getActionIcon(log.action)} text-white text-sm`}
                        ></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 break-words">
                          {getActionDisplayName(log.action)}
                        </span>
                        <div className="text-xs text-gray-500 break-words">
                          {log.action}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 break-words">
                        {log.user
                          ? `${log.user.first_name} ${log.user.last_name}`
                          : "System"}
                      </div>
                      {log.user && (
                        <div className="text-sm text-gray-500 break-words">
                          {log.user.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 break-words">
                        {getResourceTypeDisplayName(log.resource_type || "")}
                      </div>
                      {log.resource_id && (
                        <div className="text-sm text-gray-500 break-words">
                          ID: {log.resource_id}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-500 break-words">
                      {log.ip_address || "N/A"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-500 break-words">
                      {formatDateTime(log.created_at)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className="text-sm text-gray-900 break-words"
                        title={formatDetails(log.details)}
                      >
                        {formatDetails(log.details)}
                      </div>
                      {log.details && (
                        <button
                          onClick={() => handleViewDetails(log)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap"
                          title="View full details"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-700 text-center sm:text-left">
            Showing {auditLogs.length} of {totalLogs} audit logs
          </div>
          <div className="flex items-center justify-center sm:justify-end space-x-2">
            <button
              onClick={() => fetchAuditLogs(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              {currentPage}
            </span>
            <button
              onClick={() => fetchAuditLogs(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {auditLogs.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
          <i className="ri-file-list-line text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">
            No audit logs found matching the current filters
          </p>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedLogDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  Audit Log Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Basic Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Action:</span>{" "}
                        {getActionDisplayName(selectedLogDetails.action)}
                      </div>
                      <div>
                        <span className="font-medium">User:</span>{" "}
                        {selectedLogDetails.user
                          ? `${selectedLogDetails.user.first_name} ${selectedLogDetails.user.last_name}`
                          : "System"}
                      </div>
                      <div>
                        <span className="font-medium">Resource Type:</span>{" "}
                        {getResourceTypeDisplayName(
                          selectedLogDetails.resource_type || "",
                        )}
                      </div>
                      <div>
                        <span className="font-medium">Resource ID:</span>{" "}
                        {selectedLogDetails.resource_id || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Timestamp:</span>{" "}
                        {formatDateTime(selectedLogDetails.created_at)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Technical Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">IP Address:</span>{" "}
                        {selectedLogDetails.ip_address || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">User Agent:</span>{" "}
                        {selectedLogDetails.user_agent || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Log ID:</span>{" "}
                        {selectedLogDetails.id}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                {selectedLogDetails.details && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Details
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {formatDetails(selectedLogDetails.details)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw JSON (for developers) */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Raw Data (JSON)
                  </h4>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-xs text-green-400 overflow-x-auto">
                      {JSON.stringify(selectedLogDetails, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
