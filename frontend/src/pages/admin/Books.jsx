import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getImageUrl } from '../../lib/fileService';
import api from '../../lib/api';
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
import AuthorsManagement from '../../components/admin/AuthorsManagement';

const AdminBooks = () => {
  const [activeSection, setActiveSection] = useState('books');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Use custom hooks
  const bookManagement = useBookManagement();
  const { categories, fetchCategories } = useCategories();
  const { authors, fetchAuthors } = useAuthors();
  const { users, fetchUsers, assignBookToUser } = useUsers();
  
  const fetchBookDetails = async (bookId) => {
    try {
      const response = await api.get(`/admin/books/${bookId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch book details:', error);
      return null;
    }
  };
  
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
    setError,
    loadBooks
  } = bookManagement;
  
  // Consolidated state management
  const [data, setData] = useState({ categories: [], authors: [], users: [] });
  const [selection, setSelection] = useState({ books: [], users: [], bookForAction: null });
  const [modals, setModals] = useState({ 
    deleteConfirm: false, 
    assign: false, 
    analytics: false, 
    edit: false, 
    details: false, 
    batchUpdate: false, 
    bookAssign: false,
    assignConfirm: false 
  });
  const [loadingStates, setLoadingStates] = useState({ delete: false, assign: false, editLoading: false });
  const [forms, setForms] = useState({ 
    userSearch: '', 
    selectedFormat: 'ebook',
    bookToDelete: null,
    batchUpdate: { 
      status: '', 
      category_id: '', 
      price_adjustment: { value: '', type: 'percentage' } 
    }
  });
  const [errors, setErrors] = useState({});
  const [assignmentResult, setAssignmentResult] = useState(null);

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

  // Load categories and authors when edit modal opens
  useEffect(() => {
    if (modals.edit && (data.categories.length === 0 || data.authors.length === 0)) {
      loadAuthorsAndCategories();
    }
  }, [modals.edit, data.categories.length, data.authors.length]);

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
        setLoadingStates(prev => ({ ...prev, editLoading: true }));
        // Fetch full book details with IDs
        const fullBook = await fetchBookDetails(book.id);
        setLoadingStates(prev => ({ ...prev, editLoading: false }));
        if (fullBook) {
          setSelection(prev => ({ ...prev, bookForAction: fullBook }));
        } else {
          setSelection(prev => ({ ...prev, bookForAction: book }));
        }
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
        setSelection(prev => ({ ...prev, bookForAction: book, users: [] }));
        setModals(prev => ({ ...prev, bookAssign: true }));
        setErrors({});
        setAssignmentResult(null);
        setForms(prev => ({ ...prev, selectedFormat: 'ebook', userSearch: '' }));
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

          {loadingStates.editLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 shadow-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-700">Loading book details...</p>
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
                      editLoading={loadingStates.editLoading}
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
                <AuthorsManagement />
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
                      disabled={loadingStates.delete}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteBook}
                      disabled={loadingStates.delete}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loadingStates.delete && <i className="ri-loader-4-line animate-spin"></i>}
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
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      Update Books
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
                        src={getImageUrl(selection.bookForAction.cover_image_url || selection.bookForAction.cover_image)}
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
              loadBooks();
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
              loadBooks();
              setShowAddModal(false);
            }}
          />

          {/* Book Assign Modal */}
          {modals.bookAssign && selection.bookForAction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Assign Book to Users</h3>
                    <button
                      onClick={() => {
                        setModals(prev => ({ ...prev, bookAssign: false }));
                        setSelection(prev => ({ ...prev, users: [] }));
                        setErrors({});
                        setForms(prev => ({ ...prev, selectedFormat: 'ebook' }));
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <i className="ri-close-line text-2xl"></i>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Users *</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={forms.userSearch}
                          onChange={(e) => setForms(prev => ({ ...prev, userSearch: e.target.value }))}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.users ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Search and select users..."
                        />
                        {forms.userSearch && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {data.users
                              .filter(u => 
                                (u.name?.toLowerCase().includes(forms.userSearch.toLowerCase()) ||
                                u.email?.toLowerCase().includes(forms.userSearch.toLowerCase())) &&
                                !selection.users.find(su => su.id === u.id)
                              )
                              .map(user => (
                                <button
                                  key={user.id}
                                  onClick={() => {
                                    setSelection(prev => ({ 
                                      ...prev, 
                                      users: [...prev.users, user] 
                                    }));
                                    setForms(prev => ({ ...prev, userSearch: '' }));
                                    setErrors(prev => ({ ...prev, users: '' }));
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </button>
                              ))
                            }
                          </div>
                        )}
                      </div>
                      {errors.users && <p className="text-red-500 text-sm mt-1">{errors.users}</p>}
                      
                      {/* Selected Users */}
                      {selection.users.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Selected Users ({selection.users.length}):</p>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {selection.users.map(user => (
                              <div key={user.id} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                                <div>
                                  <span className="font-medium text-gray-900">{user.name}</span>
                                  <span className="text-sm text-gray-500 ml-2">({user.email})</span>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelection(prev => ({ 
                                      ...prev, 
                                      users: prev.users.filter(u => u.id !== user.id) 
                                    }));
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <i className="ri-close-line"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Format *</label>
                      <select
                        value={forms.selectedFormat}
                        onChange={(e) => {
                          setForms(prev => ({ ...prev, selectedFormat: e.target.value }));
                          setErrors(prev => ({ ...prev, format: '' }));
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.format ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="ebook">Ebook Only</option>
                        <option value="physical">Physical Only</option>
                      </select>
                      {errors.format && <p className="text-red-500 text-sm mt-1">{errors.format}</p>}
                    </div>

                    {/* Assignment Summary */}
                    {selection.users.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Assignment Summary</h4>
                        <p className="text-sm text-gray-600">
                          Book: <span className="font-medium">{selection.bookForAction.title}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Format: <span className="font-medium capitalize">{forms.selectedFormat}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Users: <span className="font-medium">{selection.users.length} selected</span>
                        </p>
                      </div>
                    )}

                    {/* Error Display */}
                    {errors.general && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-700 text-sm">{errors.general}</p>
                      </div>
                    )}

                    {/* Success Display */}
                    {assignmentResult && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-green-700 text-sm">{assignmentResult}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setModals(prev => ({ ...prev, bookAssign: false }));
                        setSelection(prev => ({ ...prev, users: [] }));
                        setErrors({});
                        setAssignmentResult(null);
                        setForms(prev => ({ ...prev, selectedFormat: 'ebook', userSearch: '' }));
                      }}
                      disabled={loadingStates.assign}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Validation
                        const newErrors = {};
                        if (selection.users.length === 0) {
                          newErrors.users = 'Please select at least one user';
                        }
                        if (!forms.selectedFormat) {
                          newErrors.format = 'Please select a format';
                        }
                        
                        if (Object.keys(newErrors).length > 0) {
                          setErrors(newErrors);
                          return;
                        }
                        
                        setModals(prev => ({ ...prev, assignConfirm: true }));
                      }}
                      disabled={selection.users.length === 0 || loadingStates.assign}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <i className="ri-user-add-line"></i>
                      Assign to {selection.users.length} User{selection.users.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assignment Confirmation Modal */}
          {modals.assignConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
                    <i className="ri-question-line text-2xl text-blue-600"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Confirm Assignment</h3>
                  <p className="text-gray-600 text-center mb-6">
                    Are you sure you want to assign "{selection.bookForAction?.title}" ({forms.selectedFormat}) to {selection.users.length} user{selection.users.length !== 1 ? 's' : ''}?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setModals(prev => ({ ...prev, assignConfirm: false }))}
                      disabled={loadingStates.assign}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        setLoadingStates(prev => ({ ...prev, assign: true }));
                        setErrors({});
                        setAssignmentResult(null);
                        
                        try {
                          let successCount = 0;
                          let failedUsers = [];
                          
                          for (const user of selection.users) {
                            try {
                              const result = await assignBookToUser(
                                user.id,
                                selection.bookForAction.id,
                                forms.selectedFormat
                              );
                              if (result.success) {
                                successCount++;
                              } else {
                                failedUsers.push(user.name);
                              }
                            } catch (error) {
                              failedUsers.push(user.name);
                            }
                          }
                          
                          setModals(prev => ({ ...prev, assignConfirm: false }));
                          
                          if (successCount === selection.users.length) {
                            setAssignmentResult(`Successfully assigned book to all ${successCount} users!`);
                            setTimeout(() => {
                              setModals(prev => ({ ...prev, bookAssign: false }));
                              setSelection(prev => ({ ...prev, users: [], bookForAction: null }));
                              setForms(prev => ({ ...prev, selectedFormat: 'ebook', userSearch: '' }));
                              setAssignmentResult(null);
                            }, 2000);
                          } else if (successCount > 0) {
                            setAssignmentResult(`Assigned to ${successCount} users. Failed for: ${failedUsers.join(', ')}`);
                          } else {
                            setErrors({ general: `Failed to assign book to any users. Please try again.` });
                          }
                        } catch (error) {
                          setErrors({ general: 'An unexpected error occurred. Please try again.' });
                          setModals(prev => ({ ...prev, assignConfirm: false }));
                        } finally {
                          setLoadingStates(prev => ({ ...prev, assign: false }));
                        }
                      }}
                      disabled={loadingStates.assign}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loadingStates.assign && <i className="ri-loader-4-line animate-spin"></i>}
                      {loadingStates.assign ? 'Assigning...' : 'Confirm Assignment'}
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
