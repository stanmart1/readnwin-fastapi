"use client";

import { useState, useEffect, useCallback } from "react";
import { ApiClient } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";

interface UsePermissionsReturn {
  permissions: string[];
  loading: boolean;
  error: string | null;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

const api = new ApiClient();

export function usePermissions(): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const fetchPermissions = useCallback(async () => {
    // Don't fetch if auth is still loading or user is not authenticated
    if (authLoading || !isAuthenticated) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Set the token on the API client before making the request
      api.setToken(token);
      const response = await api.request("/auth/permissions");
      setPermissions(response.permissions || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching permissions:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch permissions",
      );
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    // Only fetch permissions when auth is ready and user is authenticated
    if (!authLoading && isAuthenticated) {
      fetchPermissions();
    } else if (!authLoading && !isAuthenticated) {
      // Clear permissions if not authenticated
      setPermissions([]);
      setLoading(false);
    }
  }, [fetchPermissions, authLoading, isAuthenticated]);

  const hasPermission = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions],
  );

  const hasAnyPermission = useCallback(
    (requiredPermissions: string[]) =>
      requiredPermissions.some((permission) =>
        permissions.includes(permission),
      ),
    [permissions],
  );

  const hasAllPermissions = useCallback(
    (requiredPermissions: string[]) =>
      requiredPermissions.every((permission) =>
        permissions.includes(permission),
      ),
    [permissions],
  );

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions: fetchPermissions,
  };
}
