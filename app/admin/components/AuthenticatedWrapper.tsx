"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useRouter } from "next/navigation";

interface AuthenticatedWrapperProps {
  children: ReactNode;
  requiredPermissions?: string[];
  fallback?: ReactNode;
}

export default function AuthenticatedWrapper({
  children,
  requiredPermissions = [],
  fallback,
}: AuthenticatedWrapperProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShouldRender(false);
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace("/login");
      setShouldRender(false);
      return;
    }

    const hasAdminAccess =
      user.role?.name === "admin" ||
      user.role?.name === "super_admin" ||
      user.role?.name === "moderator" ||
      user.role?.name === "content_manager" ||
      user.permissions?.includes("admin_access");

    if (!hasAdminAccess) {
      router.replace("/login");
      setShouldRender(false);
      return;
    }

    if (requiredPermissions.length > 0) {
      const isAdminRole = user.role?.name === "admin" || user.role?.name === "super_admin" || user.role?.name === "moderator" || user.role?.name === "content_manager";
      const hasRequiredPermissions = requiredPermissions.every(permission =>
        user.permissions?.includes(permission)
      );

      if (!isAdminRole && !hasRequiredPermissions) {
        setShouldRender(false);
        return;
      }
    }

    setShouldRender(true);
  }, [isLoading, isAuthenticated, user]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show fallback or nothing if not authorized
  if (!shouldRender) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <i className="ri-shield-forbid-line text-6xl text-red-500 mb-4"></i>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access this section.
          </p>
        </div>
      </div>
    );
  }

  // Render children only when authenticated and authorized
  return <>{children}</>;
}
