import { useState, useEffect, useRef } from 'react';
import { useAdminBlog } from '../../hooks/useAdminBlog';

const BlogManagement = () => {
  const {
    posts,
    categories,
    stats,
    loading,
    error: hookError,
    fetchPosts,
    fetchCategories,
    fetchStats,
    createPost,
    updatePost,
    deletePost
  } = useAdminBlog();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '', search: '' });
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'draft',
    featured: false,
    category: 'general',
    tags: [],
    seo_title: '',
    seo_description: '',
    seo_keywords: []
  });
  const hasFetched = useRef(false);
  const filtersInitialized = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      loadData();
      hasFetched.current = true;
      filtersInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (filtersInitialized.current && hasFetched.current) {
      fetchPosts(filters);
    }
  }, [filters]);

  useEffect(() => {
    if (hookError) {
      setError(hookError);
    }
  }, [hookError]);

  const loadData = async () => {
    await fetchPosts(filters);
    fetchCategories().catch(err => console.warn('Categories fetch failed:', err));
    fetchStats().catch(err => console.warn('Stats fetch failed:', err));
  };

  const handleCreatePost = async () => {
    const result = await createPost(formData);
    if (result.success) {
      setShowCreateModal(false);
      resetForm();
      loadData();
    } else {
      setError(result.error || 'Failed to create post');
    }
  };

  const handleUpdatePost = async () => {
    if (!selectedPost?.id) return;
    const result = await updatePost(selectedPost.id, formData);
    if (result.success) {
      setShowEditModal(false);
      setSelectedPost(null);
      loadData();
    } else {
      setError(result.error || 'Failed to update post');
    }
  };

  const handleDeletePost = async (id) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    const result = await deletePost(id);
    if (result.success) {
      loadData();
    } else {
      setError(result.error || 'Failed to delete post');
    }
  };

  const handleEditPost = (post) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      status: post.status,
      featured: post.featured,
      category: post.category,
      tags: post.tags || [],
      seo_title: post.seo_title || '',
      seo_description: post.seo_description || '',
      seo_keywords: post.seo_keywords || []
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      status: 'draft',
      featured: false,
      category: 'general',
      tags: [],
      seo_title: '',
      seo_description: '',
      seo_keywords: []
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 md:p-12">
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 sm:h-10 md:h-12 w-8 sm:w-10 md:w-12 border-b-2 border-blue-600"></div>
              <span className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 text-center">
                Loading blog posts...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <i className="ri-error-warning-line text-red-400 text-lg sm:text-xl flex-shrink-0 mt-0.5"></i>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1 break-words">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight break-words">
                Blog Management
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed break-words">
                Create and manage blog posts
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg sm:rounded-full hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 font-medium flex items-center justify-center gap-2"
            >
              <i className="ri-add-line"></i>
              <span>Create Post</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-article-line text-white text-sm sm:text-base md:text-xl"></i>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total Posts</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.total_posts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-check-line text-white text-sm sm:text-base md:text-xl"></i>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Published</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.published_posts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-draft-line text-white text-sm sm:text-base md:text-xl"></i>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Drafts</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.draft_posts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-eye-line text-white text-sm sm:text-base md:text-xl"></i>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total Views</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.total_views}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search posts..."
              />
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">{post.title}</div>
                            {post.featured && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{post.slug}</div>
                          <div className="text-xs text-gray-400 mt-1">{post.excerpt}</div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {post.category}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-xs text-gray-600">
                          <div>{post.views_count || 0} views</div>
                          <div>{post.likes_count || 0} likes</div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditPost(post)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <i className="ri-edit-line text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <i className="ri-delete-bin-line text-lg"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <i className="ri-article-line text-6xl text-gray-300 mb-4"></i>
                      <h3 className="text-lg font-medium text-gray-900">No posts found</h3>
                      <p className="text-gray-500 mt-1">Create your first blog post</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
              <div className="p-3 xs:p-4 sm:p-6">
                <div className="flex items-start xs:items-center justify-between mb-4 xs:mb-6">
                  <h2 className="text-base xs:text-lg sm:text-xl font-semibold text-gray-900 leading-tight break-words pr-2">
                    {showEditModal ? 'Edit Blog Post' : 'Create Blog Post'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1"
                  >
                    <i className="ri-close-line text-lg xs:text-xl sm:text-2xl"></i>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Post title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Slug</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="post-slug"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Excerpt</label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Brief description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Content</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      rows={10}
                      placeholder="Post content (HTML supported)"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="flex items-center pt-6">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label className="ml-2 text-sm">Featured</label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowEditModal(false);
                      }}
                      className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={showEditModal ? handleUpdatePost : handleCreatePost}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {showEditModal ? 'Update' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogManagement;
