import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useRoles } from '../../hooks/useRoles';
import CreateRoleModal from '../../components/admin/CreateRoleModal';
import EditRoleModal from '../../components/admin/EditRoleModal';
import RolePermissionsModal from '../../components/admin/RolePermissionsModal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const Roles = () => {
  const { roles, loading, fetchRoles, deleteRole } = useRoles();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const getRoleColor = (roleName) => {
    switch (roleName) {
      case 'super_admin':
        return 'bg-gradient-to-r from-purple-600 to-pink-600';
      case 'admin':
        return 'bg-gradient-to-r from-blue-600 to-purple-600';
      case 'moderator':
        return 'bg-gradient-to-r from-cyan-500 to-blue-500';
      case 'user':
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
      default:
        return 'bg-gradient-to-r from-blue-600 to-purple-600';
    }
  };

  const handleDeleteRole = (roleId) => {
    setRoleToDelete(roleId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    const result = await deleteRole(roleToDelete);
    if (result.success) {
      fetchRoles();
    }
    setRoleToDelete(null);
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const handleViewPermissions = (role) => {
    setSelectedRole(role);
    setShowPermissionsModal(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Role Management</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage system roles and permissions</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              <i className="ri-add-line mr-2"></i>
              Create Role
            </button>
          </div>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${getRoleColor(role.name)} rounded-full flex items-center justify-center`}>
                  <i className="ri-shield-user-line text-white text-xl"></i>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewPermissions(role)}
                    className="p-2 text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    title="Manage Permissions"
                  >
                    <i className="ri-settings-line"></i>
                  </button>
                  <button
                    onClick={() => handleEditRole(role)}
                    className="p-2 text-green-600 hover:text-green-800 transition-colors duration-200"
                    title="Edit Role"
                  >
                    <i className="ri-edit-line"></i>
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {role.display_name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {role.description || 'No description provided'}
              </p>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Priority: {role.priority}</span>
                {role.is_system_role && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    System Role
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <CreateRoleModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchRoles}
        />

        <EditRoleModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRole(null);
          }}
          role={selectedRole}
          onSuccess={fetchRoles}
        />

        <RolePermissionsModal
          isOpen={showPermissionsModal}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedRole(null);
          }}
          role={selectedRole}
        />

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          title="Delete Role"
          message="Are you sure you want to delete this role? This action cannot be undone."
          confirmText="Delete"
          type="danger"
        />
      </div>
    </AdminLayout>
  );
};

export default Roles;
