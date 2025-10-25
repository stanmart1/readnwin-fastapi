import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { getUser, getPermissions } = useAuth();
  const user = getUser();
  const cachedPermissions = getPermissions();

  const hasPermission = (permissionName) => {
    if (!user) return false;
    
    // Super admin has all permissions
    if (user.role?.name === 'super_admin') {
      return true;
    }

    // Check cached permissions first
    if (cachedPermissions.length > 0) {
      return cachedPermissions.some(p => 
        (typeof p === 'string' ? p : p.name) === permissionName
      );
    }

    // Fallback to user.permissions
    const permissions = user.permissions || [];
    return permissions.some(p => 
      (typeof p === 'string' ? p : p.name) === permissionName
    );
  };

  const hasRole = (roleName) => {
    if (!user || !user.role) return false;
    
    const allowedRoles = Array.isArray(roleName) ? roleName : [roleName];
    return allowedRoles.includes(user.role.name);
  };

  const hasAnyPermission = (permissionNames) => {
    return permissionNames.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissionNames) => {
    return permissionNames.every(permission => hasPermission(permission));
  };

  const canAccess = (resource, action = 'read') => {
    const permissionName = `${resource}.${action}`;
    return hasPermission(permissionName);
  };

  const isAdmin = () => {
    return hasRole(['admin', 'super_admin']);
  };

  const isSuperAdmin = () => {
    return hasRole('super_admin');
  };

  return {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    isAdmin,
    isSuperAdmin,
    user
  };
};
