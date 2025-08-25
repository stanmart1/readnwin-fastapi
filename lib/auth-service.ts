import { EnhancedApiClient } from './api-enhanced';
import { AppErrorHandler } from './error-handler';

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  csrf_token?: string;
  token_type: string;
  expires_in?: number;
  user: {
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
  };
}

class AuthService {
  private api: EnhancedApiClient;

  constructor() {
    this.api = new EnhancedApiClient();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.api.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.access_token && response.user) {
        // Store all auth data synchronously for immediate access
        this.api.setToken(response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('token', response.access_token);
        
        // Store refresh token and CSRF token securely
        if (response.refresh_token) {
          localStorage.setItem('refresh_token', response.refresh_token);
        }
        if (response.csrf_token) {
          localStorage.setItem('csrf_token', response.csrf_token);
        } else {
          // Fetch CSRF token after login
          this.fetchCsrfToken();
        }
        
        // Set token expiry time
        if (response.expires_in) {
          const expiryTime = Date.now() + (response.expires_in * 1000);
          localStorage.setItem('token_expiry', expiryTime.toString());
        }
        
        // Set cookie for middleware (non-blocking)
        document.cookie = `token=${response.access_token}; path=/; samesite=strict; secure=${window.location.protocol === 'https:'}`;
      }

      return response;
    } catch (error) {
      AppErrorHandler.handle(error, 'Auth Login');
      throw error;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    username: string;
    first_name?: string;
    last_name?: string;
  }): Promise<AuthResponse> {
    try {
      const response = await this.api.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.access_token) {
        this.api.setToken(response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        // Also set token in cookies for middleware
        document.cookie = `token=${response.access_token}; path=/; samesite=strict; secure=${window.location.protocol === 'https:'}`;
      }

      return response;
    } catch (error) {
      AppErrorHandler.handle(error, 'Auth Register');
      throw new Error('Registration failed');
    }
  }

  async verifyEmail(token: string): Promise<boolean> {
    try {
      await this.api.request('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      return true;
    } catch (error) {
      AppErrorHandler.handle(error, 'Email Verification');
      return false;
    }
  }

  async resetPassword(email: string): Promise<boolean> {
    try {
      await this.api.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return true;
    } catch (error) {
      AppErrorHandler.handle(error, 'Password Reset');
      return false;
    }
  }

  async confirmResetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      await this.api.request('/auth/reset-password/confirm', {
        method: 'POST',
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.api.request('/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.access_token) {
        // Update stored tokens
        this.api.setToken(response.access_token);
        localStorage.setItem('token', response.access_token);
        
        if (response.csrf_token) {
          localStorage.setItem('csrf_token', response.csrf_token);
        }
        
        // Update token expiry
        if (response.expires_in) {
          const expiryTime = Date.now() + (response.expires_in * 1000);
          localStorage.setItem('token_expiry', expiryTime.toString());
        }
        
        // Update cookie
        document.cookie = `token=${response.access_token}; path=/; samesite=strict; secure=${window.location.protocol === 'https:'}`;
      }

      return response;
    } catch (error) {
      // If refresh fails, clear all tokens
      this.clearTokens();
      AppErrorHandler.handle(error, 'Token Refresh');
      throw new Error('Token refresh failed');
    }
  }

  async logout(): Promise<void> {
    // Make server request first to blacklist token
    try {
      await this.api.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Continue with local cleanup even if server request fails
      console.warn('Logout request failed, continuing with local cleanup');
    }
    
    // Clear all local data
    this.clearTokens();
  }
  
  private clearTokens(): void {
    this.api.setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('csrf_token');
    localStorage.removeItem('token_expiry');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }

  getUser() {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      // Clear corrupted data silently
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.api.token || localStorage.getItem('token');
    const user = this.getUser();
    const tokenExpiry = localStorage.getItem('token_expiry');
    
    if (!token || !user) {
      return false;
    }
    
    // Check if token is expired
    if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
      return false;
    }
    
    return true;
  }
  
  shouldRefreshToken(): boolean {
    const tokenExpiry = localStorage.getItem('token_expiry');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!tokenExpiry || !refreshToken) {
      return false;
    }
    
    // Refresh if token expires in less than 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() > (parseInt(tokenExpiry) - fiveMinutes);
  }
  
  getCsrfToken(): string | null {
    return localStorage.getItem('csrf_token');
  }
  
  async fetchCsrfToken(): Promise<void> {
    try {
      const response = await this.api.request('/auth/csrf-token');
      if (response.data?.csrf_token) {
        localStorage.setItem('csrf_token', response.data.csrf_token);
      }
    } catch (error) {
      console.warn('Failed to fetch CSRF token:', error);
    }
  }
}

export const authService = new AuthService();