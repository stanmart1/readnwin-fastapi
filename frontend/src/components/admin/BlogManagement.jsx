import { useState, useEffect, useRef, useCallback } from 'react';
import { useAdminBlog } from '../../hooks/useAdminBlog';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    seo_keywords: [],
    featured_image: null,
    author_id: null,
    published_at: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState('content');
  const [currentStep, setCurrentStep] = useState(1);
  const [editMode, setEditMode] = useState('basic');
  const [validationErrors, setValidationErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [slugEditable, setSlugEditable] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [changingStatus, setChangingStatus] = useState(null);
  const hasFetched = useRef(false);
  const filtersInitialized = useRef(false);
  const autoSaveTimer = useRef(null);
  const searchDebounce = useRef(null);

  // Utility function for image URLs
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('blob:') || url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_BASE_URL}${url}`;
  };

  // Calculate read time
  const calculateReadTime = (content) => {
    if (!content) return 0;
    const text = content.replace(/<[^>]*>/g, '');
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    return Math.ceil(wordCount / 200);
  };

  useEffect(() => {
    if (!hasFetched.current) {
      loadData();
      hasFetched.current = true;
      filtersInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (filtersInitialized.current && hasFetched.current) {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
      searchDebounce.current = setTimeout(() => {
        fetchPosts(filters);
      }, 300);
    }
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [filters]);

  useEffect(() => {
    if (hookError) {
      setError(hookError);
    }
  }, [hookError]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if ((showCreateModal || showEditModal) && hasUnsavedChanges) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        localStorage.setItem('blog_draft', JSON.stringify(formData));
        showToast('Draft auto-saved', 'info');
      }, 30000);
    }
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [formData, showCreateModal, showEditModal, hasUnsavedChanges]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (showCreateModal) handleCreatePost();
        if (showEditModal) handleUpdatePost();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateModal, showEditModal]);

  const loadData = async () => {
    await fetchPosts(filters);
    fetchCategories().catch(err => console.warn('Categories fetch failed:', err));
    fetchStats().catch(err => console.warn('Stats fetch failed:', err));
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleCreatePost = async () => {
    if (!validateForm()) {
      setError('Please fix validation errors');
      return;
    }
    setIsSaving(true);
    setUploadProgress(10);
    try {
      setUploadProgress(50);
      // Calculate read time before creating
      const readTime = calculateReadTime(formData.content);
      const result = await createPost({ ...formData, read_time: readTime });
      setUploadProgress(100);
      if (result.success) {
        setShowCreateModal(false);
        resetForm();
        setCurrentStep(1);
        setActiveTab('content');
        setValidationErrors({});
        setHasUnsavedChanges(false);
        localStorage.removeItem('blog_draft');
        loadData();
        showToast('Blog post created successfully!', 'success');
      } else {
        setError(result.error || 'Failed to create post');
        showToast('Failed to create post', 'error');
      }
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  const handleUpdatePost = async () => {
    if (!selectedPost?.id) return;
    if (!validateForm()) {
      setError('Please fix validation errors');
      return;
    }
    setIsSaving(true);
    setUploadProgress(10);
    try {
      setUploadProgress(50);
      // Calculate read time before updating
      const readTime = calculateReadTime(formData.content);
      const result = await updatePost(selectedPost.id, { ...formData, read_time: readTime });
      setUploadProgress(100);
      if (result.success) {
        setShowEditModal(false);
        setSelectedPost(null);
        setActiveTab('content');
        setValidationErrors({});
        setHasUnsavedChanges(false);
        loadData();
        showToast('Blog post updated successfully!', 'success');
      } else {
        setError(result.error || 'Failed to update post');
        showToast('Failed to update post', 'error');
      }
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  const handleStatusChange = async (postId, newStatus) => {
    setChangingStatus(postId);
    try {
      const result = await updatePost(postId, { status: newStatus });
      if (result.success) {
        loadData();
        showToast(`Post ${newStatus === 'published' ? 'published' : newStatus === 'draft' ? 'moved to draft' : 'archived'} successfully`, 'success');
      } else {
        showToast('Failed to change status', 'error');
      }
    } finally {
      setChangingStatus(null);
    }
  };

  const handleDeletePost = async (id) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setIsDeleting(true);
    try {
      const result = await deletePost(id);
      if (result.success) {
        loadData();
        showToast('Blog post deleted successfully', 'success');
      } else {
        setError(result.error || 'Failed to delete post');
        showToast('Failed to delete post', 'error');
      }
    } finally {
      setIsDeleting(false);
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
      seo_keywords: post.seo_keywords || [],
      featured_image: null,
      author_id: post.author_id || null,
      published_at: post.published_at || ''
    });
    setImagePreview(post.featured_image_url || null);
    setCurrentStep(1);
    setHasUnsavedChanges(false);
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
      seo_keywords: [],
      featured_image: null,
      author_id: null,
      published_at: ''
    });
    setTagInput('');
    setKeywordInput('');
    setImagePreview(null);
    setActiveTab('content');
    setCurrentStep(1);
    setValidationErrors({});
    setSlugEditable(false);
    setHasUnsavedChanges(false);
  };

  const loadDraft = () => {
    const savedDraft = localStorage.getItem('blog_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft);
        if (draft.featured_image) {
          setImagePreview(URL.createObjectURL(draft.featured_image));
        }
        showToast('Draft recovered successfully', 'success');
        localStorage.removeItem('blog_draft');
      } catch (err) {
        showToast('Failed to recover draft', 'error');
      }
    }
  };

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title) => {
    setFormData({ 
      ...formData, 
      title,
      slug: slugEditable ? formData.slug : generateSlug(title),
      seo_title: title
    });
    setHasUnsavedChanges(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Required';
    if (!formData.slug.trim()) errors.slug = 'Required';
    if (!formData.content.trim()) errors.content = 'Required';
    if (formData.seo_title.length > 60) errors.seo_title = 'Max 60 chars';
    if (formData.seo_description.length > 160) errors.seo_description = 'Max 160 chars';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        showToast('Image must be less than 5MB', 'error');
        return;
      }
      setUploadProgress(30);
      setFormData({ ...formData, featured_image: file });
      setImagePreview(URL.createObjectURL(file));
      setHasUnsavedChanges(true);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.seo_keywords.includes(keywordInput.trim())) {
      setFormData({ ...formData, seo_keywords: [...formData.seo_keywords, keywordInput.trim()] });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword) => {
    setFormData({ ...formData, seo_keywords: formData.seo_keywords.filter(k => k !== keyword) });
  };

  const toggleSelectPost = (postId) => {
    setSelectedPosts(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedPosts(selectedPosts.length === posts.length ? [] : posts.map(p => p.id));
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedPosts.length} posts?`)) return;
    for (const id of selectedPosts) {
      await deletePost(id);
    }
    setSelectedPosts([]);
    loadData();
  };

  const handleBulkPublish = async () => {
    for (const id of selectedPosts) {
      await updatePost(id, { status: 'published' });
    }
    setSelectedPosts([]);
    loadData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);
  
  const getPageNumbers = () => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) return Array.from({ length: totalPages }, (_, i) => i + 1);
    
    const pages = [];
    if (currentPage <= 3) {
      for (let i = 1; i <= Math.min(maxVisible, totalPages); i++) pages.push(i);
      if (totalPages > maxVisible) pages.push('...');
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...');
      for (let i = totalPages - maxVisible + 2; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
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
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-3 lg:py-4">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in ${
            toast.type === 'success' ? 'bg-green-500 text-white' :
            toast.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            <i className={`text-xl ${
              toast.type === 'success' ? 'ri-checkbox-circle-line' :
              toast.type === 'error' ? 'ri-error-warning-line' :
              'ri-information-line'
            }`}></i>
            <span className="font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        )}

        {/* Upload Progress */}
        {uploadProgress > 0 && (
          <div className="fixed top-0 left-0 right-0 z-50">
            <div className="h-1 bg-blue-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        )}

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
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4 sm:mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <i className="ri-article-line text-blue-600"></i>
                  Blog Management
                </h1>
                <p className="text-gray-600 mt-1">Create and manage blog posts</p>
              </div>
              <div className="flex gap-2">
                {localStorage.getItem('blog_draft') && (
                  <button
                    onClick={loadDraft}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-full font-semibold hover:bg-yellow-600 transition-all flex items-center gap-2"
                    title="Recover auto-saved draft"
                  >
                    <i className="ri-file-recover-line"></i>
                    <span className="hidden sm:inline">Recover Draft</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <i className="ri-add-line"></i>
                  <span>Create Post</span>
                </button>
              </div>
            </div>
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
                  <option key={cat.slug || cat.name} value={cat.name}>{cat.name}</option>
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

        {/* Bulk Actions */}
        {selectedPosts.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedPosts.length} post{selectedPosts.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkPublish}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Publish Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedPosts([])}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedPosts.length === posts.length && posts.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Post
                  </th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">
                    Author
                  </th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Category
                  </th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden xl:table-cell">
                    Published
                  </th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">
                    Stats
                  </th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPosts.length > 0 ? (
                  currentPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
                        <input
                          type="checkbox"
                          checked={selectedPosts.includes(post.id)}
                          onChange={() => toggleSelectPost(post.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2">
                          {post.featured_image_url && (
                            <img 
                              src={getImageUrl(post.featured_image_url)}
                              alt={post.title}
                              className="w-12 h-12 object-cover rounded flex-shrink-0"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{post.title}</div>
                              {post.featured && (
                                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded flex-shrink-0">
                                  Featured
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 truncate hidden sm:block">{post.slug}</div>
                            <div className="text-xs text-gray-400 mt-0.5 line-clamp-1 hidden md:block" dangerouslySetInnerHTML={{ __html: post.excerpt?.replace(/<[^>]*>/g, '') || '' }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 hidden lg:table-cell">
                        <div className="text-xs text-gray-600 whitespace-nowrap">
                          {post.author_name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                          {post.category}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
                        <select
                          value={post.status}
                          onChange={(e) => handleStatusChange(post.id, e.target.value)}
                          disabled={changingStatus === post.id}
                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusColor(post.status)} ${changingStatus === post.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 hidden xl:table-cell">
                        <div className="text-xs text-gray-600 whitespace-nowrap">
                          {post.published_at ? new Date(post.published_at).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 hidden sm:table-cell">
                        <div className="text-xs text-gray-600 whitespace-nowrap">
                          <div>{post.views_count || 0} views</div>
                          <div>{post.read_time || calculateReadTime(post.content)} min read</div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
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
                                seo_keywords: post.seo_keywords || [],
                                featured_image: null,
                                author_id: post.author_id || null,
                                published_at: post.published_at || ''
                              });
                              setImagePreview(post.featured_image_url || null);
                              setShowEditModal(false);
                              setShowPreview(true);
                            }}
                            className="text-purple-600 hover:text-purple-900 flex-shrink-0"
                            title="Preview"
                          >
                            <i className="ri-eye-line text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleEditPost(post)}
                            className="text-blue-600 hover:text-blue-900 flex-shrink-0"
                            title="Edit"
                          >
                            <i className="ri-edit-line text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-900 flex-shrink-0 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            {isDeleting ? (
                              <i className="ri-loader-4-line animate-spin text-lg"></i>
                            ) : (
                              <i className="ri-delete-bin-line text-lg"></i>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                      <i className="ri-article-line text-4xl sm:text-6xl text-gray-300 mb-3 sm:mb-4"></i>
                      <h3 className="text-sm sm:text-lg font-medium text-gray-900">No posts found</h3>
                      <p className="text-xs sm:text-base text-gray-500 mt-1">Create your first blog post</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstPost + 1} to {Math.min(indexOfLastPost, posts.length)} of {posts.length} posts
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {getPageNumbers().map((page, i) => (
                  page === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-3 py-1">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}
                    >
                      {page}
                    </button>
                  )
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {currentPosts.length > 0 ? (
            currentPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                {/* Post Header */}
                <div className="flex items-start gap-3 mb-3">
                  {post.featured_image_url && (
                    <img 
                      src={getImageUrl(post.featured_image_url)}
                      alt={post.title}
                      className="w-20 h-20 object-cover rounded flex-shrink-0"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">{post.title}</h3>
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={() => toggleSelectPost(post.id)}
                        className="rounded flex-shrink-0 mt-1"
                      />
                    </div>
                    {post.featured && (
                      <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded mb-1">
                        Featured
                      </span>
                    )}
                    <p className="text-xs text-gray-500 line-clamp-2" dangerouslySetInnerHTML={{ __html: post.excerpt?.replace(/<[^>]*>/g, '') || '' }}></p>
                  </div>
                </div>

                {/* Post Meta */}
                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                  <select
                    value={post.status}
                    onChange={(e) => handleStatusChange(post.id, e.target.value)}
                    disabled={changingStatus === post.id}
                    className={`px-2 py-1 rounded-full font-medium border-0 ${getStatusColor(post.status)} ${changingStatus === post.id ? 'opacity-50' : ''}`}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <span className="px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
                    {post.category}
                  </span>
                  <span className="text-gray-500">
                    {post.read_time || calculateReadTime(post.content)} min
                  </span>
                  <span className="text-gray-500">
                    {post.author_name || 'Unknown'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
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
                        seo_keywords: post.seo_keywords || [],
                        featured_image: null,
                        author_id: post.author_id || null,
                        published_at: post.published_at || ''
                      });
                      setImagePreview(post.featured_image_url || null);
                      setShowEditModal(false);
                      setShowPreview(true);
                    }}
                    className="flex-1 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <i className="ri-eye-line"></i>
                    Preview
                  </button>
                  <button
                    onClick={() => handleEditPost(post)}
                    className="flex-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <i className="ri-edit-line"></i>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    disabled={isDeleting}
                    className="flex-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <i className={isDeleting ? "ri-loader-4-line animate-spin" : "ri-delete-bin-line"}></i>
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <i className="ri-article-line text-5xl text-gray-300 mb-3"></i>
              <h3 className="text-base font-medium text-gray-900">No posts found</h3>
              <p className="text-sm text-gray-500 mt-1">Create your first blog post</p>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Preview</h2>
                  <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600">
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>
                {imagePreview && (
                  <img 
                    src={getImageUrl(imagePreview)}
                    alt="Featured" 
                    className="w-full h-64 object-cover rounded-lg mb-4"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      console.error('Failed to load image:', imagePreview);
                    }}
                  />
                )}
                <h1 className="text-3xl font-bold mb-2">{formData.title}</h1>
                <div className="flex gap-2 mb-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{formData.category}</span>
                  {formData.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">{tag}</span>
                  ))}
                </div>
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: formData.content }} />
              </div>
            </div>
          </div>
        )}

        {/* Create Modal - Multi-Stage */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                {/* Header with Steps */}
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 -m-4 sm:-m-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create Blog Post</h2>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Step {currentStep} of 3 - {currentStep === 1 ? 'Basic Info' : currentStep === 2 ? 'Content' : 'Settings & SEO'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (hasUnsavedChanges && !confirm('You have unsaved changes. Are you sure you want to close?')) return;
                        setShowCreateModal(false);
                        setCurrentStep(1);
                        setHasUnsavedChanges(false);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <i className="ri-close-line text-2xl"></i>
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  {/* Step Indicator */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all ${
                      currentStep >= 1 ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep > 1 ? <i className="ri-check-line"></i> : '1'}
                    </div>
                    <div className={`flex-1 h-1 rounded-full transition-all ${
                      currentStep >= 2 ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                    }`}></div>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all ${
                      currentStep >= 2 ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep > 2 ? <i className="ri-check-line"></i> : '2'}
                    </div>
                    <div className={`flex-1 h-1 rounded-full transition-all ${
                      currentStep >= 3 ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                    }`}></div>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all ${
                      currentStep >= 3 ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
                    }`}>
                      3
                    </div>
                  </div>
                  
                  {/* Step Labels */}
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                    <span className={currentStep === 1 ? 'font-semibold text-blue-600' : ''}>Basic Info</span>
                    <span className={currentStep === 2 ? 'font-semibold text-blue-600' : ''}>Content</span>
                    <span className={currentStep === 3 ? 'font-semibold text-blue-600' : ''}>Settings & SEO</span>
                  </div>
                </div>

                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${validationErrors.title ? 'border-red-500' : ''}`}
                        placeholder="Enter post title"
                      />
                      {validationErrors.title && <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Slug *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          disabled={!slugEditable}
                          className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${validationErrors.slug ? 'border-red-500' : ''} ${!slugEditable ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                          placeholder="auto-generated-slug"
                        />
                        <button
                          type="button"
                          onClick={() => setSlugEditable(!slugEditable)}
                          className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                        >
                          <i className={slugEditable ? 'ri-lock-line' : 'ri-edit-line'}></i>
                        </button>
                      </div>
                      {validationErrors.slug && <p className="text-red-500 text-xs mt-1">{validationErrors.slug}</p>}
                      <p className="text-xs text-gray-500 mt-1">URL: /blog/{formData.slug || 'post-slug'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {categories.map((cat) => (
                          <option key={cat.slug || cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Featured Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">Max 5MB. Recommended: 1200x630px</p>
                      {imagePreview && (
                        <div className="mt-2 relative inline-block">
                          <img 
                            src={getImageUrl(imagePreview)}
                            alt="Preview" 
                            className="h-32 object-cover rounded"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                          <button
                            onClick={() => { setImagePreview(null); setFormData({ ...formData, featured_image: null }); }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                            type="button"
                          >
                            <i className="ri-close-line text-sm"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Content */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Excerpt</label>
                      <ReactQuill
                        theme="snow"
                        value={formData.excerpt}
                        onChange={(value) => { setFormData({ ...formData, excerpt: value }); setHasUnsavedChanges(true); }}
                        className="bg-white rounded-lg"
                        placeholder="Brief description"
                        modules={{
                          toolbar: [
                            ['bold', 'italic', 'underline'],
                            ['clean']
                          ]
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Tags</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          className="flex-1 px-3 py-2 border rounded-lg"
                          placeholder="Add tag and press Enter"
                        />
                        <button onClick={addTag} type="button" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map(tag => (
                          <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1 text-sm">
                            {tag}
                            <button onClick={() => removeTag(tag)} type="button" className="text-blue-600 hover:text-blue-800">
                              <i className="ri-close-line"></i>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Content *</label>
                      <ReactQuill
                        theme="snow"
                        value={formData.content}
                        onChange={(value) => { setFormData({ ...formData, content: value }); setHasUnsavedChanges(true); }}
                        className={`bg-white rounded-lg ${validationErrors.content ? 'border-2 border-red-500' : ''}`}
                        placeholder="Write your post content here..."
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['blockquote', 'code-block'],
                            ['link', 'image'],
                            ['clean']
                          ]
                        }}
                        style={{ height: '300px', marginBottom: '60px' }}
                      />
                      {validationErrors.content && <p className="text-red-500 text-xs mt-1">{validationErrors.content}</p>}
                    </div>
                  </div>
                )}

                {/* Step 3: Settings & SEO */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                        <label className="ml-2 text-sm">Featured Post</label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">SEO Title</label>
                      <input
                        type="text"
                        value={formData.seo_title}
                        onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg ${validationErrors.seo_title ? 'border-red-500' : ''}`}
                        placeholder="SEO optimized title"
                        maxLength="60"
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span className={formData.seo_title.length > 60 ? 'text-red-500' : 'text-gray-500'}>
                          {formData.seo_title.length}/60 characters
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">SEO Description</label>
                      <textarea
                        value={formData.seo_description}
                        onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg ${validationErrors.seo_description ? 'border-red-500' : ''}`}
                        rows="3"
                        placeholder="Meta description for search engines"
                        maxLength="160"
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span className={formData.seo_description.length > 160 ? 'text-red-500' : 'text-gray-500'}>
                          {formData.seo_description.length}/160 characters
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">SEO Keywords</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                          className="flex-1 px-3 py-2 border rounded-lg"
                          placeholder="Add keyword and press Enter"
                        />
                        <button onClick={addKeyword} type="button" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.seo_keywords.map(keyword => (
                          <span key={keyword} className="px-3 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1 text-sm">
                            {keyword}
                            <button onClick={() => removeKeyword(keyword)} type="button" className="text-green-600 hover:text-green-800">
                              <i className="ri-close-line"></i>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 mt-6">
                  {currentStep > 1 && (
                    <button
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium order-3 sm:order-1"
                    >
                      <i className="ri-arrow-left-line mr-2"></i>
                      Back
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (hasUnsavedChanges && !confirm('You have unsaved changes. Are you sure you want to cancel?')) return;
                      setShowCreateModal(false);
                      setCurrentStep(1);
                      setHasUnsavedChanges(false);
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium order-2"
                  >
                    Cancel
                  </button>
                  <div className="flex-1 hidden sm:block"></div>
                  {currentStep < 3 ? (
                    <button
                      onClick={() => {
                        // Validate current step
                        if (currentStep === 1) {
                          if (!formData.title.trim()) {
                            setValidationErrors({ title: 'Title is required' });
                            return;
                          }
                          if (!formData.slug.trim()) {
                            setValidationErrors({ slug: 'Slug is required' });
                            return;
                          }
                        }
                        if (currentStep === 2) {
                          if (!formData.content.trim()) {
                            setValidationErrors({ content: 'Content is required' });
                            return;
                          }
                        }
                        setValidationErrors({});
                        setCurrentStep(currentStep + 1);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium order-1"
                    >
                      Next
                      <i className="ri-arrow-right-line ml-2"></i>
                    </button>
                  ) : (
                    <button
                      onClick={handleCreatePost}
                      disabled={isSaving}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 font-medium order-1"
                    >
                      {isSaving && <i className="ri-loader-4-line animate-spin"></i>}
                      {isSaving ? 'Creating...' : 'Create Post'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal - Basic/Advanced Mode */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 -m-4 sm:-m-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Blog Post</h2>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">Editing: {selectedPost?.title}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (hasUnsavedChanges && !confirm('You have unsaved changes. Are you sure you want to close?')) return;
                        setShowEditModal(false);
                        setEditMode('basic');
                        setHasUnsavedChanges(false);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <i className="ri-close-line text-2xl"></i>
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditMode('basic')}
                      className={`px-4 py-3 rounded-xl font-medium transition-all text-center border-2 ${editMode === 'basic' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-lg' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      <i className="ri-edit-line mr-2"></i>
                      <span className="hidden sm:inline">Basic Edit</span>
                      <span className="sm:hidden">Basic</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode('advanced')}
                      className={`px-4 py-3 rounded-xl font-medium transition-all text-center border-2 ${editMode === 'advanced' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-lg' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                    >
                      <i className="ri-settings-3-line mr-2"></i>
                      <span className="hidden sm:inline">Advanced Edit</span>
                      <span className="sm:hidden">Advanced</span>
                    </button>
                  </div>
                </div>

                {editMode === 'basic' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => { handleTitleChange(e.target.value); setHasUnsavedChanges(true); }}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${validationErrors.title ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                        placeholder="Enter post title"
                      />
                      {validationErrors.title && <p className="text-red-500 text-sm mt-1"><i className="ri-error-warning-line mr-1"></i>{validationErrors.title}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Slug *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) => { setFormData({ ...formData, slug: e.target.value }); setHasUnsavedChanges(true); }}
                          disabled={!slugEditable}
                          className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${!slugEditable ? 'bg-gray-50 cursor-not-allowed' : 'border-gray-200 hover:border-gray-300'}`}
                          placeholder="auto-generated-slug"
                        />
                        <button type="button" onClick={() => setSlugEditable(!slugEditable)} className="px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                          <i className={slugEditable ? 'ri-lock-line' : 'ri-edit-line'}></i>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">URL: /blog/{formData.slug || 'post-slug'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Category</label>
                      <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300 appearance-none bg-white">
                        {categories.map((cat) => <option key={cat.slug || cat.name} value={cat.name}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Featured Image</label>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                      <p className="text-xs text-gray-500 mt-1">Max 5MB. Recommended: 1200x630px</p>
                      {imagePreview && (
                        <div className="mt-3 relative inline-block">
                          <img src={getImageUrl(imagePreview)} alt="Preview" className="h-32 w-48 object-cover rounded-xl shadow-md" onError={(e) => e.target.style.display = 'none'} />
                          <button onClick={() => { setImagePreview(null); setFormData({ ...formData, featured_image: null }); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg" type="button">
                            <i className="ri-close-line text-sm"></i>
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Content *</label>
                      <ReactQuill theme="snow" value={formData.content} onChange={(value) => { setFormData({ ...formData, content: value }); setHasUnsavedChanges(true); }} className={`bg-white rounded-xl ${validationErrors.content ? 'border-2 border-red-500' : ''}`} style={{ height: '300px', marginBottom: '60px' }} />
                      {validationErrors.content && <p className="text-red-500 text-sm mt-1"><i className="ri-error-warning-line mr-1"></i>{validationErrors.content}</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Status</label>
                        <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300 appearance-none bg-white">
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
                        <label className="text-sm font-semibold text-gray-800">Featured Post</label>
                        <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                )}

                {editMode === 'advanced' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Excerpt</label>
                      <ReactQuill theme="snow" value={formData.excerpt} onChange={(value) => setFormData({ ...formData, excerpt: value })} className="bg-white rounded-xl" placeholder="Brief description" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Tags</label>
                      <div className="flex gap-2 mb-2">
                        <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300" placeholder="Add tag and press Enter" />
                        <button onClick={addTag} type="button" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium">Add</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map(tag => (
                          <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1 text-sm">
                            {tag}
                            <button onClick={() => removeTag(tag)} type="button"><i className="ri-close-line"></i></button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Publish Date</label>
                      <input type="datetime-local" value={formData.published_at} onChange={(e) => setFormData({ ...formData, published_at: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">SEO Title</label>
                      <input type="text" value={formData.seo_title} onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300" maxLength="60" placeholder="SEO optimized title" />
                      <div className="flex justify-between text-xs mt-1">
                        <span className={formData.seo_title.length > 60 ? 'text-red-500' : 'text-gray-500'}>
                          {formData.seo_title.length}/60 characters
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">SEO Description</label>
                      <textarea value={formData.seo_description} onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300" rows="3" maxLength="160" placeholder="Meta description for search engines" />
                      <div className="flex justify-between text-xs mt-1">
                        <span className={formData.seo_description.length > 160 ? 'text-red-500' : 'text-gray-500'}>
                          {formData.seo_description.length}/160 characters
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">SEO Keywords</label>
                      <div className="flex gap-2 mb-2">
                        <input type="text" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())} className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-300" placeholder="Add keyword and press Enter" />
                        <button onClick={addKeyword} type="button" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium">Add</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.seo_keywords.map(keyword => (
                          <span key={keyword} className="px-3 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1 text-sm">
                            {keyword}
                            <button onClick={() => removeKeyword(keyword)} type="button"><i className="ri-close-line"></i></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 mt-6">
                  <button onClick={() => { if (hasUnsavedChanges && !confirm('Discard changes?')) return; setShowEditModal(false); setEditMode('basic'); setHasUnsavedChanges(false); }} className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium order-2 sm:order-1">Cancel</button>
                  <div className="flex-1 hidden sm:block"></div>
                  <button onClick={handleUpdatePost} disabled={isSaving} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 font-medium order-1 sm:order-2">
                    {isSaving && <i className="ri-loader-4-line animate-spin"></i>}
                    {isSaving ? 'Updating...' : 'Update Post'}
                  </button>
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
