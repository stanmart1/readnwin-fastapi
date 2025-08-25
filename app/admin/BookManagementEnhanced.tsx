'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import BulkLibraryManagement from './BulkLibraryManagement';
import Pagination from '@/components/Pagination';
import { useEnhancedError, useAsyncOperation, useFormError } from '@/hooks/useEnhancedError';
import { useLoadingState, useSkeletonLoading } from '@/hooks/useLoadingState';
import { EnhancedErrorDisplay } from '@/components/ui/EnhancedErrorDisplay';
import { LoadingSpinner, SkeletonLoader, CardSkeleton, TableSkeleton } from '@/components/ui/LoadingSpinner';

interface Book {
  id: number;
  title: string;
  author_name: string;
  category_name: string;
  price: number;
  status: string;
  stock_quantity: number;
  is_featured: boolean;
  cover_image_url: string;
  format: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  book_count: number;
}

interface Author {
  id: number;
  name: string;
  email: string;
  books_count: number;
  total_sales: number;
  revenue: number;
  status: string;
  avatar_url: string;
  created_at: string;
}

export default function BookManagementEnhanced() {
  const [activeSection, setActiveSection] = useState('books');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('book');
  const [bookType, setBookType] = useState('ebook');
  
  // Enhanced error handling
  const { error, setError, clearError, retryAction, setRetryAction } = useEnhancedError();
  const { fieldErrors, generalError, setFieldError, setGeneralError, clearAllErrors, hasErrors } = useFormError();
  
  // Enhanced loading states
  const { loadingState, startLoading, stopLoading, updateProgress } = useLoadingState();
  const { isLoading: skeletonLoading, startSkeleton, stopSkeleton } = useSkeletonLoading();
  
  // Async operations with enhanced error handling
  const loadBooksOperation = useAsyncOperation(
    async (page = 1, limit = 20, search = '', status = '', category_id?: number) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status
      });
      if (category_id) params.append('category_id', category_id.toString());
      
      const response = await Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to load books');
      }
      return response.json();
    },
    'BookManagement'
  );

  const createBookOperation = useAsyncOperation(
    async (formData: FormData) => {
      const response = await fetch('/api/admin/books', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to create book');
      }
      return response.json();
    },
    'BookCreation'
  );

  const deleteBookOperation = useAsyncOperation(
    async (bookIds: number[]) => {
      const params = new URLSearchParams({
        ids: bookIds.join(',')
      });
      
      const response = await fetch(`/api/admin/books?${params}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to delete books');
      }
      return response.json();
    },
    'BookDeletion'
  );

  // State management
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category_id: undefined as number | undefined
  });
  const [selectedBooks, setSelectedBooks] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<number | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    author_id: '',
    category_id: '',
    price: '',
    isbn: '',
    description: '',
    language: 'English',
    pages: '',
    publication_date: '',
    publisher: '',
    format: 'ebook',
    stock_quantity: '',
    cover_image: null as File | null,
    ebook_file: null as File | null
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      startLoading('Loading books...', 'spinner');
      updateProgress(25, 'Fetching books...');
      
      const result = await loadBooksOperation.execute(
        pagination.page,
        pagination.limit,
        filters.search,
        filters.status,
        filters.category_id
      );
      
      updateProgress(75, 'Processing data...');
      
      setBooks(result.books);
      setPagination({
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        pages: result.pagination.pages
      });
      
      updateProgress(100, 'Completed');
      setTimeout(() => stopLoading(), 500);
      
    } catch (error) {
      setError(error, 'loadData');
      stopLoading();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAllErrors();
    
    // Validate form
    const validationErrors: Record<string, string> = {};
    if (!formData.title.trim()) validationErrors.title = 'Title is required';
    if (!formData.author_id) validationErrors.author_id = 'Author is required';
    if (!formData.category_id) validationErrors.category_id = 'Category is required';
    if (!formData.price) validationErrors.price = 'Price is required';
    if (!formData.cover_image) validationErrors.cover_image = 'Cover image is required';
    
    if (Object.keys(validationErrors).length > 0) {
      Object.entries(validationErrors).forEach(([field, message]) => {
        setFieldError(field, message);
      });
      return;
    }

    try {
      startLoading('Creating book...', 'progress');
      updateProgress(25, 'Validating data...');
      
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          submitData.append(key, value.toString());
        }
      });
      
      updateProgress(50, 'Uploading files...');
      
      const result = await createBookOperation.execute(submitData);
      
      updateProgress(100, 'Book created successfully');
      setTimeout(() => {
        stopLoading();
        setShowAddModal(false);
        loadData();
        toast.success('Book created successfully!');
      }, 1000);
      
    } catch (error) {
      setGeneralError(error);
      stopLoading();
    }
  };

  const handleDeleteBook = async (bookId: number) => {
    setBookToDelete(bookId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteBook = async () => {
    if (!bookToDelete) return;
    
    try {
      startLoading('Deleting book...', 'spinner');
      
      await deleteBookOperation.execute([bookToDelete]);
      
      stopLoading();
      setShowDeleteConfirm(false);
      setBookToDelete(null);
      loadData();
      toast.success('Book deleted successfully!');
      
    } catch (error) {
      setError(error, 'deleteBook');
      stopLoading();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBooks.length === 0) {
      toast.error('Please select books to delete');
      return;
    }
    
    try {
      startLoading(`Deleting ${selectedBooks.length} books...`, 'progress');
      updateProgress(25, 'Preparing deletion...');
      
      const result = await deleteBookOperation.execute(selectedBooks);
      
      updateProgress(100, 'Books deleted successfully');
      setTimeout(() => {
        stopLoading();
        setSelectedBooks([]);
        loadData();
        toast.success(`Successfully deleted ${result.deleted_count} books`);
      }, 1000);
      
    } catch (error) {
      setError(error, 'bulkDelete');
      stopLoading();
    }
  };

  const handleRetry = () => {
    clearError();
    if (retryAction) {
      retryAction();
    } else {
      loadData();
    }
  };

  // Render loading states
  if (loadingState.isLoading && loadingState.type === 'overlay') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="xl" text={loadingState.message} variant="dots" />
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <EnhancedErrorDisplay
            error={error}
            onRetry={handleRetry}
            onDismiss={clearError}
            className="mb-6"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book Management</h1>
          <p className="mt-2 text-gray-600">Manage your digital library collection</p>
        </div>

        {/* Error Display */}
        {generalError && (
          <div className="mb-6">
            <EnhancedErrorDisplay
              error={generalError}
              onRetry={() => {
                clearAllErrors();
                handleSubmit(new Event('submit') as any);
              }}
              onDismiss={() => setGeneralError(null)}
            />
          </div>
        )}

        {/* Loading Overlay */}
        {loadingState.isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <LoadingSpinner 
                size="lg" 
                text={loadingState.message} 
                variant={loadingState.type === 'progress' ? 'bars' : 'spinner'}
              />
              {loadingState.progress !== undefined && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${loadingState.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{Math.round(loadingState.progress)}%</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {['books', 'categories', 'authors'].map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeSection === section
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeSection === 'books' && (
              <div>
                {/* Actions */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Add Book
                    </button>
                    {selectedBooks.length > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                      >
                        Delete Selected ({selectedBooks.length})
                      </button>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      placeholder="Search books..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="border border-gray-300 rounded-md px-3 py-2"
                    />
                    <button
                      onClick={loadData}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                    >
                      Search
                    </button>
                  </div>
                </div>

                {/* Books Table */}
                {skeletonLoading ? (
                  <TableSkeleton rows={5} columns={6} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectedBooks.length === books.length && books.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBooks(books.map(b => b.id));
                                } else {
                                  setSelectedBooks([]);
                                }
                              }}
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Book
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Author
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {books.map((book) => (
                          <tr key={book.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedBooks.includes(book.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBooks(prev => [...prev, book.id]);
                                  } else {
                                    setSelectedBooks(prev => prev.filter(id => id !== book.id));
                                  }
                                }}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  <img
                                    className="h-10 w-10 rounded object-cover"
                                    src={book.cover_image_url || '/placeholder-book.png'}
                                    alt={book.title}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{book.title}</div>
                                  <div className="text-sm text-gray-500">{book.format}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {book.author_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {book.category_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${book.price}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                book.status === 'published' ? 'bg-green-100 text-green-800' :
                                book.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {book.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleDeleteBook(book.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.pages}
                      totalItems={pagination.total}
                      itemsPerPage={pagination.limit}
                      onPageChange={(page) => {
                        setPagination(prev => ({ ...prev, page }));
                        loadData();
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {activeSection === 'categories' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Categories</h3>
                {skeletonLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <CardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <div key={category.id} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                        <p className="text-xs text-gray-500 mt-2">{category.book_count} books</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'authors' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Authors</h3>
                {skeletonLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <CardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {authors.map((author) => (
                      <div key={author.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <img
                            src={author.avatar_url || '/placeholder-avatar.png'}
                            alt={author.name}
                            className="h-10 w-10 rounded-full"
                          />
                          <div className="ml-3">
                            <h4 className="font-medium text-gray-900">{author.name}</h4>
                            <p className="text-sm text-gray-600">{author.email}</p>
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-gray-600">
                          <p>{author.books_count} books</p>
                          <p>Revenue: ${author.revenue}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this book? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={confirmDeleteBook}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setBookToDelete(null);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 