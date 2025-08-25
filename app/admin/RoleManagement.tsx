"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/dateUtils";
import { useAuth } from "@/hooks/useAuth";
import { adminApi, handleApiError } from "./utils/api";
import PermissionManagement from "./components/PermissionManagement";

interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  priority: number;
  is_system_role: boolean;
  created_at: string;
}

interface Permission {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
  scope: string;
}

export default function RoleManagement() {
  const {
    user: currentUser,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [creatingRole, setCreatingRole] = useState({
    name: "",
    display_name: "",
    description: "",
    priority: 0,
  });
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');

  // Fetch roles
  const fetchRoles = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching roles from FastAPI backend...");
      const rolesData = await adminApi.getRoles();

      if (rolesData && Array.isArray(rolesData)) {
        setRoles(rolesData);
        console.log("✅ Roles fetched successfully:", rolesData.length);
      } else {
        setError("Failed to fetch roles");
        console.warn("⚠️ No roles returned from backend");
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(`Error fetching roles: ${errorMessage}`);
      console.error("❌ Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch permissions
  const fetchPermissions = async () => {
    try {
      console.log("🔄 Fetching permissions from FastAPI backend...");
      const permissionsData = await adminApi.getPermissions();

      if (permissionsData && Array.isArray(permissionsData)) {
        setPermissions(permissionsData);
        console.log(
          "✅ Permissions fetched successfully:",
          permissionsData.length,
        );
      } else {
        console.warn("⚠️ No permissions returned from backend");
        setPermissions([]);
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      console.error("❌ Error fetching permissions:", errorMessage);
      setPermissions([]);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchRoles();
      fetchPermissions();
    }
  }, [isAuthenticated, authLoading]);

  const handleCreateRole = async () => {
    try {
      const result = await adminApi.createRole(creatingRole);
      setShowCreateModal(false);
      setCreatingRole({
        name: "",
        display_name: "",
        description: "",
        priority: 0,
      });
      fetchRoles();
      setError("");
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(`Error creating role: ${errorMessage}`);
    }
  };

  const handleEditRole = async () => {
    if (!editingRole) return;

    try {
      await adminApi.updateRole(editingRole.id, {
        display_name: editingRole.display_name,
        description: editingRole.description,
        priority: editingRole.priority,
      });
      setShowEditModal(false);
      setEditingRole(null);
      fetchRoles();
      setError("");
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(`Error updating role: ${errorMessage}`);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    try {
      await adminApi.deleteRole(roleId);
      fetchRoles();
      setError("");
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(`Error deleting role: ${errorMessage}`);
    }
  };

  const handleViewPermissions = async (roleId: number) => {
    try {
      const data = await adminApi.getRolePermissions(roleId);
      setRolePermissions(data.permissions || []);
      setSelectedPermissions((data.permissions || []).map((p: Permission) => p.id));
      setSelectedRole(roles.find((r) => r.id === roleId) || null);
      setShowPermissionsModal(true);
      setIsEditingPermissions(false);
      setError("");
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(`Error fetching role permissions: ${errorMessage}`);
    }
  };

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    try {
      setIsSavingPermissions(true);
      // Get current permissions
      const currentPermissionIds = rolePermissions.map((p) => p.id);

      // Remove permissions that are no longer selected
      for (const permissionId of currentPermissionIds) {
        if (!selectedPermissions.includes(permissionId)) {
          await adminApi.removeRolePermission(selectedRole.id, permissionId);
        }
      }

      // Add new permissions
      for (const permissionId of selectedPermissions) {
        if (!currentPermissionIds.includes(permissionId)) {
          await adminApi.addRolePermission(selectedRole.id, permissionId);
        }
      }

      // Refresh permissions
      await handleViewPermissions(selectedRole.id);
      setIsEditingPermissions(false);
      setError("");
    } catch (error) {
      setError("Error updating role permissions");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case "super_admin":
        return "bg-gradient-to-r from-purple-600 to-pink-600";
      case "admin":
        return "bg-gradient-to-r from-blue-600 to-purple-600";
      case "moderator":
        return "bg-gradient-to-r from-cyan-500 to-blue-500";
      case "author":
        return "bg-gradient-to-r from-green-500 to-teal-500";
      case "editor":
        return "bg-gradient-to-r from-yellow-500 to-orange-500";
      case "reader":
        return "bg-gradient-to-r from-gray-500 to-gray-600";
      default:
        return "bg-gradient-to-r from-blue-600 to-purple-600";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading roles...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="ri-shield-user-line mr-2"></i>
              Roles Management
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'permissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="ri-settings-3-line mr-2"></i>
              Permissions Management
            </button>
          </nav>
        </div>
      </div>
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <i className="ri-error-warning-line text-red-400 text-xl"></i>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'roles' ? (
        <>
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Role Management
                </h2>
                <p className="text-gray-600 mt-1">
                  Manage system roles and permissions
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
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
              <div
                className={`w-12 h-12 ${getRoleColor(role.name)} rounded-full flex items-center justify-center`}
              >
                <i className="ri-shield-user-line text-white text-xl"></i>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewPermissions(role.id)}
                  className="p-2 text-blue-600 hover:text-blue-800 cursor-pointer transition-colors duration-200"
                  title="View Permissions"
                >
                  <i className="ri-settings-line"></i>
                </button>
                {!role.is_system_role && (
                  <>
                    <button
                      onClick={() => {
                        setEditingRole(role);
                        setShowEditModal(true);
                      }}
                      className="p-2 text-green-600 hover:text-green-800 cursor-pointer transition-colors duration-200"
                      title="Edit Role"
                    >
                      <i className="ri-edit-line"></i>
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="p-2 text-red-600 hover:text-red-800 cursor-pointer transition-colors duration-200"
                      title="Delete Role"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </>
                )}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {role.display_name}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {role.description || "No description provided"}
            </p>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Priority: {role.priority}</span>
              {role.is_system_role && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  System Role
                </span>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-500">
                <i className="ri-time-line mr-1"></i>
                Created {formatDate(role.created_at)}
              </div>
            </div>
          </div>
        ))}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <PermissionManagement onPermissionChange={fetchPermissions} />
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Create New Role
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={creatingRole.name}
                    onChange={(e) =>
                      setCreatingRole({ ...creatingRole, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., content_manager"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={creatingRole.display_name}
                    onChange={(e) =>
                      setCreatingRole({
                        ...creatingRole,
                        display_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Content Manager"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={creatingRole.description}
                    onChange={(e) =>
                      setCreatingRole({
                        ...creatingRole,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe the role's purpose and responsibilities"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={creatingRole.priority}
                    onChange={(e) =>
                      setCreatingRole({
                        ...creatingRole,
                        priority: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCreateRole}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                  >
                    Create Role
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && editingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit Role</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editingRole.display_name}
                    onChange={(e) =>
                      setEditingRole({
                        ...editingRole,
                        display_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingRole.description || ""}
                    onChange={(e) =>
                      setEditingRole({
                        ...editingRole,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={editingRole.priority}
                    onChange={(e) =>
                      setEditingRole({
                        ...editingRole,
                        priority: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleEditRole}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Permissions for {selectedRole.display_name}
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
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                    >
                      <i className="ri-edit-line mr-2"></i>
                      Edit Permissions
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSavePermissions}
                        disabled={isSavingPermissions}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-full hover:from-green-700 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingPermissions ? (
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
                        onClick={() => {
                          setIsEditingPermissions(false);
                          setSelectedPermissions(
                            rolePermissions.map((p) => p.id),
                          );
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowPermissionsModal(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200"
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>
              </div>

              {isEditingPermissions ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className={`rounded-lg p-4 border-2 transition-all duration-200 ${
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
                <div className="text-center py-8">
                  <i className="ri-shield-line text-4xl text-gray-400 mb-4"></i>
                  <p className="text-gray-600">
                    No permissions assigned to this role
                  </p>
                </div>
              )}

              {isEditingPermissions && permissions.length === 0 && (
                <div className="text-center py-8">
                  <i className="ri-shield-line text-4xl text-gray-400 mb-4"></i>
                  <p className="text-gray-600">No permissions available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
