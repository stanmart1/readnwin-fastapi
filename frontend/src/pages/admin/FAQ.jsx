import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import FAQList from './faq-management/components/FAQList';
import FAQForm from './faq-management/components/FAQForm';
import CategoryForm from './faq-management/components/CategoryForm';
import FAQStats from './faq-management/components/FAQStats';
import { useFAQManagement } from '../../hooks/useFAQManagement';

export default function FAQManagementPage() {
  const {
    faqs,
    categories,
    stats,
    loading,
    error,
    refetch,
    createFAQ,
    updateFAQ,
    deleteFAQ,
    bulkDeleteFAQs,
    bulkUpdateFAQs,
    createCategory,
    updateCategory
  } = useFAQManagement();

  const [showFAQForm, setShowFAQForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFAQs, setSelectedFAQs] = useState([]);

  const handleCreateFAQ = async (data) => {
    const result = await createFAQ(data);
    if (result.success) {
      setShowFAQForm(false);
    } else {
      alert(`Error creating FAQ: ${result.error}`);
    }
  };

  const handleUpdateFAQ = async (data) => {
    const result = await updateFAQ(data);
    if (result.success) {
      setShowFAQForm(false);
      setEditingFAQ(null);
    } else {
      alert(`Error updating FAQ: ${result.error}`);
    }
  };

  const handleDeleteFAQ = async (id) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    const result = await deleteFAQ(id);
    if (!result.success) {
      alert(`Error deleting FAQ: ${result.error}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFAQs.length === 0) {
      alert('Please select FAQs to delete');
      return;
    }
    if (!confirm(`Are you sure you want to delete ${selectedFAQs.length} FAQs?`)) return;
    const result = await bulkDeleteFAQs(selectedFAQs);
    if (result.success) {
      setSelectedFAQs([]);
    } else {
      alert(`Error deleting FAQs: ${result.error}`);
    }
  };

  const handleBulkToggleStatus = async (isActive) => {
    if (selectedFAQs.length === 0) {
      alert('Please select FAQs to update');
      return;
    }
    const result = await bulkUpdateFAQs(selectedFAQs, { is_active: isActive });
    if (result.success) {
      setSelectedFAQs([]);
    } else {
      alert(`Error updating FAQs: ${result.error}`);
    }
  };

  const handleCreateCategory = async (data) => {
    const result = await createCategory(data);
    if (result.success) {
      setShowCategoryForm(false);
    } else {
      alert(`Error creating category: ${result.error}`);
    }
  };

  const handleUpdateCategory = async (data) => {
    const result = await updateCategory(data);
    if (result.success) {
      setShowCategoryForm(false);
      setEditingCategory(null);
    } else {
      alert(`Error updating category: ${result.error}`);
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
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-4 sm:mb-8">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">FAQ Management</h1>
                <p className="mt-1 sm:mt-2 text-xs sm:text-base text-gray-600">Manage frequently asked questions and categories</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={refetch}
                  className="inline-flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto"
                >
                  <i className="ri-refresh-line mr-2"></i>
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">Refresh</span>
                </button>
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="inline-flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                >
                  <i className="ri-folder-add-line mr-2"></i>
                  <span>Add Category</span>
                </button>
                <button
                  onClick={() => setShowFAQForm(true)}
                  className="inline-flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  <i className="ri-add-line mr-2"></i>
                  <span>Add FAQ</span>
                </button>
              </div>
            </div>
          </div>

          <FAQStats stats={stats} />

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Search FAQs</label>
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Filter by Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <div className="text-xs sm:text-sm text-gray-600">
                  Showing {filteredFAQs.length} of {faqs.length}
                </div>
              </div>
            </div>
          </div>

          {selectedFAQs.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs sm:text-sm text-blue-800">{selectedFAQs.length} FAQ(s) selected</div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                  <button
                    onClick={() => handleBulkToggleStatus(true)}
                    className="inline-flex items-center justify-center px-3 py-1 border border-transparent text-xs sm:text-sm font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 w-full sm:w-auto"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleBulkToggleStatus(false)}
                    className="inline-flex items-center justify-center px-3 py-1 border border-transparent text-xs sm:text-sm font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 w-full sm:w-auto"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center justify-center px-3 py-1 border border-transparent text-xs sm:text-sm font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 w-full sm:w-auto"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          <FAQList
            faqs={filteredFAQs}
            categories={categories}
            selectedFAQs={selectedFAQs}
            onSelectFAQ={(id) => {
              setSelectedFAQs(prev => 
                prev.includes(id) ? prev.filter(faqId => faqId !== id) : [...prev, id]
              );
            }}
            onSelectAll={(ids) => setSelectedFAQs(ids)}
            onEditFAQ={(faq) => {
              setEditingFAQ(faq);
              setShowFAQForm(true);
            }}
            onDeleteFAQ={handleDeleteFAQ}
            onToggleStatus={async (id, isActive) => {
              const result = await updateFAQ({ id, is_active: isActive });
              if (!result.success) {
                alert(`Error updating FAQ: ${result.error}`);
              }
            }}
          />

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
    </AdminLayout>
  );
}
