import { useState } from 'react';
import api from '../lib/api';

export const useRolePermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllPermissions = async () => {
    try {
      const response = await api.get('/rbac/permissions', {
        params: { limit: 1000 }
      });
      const data = response.data?.permissions || response.data || [];
      setPermissions(Array.isArray(data) ? data : []);
      return { success: true, data };
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setPermissions([]);
      return { success: false, error: err.message };
    }
  };

  const fetchRolePermissions = async (roleId) => {
    try {
      const response = await api.get(`/rbac/roles/${roleId}/permissions`);
      const perms = Array.isArray(response.data) ? response.data : (response.data?.permissions || []);
      setRolePermissions(perms);
      return { success: true, data: perms };
    } catch (err) {
      console.error('Error fetching role permissions:', err);
      setRolePermissions([]);
      return { success: false, error: err.message };
    }
  };

  const updateRolePermissions = async (roleId, selectedPermissionIds, currentPermissionIds) => {
    setLoading(true);
    try {
      // Remove permissions
      for (const permId of currentPermissionIds) {
        if (!selectedPermissionIds.includes(permId)) {
          await api.delete(`/rbac/roles/${roleId}/permissions/${permId}`);
        }
      }

      // Add permissions
      for (const permId of selectedPermissionIds) {
        if (!currentPermissionIds.includes(permId)) {
          await api.post(`/rbac/roles/${roleId}/permissions`, { permission_id: permId });
        }
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating permissions:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const addPermissionToRole = async (roleId, permissionId) => {
    try {
      await api.post(`/rbac/roles/${roleId}/permissions`, { permission_id: permissionId });
      return { success: true };
    } catch (err) {
      console.error('Error adding permission:', err);
      return { success: false, error: err.message };
    }
  };

  const removePermissionFromRole = async (roleId, permissionId) => {
    try {
      await api.delete(`/rbac/roles/${roleId}/permissions/${permissionId}`);
      return { success: true };
    } catch (err) {
      console.error('Error removing permission:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    permissions,
    rolePermissions,
    loading,
    fetchAllPermissions,
    fetchRolePermissions,
    updateRolePermissions,
    addPermissionToRole,
    removePermissionFromRole
  };
};
