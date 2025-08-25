'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  ArchiveBoxIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { BookUploadModalV2 } from './BookUploadModalV2';
import BookDataTable from './BookDataTable';
import BookFiltersPanel from './BookFiltersPanel';

interface Book {
  id: number;
  title: string;
  subtitle?: string;
  author_name: string;
  category_name: string;
  price: number;
  original_price?: number;
  format: string;
  status: string;
  stock_quantity: number;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_release: boolean;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
}

interface BookFilters {
  search: string;
  status: string;
  category_id: string;
  format: string;
  price_range: string;
  featured: boolean;
  bestseller: boolean;
  new_release: boolean;
  in_stock: boolean;
}

interface BulkAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  action: (bookIds: number[]) => Promise<void>;
  variant: 'primary' | 'secondary' | 'danger';
}

export default function EnhancedBookManagement() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BookFilters>({
    search: '',
    status: '',
    category_id: '',
    format: '',
    price_range: '',
    featured: false,
    bestseller: false,
    new_release: false,
    in_stock: false
  });
  const [selectedBooks, setSelectedBooks] = useState<number[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [authors, setAuthors] = useState<Array<{ id: string; name: string }>>([]);
  
  const handleBookUploaded = (book: Book) => {
    loadBooks();
    setUploadModalOpen(false);
  };
  const [totalBooks, setTotalBooks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Load books
  useEffect(() => {
    loadBooks();
  }, [filters, currentPage]);

  // Load categories and authors
  useEffect(() => {
    loadCategories();
    loadAuthors();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '' && value !== false)
        )
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBooks(data.data || []);
        setTotalBooks(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.map((cat: any) => ({ id: cat.id.toString(), name: cat.name })));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAuthors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/authors`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAuthors(data.map((author: any) => ({ id: author.id.toString(), name: author.name })));
      }
    } catch (error) {
      console.error('Error loading authors:', error);
    }
  };

  const handleBookCreated = (book: Book) => {
    setBooks(prev => [book, ...prev]);
    setUploadModalOpen(false);
  };

  const handleEditBook = (bookId: number) => {
    // Open edit modal
    console.log('Edit book:', bookId);
  };

  const handleDeleteBook = async (bookId: number) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books/${bookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setBooks(prev => prev.filter(book => book.id !== bookId));
      } else {
        alert('Failed to delete book');
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Error deleting book');
    }
  };

  const handleBulkDelete = async (bookIds: number[]) => {
    if (!confirm(`Are you sure you want to delete ${bookIds.length} books?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ book_ids: bookIds })
      });

      if (response.ok) {
        setBooks(prev => prev.filter(book => !bookIds.includes(book.id)));
        setSelectedBooks([]);
      } else {
        alert('Failed to delete books');
      }
    } catch (error) {
      console.error('Error deleting books:', error);
      alert('Error deleting books');
    }
  };

  const handleBulkArchive = async (bookIds: number[]) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books/bulk-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ book_ids: bookIds, status: 'archived' })
      });

      if (response.ok) {
        setBooks(prev => prev.map(book => 
          bookIds.includes(book.id) ? { ...book, status: 'archived' } : book
        ));
        setSelectedBooks([]);
      } else {
        alert('Failed to archive books');
      }
    } catch (error) {
      console.error('Error archiving books:', error);
      alert('Error archiving books');
    }
  };

  const handleBulkFeature = async (bookIds: number[]) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books/bulk-feature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ book_ids: bookIds, is_featured: true })
      });

      if (response.ok) {
        setBooks(prev => prev.map(book => 
          bookIds.includes(book.id) ? { ...book, is_featured: true } : book
        ));
        setSelectedBooks([]);
      } else {
        alert('Failed to feature books');
      }
    } catch (error) {
      console.error('Error featuring books:', error);
      alert('Error featuring books');
    }
  };

  const bulkActions: BulkAction[] = [
    {
      id: 'delete',
      label: 'Delete Selected',
      icon: TrashIcon,
      action: handleBulkDelete,
      variant: 'danger'
    },
    {
      id: 'archive',
      label: 'Archive Selected',
      icon: ArchiveBoxIcon,
      action: handleBulkArchive,
      variant: 'secondary'
    },
    {
      id: 'feature',
      label: 'Feature Selected',
      icon: StarIcon,
      action: handleBulkFeature,
      variant: 'primary'
    }
  ];

  const handleBulkAction = async (action: BulkAction) => {
    if (selectedBooks.length === 0) {
      alert('Please select books first');
      return;
    }
    await action.action(selectedBooks);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your book catalog, upload new books, and track inventory
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add New Book
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">📚</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Books</p>
              <p className="text-2xl font-semibold text-gray-900">{totalBooks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-sm font-medium">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Published</p>
              <p className="text-2xl font-semibold text-gray-900">
                {books.filter(b => b.status === 'published').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-sm font-medium">⭐</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Featured</p>
              <p className="text-2xl font-semibold text-gray-900">
                {books.filter(b => b.is_featured).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-sm font-medium">⚠️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Out of Stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {books.filter(b => b.stock_quantity === 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow">
        <BookFiltersPanel
          filters={filters}
          onFilterChange={setFilters}
          categories={categories}
          authors={authors}
        />
      </div>

      {/* Bulk Actions */}
      {selectedBooks.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-700">
              {selectedBooks.length} book{selectedBooks.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex space-x-2">
              {bulkActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleBulkAction(action)}
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md ${
                    action.variant === 'danger'
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : action.variant === 'primary'
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <action.icon className="w-3 h-3 mr-1" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Books Table */}
      <div className="bg-white rounded-lg shadow">
        <BookDataTable
          books={books}
          loading={loading}
          selectedBooks={selectedBooks}
          onSelectionChange={setSelectedBooks}
          onEdit={handleEditBook}
          onDelete={handleDeleteBook}
          onRefresh={loadBooks}
        />
      </div>

      {/* Pagination */}
      {totalBooks > itemsPerPage && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= Math.ceil(totalBooks / itemsPerPage)}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalBooks)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{totalBooks}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.ceil(totalBooks / itemsPerPage) }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === Math.ceil(totalBooks / itemsPerPage) || Math.abs(page - currentPage) <= 1)
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage >= Math.ceil(totalBooks / itemsPerPage)}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
            <BookUploadModalV2
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onBookUploaded={handleBookUploaded}
        categories={categories}
        authors={authors}
      />
    </div>
  );
} 