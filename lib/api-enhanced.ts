'use client';

import { ApiClient } from "./api";
import { AppErrorHandler } from "./error-handler";

export class EnhancedApiClient extends ApiClient {
  // E-reader Features
  async getEpubContent(bookId: number, fileUrl: string) {
    return this.post(`/books/${bookId}/epub-content`, { fileUrl });
  }

  async getReadingProgress(bookId: number) {
    return this.request(`/books/${bookId}/progress`);
  }

  async updateReadingProgress(bookId: number, progressData: any) {
    return this.post(`/books/${bookId}/progress`, progressData);
  }

  async getBookAnnotations(bookId: number) {
    return this.request(`/books/${bookId}/annotations`);
  }

  async createAnnotation(bookId: number, annotationData: any) {
    return this.post(`/books/${bookId}/annotations`, annotationData);
  }

  // Legacy Reading System Features
  async getReadingSessions(bookId?: number) {
    const query = bookId ? `?book_id=${bookId}` : '';
    return this.request(`/reading/sessions${query}`);
  }

  async updateReadingSession(sessionId: number, data: any) {
    return this.request(`/reading/sessions/${sessionId}/progress`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async convertTextToSpeech(text: string, options = {}) {
    return this.post("/reading/text-to-speech", { text, ...options });
  }

  async createReadingGoal(goalData: any) {
    return this.post("/reading/goals", goalData);
  }

  async getReadingGoals() {
    return this.request("/reading/goals");
  }

  async deleteReadingGoal(goalId: number) {
    return this.request(`/reading/goals/${goalId}`, {
      method: 'DELETE'
    });
  }

  // Enhanced Payment Features
  async verifyPayment(verificationData: any) {
    return this.post("/payment/verify", verificationData);
  }

  async processBankTransfer(transferData: any) {
    return this.post("/payment/bank-transfer", transferData);
  }

  async getPaymentStatus(paymentId: string) {
    return this.request(`/payment/status/${paymentId}`);
  }

  // Enhanced Order Management
  async createEnhancedOrder(orderData: any) {
    return this.post("/orders/enhanced", orderData);
  }

  async getOrderTracking(orderId: number) {
    return this.request(`/orders/enhanced/${orderId}/tracking`);
  }

  async updateShippingStatus(orderId: number, statusData: any) {
    return this.request(`/orders/enhanced/${orderId}/shipping`, {
      method: "PUT",
      body: JSON.stringify(statusData),
    });
  }

  // Enhanced Shopping Features
  async getEnhancedCart() {
    return this.request("/shopping/cart");
  }

  async addToEnhancedCart(itemData: any) {
    return this.post("/shopping/cart/items", itemData);
  }

  async createCheckoutSession(sessionData: any) {
    return this.post("/shopping/checkout/session", sessionData);
  }

  async getShoppingPreferences() {
    return this.request("/shopping/preferences");
  }

  async updateShoppingPreferences(preferences: any) {
    return this.request("/shopping/preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    });
  }

  // Analytics Features
  async getReadingAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/analytics/reading?${queryString}`);
  }

  async getComprehensiveAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/analytics/comprehensive?${queryString}`);
  }

  async getUserEngagement(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/analytics/engagement?${queryString}`);
  }

  async getDetailedReadingStats(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/analytics/reading/detailed?${queryString}`);
  }

  // User Library Features
  async getUserLibrary() {
    return this.request('/user/library');
  }

  async toggleBookFavorite(bookId: number, isFavorite: boolean) {
    return this.request(`/user/library/${bookId}/favorite`, {
      method: 'PUT',
      body: JSON.stringify({ is_favorite: isFavorite })
    });
  }

  // Admin Email Management
  async getEmailTemplates() {
    return this.request("/admin/email/templates");
  }

  async createEmailTemplate(templateData: any) {
    return this.post("/admin/email/templates", templateData);
  }

  async updateEmailTemplate(templateId: number, templateData: any) {
    return this.request(`/admin/email/templates/${templateId}`, {
      method: "PUT",
      body: JSON.stringify(templateData),
    });
  }

  async getEmailGatewayConfig() {
    return this.request("/admin/email/gateway");
  }

  async updateEmailGatewayConfig(configData: any) {
    return this.request("/admin/email/gateway", {
      method: "PUT",
      body: JSON.stringify(configData),
    });
  }

  // Admin Enhanced Features
  async getSystemSettings() {
    return this.request("/admin/enhanced/settings");
  }

  async updateSystemSettings(settingsData: any) {
    return this.request("/admin/enhanced/settings", {
      method: "PUT",
      body: JSON.stringify(settingsData),
    });
  }

  async bulkImportBooks(formData: FormData) {
    return this.request("/admin/enhanced/library/bulk-import", {
      method: "POST",
      body: formData,
      headers: {
        // Don't set Content-Type here, let the browser set it with the boundary
        Authorization: `Bearer ${this.token}`,
      },
    });
  }

  async uploadFile(endpoint: string, formData: FormData) {
    return this.request(endpoint, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
  }
}
