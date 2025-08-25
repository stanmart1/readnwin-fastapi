'use client';

import { useState, useEffect } from 'react';
import { FAQWithCategory, FAQCategory, CreateFAQRequest, UpdateFAQRequest } from '@/types/faq';
import FAQList from './components/FAQList';
import FAQForm from './components/FAQForm';
import CategoryForm from './components/CategoryForm';
import FAQStats from './components/FAQStats';
import { RiAddLine, RiFolderAddLine, RiRefreshLine, RiSearchLine } from 'react-icons/ri';

export default function FAQManagementPage() {
  const [faqs, setFaqs] = useState<FAQWithCategory[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showFAQForm, setShowFAQForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQWithCategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFAQs, setSelectedFAQs] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch FAQs
      const faqResponse = await fetch('/api/faq');
      const faqData = await faqResponse.json();
      if (faqData.success) {
        setFaqs(faqData.data.faqs);
      }

      // Fetch categories
      const categoryResponse = await fetch('/api/faq/categories');
      const categoryData = await categoryResponse.json();
      if (categoryData.success) {
        setCategories(categoryData.data);
      }

      // Fetch stats (you can implement this API later)
      setStats({
        total_faqs: faqData.data?.total || 0,
        total_categories: categoryData.data?.length || 0,
        total_views: 0,
        recent_faqs: faqData.data?.faqs?.slice(0, 5) || []
      });

    } catch (error) {
      console.error('Error fetching FAQ data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFAQ = async (data: CreateFAQRequest) => {
    try {
      const response = await fetch('/api/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setShowFAQForm(false);
        fetchData();
      } else {
        const error = await response.json();
        alert(`Error creating FAQ: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating FAQ:', error);
      alert('Error creating FAQ');
    }
  };

  const handleUpdateFAQ = async (data: UpdateFAQRequest) => {
    try {
      const response = await fetch(`/api/faq/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setShowFAQForm(false);
        setEditingFAQ(null);
        fetchData();
      } else {
        const error = await response.json();
        alert(`Error updating FAQ: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating FAQ:', error);
      alert('Error updating FAQ');
    }
  };

  const handleDeleteFAQ = async (id: number) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const response = await fetch(`/api/faq/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
      } else {
        const error = await response.json();
        alert(`Error deleting FAQ: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      alert('Error deleting FAQ');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFAQs.length === 0) {
      alert('Please select FAQs to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedFAQs.length} FAQs?`)) return;

    try {
      const response = await fetch('/api/faq/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedFAQs })
      });

      if (response.ok) {
        setSelectedFAQs([]);
        fetchData();
      } else {
        const error = await response.json();
        alert(`Error deleting FAQs: ${error.error}`);
      }
    } catch (error) {
      console.error('Error bulk deleting FAQs:', error);
      alert('Error deleting FAQs');
    }
  };

  const handleBulkToggleStatus = async (isActive: boolean) => {
    if (selectedFAQs.length === 0) {
      alert('Please select FAQs to update');
      return;
    }

    try {
      const response = await fetch('/api/faq/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ids: selectedFAQs, 
          updates: { is_active: isActive } 
        })
      });

      if (response.ok) {
        setSelectedFAQs([]);
        fetchData();
      } else {
        const error = await response.json();
        alert(`Error updating FAQs: ${error.error}`);
      }
    } catch (error) {
      console.error('Error bulk updating FAQs:', error);
      alert('Error updating FAQs');
    }
  };

  const handleCreateCategory = async (data: any) => {
    try {
      const response = await fetch('/api/faq/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setShowCategoryForm(false);
        fetchData();
      } else {
        const error = await response.json();
        alert(`Error creating category: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error creating category');
    }
  };

  const handleUpdateCategory = async (data: any) => {
    try {
      const response = await fetch(`/api/faq/categories/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setShowCategoryForm(false);
        setEditingCategory(null);
        fetchData();
      } else {
        const error = await response.json();
        alert(`Error updating category: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Error updating category');
    }
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FAQ Management</h1>
              <p className="mt-2 text-gray-600">Manage frequently asked questions and categories</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RiRefreshLine className="mr-2 h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={() => setShowCategoryForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <RiFolderAddLine className="mr-2 h-4 w-4" />
                Add Category
              </button>
              <button
                onClick={() => setShowFAQForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RiAddLine className="mr-2 h-4 w-4" />
                Add FAQ
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <FAQStats stats={stats} />

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search FAQs
              </label>
              <div className="relative">
                <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search questions or answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {filteredFAQs.length} of {faqs.length} FAQs
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedFAQs.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                {selectedFAQs.length} FAQ(s) selected
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkToggleStatus(true)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkToggleStatus(false)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Deactivate
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ List */}
        <FAQList
          faqs={filteredFAQs}
          categories={categories}
          selectedFAQs={selectedFAQs}
          onSelectFAQ={(id) => {
            setSelectedFAQs(prev => 
              prev.includes(id) 
                ? prev.filter(faqId => faqId !== id)
                : [...prev, id]
            );
          }}
          onSelectAll={(ids) => setSelectedFAQs(ids)}
          onEditFAQ={(faq) => {
            setEditingFAQ(faq);
            setShowFAQForm(true);
          }}
          onDeleteFAQ={handleDeleteFAQ}
          onToggleStatus={async (id, isActive) => {
            try {
              const response = await fetch(`/api/faq/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_active: isActive })
              });

              if (response.ok) {
                fetchData();
              } else {
                const error = await response.json();
                alert(`Error updating FAQ: ${error.error}`);
              }
            } catch (error) {
              console.error('Error updating FAQ status:', error);
              alert('Error updating FAQ status');
            }
          }}
        />

        {/* Forms */}
        {showFAQForm && (
          <FAQForm
            faq={editingFAQ}
            categories={categories}
            onSubmit={editingFAQ ? handleUpdateFAQ : handleCreateFAQ}
            onCancel={() => {
              setShowFAQForm(false);
              setEditingFAQ(null);
            }}
          />
        )}

        {showCategoryForm && (
          <CategoryForm
            category={editingCategory}
            onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
            onCancel={() => {
              setShowCategoryForm(false);
              setEditingCategory(null);
            }}
          />
        )}
      </div>
    </div>
  );
} 