import { usePermissions } from '../hooks/usePermissions';

export const PermissionGate = ({ 
  children, 
  permission = null, 
  role = null, 
  fallback = null 
}) => {
  const { hasPermission, hasRole } = usePermissions();

  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  }

  if (role && hasAccess) {
    hasAccess = hasRole(role);
  }

  if (!hasAccess) {
    return fallback;
  }

  return children;
};

export const AdminOnly = ({ children, fallback = null }) => {
  return (
    <PermissionGate role={['admin', 'super_admin']} fallback={fallback}>
      {children}
    </PermissionGate>
  );
};

export const SuperAdminOnly = ({ children, fallback = null }) => {
  return (
    <PermissionGate role="super_admin" fallback={fallback}>
      {children}
    </PermissionGate>
  );
};
