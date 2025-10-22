import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

const RolePermissionsModal = ({ isOpen, onClose, role }) => {
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role && isOpen) {
      fetchPermissions();
      fetchRolePermissions();
    }
  }, [role, isOpen]);

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/rbac/permissions');
      setPermissions(response.data || []);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  };

  const fetchRolePermissions = async () => {
    try {
      const response = await api.get(`/rbac/roles/${role.id}/permissions`);
      const perms = Array.isArray(response.data) ? response.data : (response.data?.permissions || []);
      setRolePermissions(perms);
      setSelectedPermissions(perms.map(p => p.id));
    } catch (err) {
      console.error('Error fetching role permissions:', err);
      setRolePermissions([]);
      setSelectedPermissions([]);
    }
  };

  const handleToggle = (permissionId) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const currentIds = rolePermissions.map(p => p.id);
      
      // Remove permissions
      for (const permId of currentIds) {
        if (!selectedPermissions.includes(permId)) {
          await api.delete(`/rbac/roles/${role.id}/permissions/${permId}`);
        }
      }

      // Add permissions
      for (const permId of selectedPermissions) {
        if (!currentIds.includes(permId)) {
          await api.post(`/rbac/roles/${role.id}/permissions`, { permission_id: permId });
        }
      }

      await fetchRolePermissions();
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !role) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Permissions</h2>
            <p className="text-gray-600 mt-1">{role.display_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Permissions</h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="ri-edit-line mr-2"></i>
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedPermissions(rolePermissions.map(p => p.id));
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {permissions.map((permission) => (
              <label
                key={permission.id}
                className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedPermissions.includes(permission.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!isEditing ? 'cursor-default' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(permission.id)}
                  onChange={() => isEditing && handleToggle(permission.id)}
                  disabled={!isEditing}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{permission.display_name}</div>
                  <div className="text-sm text-gray-600">{permission.description || 'No description'}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RolePermissionsModal;
