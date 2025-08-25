/**
 * Admin API utility functions for making authenticated requests to FastAPI backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class AdminApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

/**
 * Make an authenticated API request to the FastAPI backend
 */
export async function adminApiRequest(
  endpoint: string,
  options: RequestInit = {},
): Promise<any> {
  // Check if we're in browser environment
  if (typeof window === "undefined") {
    throw new AdminApiError("Cannot make API request on server side", 500);
  }

  const token = localStorage.getItem("token");

  if (!token) {
    throw new AdminApiError("No authentication token found", 401);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Don't override Content-Type if it's already set (e.g., for FormData)
  const headers = options.headers
    ? { ...defaultHeaders, ...options.headers }
    : defaultHeaders;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorData;

      try {
        errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // If we can't parse the error response, use the default message
      }

      throw new AdminApiError(errorMessage, response.status, errorData);
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      return null;
    }
  } catch (error) {
    if (error instanceof AdminApiError) {
      throw error;
    }

    // Network or other errors
    throw new AdminApiError(
      error instanceof Error ? error.message : "Network error",
      0,
    );
  }
}

/**
 * GET request helper
 */
export function adminGet(endpoint: string): Promise<any> {
  return adminApiRequest(endpoint, { method: "GET" });
}

/**
 * POST request helper
 */
export function adminPost(endpoint: string, data?: any): Promise<any> {
  const options: RequestInit = { method: "POST" };

  if (data) {
    if (data instanceof FormData) {
      options.body = data;
      // Don't set Content-Type for FormData, let browser set it with boundary
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      options.headers = {
        Authorization: `Bearer ${token}`,
      };
    } else {
      options.body = JSON.stringify(data);
    }
  }

  return adminApiRequest(endpoint, options);
}

/**
 * PUT request helper
 */
export function adminPut(endpoint: string, data?: any): Promise<any> {
  const options: RequestInit = { method: "PUT" };

  if (data) {
    if (data instanceof FormData) {
      options.body = data;
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      options.headers = {
        Authorization: `Bearer ${token}`,
      };
    } else {
      options.body = JSON.stringify(data);
    }
  }

  return adminApiRequest(endpoint, options);
}

/**
 * DELETE request helper
 */
export function adminDelete(endpoint: string, data?: any): Promise<any> {
  const options: RequestInit = { method: "DELETE" };
  if (data) {
    options.body = JSON.stringify(data);
  }
  return adminApiRequest(endpoint, options);
}

/**
 * Admin-specific API endpoints
 */
