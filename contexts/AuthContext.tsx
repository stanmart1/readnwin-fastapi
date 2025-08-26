"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth-service";

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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    status: "loading",
    error: null,
  });
  const router = useRouter();

  const clearAuthData = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("csrf_token");
    localStorage.removeItem("token_expiry");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      const token = localStorage.getItem("token");
      const user = authService.getUser();

      if (token && user) {
        if (authService.shouldRefreshToken()) {
          try {
            await authService.refreshToken();
          } catch (refreshError) {
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

        try {
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
            setAuthState({
              user: serverUser,
              isAuthenticated: true,
              isLoading: false,
              status: "authenticated",
              error: null,
            });
          } else {
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
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await authService.login(email, password);
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        status: "authenticated",
        error: null,
      });
      return true;
    } catch (err) {
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
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      await authService.logout();
      clearAuthData();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        status: "unauthenticated",
        error: null,
      });
      router.push("/login");
    } catch (err) {
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}