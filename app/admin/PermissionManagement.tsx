'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/dateUtils';

interface Permission {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
  scope: string;
  created_at: string;
}

export default function PermissionManagement() {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [creatingPermission, setCreatingPermission] = useState({
    name: '',
    display_name: '',
    description: '',
    resource: '',
    action: '',
    scope: 'global'
  });
  const [filterResource, setFilterResource] = useState('all');
  const [filterScope, setFilterScope] = useState('all');

  // Fetch permissions
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/permissions');
      const data = await response.json();

      if (data.success) {
        setPermissions(data.permissions);
      } else {
        setError('Failed to fetch permissions');
      }
    } catch (error) {
      setError('Error fetching permissions');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleCreatePermission = async () => {
    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creatingPermission)
      });
      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setCreatingPermission({
          name: '',
          display_name: '',
          description: '',
          resource: '',
          action: '',
          scope: 'global'
        });
        fetchPermissions();
      } else {
        setError(data.error || 'Failed to create permission');
      }
    } catch (error) {
      setError('Error creating permission');
    }
  };

  const handleEditPermission = async () => {
    if (!editingPermission) return;
    
    try {
      const response = await fetch(`/api/admin/permissions/${editingPermission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: editingPermission.display_name,
          description: editingPermission.description,
          resource: editingPermission.resource,
          action: editingPermission.action,
          scope: editingPermission.scope
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowEditModal(false);
        setEditingPermission(null);
        fetchPermissions();
      } else {
        setError(data.error || 'Failed to update permission');
      }
    } catch (error) {
      setError('Error updating permission');
    }
  };

  const handleDeletePermission = async (permissionId: number) => {
    if (!confirm('Are you sure you want to delete this permission?')) return;

    try {
      const response = await fetch(`/api/admin/permissions/${permissionId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        fetchPermissions();
      } else {
        setError('Failed to delete permission');
      }
    } catch (error) {
      setError('Error deleting permission');
    }
  };

  const getResourceColor = (resource: string) => {
    switch (resource) {
      case 'users': return 'bg-gradient-to-r from-blue-600 to-purple-600';
      case 'roles': return 'bg-gradient-to-r from-purple-600 to-pink-600';
      case 'permissions': return 'bg-gradient-to-r from-cyan-500 to-blue-500';
      case 'content': return 'bg-gradient-to-r from-green-500 to-teal-500';
      case 'system': return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'profile': return 'bg-gradient-to-r from-gray-500 to-gray-600';
      default: return 'bg-gradient-to-r from-blue-600 to-purple-600';
    }
  };

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'global': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'user': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'organization': return 'bg-gradient-to-r from-green-500 to-teal-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesResource = filterResource === 'all' || permission.resource === filterResource;
    const matchesScope = filterScope === 'all' || permission.scope === filterScope;
    return matchesResource && matchesScope;
  });

  const uniqueResources = [...new Set(permissions.map(p => p.resource))];
  const uniqueScopes = [...new Set(permissions.map(p => p.scope))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading permissions...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Permission Management</h2>
            <p className="text-gray-600 mt-1">Manage system permissions and access controls</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            <i className="ri-add-line mr-2"></i>
            Create Permission
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Resource</label>
            <select
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Resources</option>
              {uniqueResources.map(resource => (
                <option key={resource} value={resource}>{resource}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Scope</label>
            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Scopes</option>
              {uniqueScopes.map(scope => (
                <option key={scope} value={scope}>{scope}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Permissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPermissions.map((permission) => (
          <div key={permission.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${getResourceColor(permission.resource)} rounded-full flex items-center justify-center`}>
                <i className="ri-shield-keyhole-line text-white text-xl"></i>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingPermission(permission);
                    setShowEditModal(true);
                  }}
                  className="p-2 text-green-600 hover:text-green-800 cursor-pointer transition-colors duration-200"
                  title="Edit Permission"
                >
                  <i className="ri-edit-line"></i>
                </button>
                <button
                  onClick={() => handleDeletePermission(permission.id)}
                  className="p-2 text-red-600 hover:text-red-800 cursor-pointer transition-colors duration-200"
                  title="Delete Permission"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{permission.display_name}</h3>
            <p className="text-sm text-gray-600 mb-3">{permission.description || 'No description provided'}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Resource:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getResourceColor(permission.resource)}`}>
                  {permission.resource}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Action:</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                  {permission.action}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Scope:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getScopeColor(permission.scope)}`}>
                  {permission.scope}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-500">
                <i className="ri-time-line mr-1"></i>
                Created {formatDate(permission.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPermissions.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <i className="ri-shield-line text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">No permissions found matching the current filters</p>
        </div>
      )}

      {/* Create Permission Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New Permission</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200"
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
                    onChange={(e) => setCreatingPermission({...creatingPermission, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., users.create"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={creatingPermission.display_name}
                    onChange={(e) => setCreatingPermission({...creatingPermission, display_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Create Users"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={creatingPermission.description}
                    onChange={(e) => setCreatingPermission({...creatingPermission, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe what this permission allows"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                  <input
                    type="text"
                    value={creatingPermission.resource}
                    onChange={(e) => setCreatingPermission({...creatingPermission, resource: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., users"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                  <input
                    type="text"
                    value={creatingPermission.action}
                    onChange={(e) => setCreatingPermission({...creatingPermission, action: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., create"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                  <select
                    value={creatingPermission.scope}
                    onChange={(e) => setCreatingPermission({...creatingPermission, scope: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="global">Global</option>
                    <option value="user">User</option>
                    <option value="organization">Organization</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCreatePermission}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
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
                  className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editingPermission.display_name}
                    onChange={(e) => setEditingPermission({...editingPermission, display_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingPermission.description || ''}
                    onChange={(e) => setEditingPermission({...editingPermission, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
                  <input
                    type="text"
                    value={editingPermission.resource}
                    onChange={(e) => setEditingPermission({...editingPermission, resource: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                  <input
                    type="text"
                    value={editingPermission.action}
                    onChange={(e) => setEditingPermission({...editingPermission, action: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                  <select
                    value={editingPermission.scope}
                    onChange={(e) => setEditingPermission({...editingPermission, scope: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="global">Global</option>
                    <option value="user">User</option>
                    <option value="organization">Organization</option>
                  </select>
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