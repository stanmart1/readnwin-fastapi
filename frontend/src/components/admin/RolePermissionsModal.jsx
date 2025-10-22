import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRolePermissions } from '../../hooks/useRolePermissions';

const RolePermissionsModal = ({ isOpen, onClose, role }) => {
  const {
    permissions,
    rolePermissions,
    loading,
    fetchAllPermissions,
    fetchRolePermissions,
    updateRolePermissions
  } = useRolePermissions();

  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);

  useEffect(() => {
    if (role && isOpen) {
      fetchAllPermissions();
      loadRolePermissions();
    }
  }, [role, isOpen]);

  const loadRolePermissions = async () => {
    const result = await fetchRolePermissions(role.id);
    if (result.success) {
      setSelectedPermissions(result.data.map(p => p.id));
    }
  };

  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSavePermissions = async () => {
    const currentIds = rolePermissions.map(p => p.id);
    const result = await updateRolePermissions(role.id, selectedPermissions, currentIds);
    
    if (result.success) {
      await loadRolePermissions();
      setIsEditingPermissions(false);
    }
  };

  const handleCancel = () => {
    setIsEditingPermissions(false);
    setSelectedPermissions(rolePermissions.map(p => p.id));
  };

  if (!isOpen || !role) return null;

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const resource = perm.resource || 'other';
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(perm);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Permissions for {role.display_name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {isEditingPermissions
                      ? "Select permissions to assign to this role"
                      : "View current permissions"}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {!isEditingPermissions ? (
                    <button
                      onClick={() => setIsEditingPermissions(true)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center"
                    >
                      <i className="ri-edit-line mr-2"></i>
                      Edit Permissions
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSavePermissions}
                        disabled={loading}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-full hover:from-green-700 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {loading ? (
                          <>
                            <i className="ri-loader-4-line animate-spin mr-2"></i>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="ri-save-line mr-2"></i>
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isEditingPermissions ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {permissions.map((permission) => (
                    <div
                      key={permission.id}
                      onClick={() => handlePermissionToggle(permission.id)}
                      className={`rounded-lg p-4 border-2 transition-all duration-200 cursor-pointer ${
                        selectedPermissions.includes(permission.id)
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => handlePermissionToggle(permission.id)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              {permission.display_name}
                            </h4>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {permission.resource}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {permission.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="mr-2">
                              Action: {permission.action}
                            </span>
                            <span>Scope: {permission.scope}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rolePermissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {permission.display_name}
                        </h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {permission.resource}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {permission.description}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="mr-2">
                          Action: {permission.action}
                        </span>
                        <span>Scope: {permission.scope}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isEditingPermissions && rolePermissions.length === 0 && (
                <div className="text-center py-12">
                  <i className="ri-shield-line text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-600 text-lg">
                    No permissions assigned to this role
                  </p>
                  <button
                    onClick={() => setIsEditingPermissions(true)}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                  >
                    Assign Permissions
                  </button>
                </div>
              )}
            </div>

            {/* Footer Stats */}
            {!isEditingPermissions && rolePermissions.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Total Permissions: <strong>{rolePermissions.length}</strong>
                  </span>
                  <span>
                    Resources: <strong>{Object.keys(groupedPermissions).length}</strong>
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RolePermissionsModal;
