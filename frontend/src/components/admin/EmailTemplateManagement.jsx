import { useState, useEffect, useRef } from 'react';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';

const EmailTemplateManagement = () => {
  const {
    templates,
    categories,
    stats,
    loading,
    error: hookError,
    fetchTemplates,
    fetchCategories,
    fetchStats,
    createTemplate,
    updateTemplate,
    deleteTemplate
  } = useEmailTemplates();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [error, setError] = useState('');
  const [showVariables, setShowVariables] = useState(false);
  const [showPreviewInModal, setShowPreviewInModal] = useState(false);
  const [filters, setFilters] = useState({ category: '', isActive: '', search: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subject: '',
    html_content: '',
    text_content: '',
    description: '',
    category: 'general',
    is_active: true
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
      fetchTemplates(filters);
    }
  }, [filters]);

  useEffect(() => {
    if (hookError) {
      setError(hookError);
    }
  }, [hookError]);

  const loadData = async () => {
    // Fetch templates first (most important)
    await fetchTemplates(filters);
    
    // Fetch other data independently (don't block on failures)
    fetchCategories().catch(err => console.warn('Categories fetch failed:', err));
    fetchStats().catch(err => console.warn('Stats fetch failed:', err));
  };

  const handleCreateTemplate = async () => {
    setIsSaving(true);
    try {
      const result = await createTemplate(formData);
      if (result.success) {
        setShowCreateModal(false);
        resetForm();
        loadData();
      } else {
        setError(result.error || 'Failed to create template');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate?.id) return;
    setIsSaving(true);
    try {
      const result = await updateTemplate(selectedTemplate.id, formData);
      if (result.success) {
        setShowEditModal(false);
        setSelectedTemplate(null);
        loadData();
      } else {
        setError(result.error || 'Failed to update template');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    setIsDeleting(true);
    try {
      const result = await deleteTemplate(templateId);
      if (result.success) {
        loadData();
      } else {
        setError(result.error || 'Failed to delete template');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      slug: template.slug,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content || '',
      description: template.description || '',
      category: template.category,
      is_active: template.is_active
    });
    setShowEditModal(true);
  };

  const handlePreviewTemplate = (template) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      subject: '',
      html_content: '',
      text_content: '',
      description: '',
      category: 'general',
      is_active: true
    });
    setShowVariables(false);
    setShowPreviewInModal(false);
  };

  const getCategoryColor = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || '#6B7280';
  };

  const getCategoryIcon = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.icon || 'ri-mail-line';
  };

  if (loading && templates.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 md:p-12">
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 sm:h-10 md:h-12 w-8 sm:w-10 md:w-12 border-b-2 border-blue-600"></div>
              <span className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 text-center">
                Loading email templates...
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
                Email Templates
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed break-words">
                Manage email templates for the application
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
              <span>Create Template</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-mail-line text-white text-sm sm:text-base md:text-xl"></i>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total Templates</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-check-line text-white text-sm sm:text-base md:text-xl"></i>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Active Templates</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-folder-line text-white text-sm sm:text-base md:text-xl"></i>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Categories</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="ri-settings-line text-white text-sm sm:text-base md:text-xl"></i>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Management</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Ready</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                {categories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Status
              </label>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
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
                placeholder="Search templates..."
              />
            </div>
          </div>
        </div>

        {/* Templates Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Template
                  </th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Category
                  </th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">
                    Status
                  </th>
                  <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.length > 0 ? (
                  templates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{template.name}</div>
                          <div className="text-xs text-gray-500 truncate hidden sm:block">{template.slug}</div>
                          <div className="text-xs text-gray-400 mt-0.5 line-clamp-1 hidden md:block">{template.subject}</div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                          style={{ backgroundColor: `${getCategoryColor(template.category)}20`, color: getCategoryColor(template.category) }}
                        >
                          <i className={`${getCategoryIcon(template.category)} mr-1`}></i>
                          <span className="hidden sm:inline">{template.category}</span>
                          <span className="sm:hidden">{template.category.substring(0, 3)}</span>
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 hidden sm:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                          template.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => handlePreviewTemplate(template)}
                            className="text-blue-600 hover:text-blue-900 flex-shrink-0 p-1"
                            title="Preview"
                          >
                            <i className="ri-eye-line text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="text-green-600 hover:text-green-900 flex-shrink-0 p-1"
                            title="Edit"
                          >
                            <i className="ri-edit-line text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-900 flex-shrink-0 p-1 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <td colSpan={4} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                      <i className="ri-mail-line text-4xl sm:text-6xl text-gray-300 mb-3 sm:mb-4"></i>
                      <h3 className="text-sm sm:text-lg font-medium text-gray-900">No templates found</h3>
                      <p className="text-xs sm:text-base text-gray-500 mt-1">Create your first email template</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-xs xs:max-w-sm sm:max-w-2xl md:max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-3 xs:p-4 sm:p-6">
                <div className="flex items-start xs:items-center justify-between mb-4 xs:mb-6">
                  <h2 className="text-base xs:text-lg sm:text-xl font-semibold text-gray-900 leading-tight break-words pr-2">
                    {showEditModal ? 'Edit Email Template' : 'Create Email Template'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setShowVariables(false);
                      setShowPreviewInModal(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1"
                  >
                    <i className="ri-close-line text-lg xs:text-xl sm:text-2xl"></i>
                  </button>
                </div>

                <div className="space-y-4 xs:space-y-6">
                  {/* Tips Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 xs:p-4">
                    <div className="flex items-start gap-2">
                      <i className="ri-lightbulb-line text-blue-600 text-lg flex-shrink-0 mt-0.5"></i>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for Email Templates</h4>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• Use variables like {'{{userName}}'} for personalization</li>
                          <li>• Include both HTML and text versions for better email client compatibility</li>
                          <li>• Test your templates with different email clients</li>
                          <li>• Keep subject lines under 50 characters for better open rates</li>
                          <li>• Use clear call-to-action buttons and links</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                    <div>
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                        Template Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter template name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                        Slug
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="template-slug"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Email subject line"
                    />
                  </div>

                  <div>
                    <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Template description"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
                    <div>
                      <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {categories.map((category) => (
                          <option key={category.name} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center pt-4 sm:pt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-xs xs:text-sm text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1 xs:mb-2">
                      <label className="block text-xs xs:text-sm font-medium text-gray-700">
                        HTML Content
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowVariables(!showVariables)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <i className="ri-code-line"></i>
                          Show Variables
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPreviewInModal(!showPreviewInModal)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <i className="ri-eye-line"></i>
                          Show Preview
                        </button>
                      </div>
                    </div>
                    
                    {showVariables && (
                      <div className="mb-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                        <p className="font-medium text-gray-700 mb-1">Available Variables:</p>
                        <div className="flex flex-wrap gap-1">
                          <code className="px-2 py-0.5 bg-white border rounded">{'{{userName}}'}</code>
                          <code className="px-2 py-0.5 bg-white border rounded">{'{{userEmail}}'}</code>
                          <code className="px-2 py-0.5 bg-white border rounded">{'{{verificationUrl}}'}</code>
                          <code className="px-2 py-0.5 bg-white border rounded">{'{{verificationToken}}'}</code>
                          <code className="px-2 py-0.5 bg-white border rounded">{'{{resetUrl}}'}</code>
                          <code className="px-2 py-0.5 bg-white border rounded">{'{{orderNumber}}'}</code>
                        </div>
                      </div>
                    )}
                    
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <textarea
                        value={formData.html_content}
                        onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                        className="w-full px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={12}
                        placeholder="Write your email template HTML content..."
                      />
                    </div>
                    
                    {showPreviewInModal && formData.html_content && (
                      <div className="mt-2 p-3 border border-gray-300 rounded-lg bg-white">
                        <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: formData.html_content }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">
                      Text Content (Optional)
                    </label>
                    <textarea
                      value={formData.text_content}
                      onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                      className="w-full px-2 xs:px-3 py-1.5 xs:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={5}
                      placeholder="Plain text version of the email..."
                    />
                  </div>
                </div>

                <div className="mt-4 xs:mt-6 flex flex-col xs:flex-row justify-end gap-2 xs:gap-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setShowVariables(false);
                      setShowPreviewInModal(false);
                    }}
                    className="w-full xs:w-auto px-3 xs:px-4 py-2 xs:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs xs:text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={showEditModal ? handleUpdateTemplate : handleCreateTemplate}
                    disabled={isSaving}
                    className="w-full xs:w-auto px-3 xs:px-4 py-2 xs:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs xs:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving && <i className="ri-loader-4-line animate-spin"></i>}
                    {isSaving ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Preview: {selectedTemplate.name}</h3>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Subject:</p>
                  <p className="font-medium">{selectedTemplate.subject}</p>
                </div>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div dangerouslySetInnerHTML={{ __html: selectedTemplate.html_content }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailTemplateManagement;
