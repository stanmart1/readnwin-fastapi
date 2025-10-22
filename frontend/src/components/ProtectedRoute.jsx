import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ children, requiredRole = null, requiredPermission = null }) => {
  const { isAuthenticated, getUser } = useAuth();
  const user = getUser();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const userRole = user?.role?.name;
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (requiredPermission) {
    const userPermissions = user?.permissions || [];
    const hasPermission = userPermissions.some(p => p.name === requiredPermission);
    
    if (!hasPermission && user?.role?.name !== 'admin' && user?.role?.name !== 'super_admin') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export const AdminRoute = ({ children }) => {
  return (
    <ProtectedRoute requiredRole={['admin', 'super_admin']}>
      {children}
    </ProtectedRoute>
  );
};
