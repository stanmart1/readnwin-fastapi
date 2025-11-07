import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useEffect, useState } from 'react';
import api from '../lib/api';

/**
 * Protected Route Component
 * Protects routes based on authentication, role, or permissions
 * 
 * Usage:
 * <ProtectedRoute requiredPermission="manage_users">{children}</ProtectedRoute>
 * <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
 * <ProtectedRoute>{children}</ProtectedRoute>
 */
export const ProtectedRoute = ({ children, requiredRole = null, requiredPermission = null }) => {
  const { isAuthenticated, getUser, logout } = useAuth();
  const { hasPermission, isAdmin } = usePermissions();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const user = getUser();

  // Check authentication
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        await api.get('/auth/me');
        setIsValid(true);
      } catch (error) {
        if (error.response?.status === 401) {
          logout();
        }
      } finally {
        setIsValidating(false);
      }
    };
    validateToken();
  }, []);

  // Show loading while validating
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect if invalid
  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!allowedRoles.includes(user?.role?.name)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check permission-based access
  // Super admins always have access
  // Admins always have access
  // Others need the specific permission
  if (requiredPermission) {
    if (!isAdmin() && !hasPermission(requiredPermission)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

/**
 * Admin Route - Restricts access to admin and super_admin users
 * Usage: <AdminRoute requiredPermission="manage_settings">{children}</AdminRoute>
 */
export const AdminRoute = ({ children, requiredPermission = null }) => {
  return (
    <ProtectedRoute requiredRole={['admin', 'super_admin']} requiredPermission={requiredPermission}>
      {children}
    </ProtectedRoute>
  );
};
