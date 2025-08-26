'use client';

import { AppErrorHandler } from './error-handler';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
  }

  async request(endpoint: string, options: RequestInit = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      // Refresh token from localStorage before each request
      if (typeof window !== "undefined") {
        const currentToken = localStorage.getItem("token");
        if (currentToken) {
          this.token = currentToken;
        }
        
        // Add CSRF token for state-changing requests
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase() || 'GET')) {
          const csrfToken = localStorage.getItem('csrf_token');
          if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
          }
        }
      }

      if (this.token) {
        headers["Authorization"] = `Bearer ${this.token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `API Error: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the error response, use the status text
        }
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        
        // Handle session expiration or token revocation
        if (response.status === 401) {
          // Try to refresh token if available
          if (typeof window !== "undefined" && localStorage.getItem('refresh_token')) {
            try {
              const { authService } = await import('./auth-service');
              await authService.refreshToken();
              // Retry the original request with new token
              return this.request(endpoint, options);
            } catch (refreshError) {
              AppErrorHandler.handleSessionExpired();
            }
          } else {
            AppErrorHandler.handleSessionExpired();
          }
        }
        
        throw error;
      }

      return response.json();
    } catch (error: any) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        AppErrorHandler.showConnectionError();
      }
      throw error;
    }
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  async checkVerificationStatus(email: string) {
    return this.request("/auth/check-verification-status", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async getCurrentUser() {
    return this.request("/auth/me");
  }

  async getPermissions() {
    return this.request("/auth/permissions");
  }

  async register(userData: any) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  // Dashboard endpoints
  async getDashboardData() {
    return this.request("/dashboard/data");
  }

  // Books endpoints
  async getBooks(params?: any) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/books?${query}`);
  }

  async getBook(id: number) {
    return this.request(`/books/${id}`);
  }

  async getCategories() {
    return this.request("/books/categories/");
  }

  // Cart endpoints
  async getCart() {
    return this.request("/cart/");
  }

  async addToCart(bookId: number, quantity: number = 1) {
    return this.request("/cart/add", {
      method: "POST",
      body: JSON.stringify({ book_id: bookId, quantity }),
    });
  }

  async removeFromCart(itemId: number) {
    return this.request(`/cart/${itemId}`, {
      method: "DELETE",
    });
  }

  // Orders endpoints
  async createOrder(orderData: any) {
    return this.request("/orders/", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }

  async getOrders() {
    return this.request("/orders/");
  }

  // Blog endpoints
  async getBlogPosts(params?: any) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/blog/posts?${query}`);
  }

  async getBlogPost(slug: string) {
    return this.request(`/blog/posts/${slug}`);
  }

  // Contact endpoint
  async submitContact(contactData: any) {
    return this.request("/contact/", {
      method: "POST",
      body: JSON.stringify(contactData),
    });
  }

  // FAQ endpoint
  async getFAQs() {
    return this.request("/faq/");
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request("/admin/stats/overview");
  }

  async getAllOrders() {
    return this.request("/admin/orders");
  }

  async updateOrderStatus(orderId: number, status: string) {
    return this.request(`/admin/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  // Admin notification endpoints
  async getAdminNotifications(params?: any) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/notifications?${query}`);
  }

  async getAdminNotificationStats() {
    return this.request("/admin/notifications/stats");
  }

  // System settings endpoints
  async getSystemSettings(category?: string) {
    const query = category ? `?category=${category}` : '';
    return this.request(`/admin/system-settings${query}`);
  }

  async updateSystemSetting(key: string, value: any) {
    return this.request(`/admin/system-settings/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
  }

  async initializeSystemSettings() {
    return this.request("/admin/system-settings/initialize", {
      method: "POST",
    });
  }
}

export const apiClient = new ApiClient();
