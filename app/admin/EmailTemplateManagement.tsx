'use client';

import { useState, useEffect } from 'react';
import EmailTemplateEditor from '@/components/EmailTemplateEditor';
import TestMailModal from '@/components/TestMailModal';
import { adminApi, handleApiError } from './utils/api';

interface EmailTemplate {
  id?: number;
  name: string;
  slug: string;
  subject: string;
  html_content: string;
  text_content?: string;
  description?: string;
  variables?: Record<string, any>;
  is_active: boolean;
  category: string;
  created_at?: string;
  updated_at?: string;
}

interface EmailFunction {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  category: string;
  required_variables: string[];
  is_active: boolean;
  created_at?: string;
}

interface EmailFunctionAssignment {
  id?: number;
  function_id: number;
  template_id: number;
  is_active: boolean;
  priority: number;
  created_at?: string;
  updated_at?: string;
  function_name?: string;
  function_slug?: string;
  template_name?: string;
  template_slug?: string;
}

interface EmailTemplateCategory {
  id?: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
}

export default function EmailTemplateManagement() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [categories, setCategories] = useState<EmailTemplateCategory[]>([]);
  const [emailFunctions, setEmailFunctions] = useState<EmailFunction[]>([]);
  const [assignments, setAssignments] = useState<EmailFunctionAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
  const [showTestMailModal, setShowTestMailModal] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    isActive: '',
    search: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    byCategory: {} as Record<string, number>
  });

  // Form state for create/edit
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

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
    fetchEmailFunctions();
    fetchAssignments();
    fetchStats();
  }, [filters]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.isActive) params.append('is_active', filters.isActive);
      if (filters.search) params.append('search', filters.search);

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-templates?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (response.ok) {
        setTemplates(data.templates || []);
      } else {
        setError(data.detail || 'Failed to fetch templates');
      }
    } catch (error) {
      setError('Error fetching templates');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchEmailFunctions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-functions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        setEmailFunctions(data.functions || []);
      }
    } catch (error) {
      console.error('Error fetching email functions:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats || { total: 0, active: 0, byCategory: {} });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        setShowCreateModal(false);
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
        fetchTemplates();
        fetchStats();
      } else {
        setError(data.detail || 'Failed to create template');
      }
    } catch (error) {
      setError('Error creating template');
      console.error('Error:', error);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate?.id) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        setShowEditModal(false);
        setSelectedTemplate(null);
        fetchTemplates();
      } else {
        setError(data.detail || 'Failed to update template');
      }
    } catch (error) {
      setError('Error updating template');
      console.error('Error:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok) {
        fetchTemplates();
        fetchStats();
      } else {
        setError(data.detail || 'Failed to delete template');
      }
    } catch (error) {
      setError('Error deleting template');
      console.error('Error:', error);
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
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

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  const handleAssignTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowAssignmentsModal(true);
  };

  const handleTestMail = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowTestMailModal(true);
  };

  const handleAssignTemplateToFunction = async (functionId: number, priority: number = 1) => {
    if (!selectedTemplate?.id) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-templates/assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          functionId,
          templateId: selectedTemplate.id,
          priority
        })
      });

      const data = await response.json();
      if (response.ok) {
        fetchAssignments();
        setError('');
      } else {
        setError(data.detail || 'Failed to assign template');
      }
    } catch (error) {
      setError('Error assigning template');
      console.error('Error:', error);
    }
  };

  const handleUnassignTemplate = async (functionId: number, templateId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-templates/assignments?function_id=${functionId}&template_id=${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok) {
        fetchAssignments();
        setError('');
      } else {
        setError(data.detail || 'Failed to unassign template');
      }
    } catch (error) {
      setError('Error unassigning template');
      console.error('Error:', error);
    }
  };

  const handleUpdateAssignmentPriority = async (assignmentId: number, priority: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-templates/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priority })
      });

      const data = await response.json();
      if (response.ok) {
        fetchAssignments();
        setError('');
      } else {
        setError(data.detail || 'Failed to update priority');
      }
    } catch (error) {
      setError('Error updating priority');
      console.error('Error:', error);
    }
  };

  const handleToggleAssignmentStatus = async (assignmentId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email-templates/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok) {
        fetchAssignments();
        setError('');
      } else {
        setError(data.detail || 'Failed to toggle status');
      }
    } catch (error) {
      setError('Error toggling status');
      console.error('Error:', error);
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.color || '#6B7280';
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category?.icon || 'ri-mail-line';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading email templates...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <i className="ri-error-warning-line text-red-400 text-xl"></i>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Email Templates</h2>
            <p className="text-gray-600 mt-1">Manage email templates for the application</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105"
          >
            <i className="ri-add-line mr-2"></i>
            Create Template
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i className="ri-mail-line text-white text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <i className="ri-check-line text-white text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Templates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <i className="ri-folder-line text-white text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <i className="ri-settings-line text-white text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Management</p>
              <p className="text-2xl font-bold text-gray-900">Ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.name} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({...filters, isActive: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search templates..."
            />
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-500">{template.slug}</div>
                      {template.description && (
                        <div className="text-xs text-gray-400 mt-1">{template.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
                        style={{ backgroundColor: getCategoryColor(template.category) }}
                      >
                        <i className={`${getCategoryIcon(template.category)} text-white text-sm`}></i>
                      </div>
                      <span className="text-sm text-gray-900 capitalize">{template.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      template.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {template.updated_at ? new Date(template.updated_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePreviewTemplate(template)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        title="Preview template"
                      >
                        <i className="ri-eye-line"></i>
                      </button>
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                        title="Edit template"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        onClick={() => handleAssignTemplate(template)}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        title="Assign to functions"
                      >
                        <i className="ri-link"></i>
                      </button>
                      <button
                        onClick={() => handleTestMail(template)}
                        className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                        title="Send test email"
                      >
                        <i className="ri-send-plane-line"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id!)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        title="Delete template"
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
      </div>

      {templates.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <i className="ri-mail-line text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">No email templates found</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Your First Template
          </button>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <TemplateModal
          title="Create Email Template"
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          onSubmit={handleCreateTemplate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Template Modal */}
      {showEditModal && selectedTemplate && (
        <TemplateModal
          title="Edit Email Template"
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          onSubmit={handleUpdateTemplate}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Preview Template Modal */}
      {showPreviewModal && selectedTemplate && (
        <PreviewModal
          template={selectedTemplate}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {/* Assignments Modal */}
      {showAssignmentsModal && selectedTemplate && (
        <AssignmentsModal
          template={selectedTemplate}
          emailFunctions={emailFunctions}
          assignments={assignments}
          onAssign={handleAssignTemplateToFunction}
          onUnassign={handleUnassignTemplate}
          onUpdatePriority={handleUpdateAssignmentPriority}
          onToggleStatus={handleToggleAssignmentStatus}
          onClose={() => setShowAssignmentsModal(false)}
        />
      )}

      {/* Test Mail Modal */}
      {showTestMailModal && selectedTemplate && (
        <TestMailModal
          template={selectedTemplate}
          onClose={() => setShowTestMailModal(false)}
        />
      )}
    </div>
  );
}

// Template Modal Component
function TemplateModal({ 
  title, 
  formData, 
  setFormData, 
  categories, 
  onSubmit, 
  onClose 
}: {
  title: string;
  formData: any;
  setFormData: (data: any) => void;
  categories: EmailTemplateCategory[];
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="template-slug"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email subject line"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Template description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HTML Content</label>
              <EmailTemplateEditor
                value={formData.html_content}
                onChange={(value) => setFormData({...formData, html_content: value})}
                placeholder="Write your email template HTML content..."
                variables={['{{userName}}', '{{userEmail}}', '{{verificationToken}}', '{{verificationUrl}}']}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Content (Optional)</label>
              <textarea
                value={formData.text_content}
                onChange={(e) => setFormData({...formData, text_content: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                placeholder="Plain text version of the email..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Preview Modal Component
function PreviewModal({ template, onClose }: { template: EmailTemplate; onClose: () => void }) {
  const [previewData, setPreviewData] = useState({
    userName: 'John Doe',
    userEmail: 'john.doe@example.com',
    verificationToken: 'abc123def456',
    verificationUrl: 'https://readnwin.com/verify?token=abc123def456',
    resetToken: 'reset123token456',
    resetUrl: 'https://readnwin.com/reset?token=reset123token456',
                orderNumber: 'ORD-2025-001',
    orderTotal: '$29.99',
    trackingNumber: 'TRK123456789',
                estimatedDelivery: '2025-01-15'
  });

  const renderPreview = () => {
    let content = template.html_content;
    Object.entries(previewData).forEach(([key, value]) => {
      const variable = `{{${key}}}`;
      content = content.replace(new RegExp(variable, 'g'), value);
    });
    return content;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Preview: {template.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Preview Data */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Preview Variables</h3>
                <div className="space-y-3">
                  {Object.entries(previewData).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {key}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setPreviewData(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Email Preview */}
            <div className="lg:col-span-2">
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-300">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">Email Preview</h3>
                    <div className="text-xs text-gray-500">
                      Subject: {template.subject}
                    </div>
                  </div>
                </div>
                <div className="bg-white">
                  <div 
                    className="p-4"
                    dangerouslySetInnerHTML={{ __html: renderPreview() }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Assignments Modal Component
function AssignmentsModal({ 
  template, 
  emailFunctions, 
  assignments, 
  onAssign, 
  onUnassign, 
  onUpdatePriority, 
  onToggleStatus, 
  onClose 
}: {
  template: EmailTemplate;
  emailFunctions: EmailFunction[];
  assignments: EmailFunctionAssignment[];
  onAssign: (functionId: number, priority: number) => void;
  onUnassign: (functionId: number, templateId: number) => void;
  onUpdatePriority: (assignmentId: number, priority: number) => void;
  onToggleStatus: (assignmentId: number) => void;
  onClose: () => void;
}) {
  const [selectedFunction, setSelectedFunction] = useState<number | ''>('');
  const [priority, setPriority] = useState(1);

  const templateAssignments = assignments.filter(a => a.template_id === template.id);
  const availableFunctions = emailFunctions.filter(f => 
    !templateAssignments.some(a => a.function_id === f.id)
  );

  const handleAssign = () => {
    if (selectedFunction && typeof selectedFunction === 'number') {
      onAssign(selectedFunction, priority);
      setSelectedFunction('');
      setPriority(1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Assign Template: {template.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage which email functions use this template
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {/* Assignment Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <i className="ri-link text-blue-600"></i>
                  <span className="text-sm font-medium text-gray-900">Current Assignments:</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {templateAssignments.length} assigned
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {templateAssignments.filter(a => a.is_active).length} active
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {availableFunctions.length} available
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">
                  Template: <code className="bg-white px-1 py-0.5 rounded text-xs">{template.slug}</code>
                </p>
                <p className="text-xs text-gray-600">
                  Category: <span className="capitalize">{template.category}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Assignments */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <i className="ri-check-double-line text-green-600 mr-2"></i>
                  Current Assignments
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {templateAssignments.length} assigned
                </span>
              </div>
              
              {templateAssignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <i className="ri-link text-4xl mb-2 text-gray-400"></i>
                  <p className="text-gray-600">No functions assigned yet</p>
                  <p className="text-sm text-gray-500 mt-1">This template is not being used by any email functions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templateAssignments.map((assignment) => (
                    <div key={assignment.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <h4 className="font-semibold text-gray-900">
                              {assignment.function_name}
                            </h4>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              assignment.is_active 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {assignment.is_active ? '✓ Active' : '✗ Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{assignment.function_slug}</code>
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-600">
                            <span className="flex items-center">
                              <i className="ri-sort-asc mr-1"></i>
                              Priority: <strong className="ml-1">{assignment.priority}</strong>
                            </span>
                            <span className="flex items-center">
                              <i className="ri-time-line mr-1"></i>
                              Assigned: {new Date(assignment.created_at || '').toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => onToggleStatus(assignment.id!)}
                            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                              assignment.is_active
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                            }`}
                            title={assignment.is_active ? 'Disable this assignment' : 'Enable this assignment'}
                          >
                            {assignment.is_active ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => onUnassign(assignment.function_id, assignment.template_id)}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 border border-red-200 font-medium transition-colors"
                            title="Remove this assignment"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Update Priority
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            value={assignment.priority}
                            onChange={(e) => onUpdatePriority(assignment.id!, parseInt(e.target.value))}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-500">
                            (Lower = Higher Priority)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assign to Function */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <i className="ri-add-line text-blue-600 mr-2"></i>
                Assign to Function
              </h3>
              {availableFunctions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <i className="ri-check-line text-4xl mb-2 text-gray-400"></i>
                  <p className="text-gray-600">All functions are already assigned</p>
                  <p className="text-sm text-gray-500 mt-1">This template is assigned to all available email functions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Function
                    </label>
                    <select
                      value={selectedFunction}
                      onChange={(e) => setSelectedFunction(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a function...</option>
                      {availableFunctions.map((func) => (
                        <option key={func.id} value={func.id}>
                          {func.name} ({func.slug})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedFunction && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority (lower number = higher priority)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={priority}
                        onChange={(e) => setPriority(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {selectedFunction && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">Function Details</h4>
                      {(() => {
                        const func = emailFunctions.find(f => f.id === selectedFunction);
                        return func ? (
                          <div className="text-sm text-blue-800">
                            <p><strong>Description:</strong> {func.description}</p>
                            <p><strong>Category:</strong> {func.category}</p>
                            <p><strong>Required Variables:</strong></p>
                            <ul className="list-disc list-inside ml-2">
                              {func.required_variables.map((variable, index) => (
                                <li key={index}>{variable}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  <button
                    onClick={handleAssign}
                    disabled={!selectedFunction}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Assign Template
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}