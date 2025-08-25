'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth-service';

interface User {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  role?: {
    id: number;
    name: string;
    display_name: string;
  };
  permissions: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    status: 'loading',
    error: null
  });
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const user = await authService.getUser();
      if (user) {
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          status: 'authenticated',
          error: null
        });
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          status: 'unauthenticated',
          error: null
        });
      }
    } catch (err) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        status: 'unauthenticated',
        error: 'Authentication check failed'
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login failed:', errorData.detail);
        setAuthState(prev => ({
          ...prev,
          error: errorData.detail || 'Login failed',
          status: 'unauthenticated'
        }));
        return false;
      }

      const data = await response.json();
      document.cookie = `token=${data.access_token}; path=/; samesite=strict; secure`;
      
      setAuthState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        status: 'authenticated',
        error: null
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Login failed',
        status: 'unauthenticated'
      }));
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Logout failed:', response.statusText);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        status: 'unauthenticated',
        error: null
      });
      router.push('/login');
    }
  }, [router]);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    status: authState.status,
    login,
    logout
  };
};