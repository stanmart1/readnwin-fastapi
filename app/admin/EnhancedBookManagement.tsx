"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import EnhancedBookUploadModal from "@/components/admin/EnhancedBookUploadModal";
import BookDetailsModal from "@/components/admin/BookDetailsModal";
import AssignBookModal from "@/components/admin/AssignBookModal";
import { constructImageUrl } from "@/lib/imageUtils";

interface EditBookModalProps {
  isOpen: boolean;
  book: Book;
  categories: any[];
  authors: any[];
  onClose: () => void;
  onSuccess: () => void;
}

const EditBookModal = ({ isOpen, book, categories, authors, onClose, onSuccess }: EditBookModalProps) => {
  const [formData, setFormData] = useState({
    title: book.title,
    author_name: book.author_name,
    category_name: book.category_name,
    price: book.price,
    status: book.status,
    format: book.format,
    is_featured: book.is_featured,
    is_active: book.is_active,
    stock_quantity: book.stock_quantity || 0,
    inventory_enabled: book.inventory_enabled || false,
    binding_type: book.binding_type || '',
    pages: book.pages || 0
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books/${book.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Book updated successfully');
        onSuccess();
      } else {
        toast.error('Failed to update book');
      }
    } catch (error) {
      toast.error('Error updating book');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit Book</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
              <input
                type="text"
                value={formData.author_name}
                onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category_name}
                onChange={(e) => setFormData(prev => ({ ...prev, category_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <select
                value={formData.format}
                onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ebook">Digital</option>
                <option value="physical">Physical</option>
                <option value="both">Both</option>
              </select>
            </div>

            {formData.format !== 'ebook' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pages</label>
                  <input
                    type="number"
                    value={formData.pages}
                    onChange={(e) => setFormData(prev => ({ ...prev, pages: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Binding Type</label>
                  <select
                    value={formData.binding_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, binding_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Binding</option>
                    <option value="paperback">Paperback</option>
                    <option value="hardcover">Hardcover</option>
                    <option value="spiral">Spiral</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Featured</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.inventory_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, inventory_enabled: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Track Inventory</span>
              </label>
            </div>
          </div>

          {formData.inventory_enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface Book {
  id: number;
  title: string;
  author_name: string;
  category_name: string;
  price: number;
  status: string;
  stock_quantity?: number;
  is_featured: boolean;
  is_active: boolean;
  cover_image_url: string;
  format: string;
  created_at: string;
  inventory_enabled?: boolean;
  binding_type?: string;
  pages?: number;
  file_size?: string;
}

export default function EnhancedBookManagement() {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [assigningBook, setAssigningBook] = useState<Book | null>(null);
  
  // Mobile-optimized states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedBooks, setSelectedBooks] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    format: '',
    featured: '',
    price_range: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    loadData();
  }, [currentPage, itemsPerPage, filters, sortBy, sortOrder]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
        ...filters
      });

      const token = localStorage.getItem('token');
      const [booksResponse, categoriesResponse, authorsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/authors`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (booksResponse.ok) {
        const booksData = await booksResponse.json();
        setBooks(booksData.books || booksData.data || []);
        setTotalItems(booksData.total || booksData.pagination?.total || 0);
      }

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData || []);
      }

      if (authorsResponse.ok) {
        const authorsData = await authorsResponse.json();
        setAuthors(authorsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedBooks.size === 0) {
      toast.error('Please select books first');
      return;
    }

    // Security: Limit bulk operations
    if (selectedBooks.size > 50) {
      toast.error('Too many books selected. Maximum 50 books allowed.');
      return;
    }

    // Validate action
    const allowedActions = ['feature', 'unfeature', 'publish', 'draft', 'activate', 'deactivate', 'delete'];
    if (!allowedActions.includes(action)) {
      toast.error('Invalid action');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      const bookIds = Array.from(selectedBooks).filter(id => typeof id === 'number' && id > 0);
      if (bookIds.length === 0) {
        toast.error('No valid books selected');
        return;
      }
      
      let endpoint = '';
      let body = {};

      switch (action) {
        case 'feature':
          endpoint = '/admin/books/bulk-feature';
          body = { book_ids: bookIds, is_featured: true };
          break;
        case 'unfeature':
          endpoint = '/admin/books/bulk-feature';
          body = { book_ids: bookIds, is_featured: false };
          break;
        case 'publish':
          endpoint = '/admin/books/bulk-status';
          body = { book_ids: bookIds, status: 'published' };
          break;
        case 'draft':
          endpoint = '/admin/books/bulk-status';
          body = { book_ids: bookIds, status: 'draft' };
          break;
        case 'activate':
          endpoint = '/admin/books/bulk-active';
          body = { book_ids: bookIds, is_active: true };
          break;
        case 'deactivate':
          endpoint = '/admin/books/bulk-active';
          body = { book_ids: bookIds, is_active: false };
          break;
        case 'delete':
          if (!confirm(`Delete ${bookIds.length} selected books? This action cannot be undone.`)) return;
          if (bookIds.length > 10) {
            if (!confirm(`You are about to delete ${bookIds.length} books. Are you absolutely sure?`)) return;
          }
          endpoint = '/admin/books/bulk-delete';
          body = { book_ids: bookIds };
          break;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'  // CSRF protection
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success(`${action} completed successfully`);
        setSelectedBooks(new Set());
        loadData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `Failed to ${action} books`;
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error(`Bulk action error:`, error);
      toast.error(`Error performing ${action}. Please try again.`);
    }
  };

  const BookCard = ({ book }: { book: Book }) => (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200">
      {/* Selection checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <input
          type="checkbox"
          checked={selectedBooks.has(book.id)}
          onChange={(e) => {
            const newSelected = new Set(selectedBooks);
            if (e.target.checked) {
              newSelected.add(book.id);
            } else {
              newSelected.delete(book.id);
            }
            setSelectedBooks(newSelected);
          }}
          className="w-4 h-4 text-blue-600 rounded"
        />
      </div>

      {/* Book cover */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl">
        <img
          src={constructImageUrl(book.cover_image_url) || "/placeholder-book.jpg"}
          alt={book.title}
          className="w-full h-full object-cover"
        />
        
        {/* Status badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          {book.is_featured && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              <i className="ri-star-fill"></i>
            </span>
          )}
          <span className={`text-xs px-2 py-1 rounded-full ${
            book.status === 'published' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
          }`}>
            {book.status}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            book.is_active ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {book.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Format indicator */}
        <div className="absolute bottom-3 left-3">
          <span className={`text-xs px-2 py-1 rounded-full ${
            book.format === 'ebook' ? 'bg-blue-500 text-white' : 
            book.format === 'physical' ? 'bg-green-500 text-white' : 
            'bg-purple-500 text-white'
          }`}>
            {book.format === 'ebook' ? 'Digital' : book.format === 'physical' ? 'Physical' : 'Both'}
          </span>
        </div>
      </div>

      {/* Book details */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2" title={book.title}>
          {book.title.length > 50 ? `${book.title.substring(0, 50)}...` : book.title}
        </h3>
        <p className="text-sm text-gray-600 mb-2" title={book.author_name}>
          {book.author_name.length > 30 ? `${book.author_name.substring(0, 30)}...` : book.author_name}
        </p>
        <p className="text-xs text-gray-500 mb-3" title={book.category_name}>
          {book.category_name.length > 25 ? `${book.category_name.substring(0, 25)}...` : book.category_name}
        </p>

        {/* Pricing */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm">
            <div className="text-green-600 font-medium">₦{book.price}</div>
          </div>
        </div>

        {/* Stock info for books with inventory enabled */}
        {book.inventory_enabled && book.stock_quantity !== undefined && (
          <div className="text-xs text-gray-500 mb-3">
            <i className="ri-archive-line mr-1"></i>
            Stock: {book.stock_quantity} units
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => handleView(book)}
              className="text-green-600 hover:text-green-800 p-1"
              title="View Details"
            >
              <i className="ri-eye-line"></i>
            </button>
            <button
              onClick={() => handleEdit(book)}
              className="text-blue-600 hover:text-blue-800 p-1"
              title="Edit Book"
            >
              <i className="ri-edit-line"></i>
            </button>
            <button
              onClick={() => handleToggleFeature(book.id)}
              className="text-yellow-600 hover:text-yellow-800 p-1"
              title="Toggle Featured"
            >
              <i className={book.is_featured ? "ri-star-fill" : "ri-star-line"}></i>
            </button>
            <button
              onClick={() => handleToggleActive(book.id)}
              className={`p-1 ${book.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-gray-600 hover:text-gray-800'}`}
              title={book.is_active ? 'Deactivate' : 'Activate'}
            >
              <i className={book.is_active ? "ri-pause-circle-line" : "ri-play-circle-line"}></i>
            </button>
            {(book.format === 'ebook' || book.format === 'both') && (
              <button
                onClick={() => handleAssign(book)}
                className="text-purple-600 hover:text-purple-800 p-1"
                title="Assign to Users"
              >
                <i className="ri-user-add-line"></i>
              </button>
            )}
            <button
              onClick={() => handleDelete(book.id)}
              className="text-red-600 hover:text-red-800 p-1"
              title="Delete"
            >
              <i className="ri-delete-bin-line"></i>
            </button>
          </div>
          
          <div className="text-xs text-gray-400">
            {new Date(book.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );

  const BookListItem = ({ book }: { book: Book }) => (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 p-4">
      <div className="flex items-center gap-4">
        {/* Selection checkbox */}
        <input
          type="checkbox"
          checked={selectedBooks.has(book.id)}
          onChange={(e) => {
            const newSelected = new Set(selectedBooks);
            if (e.target.checked) {
              newSelected.add(book.id);
            } else {
              newSelected.delete(book.id);
            }
            setSelectedBooks(newSelected);
          }}
          className="w-4 h-4 text-blue-600 rounded"
        />

        {/* Book cover - smaller for list view */}
        <div className="w-16 h-20 flex-shrink-0">
          <img
            src={book.cover_image_url || "/placeholder-book.jpg"}
            alt={book.title}
            className="w-full h-full object-cover rounded"
          />
        </div>

        {/* Book details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{book.title}</h3>
              <p className="text-sm text-gray-600">{book.author_name}</p>
              <p className="text-xs text-gray-500">{book.category_name}</p>
            </div>
            
            {/* Price */}
            <div className="text-right ml-4">
              <div className="text-green-600 font-medium">₦{book.price}</div>
              <div className="text-xs text-gray-400">
                {new Date(book.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Status badges and stock */}
          <div className="flex items-center gap-2 mt-2">
            {book.is_featured && (
              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                <i className="ri-star-fill"></i> Featured
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${
              book.status === 'published' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
            }`}>
              {book.status}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              book.is_active ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {book.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              book.format === 'ebook' ? 'bg-blue-500 text-white' : 
              book.format === 'physical' ? 'bg-green-500 text-white' : 
              'bg-purple-500 text-white'
            }`}>
              {book.format === 'ebook' ? 'Digital' : book.format === 'physical' ? 'Physical' : 'Both'}
            </span>
            
            {book.inventory_enabled && book.stock_quantity !== undefined && (
              <span className="text-xs text-gray-500">
                <i className="ri-archive-line mr-1"></i>
                Stock: {book.stock_quantity}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => handleView(book)}
            className="text-green-600 hover:text-green-800 p-2"
            title="View Details"
          >
            <i className="ri-eye-line"></i>
          </button>
          <button
            onClick={() => handleEdit(book)}
            className="text-blue-600 hover:text-blue-800 p-2"
            title="Edit Book"
          >
            <i className="ri-edit-line"></i>
          </button>
          <button
            onClick={() => handleToggleFeature(book.id)}
            className="text-yellow-600 hover:text-yellow-800 p-2"
            title="Toggle Featured"
          >
            <i className={book.is_featured ? "ri-star-fill" : "ri-star-line"}></i>
          </button>
          <button
            onClick={() => handleToggleActive(book.id)}
            className={`p-2 ${book.is_active ? 'text-orange-600 hover:text-orange-800' : 'text-gray-600 hover:text-gray-800'}`}
            title={book.is_active ? 'Deactivate' : 'Activate'}
          >
            <i className={book.is_active ? "ri-pause-circle-line" : "ri-play-circle-line"}></i>
          </button>
          {(book.format === 'ebook' || book.format === 'both') && (
            <button
              onClick={() => handleAssign(book)}
              className="text-purple-600 hover:text-purple-800 p-2"
              title="Assign to Users"
            >
              <i className="ri-user-add-line"></i>
            </button>
          )}
          <button
            onClick={() => handleDelete(book.id)}
            className="text-red-600 hover:text-red-800 p-2"
            title="Delete"
          >
            <i className="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>
    </div>
  );

  const handleView = (book: Book) => {
    setViewingBook(book);
    setShowDetailsModal(true);
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setShowEditModal(true);
  };

  const handleAssign = (book: Book) => {
    setAssigningBook(book);
    setShowAssignModal(true);
  };

  const handleToggleFeature = async (bookId: number) => {
    try {
      const book = books.find(b => b.id === bookId);
      if (!book) return;

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books/bulk-feature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          book_ids: [bookId],
          is_featured: !book.is_featured
        })
      });

      if (response.ok) {
        toast.success(`Book ${book.is_featured ? 'unfeatured' : 'featured'} successfully`);
        loadData();
      }
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  const handleToggleActive = async (bookId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books/${bookId}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        loadData();
      }
    } catch (error) {
      toast.error('Failed to update active status');
    }
  };

  const handleDelete = async (bookId: number) => {
    // Validate bookId
    if (!bookId || typeof bookId !== 'number' || bookId <= 0) {
      toast.error('Invalid book ID');
      return;
    }

    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books/${bookId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.ok) {
        toast.success('Book deleted successfully');
        loadData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || 'Failed to delete book';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete book. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading books...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile-optimized header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Management</h1>
          <p className="text-gray-600">Manage your digital and physical book inventory</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <i className="ri-add-line mr-2"></i>
            Add Book
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{books.length}</div>
          <div className="text-sm text-gray-600">Total Books</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {books.filter(b => b.status === 'published').length}
          </div>
          <div className="text-sm text-gray-600">Published</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-purple-600">
            {books.filter(b => b.format === 'ebook').length}
          </div>
          <div className="text-sm text-gray-600">Digital</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-orange-600">
            {books.filter(b => b.is_active).length}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
      </div>

      {/* Filters and controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search books..."
                value={filters.search}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 100); // Limit length
                  setFilters(prev => ({ ...prev, search: value }));
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                maxLength={100}
              />
            </div>
          </div>

          {/* View controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <i className="ri-filter-line"></i>
            </button>
            
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <i className="ri-grid-line"></i>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <i className="ri-list-check"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-4">
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Categories</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
            </select>

            <select
              value={filters.format}
              onChange={(e) => setFilters(prev => ({ ...prev, format: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Formats</option>
              <option value="ebook">Digital</option>
              <option value="physical">Physical</option>
              <option value="both">Both</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="created_at">Date Added</option>
              <option value="title">Title</option>
              <option value="price">Price</option>
              <option value="status">Status</option>
            </select>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {selectedBooks.size > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-blue-900">
              {selectedBooks.size} book(s) selected
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkAction('feature')}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                Feature
              </button>
              <button
                onClick={() => handleBulkAction('publish')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Publish
              </button>
              <button
                onClick={() => handleBulkAction('draft')}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Draft
              </button>
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Books grid/list */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBooks(new Set(books.map(b => b.id)));
                        } else {
                          setSelectedBooks(new Set());
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedBooks.has(book.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedBooks);
                          if (e.target.checked) {
                            newSelected.add(book.id);
                          } else {
                            newSelected.delete(book.id);
                          }
                          setSelectedBooks(newSelected);
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-12">
                          <img
                            className="h-16 w-12 object-cover rounded"
                            src={constructImageUrl(book.cover_image_url) || "/placeholder-book.jpg"}
                            alt={book.title}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">{book.title}</div>
                          <div className="text-sm text-gray-500">{book.author_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{book.category_name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₦{book.price}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          book.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {book.status}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          book.is_active ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {book.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {book.is_featured && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(book)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="View Details"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                        <button
                          onClick={() => handleEdit(book)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit Book"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          onClick={() => handleToggleFeature(book.id)}
                          className="text-yellow-600 hover:text-yellow-900 p-1"
                          title="Toggle Featured"
                        >
                          <i className={book.is_featured ? "ri-star-fill" : "ri-star-line"}></i>
                        </button>
                        <button
                          onClick={() => handleToggleActive(book.id)}
                          className={`p-1 ${book.is_active ? 'text-orange-600 hover:text-orange-900' : 'text-gray-600 hover:text-gray-900'}`}
                          title={book.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <i className={book.is_active ? "ri-pause-circle-line" : "ri-play-circle-line"}></i>
                        </button>
                        {(book.format === 'ebook' || book.format === 'both') && (
                          <button
                            onClick={() => handleAssign(book)}
                            className="text-purple-600 hover:text-purple-900 p-1"
                            title="Assign to Users"
                          >
                            <i className="ri-user-add-line"></i>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(book.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
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
      )}

      {/* Pagination */}
      {totalItems > itemsPerPage && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} books
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-2">{currentPage}</span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage * itemsPerPage >= totalItems}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Upload Modal */}
      {showUploadModal && (
        <EnhancedBookUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadData();
          }}
          categories={categories}
          authors={authors}
        />
      )}

      {/* Book Details Modal */}
      {showDetailsModal && viewingBook && (
        <BookDetailsModal
          isOpen={showDetailsModal}
          book={viewingBook}
          onClose={() => {
            setShowDetailsModal(false);
            setViewingBook(null);
          }}
          onEdit={(book) => {
            setEditingBook(book);
            setShowEditModal(true);
            setShowDetailsModal(false);
            setViewingBook(null);
          }}
        />
      )}

      {/* Assign Book Modal */}
      {showAssignModal && assigningBook && (
        <AssignBookModal
          isOpen={showAssignModal}
          book={assigningBook}
          onClose={() => {
            setShowAssignModal(false);
            setAssigningBook(null);
          }}
          onSuccess={() => {
            setShowAssignModal(false);
            setAssigningBook(null);
            loadData();
          }}
        />
      )}

      {/* Edit Book Modal */}
      {showEditModal && editingBook && (
        <EditBookModal
          isOpen={showEditModal}
          book={editingBook}
          categories={categories}
          authors={authors}
          onClose={() => {
            setShowEditModal(false);
            setEditingBook(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingBook(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}