const UserFilters = ({ searchTerm, setSearchTerm, filterRole, setFilterRole, filterStatus, setFilterStatus, onCreateUser, selectedCount }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            onClick={onCreateUser}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2"
          >
            <i className="ri-user-add-line"></i>
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
          <span className="text-sm text-gray-700">
            {selectedCount} user(s) selected
          </span>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
              Delete Selected
            </button>
            <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700">
              Export Selected
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFilters;
