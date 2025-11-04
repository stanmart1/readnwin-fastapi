import { useState, useEffect, useRef } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useBookManagement } from '../../hooks/useBookManagement';
import api from '../../lib/api';

const LibraryManagement = () => {
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('ebook');
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    user_id: undefined
  });

  const { users, fetchUsers } = useUsers();
  const { books, loadBooks } = useBookManagement();

  // Load users and books once on mount
  useEffect(() => {
    fetchUsers({ limit: 100 });
    loadBooks();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load library data when filters change
  useEffect(() => {
    loadData();
  }, [pagination.page, filters.search, filters.status, filters.user_id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {
        skip: (pagination.page - 1) * pagination.limit,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.user_id && { user_id: filters.user_id })
      };

      const response = await api.get('/admin/library-assignments', { params });
      const result = response.data;

      setLibraries(result.assignments || []);
      setPagination(prev => ({
        ...prev,
        total: result.total || 0,
        pages: result.pagination?.pages || Math.ceil((result.total || 0) / pagination.limit)
      }));
    } catch (error) {
      console.error('Failed to load libraries:', error);
      alert('Failed to load library assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBook = async () => {
    if (!selectedUser || !selectedBook) {
      alert('Please select both user and book');
      return;
    }

    try {
      await api.post('/admin/user-library', {
        user_id: selectedUser,
        book_id: selectedBook,
        format: selectedFormat
      });

      alert('Book assigned successfully!');
      setShowAssignModal(false);
      setSelectedUser(null);
      setSelectedBook(null);
      setSelectedFormat('ebook');
      setUserSearch('');
      setShowUserDropdown(false);
      loadData();
    } catch (error) {
      console.error('Assignment error:', error);
      alert('Failed to assign book');
    }
  };

  const handleRemoveAssignment = async (libraryId) => {
    if (!confirm('Are you sure you want to remove this book assignment?')) return;

    try {
      await api.delete(`/admin/library-assignment/${libraryId}`);
      alert('Assignment removed successfully!');
      loadData();
    } catch (error) {
      console.error('Remove error:', error);
      alert('Failed to remove assignment');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Library Management</h2>
        <p className="text-gray-600 mt-1">Manage user book assignments and reading progress</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
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
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
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
        <div className="flex justify-end">
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            Assign Book
          </button>
        </div>
      </div>

      {/* Libraries Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                    <td className="px-6 py-4 whitespace-nowrap" colSpan={7}>
                      <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : libraries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
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
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${library.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{library.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        library.status === 'active' ? 'bg-green-100 text-green-800' :
                        library.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {library.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(library.assigned_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleRemoveAssignment(library.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
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
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4 mt-4">
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
                <select
                  value={selectedBook || ''}
                  onChange={(e) => setSelectedBook(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300 appearance-none bg-white"
                >
                  <option value="">Choose a book...</option>
                  {books.length === 0 ? (
                    <option disabled>Loading books...</option>
                  ) : (
                    books.map(book => (
                      <option key={book.id} value={book.id}>
                        {book.title} - {book.author_name}
                      </option>
                    ))
                  )}
                </select>
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
                    setShowUserDropdown(false);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-colors font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignBook}
                  disabled={!selectedUser || !selectedBook}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
                >
                  <i className="ri-check-line"></i>
                  <span>Assign Book</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryManagement;
