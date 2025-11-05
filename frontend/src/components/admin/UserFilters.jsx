import { useState } from 'react';

const UserFilters = ({ searchTerm, setSearchTerm, filterRole, setFilterRole, filterStatus, setFilterStatus, onCreateUser, selectedCount, roles = [] }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    accountType: 'all',
    schoolCategory: 'all',
    schoolName: '',
    classLevel: '',
    department: '',
    registrationDate: 'all'
  });

  const handleAdvancedFilterChange = (field, value) => {
    setAdvancedFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      accountType: 'all',
      schoolCategory: 'all',
      schoolName: '',
      classLevel: '',
      department: '',
      registrationDate: 'all'
    });
  };

  const hasActiveFilters = Object.values(advancedFilters).some(val => 
    val !== 'all' && val !== ''
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      {/* Search - Full width on mobile */}
      <div className="mb-4">
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Search by email, username, or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filters and Button */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        {/* Selects - wrap on mobile, grow on larger screens */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {role.display_name || role.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
          >
            <i className={`ri-filter-${showAdvanced ? 'off' : '3'}-line`}></i>
            {showAdvanced ? 'Hide' : 'Advanced'}
          </button>
        </div>

        {/* Button - full width on mobile */}
        <button
          onClick={onCreateUser}
          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center sm:justify-start gap-2 flex-shrink-0"
        >
          <i className="ri-user-add-line"></i>
          <span className="sm:block">Add User</span>
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <i className="ri-filter-3-line"></i>
              Advanced Filters
              {hasActiveFilters && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Active
                </span>
              )}
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearAdvancedFilters}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <i className="ri-close-circle-line"></i>
                Clear All
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Account Type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account Type</label>
              <select 
                value={advancedFilters.accountType}
                onChange={(e) => handleAdvancedFilterChange('accountType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users</option>
                <option value="students">Students Only</option>
                <option value="non-students">Non-Students</option>
              </select>
            </div>

            {/* School Category */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">School Category</label>
              <select 
                value={advancedFilters.schoolCategory}
                onChange={(e) => handleAdvancedFilterChange('schoolCategory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
                <option value="Tertiary">Tertiary</option>
              </select>
            </div>

            {/* School Name */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">School Name</label>
              <input
                type="text"
                value={advancedFilters.schoolName}
                onChange={(e) => handleAdvancedFilterChange('schoolName', e.target.value)}
                placeholder="Search by school name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Class Level */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Class Level</label>
              <input
                type="text"
                value={advancedFilters.classLevel}
                onChange={(e) => handleAdvancedFilterChange('classLevel', e.target.value)}
                placeholder="e.g., SS1, Primary 3..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <input
                type="text"
                value={advancedFilters.department}
                onChange={(e) => handleAdvancedFilterChange('department', e.target.value)}
                placeholder="e.g., Computer Science..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Registration Date */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Registration Date</label>
              <select 
                value={advancedFilters.registrationDate}
                onChange={(e) => handleAdvancedFilterChange('registrationDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>

          {/* Filter Summary */}
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {advancedFilters.accountType !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    Type: {advancedFilters.accountType}
                    <button onClick={() => handleAdvancedFilterChange('accountType', 'all')} className="hover:text-blue-900">
                      <i className="ri-close-line"></i>
                    </button>
                  </span>
                )}
                {advancedFilters.schoolCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    Category: {advancedFilters.schoolCategory}
                    <button onClick={() => handleAdvancedFilterChange('schoolCategory', 'all')} className="hover:text-blue-900">
                      <i className="ri-close-line"></i>
                    </button>
                  </span>
                )}
                {advancedFilters.schoolName && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    School: {advancedFilters.schoolName}
                    <button onClick={() => handleAdvancedFilterChange('schoolName', '')} className="hover:text-blue-900">
                      <i className="ri-close-line"></i>
                    </button>
                  </span>
                )}
                {advancedFilters.classLevel && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    Class: {advancedFilters.classLevel}
                    <button onClick={() => handleAdvancedFilterChange('classLevel', '')} className="hover:text-blue-900">
                      <i className="ri-close-line"></i>
                    </button>
                  </span>
                )}
                {advancedFilters.department && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    Dept: {advancedFilters.department}
                    <button onClick={() => handleAdvancedFilterChange('department', '')} className="hover:text-blue-900">
                      <i className="ri-close-line"></i>
                    </button>
                  </span>
                )}
                {advancedFilters.registrationDate !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    Date: {advancedFilters.registrationDate}
                    <button onClick={() => handleAdvancedFilterChange('registrationDate', 'all')} className="hover:text-blue-900">
                      <i className="ri-close-line"></i>
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserFilters;
