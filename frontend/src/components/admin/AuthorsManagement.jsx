import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthorsManagement = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    avatar_url: '',
    status: 'active'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  const loadAuthors = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status })
      };

      const response = await axios.get('/admin/authors', { params });
      const result = response.data;

      setAuthors(result.authors || []);
      if (result.pagination) {
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total || 0,
          pages: result.pagination.pages || 0
        }));
      }
    } catch (error) {
      console.error('Failed to load authors:', error);
      alert('Failed to load authors');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters.search, filters.status]);

  useEffect(() => {
    loadAuthors();
  }, [loadAuthors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Author name is required');
      return;
    }

    try {
      if (editingAuthor) {
        await axios.put(`/admin/authors/${editingAuthor.id}`, formData);
        alert('Author updated successfully!');
      } else {
        await axios.post('/admin/authors', formData);
        alert('Author created successfully!');
      }

      setShowModal(false);
      resetForm();
      loadAuthors();
    } catch (error) {
      console.error('Save error:', error);
      alert(error.response?.data?.error || 'Failed to save author');
    }
  };

  const handleEdit = (author) => {
    setEditingAuthor(author);
    setFormData({
      name: author.name,
      email: author.email || '',
      bio: author.bio || '',
      avatar_url: author.avatar_url || '',
      status: author.status
    });
    setShowModal(true);
  };

  const handleDelete = async (authorId) => {
    if (!confirm('Are you sure you want to delete this author? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/admin/authors/${authorId}`);
      alert('Author deleted successfully!');
      loadAuthors();
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.response?.data?.error || 'Failed to delete author');
    }
  };

  const toggleStatus = async (authorId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      await axios.put(`/admin/authors/${authorId}`, { status: newStatus });
      alert(`Author ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      loadAuthors();
    } catch (error) {
      console.error('Status update error:', error);
      alert(error.response?.data?.error || 'Failed to update author status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      bio: '',
      avatar_url: '',
      status: 'active'
    });
    setEditingAuthor(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Authors Management</h2>
        <p className="text-gray-600 mt-1">Manage book authors and their profiles</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search authors by name or email..."
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
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            Add Author
          </button>
        </div>
      </div>

      {/* Authors Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Books</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="animate-pulse bg-gray-200 h-10 w-10 rounded-full mr-4"></div>
                        <div>
                          <div className="animate-pulse bg-gray-200 h-4 w-24 rounded mb-1"></div>
                          <div className="animate-pulse bg-gray-200 h-3 w-32 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="animate-pulse bg-gray-200 h-6 w-16 rounded-full"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div></td>
                  </tr>
                ))
              ) : authors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <i className="ri-user-line text-4xl text-gray-400 mb-4 block"></i>
                    <h3 className="text-lg font-medium text-gray-900">No authors found</h3>
                    <p className="text-gray-500 mt-1">Add your first author to get started</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Author
                    </button>
                  </td>
                </tr>
              ) : (
                authors.map((author) => (
                  <tr key={author.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={author.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=3B82F6&color=fff`}
                            alt={author.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{author.name}</div>
                          <div className="text-sm text-gray-500">{author.email || 'No email provided'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{author.books_count || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        author.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {author.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(author.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleStatus(author.id, author.status)}
                          className={`p-1 rounded ${author.status === 'active' ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={author.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          <i className={`ri-${author.status === 'active' ? 'pause' : 'play'}-line`}></i>
                        </button>
                        <button
                          onClick={() => handleEdit(author)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(author.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
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

      {pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} authors
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

      {/* Add/Edit Author Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingAuthor ? 'Edit Author' : 'Add New Author'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Author Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter author name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter author email (optional)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter author biography"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Avatar URL</label>
                  <input
                    type="url"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter avatar image URL"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingAuthor ? 'Update' : 'Create'} Author
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorsManagement;