/**
 * Check if user is authenticated before making API calls
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("token");
  return !!token;
}

export const adminApi = {
  // Stats and Analytics
  getOverviewStats: () => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    return adminGet("/admin/stats/overview");
  },
  getDailyActivity: () => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    return adminGet("/admin/stats/daily-activity");
  },
  getMonthlyTrends: () => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    return adminGet("/admin/stats/monthly-trends");
  },
  getRecentActivities: (limit?: number) => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    const params = limit ? `?limit=${limit}` : "";
    return adminGet(`/admin/stats/recent-activities${params}`);
  },
  getGrowthMetrics: () => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    return adminGet("/admin/stats/growth-metrics");
  },

  // Books Management
  getBooks: (params?: URLSearchParams) =>
    adminGet(`/admin/books${params ? `?${params}` : ""}`),
  getBook: (id: number) => adminGet(`/admin/books/${id}`),
  createBook: (data: FormData) => adminPost("/admin/books", data),
  updateBook: (id: number, data: any) => adminPut(`/admin/books/${id}`, data),
  deleteBook: (id: number) => adminDelete(`/admin/books/${id}`),
  bulkDeleteBooks: (ids: number[]) =>
    adminPost("/admin/books/bulk-delete", { book_ids: ids }),
  bulkImportBooks: (data: FormData) =>
    adminPost("/admin/enhanced/library/bulk-import", data),
  bulkUpdateBooks: (data: FormData) =>
    adminPost("/admin/enhanced/library/bulk-update", data),
  toggleBookActive: (id: number) => 
    adminApiRequest(`/admin/books/${id}/toggle-active`, { method: 'PATCH' }),
  bulkToggleActive: (ids: number[], isActive: boolean) =>
    adminPost("/admin/books/bulk-active", { book_ids: ids, is_active: isActive }),

  // Categories Management
  getCategories: () => adminGet("/admin/categories"),
  createCategory: (data: any) => adminPost("/admin/categories", data),

  // Authors Management
  getAuthors: () => adminGet("/admin/authors"),
  createAuthor: (data: any) => adminPost("/admin/authors", data),

  // Users Management
  getUsers: (params?: URLSearchParams) =>
    adminGet(`/admin/users${params ? `?${params}` : ""}`),
  getUserStats: () => adminGet("/users/stats/overview"),
  getUser: (id: number) => adminGet(`/users/${id}`),
  updateUserStatus: (id: number, isActive: boolean) =>
    adminPut(`/admin/users/${id}/status`, { is_active: isActive }),
  updateUserRole: (id: number, roleId: number) =>
    adminPut(`/users/${id}/role`, { role_id: roleId }),
  deleteUser: (id: number) => adminDelete(`/admin/users/${id}`),
  bulkAssignLibrary: (data: any) =>
    adminPost("/admin/users/library/bulk-assign", data),

  // Role Management
  getRoles: () => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    return adminGet("/admin/roles");
  },
  createRole: (data: any) => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    return adminPost("/rbac/roles", data);
  },
  updateRole: (id: number, data: any) => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    return adminPut(`/rbac/roles/${id}`, data);
  },
  deleteRole: (id: number) => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    return adminDelete(`/rbac/roles/${id}`);
  },
  assignRole: (userId: number, roleId: number) => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    return adminPost("/rbac/assign-role", { user_id: userId, role_id: roleId });
  },
  removeUserRole: (userId: number) => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    return adminDelete(`/rbac/users/${userId}/role`);
  },
  getPermissions: () => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    return adminGet("/rbac/permissions");
  },
  getRolePermissions: (roleId: number) => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    return adminGet(`/rbac/roles/${roleId}/permissions`);
  },
  addRolePermission: (roleId: number, permissionId: number) => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    return adminPost(`/rbac/roles/${roleId}/permissions`, { permission_id: permissionId });
  },
  removeRolePermission: (roleId: number, permissionId: number) => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    return adminDelete(`/rbac/roles/${roleId}/permissions?permission_id=${permissionId}`);
  },
  createPermission: (data: any) => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    return adminPost("/rbac/permissions", data);
  },
  updatePermission: (id: number, data: any) => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    return adminPut(`/rbac/permissions/${id}`, data);
  },
  deletePermission: (id: number) => {
    if (!isAuthenticated()) {
      return Promise.reject(new AdminApiError("User not authenticated", 401));
    }
    return adminDelete(`/rbac/permissions/${id}`);
  },

  // Orders Management
  getOrders: () => adminGet("/admin/orders"),
  updateOrderStatus: (id: number, status: string) =>
    adminPut(`/admin/orders/${id}/status`, { status }),

  // Blog Management
  getBlogPosts: () => adminGet("/blog/posts/admin"),
  getBlogCategories: () => adminGet("/blog/categories"),
  getBlogStats: () => adminGet("/blog/stats"),
  createBlogPost: (data: any) => adminPost("/blog/posts", data),
  updateBlogPost: (id: number, data: any) =>
    adminPut(`/blog/posts/${id}`, data),
  deleteBlogPost: (id: number) => adminDelete(`/blog/posts/${id}`),
  uploadBlogImages: (postId: number, data: FormData) =>
    adminPost(`/blog/posts/${postId}/images`, data),
  deleteBlogImage: (postId: number, imageId: string) =>
    adminDelete(`/blog/posts/${postId}/images?imageId=${imageId}`),

  // Email Management
  getEmailTemplates: () => adminGet("/admin/email/templates"),
  getEmailCategories: () => adminGet("/admin/email/templates/categories"),
  getEmailFunctions: () => adminGet("/admin/email/templates/functions"),
  getEmailAssignments: () => adminGet("/admin/email/templates/assignments"),
  getEmailStats: () => adminGet("/admin/email/templates/stats"),
  createEmailTemplate: (data: any) => adminPost("/admin/email/templates", data),
  updateEmailTemplate: (id: number, data: any) =>
    adminPut(`/admin/email/templates/${id}`, data),
  deleteEmailTemplate: (id: number) =>
    adminDelete(`/admin/email/templates/${id}`),
  assignEmailTemplate: (data: any) =>
    adminPost("/admin/email/templates/assignments", data),
  unassignEmailTemplate: (functionId: string, templateId: number) =>
    adminDelete(
      `/admin/email/templates/assignments?function_id=${functionId}&template_id=${templateId}`,
    ),

  // Email Gateway Management
  getEmailGateways: () => adminGet("/admin/email/gateways"),
  updateEmailGateways: (data: any) => adminPost("/admin/email/gateways", data),
  testEmailGateway: (data: any) =>
    adminPost("/admin/email/gateways/test", data),

  // Contact Management
  getContactInfo: () => adminGet("/contact/info"),

  // FAQ Management
  getFAQs: () => adminGet("/faq"),

  // About Management
  getAboutInfo: () => adminGet("/about"),
  uploadImage: (data: FormData) => adminPost("/admin/upload-image", data),

  // System Settings Management
  getSystemSettings: () => adminGet("/admin/enhanced/settings"),
  updateSystemSettings: (data: any) =>
    adminPut("/admin/enhanced/settings", data),

  // Shipping Management
  getShippingConfigs: () => adminGet("/admin/enhanced/shipping/config"),
  createShippingConfig: (data: any) =>
    adminPost("/admin/enhanced/shipping/config", data),
  updateShippingConfig: (id: number, data: any) =>
    adminPut(`/admin/enhanced/shipping/config/${id}`, data),

  // Enhanced Analytics
  getEnhancedAnalytics: () => adminGet("/admin/enhanced/analytics/overview"),

  // Notifications Management
  getNotifications: (params?: URLSearchParams) =>
    adminGet(`/admin/notifications${params ? `?${params}` : ""}`),
  getNotificationStats: () => adminGet("/admin/notifications/stats"),
  createNotification: (data: any) => adminPost("/admin/notifications", data),
  updateNotification: (id: number, data: any) =>
    adminPut(`/admin/notifications/${id}`, data),
  deleteNotification: (id: number) =>
    adminDelete(`/admin/notifications/${id}`),
  batchDeleteNotifications: (data: any) =>
    adminApiRequest("/admin/notifications/batch-delete", {
      method: "DELETE",
      body: JSON.stringify(data)
    }),
  markNotificationRead: (id: number) =>
    adminPost(`/admin/notifications/${id}/mark-read`, {}),
};

/**
 * Handle API errors consistently across admin components
 */
export function handleApiError(error: unknown): string {
  if (error instanceof AdminApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}

/**
 * Check if error is authentication related
 */
export function isAuthError(error: unknown): boolean {
  return error instanceof AdminApiError && error.status === 401;
}
