"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { useRouter } from "next/navigation";
import { authService, AuthResponse } from "@/lib/auth-service";

interface User {
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

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  status: "loading" | "authenticated" | "unauthenticated";
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    username: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    status: "loading",
    error: null,
  });
  const router = useRouter();

  const clearAuthData = useCallback(() => {
    console.log("🔍 AuthProvider: Clearing auth data");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("csrf_token");
    localStorage.removeItem("token_expiry");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      console.log("🔍 AuthProvider: Checking authentication");
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const token = localStorage.getItem("token");
      const user = authService.getUser();

      console.log("🔍 AuthProvider: Current auth state", {
        hasToken: !!token,
        hasUser: !!user,
        userEmail: user?.email,
      });

      if (token && user) {
        // Check if token needs refresh
        if (authService.shouldRefreshToken()) {
          try {
            console.log("🔄 AuthProvider: Refreshing token");
            await authService.refreshToken();
          } catch (refreshError) {
            console.warn("⚠️ AuthProvider: Token refresh failed, clearing auth data");
            clearAuthData();
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              status: "unauthenticated",
              error: null,
            });
            return;
          }
        }

        // Validate token with server
        try {
          console.log("🔍 AuthProvider: Validating token with server");
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/me`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            },
          );

          if (response.ok) {
            const serverUser = await response.json();
            console.log("✅ AuthProvider: Token valid, user authenticated", {
              userId: serverUser.id,
              userRole: serverUser.role?.name,
            });
            setAuthState({
              user: serverUser,
              isAuthenticated: true,
              isLoading: false,
              status: "authenticated",
              error: null,
            });
          } else {
            console.log("❌ AuthProvider: Token invalid, clearing auth data");
            clearAuthData();
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              status: "unauthenticated",
              error: null,
            });
          }
        } catch (error) {
          console.warn(
            "⚠️ AuthProvider: Could not validate token with server, clearing auth data",
            error,
          );
          clearAuthData();
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            status: "unauthenticated",
            error: null,
          });
        }
      } else {
        console.log("🔍 AuthProvider: No token or user, ensuring clean state");
        clearAuthData();
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          status: "unauthenticated",
          error: null,
        });
      }
    } catch (err) {
      console.error("❌ AuthProvider: Error in checkAuth", err);
      clearAuthData();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        status: "unauthenticated",
        error: "Authentication check failed",
      });
    }
  }, [clearAuthData]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("🔍 AuthProvider: Starting login process", { email });
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      console.log("🔍 AuthProvider: Calling authService.login...");
      const response = await authService.login(email, password);
      console.log("🔍 AuthProvider: Login response received", {
        hasUser: !!response.user,
        userId: response.user?.id,
        userRole: response.user?.role?.name,
      });

      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        status: "authenticated",
        error: null,
      });

      return true;
    } catch (err) {
      console.error("❌ AuthProvider: Login error", err);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        status: "unauthenticated",
        error: "Login failed. Please check your credentials.",
      }));
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log("🔍 AuthProvider: Starting logout process");
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      await authService.logout();

      // Ensure everything is cleared
      clearAuthData();

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        status: "unauthenticated",
        error: null,
      });

      console.log("🔍 AuthProvider: Logout complete, redirecting to /login");
      router.push("/login");
    } catch (err) {
      console.error("❌ AuthProvider: Logout error", err);
      // Even if logout fails, clear local data
      clearAuthData();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        status: "unauthenticated",
        error: null,
      });
      router.push("/login");
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    username: string;
    first_name?: string;
    last_name?: string;
  }): Promise<boolean> => {
    try {
      console.log("🔍 AuthProvider: Starting registration process");
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await authService.register(userData);

      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        status: "authenticated",
        error: null,
      });

      return true;
    } catch (err) {
      console.error("❌ AuthProvider: Registration error", err);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        status: "unauthenticated",
        error: "Registration failed",
      }));
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      const success = await authService.resetPassword(email);

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: null,
      }));

      return success;
    } catch (err) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Password reset request failed",
      }));
      return false;
    }
  };

  const clearError = () => {
    setAuthState((prev) => ({ ...prev, error: null }));
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    register,
    resetPassword,
    refresh: checkAuth,
    clearError,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// For backward compatibility with components expecting session-like object
export const useSession = () => {
  const auth = useAuth();
  return {
    data: auth.user
      ? {
          user: {
            id: auth.user.id.toString(),
            email: auth.user.email,
            username: auth.user.username,
            firstName: auth.user.first_name || "",
            lastName: auth.user.last_name || "",
            role: auth.user.role?.name || "user",
            roleDisplayName: auth.user.role?.display_name || "User",
            roles: [auth.user.role?.name || "user"],
            permissions: auth.user.permissions || [],
            lastLogin: new Date().toISOString(),
          },
        }
      : null,
    status: auth.status,
  };
};
