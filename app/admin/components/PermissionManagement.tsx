"use client";

import { useState, useEffect } from "react";
import { adminApi, handleApiError } from "../utils/api";

interface Permission {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
  scope: string;
}

interface PermissionManagementProps {
  onPermissionChange?: () => void;
}

export default function PermissionManagement({ onPermissionChange }: PermissionManagementProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [creatingPermission, setCreatingPermission] = useState({
    name: "",
    display_name: "",
    description: "",
    resource: "",
    action: "*",
    scope: "*",
  });

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getPermissions();
      setPermissions(data || []);
      setError("");
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(`Error fetching permissions: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleCreatePermission = async () => {
    try {
      await adminApi.createPermission(creatingPermission);
      setShowCreateModal(false);
      setCreatingPermission({
        name: "",
        display_name: "",
        description: "",
        resource: "",
        action: "*",
        scope: "*",
      });
      fetchPermissions();
      onPermissionChange?.();
      setError("");
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(`Error creating permission: ${errorMessage}`);
    }
  };

  const handleEditPermission = async () => {
    if (!editingPermission) return;

    try {
      await adminApi.updatePermission(editingPermission.id, {
        name: editingPermission.name,
        display_name: editingPermission.display_name,
        description: editingPermission.description,
        resource: editingPermission.resource,
        action: editingPermission.action,
        scope: editingPermission.scope,
      });
      setShowEditModal(false);
      setEditingPermission(null);
      fetchPermissions();
      onPermissionChange?.();
      setError("");
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(`Error updating permission: ${errorMessage}`);
    }
  };

  const handleDeletePermission = async (permissionId: number) => {
    if (!confirm("Are you sure you want to delete this permission?")) return;

    try {
      await adminApi.deletePermission(permissionId);
      fetchPermissions();
      onPermissionChange?.();
      setError("");
    } catch (error) {
      const errorMessage = handleApiError(error);
      setError(`Error deleting permission: ${errorMessage}`);
    }
  };

  const getResourceColor = (resource: string) => {
    const colors = {
      users: "bg-blue-100 text-blue-800",
      roles: "bg-purple-100 text-purple-800",
      books: "bg-green-100 text-green-800",
      orders: "bg-yellow-100 text-yellow-800",
      admin: "bg-red-100 text-red-800",
      system: "bg-gray-100 text-gray-800",
    };
    return colors[resource as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading permissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Permissions</h3>
          <p className="text-sm text-gray-600">Manage system permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-full hover:from-green-700 hover:to-teal-700 transition-all duration-300"
        >
          <i className="ri-add-line mr-2"></i>
          Create Permission
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {permissions.map((permission) => (
          <div key={permission.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResourceColor(permission.resource)}`}>
                {permission.resource}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingPermission(permission);
                    setShowEditModal(true);
                  }}
                  className="p-1 text-blue-600 hover:text-blue-800 transition-colors duration-200"
                  title="Edit Permission"
                >
                  <i className="ri-edit-line"></i>
                </button>
                <button
                  onClick={() => handleDeletePermission(permission.id)}
                  className="p-1 text-red-600 hover:text-red-800 transition-colors duration-200"
                  title="Delete Permission"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>

            <h4 className="font-medium text-gray-900 mb-2">{permission.display_name}</h4>
            <p className="text-sm text-gray-600 mb-3">{permission.description || "No description"}</p>

            <div className="space-y-1 text-xs text-gray-500">
              <div>Name: {permission.name}</div>
              <div>Action: {permission.action}</div>
              <div>Scope: {permission.scope}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Permission Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New Permission</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permission Name</label>
                  <input
                    type="text"
                    value={creatingPermission.name}
                    onChange={(e) => setCreatingPermission({ ...creatingPermission, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., manage_users"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={creatingPermission.display_name}
                    onChange={(e) => setCreatingPermission({ ...creatingPermission, display_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Manage Users"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={creatingPermission.description}
                    onChange={(e) => setCreatingPermission({ ...creatingPermission, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe what this permission allows"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                  <select
                    value={creatingPermission.resource}
                    onChange={(e) => setCreatingPermission({ ...creatingPermission, resource: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Resource</option>
                    <option value="users">Users</option>
                    <option value="roles">Roles</option>
                    <option value="books">Books</option>
                    <option value="orders">Orders</option>
                    <option value="admin">Admin</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                    <input
                      type="text"
                      value={creatingPermission.action}
                      onChange={(e) => setCreatingPermission({ ...creatingPermission, action: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., create, read, update, delete, *"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                    <input
                      type="text"
                      value={creatingPermission.scope}
                      onChange={(e) => setCreatingPermission({ ...creatingPermission, scope: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., own, all, *"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCreatePermission}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-full hover:from-green-700 hover:to-teal-700 transition-all duration-300"
                  >
                    Create Permission
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

      {/* Edit Permission Modal */}
      {showEditModal && editingPermission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit Permission</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permission Name</label>
                  <input
                    type="text"
                    value={editingPermission.name}
                    onChange={(e) => setEditingPermission({ ...editingPermission, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editingPermission.display_name}
                    onChange={(e) => setEditingPermission({ ...editingPermission, display_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingPermission.description || ""}
                    onChange={(e) => setEditingPermission({ ...editingPermission, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                  <select
                    value={editingPermission.resource}
                    onChange={(e) => setEditingPermission({ ...editingPermission, resource: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="users">Users</option>
                    <option value="roles">Roles</option>
                    <option value="books">Books</option>
                    <option value="orders">Orders</option>
                    <option value="admin">Admin</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                    <input
                      type="text"
                      value={editingPermission.action}
                      onChange={(e) => setEditingPermission({ ...editingPermission, action: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                    <input
                      type="text"
                      value={editingPermission.scope}
                      onChange={(e) => setEditingPermission({ ...editingPermission, scope: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleEditPermission}
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
    </div>
  );
}