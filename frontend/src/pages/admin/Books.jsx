import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/AdminLayout';
import { useBookManagement } from '../../hooks/useBookManagement';
import { useCategories } from '../../hooks/useCategories';
import { useAuthors } from '../../hooks/useAuthors';
import { useUsers } from '../../hooks/useUsers';
import BookFilters from '../../components/admin/BookFilters';
import BookTable from '../../components/admin/BookTable';
import BookEditModal from '../../components/admin/BookEditModal';
import BookAddModal from '../../components/admin/BookAddModal';
import LibraryManagement from '../../components/admin/LibraryManagement';
import CategoriesManagement from '../../components/admin/CategoriesManagement';

const AdminBooks = () => {
  const [activeSection, setActiveSection] = useState('books');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Use custom hooks
  const bookManagement = useBookManagement();
  const { categories, fetchCategories } = useCategories();
  const { authors, fetchAuthors } = useAuthors();
  const { users, fetchUsers, assignBookToUser } = useUsers();
  
  const {
    books,
    loading,
    error,
    filters,
    pagination,
    setFilters,
    setPagination,
    updateBook,
    deleteBooks,
    batchUpdateBooks,
    setError
  } = bookManagement;
  
  // Consolidated state management
  const [data, setData] = useState({ categories: [], authors: [], users: [] });
  const [selection, setSelection] = useState({ books: [], user: null, bookForAction: null });
  const [modals, setModals] = useState({ 
    deleteConfirm: false, 
    assign: false, 
    analytics: false, 
    edit: false, 
    details: false, 
    batchUpdate: false, 
    bookAssign: false 
  });
  const [loadingStates, setLoadingStates] = useState({ delete: false, assign: false });
  const [forms, setForms] = useState({ 
    userSearch: '', 
    selectedFormat: 'both',
    bookToDelete: null,
    batchUpdate: { 
      status: '', 
      category_id: '', 
      price_adjustment: { value: '', type: 'percentage' } 
    }
  });

  // Load authors and categories on mount
  useEffect(() => {
    loadAuthorsAndCategories();
  }, []);
  
  // Load users when assign modal opens
  useEffect(() => {
    if (modals.bookAssign) {
      loadUsers();
    }
  }, [modals.bookAssign]);

  const loadAuthorsAndCategories = async () => {
    await Promise.all([
      fetchCategories(),
      fetchAuthors()
    ]);
  };

  const loadUsers = async () => {
    await fetchUsers();
  };

  // Update data state when hooks update
  useEffect(() => {
    setData(prev => ({ ...prev, categories }));
  }, [categories]);

  useEffect(() => {
    setData(prev => ({ ...prev, authors }));
  }, [authors]);

  useEffect(() => {
    setData(prev => ({ ...prev, users }));
  }, [users]);

  const handleDeleteBook = async (bookId) => {
    setForms(prev => ({ ...prev, bookToDelete: bookId }));
    setModals(prev => ({ ...prev, deleteConfirm: true }));
  };

  const confirmDeleteBook = async () => {
    if (!forms.bookToDelete || loadingStates.delete) return;
    
    setLoadingStates(prev => ({ ...prev, delete: true }));
    const result = await deleteBooks([forms.bookToDelete]);
    if (result.success) {
      setModals(prev => ({ ...prev, deleteConfirm: false }));
      setForms(prev => ({ ...prev, bookToDelete: null }));
      setSelection(prev => ({ ...prev, books: prev.books.filter(id => id !== forms.bookToDelete) }));
    }
    setLoadingStates(prev => ({ ...prev, delete: false }));
  };

  const handleBulkDelete = async () => {
    if (selection.books.length === 0) {
      alert('Please select books to delete');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selection.books.length} selected books? This action cannot be undone.`)) {
      return;
    }
    
    const result = await deleteBooks(selection.books);
    if (result.success) {
      setSelection(prev => ({ ...prev, books: [] }));
    }
  };

  const handleBatchUpdate = async () => {
    if (selection.books.length === 0) {
      alert('Please select books to update');
      return;
    }

    const result = await batchUpdateBooks(selection.books, forms.batchUpdate);
    if (result.success) {
      setSelection(prev => ({ ...prev, books: [] }));
      setModals(prev => ({ ...prev, batchUpdate: false }));
      setForms(prev => ({ 
        ...prev, 
        batchUpdate: { status: '', category_id: '', price_adjustment: { value: '', type: 'percentage' } } 
      }));
    }
  };

  const handleBookAction = async (action, book) => {
    switch (action) {
      case 'toggleFeature':
        const result1 = await updateBook(book.id, { is_featured: !book.is_featured });
        if (result1.success) {
          alert(book.is_featured ? 'Book removed from featured' : 'Book added to featured');
        }
        break;
      case 'toggleStatus':
        const newStatus = book.status === 'published' ? 'draft' : 'published';
        const result2 = await updateBook(book.id, { status: newStatus });
        if (result2.success) {
          alert(`Book ${newStatus === 'published' ? 'activated' : 'deactivated'} successfully`);
        }
        break;
      case 'edit':
        setSelection(prev => ({ ...prev, bookForAction: book }));
        setModals(prev => ({ ...prev, edit: true }));
        break;
      case 'view':
        setSelection(prev => ({ ...prev, bookForAction: book }));
        setModals(prev => ({ ...prev, details: true }));
        break;
      case 'delete':
        handleDeleteBook(book.id);
        break;
      case 'assign':
        setSelection(prev => ({ ...prev, bookForAction: book }));
        setModals(prev => ({ ...prev, bookAssign: true }));
        break;
    }
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <i className="ri-error-warning-line text-red-600"></i>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-red-900">Failed to Load Books</h3>
                  <p className="text-sm text-red-700 mt-1">
                    {error instanceof Error ? error.message : 'An unknown error occurred'}
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Troubleshooting Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>Check if the database is running and accessible</li>
                  <li>Verify your environment variables are set correctly</li>
                  <li>Ensure you have the required permissions</li>
                  <li>Check the browser console for additional error details</li>
                </ol>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => { setError(null); }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight break-words">
              Book Management
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed break-words">
              Manage your digital library collection
            </p>
          </div>

          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 shadow-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-700">Loading books...</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex overflow-x-auto scrollbar-thin px-3 sm:px-4 md:px-6">
                {['books', 'library', 'categories', 'authors'].map((section) => (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={`flex-shrink-0 mr-3 sm:mr-4 md:mr-6 lg:mr-8 py-3 sm:py-4 px-2 border-b-2 font-medium text-sm sm:text-base capitalize whitespace-nowrap transition-colors duration-200 ${
                      activeSection === section
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {section}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeSection === 'books' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">All Books</h2>
                    <div className="flex items-center gap-3">
                      {selection.books.length > 0 && (
                        <>
                          <button
                            onClick={() => setModals(prev => ({ ...prev, batchUpdate: true }))}
                            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 flex items-center"
                          >
                            <i className="ri-edit-box-line mr-2"></i>
                            Batch Update ({selection.books.length})
                          </button>
                          <button
                            onClick={handleBulkDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-300 flex items-center"
                          >
                            <i className="ri-delete-bin-line mr-2"></i>
                            Delete ({selection.books.length})
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center"
                      >
                        <i className="ri-add-line mr-2"></i>
                        Add Book
                      </button>
                    </div>
                  </div>

                  <BookFilters
                    filters={filters}
                    categories={data.categories}
                    onFiltersChange={setFilters}
                  />

                  {books.length === 0 && !loading ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow-md">
                      <i className="ri-book-line text-6xl text-gray-300 mb-4"></i>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Books Found</h3>
                      <p className="text-gray-500">
                        {filters.search || filters.status || filters.category_id
                          ? 'Try adjusting your filters'
                          : 'Start by adding your first book'}
                      </p>
                    </div>
                  ) : (
                    <BookTable
                      books={books}
                      selectedBooks={selection.books}
                      onSelectionChange={(bookIds) => setSelection(prev => ({ ...prev, books: bookIds }))}
                      onBookAction={handleBookAction}
                    />
                  )}

                  {/* Pagination */}
                  {books.length > 0 && (
                    <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-4">
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                        <span className="font-medium">{pagination.total}</span> books
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
                </div>
              )}

              {activeSection === 'library' && (
                <LibraryManagement />
              )}

              {activeSection === 'categories' && (
                <CategoriesManagement />
              )}

              {activeSection === 'authors' && (
                <div className="text-center py-12">
                  <i className="ri-user-line text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">Authors management coming soon...</p>
                </div>
              )}
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {modals.deleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                    <i className="ri-error-warning-line text-2xl text-red-600"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Book</h3>
                  <p className="text-gray-600 text-center mb-6">
                    Are you sure you want to delete this book? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setModals(prev => ({ ...prev, deleteConfirm: false }))}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteBook}
                      disabled={loadingStates.delete}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {loadingStates.delete ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Batch Update Modal */}
          {modals.batchUpdate && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Batch Update Books</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={forms.batchUpdate.status}
                        onChange={(e) => setForms(prev => ({ 
                          ...prev, 
                          batchUpdate: { ...prev.batchUpdate, status: e.target.value } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Don't change</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={forms.batchUpdate.category_id}
                        onChange={(e) => setForms(prev => ({ 
                          ...prev, 
                          batchUpdate: { ...prev.batchUpdate, category_id: e.target.value } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Don't change</option>
                        {data.categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price Adjustment</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={forms.batchUpdate.price_adjustment.value}
                          onChange={(e) => setForms(prev => ({ 
                            ...prev, 
                            batchUpdate: { 
                              ...prev.batchUpdate, 
                              price_adjustment: { ...prev.batchUpdate.price_adjustment, value: e.target.value } 
                            } 
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                        <select
                          value={forms.batchUpdate.price_adjustment.type}
                          onChange={(e) => setForms(prev => ({ 
                            ...prev, 
                            batchUpdate: { 
                              ...prev.batchUpdate, 
                              price_adjustment: { ...prev.batchUpdate.price_adjustment, type: e.target.value } 
                            } 
                          }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="percentage">%</option>
                          <option value="fixed">₦</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setModals(prev => ({ ...prev, batchUpdate: false }))}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBatchUpdate}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Book Details Modal */}
          {modals.details && selection.bookForAction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Book Details</h3>
                    <button
                      onClick={() => setModals(prev => ({ ...prev, details: false }))}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <i className="ri-close-line text-2xl"></i>
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={selection.bookForAction.cover_image_url || '/placeholder-book.jpg'}
                        alt={selection.bookForAction.title}
                        className="w-32 h-48 object-cover rounded-lg shadow-md"
                      />
                      <div className="flex-1">
                        <h4 className="text-2xl font-bold text-gray-900 mb-2">{selection.bookForAction.title}</h4>
                        <p className="text-gray-600 mb-2">by {selection.bookForAction.author_name}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full text-white ${
                            selection.bookForAction.status === 'published' ? 'bg-green-500' :
                            selection.bookForAction.status === 'draft' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`}>
                            {selection.bookForAction.status}
                          </span>
                          {selection.bookForAction.is_featured && (
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-bold text-green-600">₦{selection.bookForAction.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <span className="text-sm text-gray-500">Category</span>
                        <p className="font-medium text-gray-900">{selection.bookForAction.category_name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Format</span>
                        <p className="font-medium text-gray-900">{selection.bookForAction.format}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Stock</span>
                        <p className="font-medium text-gray-900">{selection.bookForAction.stock_quantity}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Created</span>
                        <p className="font-medium text-gray-900">
                          {new Date(selection.bookForAction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {selection.bookForAction.description && (
                      <div className="pt-4 border-t">
                        <span className="text-sm text-gray-500">Description</span>
                        <p className="mt-1 text-gray-900">{selection.bookForAction.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Book Edit Modal */}
          <BookEditModal
            isOpen={modals.edit}
            onClose={() => setModals(prev => ({ ...prev, edit: false }))}
            book={selection.bookForAction}
            categories={data.categories}
            authors={data.authors}
            onSuccess={() => {
              setModals(prev => ({ ...prev, edit: false }));
              setSelection(prev => ({ ...prev, bookForAction: null }));
            }}
          />

          {/* Book Add Modal */}
          <BookAddModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            categories={data.categories}
            authors={data.authors}
            onSuccess={() => {
              setShowAddModal(false);
            }}
          />

          {/* Book Assign Modal */}
          {modals.bookAssign && selection.bookForAction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Assign Book to User</h3>
                    <button
                      onClick={() => setModals(prev => ({ ...prev, bookAssign: false }))}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <i className="ri-close-line text-2xl"></i>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search User</label>
                      <input
                        type="text"
                        value={forms.userSearch}
                        onChange={(e) => setForms(prev => ({ ...prev, userSearch: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Search by name or email..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                      <select
                        value={selection.user?.id || ''}
                        onChange={(e) => {
                          const user = data.users.find(u => u.id === parseInt(e.target.value));
                          setSelection(prev => ({ ...prev, user }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a user</option>
                        {data.users
                          .filter(u => 
                            !forms.userSearch || 
                            u.name?.toLowerCase().includes(forms.userSearch.toLowerCase()) ||
                            u.email?.toLowerCase().includes(forms.userSearch.toLowerCase())
                          )
                          .map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                      <select
                        value={forms.selectedFormat}
                        onChange={(e) => setForms(prev => ({ ...prev, selectedFormat: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="both">Both (Ebook & Physical)</option>
                        <option value="ebook">Ebook Only</option>
                        <option value="physical">Physical Only</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setModals(prev => ({ ...prev, bookAssign: false }))}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!selection.user || !selection.bookForAction) return;
                        
                        setLoadingStates(prev => ({ ...prev, assign: true }));
                        
                        const formats = forms.selectedFormat === 'both' 
                          ? ['ebook', 'physical'] 
                          : [forms.selectedFormat];
                        
                        let successCount = 0;
                        for (const format of formats) {
                          const result = await assignBookToUser(
                            selection.user.id,
                            selection.bookForAction.id,
                            format
                          );
                          if (result.success) successCount++;
                        }
                        
                        setLoadingStates(prev => ({ ...prev, assign: false }));
                        
                        if (successCount > 0) {
                          alert(`Book assigned successfully (${successCount} format${successCount > 1 ? 's' : ''})`);
                          setModals(prev => ({ ...prev, bookAssign: false }));
                          setSelection(prev => ({ ...prev, user: null, bookForAction: null }));
                          setForms(prev => ({ ...prev, userSearch: '', selectedFormat: 'both' }));
                        } else {
                          alert('Failed to assign book');
                        }
                      }}
                      disabled={!selection.user || loadingStates.assign}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loadingStates.assign ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBooks;
