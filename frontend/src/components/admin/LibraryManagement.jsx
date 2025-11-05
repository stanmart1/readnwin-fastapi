import { useState, useEffect, useRef } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useBookManagement } from '../../hooks/useBookManagement';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import Toast from '../Toast';
import api from '../../lib/api';

const LibraryManagement = () => {
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentDetails, setAssignmentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('ebook');
  const [userSearch, setUserSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [userLibrary, setUserLibrary] = useState([]);
  const userDropdownRef = useRef(null);
  const bookDropdownRef = useRef(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    user_id: undefined,
    dateFrom: '',
    dateTo: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [stats, setStats] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkUsers, setBulkUsers] = useState([]);
  const [bulkBook, setBulkBook] = useState(null);
  const [bulkFormat, setBulkFormat] = useState('ebook');
  const [bulkLoading, setBulkLoading] = useState(false);
  const debouncedSearch = useDebounce(filters.search, 300);

  const { users, fetchUsers } = useUsers();
  const { books, loadBooks } = useBookManagement();
  const { toasts, showToast, removeToast } = useToast();

  // Load users and books once on mount
  useEffect(() => {
    fetchUsers({ limit: 100 });
    loadBooks();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (bookDropdownRef.current && !bookDropdownRef.current.contains(event.target)) {
        setShowBookDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch user's library when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchUserLibrary();
    }
  }, [selectedUser]);

  const fetchUserLibrary = async () => {
    if (!selectedUser) return;
    try {
      const response = await api.get('/admin/library-assignments', {
        params: { user_id: selectedUser, limit: 1000 }
      });
      setUserLibrary(response.data.assignments || []);
    } catch (error) {
      console.error('Error fetching user library:', error);
    }
  };

  const isBookAlreadyAssigned = (bookId) => {
    return userLibrary.some(item => item.book_id === bookId);
  };

  // Load library data when filters change
  useEffect(() => {
    loadData();
  }, [pagination.page, debouncedSearch, filters.status, filters.user_id, filters.dateFrom, filters.dateTo, filters.sortBy, filters.sortOrder]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/library-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {
        skip: (pagination.page - 1) * pagination.limit,
        limit: pagination.limit,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.user_id && { user_id: filters.user_id }),
        ...(filters.status && { status: filters.status }),
        ...(filters.dateFrom && { date_from: filters.dateFrom }),
        ...(filters.dateTo && { date_to: filters.dateTo }),
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      };

      const response = await api.get('/admin/library-assignments', { params });
      const result = response.data;

      console.log('Library assignments response:', result);
      setLibraries(result.assignments || []);
      setPagination(prev => ({
        ...prev,
        total: result.total || 0,
        pages: result.pagination?.pages || Math.ceil((result.total || 0) / pagination.limit)
      }));
    } catch (error) {
      console.error('Failed to load libraries:', error);
      if (error.response?.status === 403) {
        showToast('Access denied. Admin privileges required.', 'error');
      } else {
        showToast(`Failed to load library assignments: ${error.response?.data?.detail || error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBook = async () => {
    if (!selectedUser || !selectedBook) {
      showToast('Please select both user and book', 'warning');
      return;
    }

    if (isBookAlreadyAssigned(selectedBook)) {
      showToast('This book is already assigned to the selected user', 'warning');
      return;
    }

    setAssignLoading(true);
    try {
      await api.post('/admin/user-library', {
        user_id: selectedUser,
        book_id: selectedBook,
        format: selectedFormat
      });

      showToast('Book assigned successfully!');
      setShowAssignModal(false);
      setSelectedUser(null);
      setSelectedBook(null);
      setSelectedFormat('ebook');
      setUserSearch('');
      setBookSearch('');
      setShowUserDropdown(false);
      setShowBookDropdown(false);
      setUserLibrary([]);
      loadData();
      loadStats();
    } catch (error) {
      console.error('Assignment error:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to assign book';
      showToast(errorMsg, 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleBulkAssign = async () => {
    if (bulkUsers.length === 0 || !bulkBook) {
      showToast('Please select users and a book', 'warning');
      return;
    }

    setBulkLoading(true);
    try {
      const response = await api.post('/admin/bulk-assign', {
        user_ids: bulkUsers,
        book_id: bulkBook,
        format: bulkFormat
      });

      showToast(`Book assigned to ${response.data.assigned_count} users successfully!`);
      setShowBulkModal(false);
      setBulkUsers([]);
      setBulkBook(null);
      setBulkFormat('ebook');
      loadData();
      loadStats();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to bulk assign', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = {
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.user_id && { user_id: filters.user_id }),
        ...(filters.status && { status: filters.status }),
        ...(filters.dateFrom && { date_from: filters.dateFrom }),
        ...(filters.dateTo && { date_to: filters.dateTo })
      };

      const response = await api.get('/admin/library-assignments', { 
        params: { ...params, limit: 10000 } 
      });

      const csv = [
        ['User Name', 'User Email', 'Book Title', 'Author', 'Format', 'Progress', 'Status', 'Assigned Date'],
        ...response.data.assignments.map(a => [
          a.user_name,
          a.user_email,
          a.book_title,
          a.book_author,
          a.format,
          `${a.progress}%`,
          a.status,
          new Date(a.assigned_at).toLocaleDateString()
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `library-assignments-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      showToast('Export completed successfully!');
    } catch (error) {
      showToast('Failed to export data', 'error');
    }
  };

  const handleViewDetails = async (libraryId) => {
    setSelectedAssignment(libraryId);
    setShowDetailsModal(true);
    setDetailsLoading(true);
    
    try {
      const [detailsRes, analyticsRes] = await Promise.all([
        api.get(`/admin/library-assignment/${libraryId}/details`),
        api.get(`/admin/library-assignment/${libraryId}/analytics`)
      ]);
      setAssignmentDetails({
        ...detailsRes.data,
        analytics: analyticsRes.data
      });
    } catch (error) {
      console.error('Failed to load details:', error);
      showToast('Failed to load reading details', 'error');
      setShowDetailsModal(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleRemoveAssignment = async (libraryId) => {
    if (!confirm('Are you sure you want to remove this book assignment?')) return;

    try {
      await api.delete(`/admin/library-assignment/${libraryId}`);
      showToast('Assignment removed successfully!');
      loadData();
      loadStats();
    } catch (error) {
      console.error('Remove error:', error);
      showToast('Failed to remove assignment', 'error');
    }
  };

  return (
    <div className="p-6">
      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Library Management</h2>
        <p className="text-gray-600 mt-1">Manage user book assignments and reading progress</p>
      </div>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-book-line text-white text-lg sm:text-xl"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total Assignments</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats.total_assignments || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-user-line text-white text-lg sm:text-xl"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Active Readers</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats.active_readers || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-trophy-line text-white text-lg sm:text-xl"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Completion Rate</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats.completion_rate || 0}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-bar-chart-line text-white text-lg sm:text-xl"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Avg Progress</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats.avg_progress || 0}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder="Search by user name, email, or book title..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="unread">Unread</option>
            <option value="reading">Reading</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filters.user_id || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, user_id: e.target.value ? parseInt(e.target.value) : undefined }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Users</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.first_name} {user.last_name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="From Date"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="To Date"
          />
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters(prev => ({ ...prev, sortBy, sortOrder }));
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="progress-desc">Highest Progress</option>
            <option value="progress-asc">Lowest Progress</option>
            <option value="status-asc">Status A-Z</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleExport}
            className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
          >
            <i className="ri-download-line"></i>
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
          >
            <i className="ri-group-line"></i>
            <span className="hidden sm:inline">Bulk Assign</span>
            <span className="sm:hidden">Bulk</span>
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all text-sm flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            <span className="hidden sm:inline">Assign Book</span>
            <span className="sm:hidden">Assign</span>
          </button>
        </div>
      </div>

      {/* Libraries Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Format
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Readers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap" colSpan={8}>
                      <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : libraries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <i className="ri-book-shelf-line text-6xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">No library assignments found</p>
                  </td>
                </tr>
              ) : (
                libraries.map((library) => (
                  <tr key={library.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{library.user_name}</div>
                      <div className="text-sm text-gray-500">{library.user_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{library.book_title}</div>
                      <div className="text-sm text-gray-500">{library.book_author}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {library.format}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <i className="ri-user-line text-green-600"></i>
                        <span className="text-sm font-semibold text-gray-900">{library.active_readers || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${library.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{(library.progress || 0).toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        library.status === 'reading' ? 'bg-green-100 text-green-800' :
                        library.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {library.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(library.assigned_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(library.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                        <button
                          onClick={() => handleRemoveAssignment(library.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove Assignment"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {libraries.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-4 mt-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-medium">{pagination.total}</span> assignments
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Assign Book Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <i className="ri-book-line text-white text-lg"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Assign Book to User</h3>
                    <p className="text-sm text-gray-600">Grant access to a book for a specific user</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUser(null);
                    setSelectedBook(null);
                    setUserSearch('');
                    setShowUserDropdown(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-white/50"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Searchable User Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  <i className="ri-user-line mr-1"></i>
                  Select User *
                </label>
                <div className="relative" ref={userDropdownRef}>
                  <div
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 cursor-pointer transition-all hover:border-gray-300"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                  >
                    <div className="flex items-center justify-between">
                      {selectedUser ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {users.find(u => u.id === selectedUser)?.first_name?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {users.find(u => u.id === selectedUser)?.first_name} {users.find(u => u.id === selectedUser)?.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {users.find(u => u.id === selectedUser)?.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Choose a user...</span>
                      )}
                      <i className={`ri-arrow-down-s-line text-gray-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`}></i>
                    </div>
                  </div>
                  
                  {showUserDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-64 overflow-hidden">
                      <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                          <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {users
                          .filter(user => 
                            `${user.first_name} ${user.last_name} ${user.email}`
                              .toLowerCase()
                              .includes(userSearch.toLowerCase())
                          )
                          .map(user => (
                            <div
                              key={user.id}
                              className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => {
                                setSelectedUser(user.id);
                                setShowUserDropdown(false);
                                setUserSearch('');
                              }}
                            >
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {user.first_name?.[0]}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                              {selectedUser === user.id && (
                                <i className="ri-check-line text-blue-600"></i>
                              )}
                            </div>
                          ))
                        }
                        {users.filter(user => 
                          `${user.first_name} ${user.last_name} ${user.email}`
                            .toLowerCase()
                            .includes(userSearch.toLowerCase())
                        ).length === 0 && (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <i className="ri-user-search-line text-3xl mb-2"></i>
                            <p>No users found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Book Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  <i className="ri-book-open-line mr-1"></i>
                  Select Book *
                </label>
                <div className="relative" ref={bookDropdownRef}>
                  <div
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 cursor-pointer transition-all hover:border-gray-300"
                    onClick={() => setShowBookDropdown(!showBookDropdown)}
                  >
                    <div className="flex items-center justify-between">
                      {selectedBook ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            <i className="ri-book-line"></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {books.find(b => b.id === selectedBook)?.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {books.find(b => b.id === selectedBook)?.author_name}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Choose a book...</span>
                      )}
                      <i className={`ri-arrow-down-s-line text-gray-400 transition-transform ${showBookDropdown ? 'rotate-180' : ''}`}></i>
                    </div>
                  </div>
                  
                  {showBookDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-64 overflow-hidden">
                      <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                          <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                          <input
                            type="text"
                            placeholder="Search books..."
                            value={bookSearch}
                            onChange={(e) => setBookSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {books
                          .filter(book => 
                            `${book.title} ${book.author_name}`
                              .toLowerCase()
                              .includes(bookSearch.toLowerCase())
                          )
                          .map(book => {
                            const alreadyAssigned = isBookAlreadyAssigned(book.id);
                            return (
                              <div
                                key={book.id}
                                className={`flex items-center space-x-3 px-4 py-3 transition-colors ${
                                  alreadyAssigned
                                    ? 'bg-gray-50 opacity-60 cursor-not-allowed'
                                    : 'hover:bg-gray-50 cursor-pointer'
                                }`}
                                onClick={() => {
                                  if (!alreadyAssigned) {
                                    setSelectedBook(book.id);
                                    setShowBookDropdown(false);
                                    setBookSearch('');
                                  }
                                }}
                              >
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                  <i className="ri-book-line"></i>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-900">{book.title}</p>
                                    {alreadyAssigned && (
                                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                        Assigned
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">{book.author_name}</p>
                                </div>
                                {selectedBook === book.id && !alreadyAssigned && (
                                  <i className="ri-check-line text-blue-600"></i>
                                )}
                              </div>
                            );
                          })
                        }
                        {books.filter(book => 
                          `${book.title} ${book.author_name}`
                            .toLowerCase()
                            .includes(bookSearch.toLowerCase())
                        ).length === 0 && (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <i className="ri-book-search-line text-3xl mb-2"></i>
                            <p>No books found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  <i className="ri-file-list-line mr-1"></i>
                  Book Format *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('ebook')}
                    className={`p-4 rounded-xl border-2 transition-all text-center group ${
                      selectedFormat === 'ebook'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <i className={`ri-smartphone-line text-2xl mb-2 block ${
                      selectedFormat === 'ebook' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`}></i>
                    <span className="text-sm font-medium">Digital Ebook</span>
                    <p className="text-xs text-gray-500 mt-1">Instant access</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('physical')}
                    className={`p-4 rounded-xl border-2 transition-all text-center group ${
                      selectedFormat === 'physical'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <i className={`ri-book-line text-2xl mb-2 block ${
                      selectedFormat === 'physical' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`}></i>
                    <span className="text-sm font-medium">Physical Book</span>
                    <p className="text-xs text-gray-500 mt-1">Hardcopy access</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUser(null);
                    setSelectedBook(null);
                    setUserSearch('');
                    setBookSearch('');
                    setShowUserDropdown(false);
                    setShowBookDropdown(false);
                    setUserLibrary([]);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-colors font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignBook}
                  disabled={!selectedUser || !selectedBook || assignLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
                >
                  {assignLoading ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-check-line"></i>
                      <span>Assign Book</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                    <i className="ri-group-line text-white text-lg"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Bulk Assign Book</h3>
                    <p className="text-sm text-gray-600">Assign one book to multiple users</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkUsers([]);
                    setBulkBook(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Select Users *</label>
                <div className="border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bulkUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkUsers([...bulkUsers, user.id]);
                          } else {
                            setBulkUsers(bulkUsers.filter(id => id !== user.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">{bulkUsers.length} user(s) selected</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Select Book *</label>
                <select
                  value={bulkBook || ''}
                  onChange={(e) => setBulkBook(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Choose a book...</option>
                  {books.map(book => (
                    <option key={book.id} value={book.id}>{book.title} - {book.author_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Format *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBulkFormat('ebook')}
                    className={`p-3 rounded-xl border-2 ${bulkFormat === 'ebook' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                  >
                    <i className="ri-smartphone-line text-xl mb-1 block"></i>
                    <span className="text-sm font-medium">Ebook</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkFormat('physical')}
                    className={`p-3 rounded-xl border-2 ${bulkFormat === 'physical' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                  >
                    <i className="ri-book-line text-xl mb-1 block"></i>
                    <span className="text-sm font-medium">Physical</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkUsers([]);
                    setBulkBook(null);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAssign}
                  disabled={bulkUsers.length === 0 || !bulkBook || bulkLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  {bulkLoading ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-check-line"></i>
                      <span>Assign to {bulkUsers.length} Users</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reading Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <i className="ri-book-open-line text-white text-lg"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Reading Details</h3>
                    <p className="text-sm text-gray-600">Notes, highlights, and progress</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setAssignmentDetails(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-white/50"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {detailsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : assignmentDetails ? (
                <div className="space-y-6">
                  {/* Assignment Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">User</p>
                        <p className="font-semibold text-gray-900">{assignmentDetails.assignment.user_name}</p>
                        <p className="text-sm text-gray-500">{assignmentDetails.assignment.user_email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Book</p>
                        <p className="font-semibold text-gray-900">{assignmentDetails.assignment.book_title}</p>
                        <p className="text-sm text-gray-500">{assignmentDetails.assignment.book_author}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Progress</p>
                        <p className="font-semibold text-gray-900">{assignmentDetails.assignment.progress.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          assignmentDetails.assignment.status === 'reading' ? 'bg-green-100 text-green-800' :
                          assignmentDetails.assignment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {assignmentDetails.assignment.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reading Analytics */}
                  {assignmentDetails.analytics && (
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <i className="ri-line-chart-line text-blue-600"></i>
                        Reading Analytics
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white rounded-lg shadow-md p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <i className="ri-time-line text-white text-sm"></i>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Total Time</p>
                              <p className="text-sm font-bold text-gray-900">{assignmentDetails.analytics.total_reading_time || '0h'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                              <i className="ri-calendar-line text-white text-sm"></i>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Sessions</p>
                              <p className="text-sm font-bold text-gray-900">{assignmentDetails.analytics.total_sessions || 0}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <i className="ri-speed-line text-white text-sm"></i>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Avg Session</p>
                              <p className="text-sm font-bold text-gray-900">{assignmentDetails.analytics.avg_session_time || '0m'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                              <i className="ri-fire-line text-white text-sm"></i>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Streak</p>
                              <p className="text-sm font-bold text-gray-900">{assignmentDetails.analytics.reading_streak || 0} days</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reading Goals */}
                  {assignmentDetails.analytics?.goals && assignmentDetails.analytics.goals.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <i className="ri-flag-line text-green-600"></i>
                        Reading Goals ({assignmentDetails.analytics.goals.length})
                      </h4>
                      <div className="space-y-3">
                        {assignmentDetails.analytics.goals.map((goal) => (
                          <div key={goal.id} className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900">{goal.title}</h5>
                                <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                                goal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {goal.status === 'completed' ? 'Completed' : goal.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-semibold text-gray-900">{goal.current_value || 0} / {goal.target_value}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    goal.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%` }}
                                ></div>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Started: {new Date(goal.start_date).toLocaleDateString()}</span>
                                <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Highlights Section */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <i className="ri-mark-pen-line text-yellow-600"></i>
                      Highlights ({assignmentDetails.highlights.length})
                    </h4>
                    {assignmentDetails.highlights.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <i className="ri-mark-pen-line text-4xl text-gray-300 mb-2"></i>
                        <p className="text-gray-500">No highlights yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {assignmentDetails.highlights.map((highlight) => (
                          <div key={highlight.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                            <p className="text-gray-800 italic mb-2">"{highlight.text}"</p>
                            {highlight.context && (
                              <p className="text-sm text-gray-600 mb-2">Context: {highlight.context}</p>
                            )}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <div className={`w-3 h-3 rounded-full bg-${highlight.color}-400`}></div>
                                {highlight.color}
                              </span>
                              <span>{new Date(highlight.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes Section */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <i className="ri-sticky-note-line text-blue-600"></i>
                      Notes ({assignmentDetails.notes.length})
                    </h4>
                    {assignmentDetails.notes.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <i className="ri-sticky-note-line text-4xl text-gray-300 mb-2"></i>
                        <p className="text-gray-500">No notes yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {assignmentDetails.notes.map((note) => (
                          <div key={note.id} className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                            <p className="text-gray-800 mb-2">{note.content}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{note.highlight_id ? 'Attached to highlight' : 'Standalone note'}</span>
                              <span>{new Date(note.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Failed to load details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryManagement;
