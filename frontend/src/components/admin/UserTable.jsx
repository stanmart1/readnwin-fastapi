import { motion } from 'framer-motion';

const UserTable = ({ users, selectedUsers, onSelectAll, onSelectUser, onView, onEdit, onStatusChange, onDelete, onAnalytics, onAssignBooks, onPasswordReset, onAssignRole }) => {
  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-gradient-to-r from-purple-600 to-pink-600';
      case 'admin': return 'bg-gradient-to-r from-blue-600 to-purple-600';
      case 'moderator': return 'bg-gradient-to-r from-cyan-500 to-blue-500';
      case 'author': return 'bg-gradient-to-r from-green-500 to-teal-500';
      case 'user': return 'bg-gradient-to-r from-gray-500 to-gray-600';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-gradient-to-r from-green-500 to-teal-500' 
      : 'bg-gradient-to-r from-yellow-500 to-orange-500';
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin': return 'ri-shield-star-line';
      case 'admin': return 'ri-shield-check-line';
      case 'moderator': return 'ri-user-shield-line';
      case 'author': return 'ri-book-line';
      case 'user': return 'ri-user-line';
      default: return 'ri-user-line';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={onSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">User</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Joined</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => onSelectUser(user.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.first_name?.[0] || user.username?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  {user.role ? (
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full text-white ${getRoleColor(user.role?.name)}`}>
                      <i className={`${getRoleIcon(user.role?.name)} mr-1`}></i>
                      {user.role?.display_name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full text-white bg-gradient-to-r from-gray-400 to-gray-500">
                      <i className="ri-user-line mr-1"></i>
                      No Role
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(user.is_active)}`}>
                    <i className={`${user.is_active ? 'ri-check-circle-line' : 'ri-alert-circle-line'} mr-1`}></i>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => onView(user)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View"
                    >
                      <i className="ri-eye-line"></i>
                    </button>
                    <button
                      onClick={() => onAssignRole?.(user)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Assign Role"
                    >
                      <i className="ri-shield-user-line"></i>
                    </button>
                    <button
                      onClick={() => onAnalytics(user.id)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Analytics"
                    >
                      <i className="ri-line-chart-line"></i>
                    </button>
                    <button
                      onClick={() => onAssignBooks(user)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Assign Books"
                    >
                      <i className="ri-book-add-line"></i>
                    </button>
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <i className="ri-edit-line"></i>
                    </button>
                    <button
                      onClick={() => onPasswordReset(user)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Reset Password"
                    >
                      <i className="ri-lock-password-line"></i>
                    </button>
                    <button
                      onClick={() => onStatusChange(user.id, !user.is_active)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title={user.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <i className={user.is_active ? 'ri-pause-circle-line' : 'ri-play-circle-line'}></i>
                    </button>
                    <button
                      onClick={() => onDelete(user.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default UserTable;
