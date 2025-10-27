import { useState, useEffect } from 'react';
import { useRoles } from '../../hooks/useRoles';
import api from '../../lib/api';

const AssignRoleModal = ({ user, onClose, onSuccess }) => {
  const { roles, fetchRoles } = useRoles();
  const [selectedRole, setSelectedRole] = useState(user?.role?.id || '');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchRoles();
    // Get current user info
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) return;

    setLoading(true);
    try {
      await api.post(`/rbac/users/${user.id}/assign-role`, null, {
        params: { role_id: selectedRole }
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error assigning role:', err);
      alert('Failed to assign role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">Assign Role</h3>
          <p className="text-sm text-gray-600 mt-1">
            Assign a role to {user?.first_name} {user?.last_name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose a role...</option>
              {roles
                .filter(role => {
                  // Hide super_admin role if current user is not super_admin
                  if (role.name === 'super_admin') {
                    return currentUser?.role?.name === 'super_admin';
                  }
                  return true;
                })
                .map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.display_name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
              disabled={loading || !selectedRole}
            >
              {loading ? 'Assigning...' : 'Assign Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignRoleModal;
