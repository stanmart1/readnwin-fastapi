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
        <table className="w-full table-auto">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="px-3 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={onSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-3 py-4 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">User</th>
              <th className="px-3 py-4 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Email</th>
              <th className="px-3 py-4 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Role</th>
              <th className="px-3 py-4 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Status</th>
              <th className="px-3 py-4 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Joined</th>
              <th className="px-3 py-4 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => onSelectUser(user.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                      {user.first_name?.[0] || user.username?.[0] || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        {user.school_name && (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700" title="Student">
                            <i className="ri-graduation-cap-line"></i>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-gray-600 truncate" title={user.email}>{user.email}</td>
                <td className="px-3 py-3">
                  {user.role ? (
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full text-white whitespace-nowrap ${getRoleColor(user.role?.name)}`}>
                      <i className={`${getRoleIcon(user.role?.name)} mr-0.5`}></i>
                      {user.role?.display_name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full text-white whitespace-nowrap bg-gradient-to-r from-gray-400 to-gray-500">
                      <i className="ri-user-line mr-0.5"></i>
                      No Role
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full text-white whitespace-nowrap ${getStatusColor(user.is_active)}`}>
                    <i className={`${user.is_active ? 'ri-check-circle-line' : 'ri-alert-circle-line'} mr-0.5`}></i>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => onView(user)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors text-sm"
                      title="View"
                    >
                      <i className="ri-eye-line text-base"></i>
                    </button>
                    <button
                      onClick={() => onAssignRole?.(user)}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors text-sm"
                      title="Assign Role"
                    >
                      <i className="ri-shield-user-line text-base"></i>
                    </button>
                    <button
                      onClick={() => onAnalytics(user.id)}
                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors text-sm"
                      title="Analytics"
                    >
                      <i className="ri-line-chart-line text-base"></i>
                    </button>
                    <button
                      onClick={() => onAssignBooks(user)}
                      className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors text-sm"
                      title="Assign Books"
                    >
                      <i className="ri-book-2-line text-base"></i>
                    </button>
                    <button
                      onClick={() => onEdit(user)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors text-sm"
                      title="Edit"
                    >
                      <i className="ri-edit-line text-base"></i>
                    </button>
                    <button
                      onClick={() => onPasswordReset(user)}
                      className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors text-sm"
                      title="Reset Password"
                    >
                      <i className="ri-lock-password-line text-base"></i>
                    </button>
                    <button
                      onClick={() => onStatusChange(user.id, !user.is_active)}
                      className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors text-sm"
                      title={user.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <i className={`${user.is_active ? 'ri-pause-circle-line' : 'ri-play-circle-line'} text-base`}></i>
                    </button>
                    <button
                      onClick={() => onDelete(user.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                      title="Delete"
                    >
                      <i className="ri-delete-bin-line text-base"></i>
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
