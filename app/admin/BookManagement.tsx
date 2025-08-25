"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import BulkLibraryManagement from "./BulkLibraryManagement";
import Pagination from "@/components/Pagination";
import BookUploadModal from "@/components/admin/BookUploadModal";
import AssignBookModal from "@/components/admin/AssignBookModal";
import EditBookModal from "@/components/admin/EditBookModal";
import UpdatePriceModal from "@/components/admin/UpdatePriceModal";
import OptimizedImage from "@/components/OptimizedImage";
import { constructImageUrl } from "@/lib/imageUtils";

// Simple modals for authors and categories
function AuthorModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/authors-new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim() || null, 
          bio: bio.trim() || null,
          website: null
        })
      });

      if (response.ok) {
        toast.success('Author created successfully');
        setName('');
        setEmail('');
        setBio('');
        onSuccess();
      } else {
        const errorData = await response.json();
        console.error('Author creation error:', errorData);
        console.error('Author creation detail:', JSON.stringify(errorData.detail, null, 2));
        toast.error('Failed to create author');
      }
    } catch (error) {
      toast.error('Error creating author');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Author</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 border rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Author'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/categories-new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: name.trim(), 
          description: description.trim() || null 
        })
      });

      if (response.ok) {
        toast.success('Category created successfully');
        setName('');
        setDescription('');
        onSuccess();
      } else {
        const errorData = await response.json();
        console.error('Category creation error:', errorData);
        console.error('Category creation detail:', JSON.stringify(errorData.detail, null, 2));
        toast.error('Failed to create category');
      }
    } catch (error) {
      toast.error('Error creating category');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Category</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 border rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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

export default function BookManagement() {
  
  // UI State
  const [activeSection, setActiveSection] = useState("books");
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState("book");
  const [loading, setLoading] = useState(true);
  
  // New modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([]);
  const [priceModalMode, setPriceModalMode] = useState<'single' | 'bulk'>('single');
  
  // Data State
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter State
  const [selectedFilters, setSelectedFilters] = useState({
    category: "",
    status: "",
    search: ""
  });

  useEffect(() => {
    loadData();
  }, [currentPage, itemsPerPage, selectedFilters]);

  const loadData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      if (selectedFilters.category) {
        params.append("category_id", selectedFilters.category);
      }
      if (selectedFilters.status) {
        params.append("status", selectedFilters.status);
      }
      if (selectedFilters.search) {
        params.append("search", selectedFilters.search);
      }

      const token = localStorage.getItem('token');
      const [booksResponse, categoriesResponse, authorsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/categories-new`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/authors-new`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (booksResponse.ok) {
        const booksData = await booksResponse.json();
        console.log('Books API Response:', booksData);
        setBooks(booksData.data || []);
        setTotalItems(booksData.pagination?.total || 0);
        setTotalPages(booksData.pagination?.pages || 1);
      } else {
        console.error('Books API Error:', booksResponse.status, await booksResponse.text());
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
      toast.error('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = (type: string) => {
    setModalType(type);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
  };

  const handleAssignBook = (book: Book) => {
    setSelectedBook(book);
    setShowAssignModal(true);
  };

  const handleEditBook = (book: Book) => {
    setSelectedBook(book);
    setShowEditModal(true);
  };

  const handleUpdatePrice = (book: Book) => {
    setSelectedBook(book);
    setPriceModalMode('single');
    setShowPriceModal(true);
  };

  const handleBulkPriceUpdate = () => {
    if (selectedBooks.length === 0) {
      toast.error('Please select books first');
      return;
    }
    setPriceModalMode('bulk');
    setShowPriceModal(true);
  };

  const handleToggleFeature = async (bookId: number) => {
    try {
      const book = books.find((b) => b.id === bookId);
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
        toast.success(`Book ${book.is_featured ? "unfeatured" : "featured"} successfully`);
        loadData();
      } else {
        toast.error('Failed to update featured status');
      }
    } catch (error) {
      console.error("Error toggling feature:", error);
      toast.error("Failed to update featured status");
    }
  };

  const handleStatusChange = async (bookId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books/bulk-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          book_ids: [bookId],
          status: newStatus
        })
      });

      if (response.ok) {
        toast.success(`Book status updated to ${newStatus}`);
        loadData();
      } else {
        toast.error('Failed to update book status');
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update book status");
    }
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
        toast.success("Book deleted successfully");
        // Force refresh after a short delay to ensure deletion is complete
        setTimeout(() => {
          loadData();
        }, 500);
      } else {
        toast.error("Failed to delete book");
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      toast.error("Failed to delete book");
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/categories-new/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success("Category deleted successfully");
        loadData();
      } else {
        toast.error("Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleDeleteAuthor = async (authorId: number) => {
    if (!confirm('Are you sure you want to delete this author?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/authors-new/${authorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success("Author deleted successfully");
        loadData();
      } else {
        toast.error("Failed to delete author");
      }
    } catch (error) {
      console.error("Error deleting author:", error);
      toast.error("Failed to delete author");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading book management...</p>
        </div>
      </div>
    );
  }

  const renderCategories = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => handleAddNew("category")}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <i className="ri-add-line mr-2"></i>
          Add New Category
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Books</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-sm font-medium text-gray-900">{category.name}</td>
                <td className="px-4 py-4 text-sm text-gray-500">{category.description || 'No description'}</td>
                <td className="px-4 py-4 text-sm text-gray-900">{category.book_count || 0}</td>
                <td className="px-4 py-4">
                  <button 
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAuthors = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => handleAddNew("author")}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <i className="ri-add-line mr-2"></i>
          Add New Author
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Books</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {authors.map((author) => (
              <tr key={author.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-sm font-medium text-gray-900">{author.name}</td>
                <td className="px-4 py-4 text-sm text-gray-500">{author.email || 'No email'}</td>
                <td className="px-4 py-4 text-sm text-gray-900">{author.books_count || 0}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    author.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {author.status || 'Active'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button 
                    onClick={() => handleDeleteAuthor(author.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBooks = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => handleAddNew("book")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <i className="ri-add-line mr-2"></i>
            Add New Book
          </button>
          <button
            onClick={() => handleAddNew("author")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <i className="ri-user-add-line mr-2"></i>
            Add Author
          </button>
          <button
            onClick={() => handleAddNew("category")}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <i className="ri-price-tag-3-line mr-2"></i>
            Add Category
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleBulkPriceUpdate}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            disabled={selectedBooks.length === 0}
          >
            <i className="ri-price-tag-line mr-2"></i>
            Bulk Update Prices
          </button>
        </div>
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
          <tbody className="divide-y divide-gray-200">
            {books.map((book) => (
              <tr key={book.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <OptimizedImage
                      src={constructImageUrl(book.cover_image_url)}
                      alt={book.title}
                      className="w-12 h-18 object-cover rounded"
                      width={48}
                      height={72}
                      showPlaceholderOnError={false}
                    />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{book.title}</div>
                      <div className="text-sm text-gray-500">{book.author_name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">{book.category_name}</td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900">₦{book.price}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleStatusChange(book.id, book.status === 'published' ? 'draft' : 'published')}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                        book.status === 'published' 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      title={`Click to ${book.status === 'published' ? 'unpublish' : 'publish'}`}
                    >
                      {book.status === 'published' ? '✓ Published' : '○ Draft'}
                    </button>
                    {book.is_featured && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAssignBook(book)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Assign to User"
                    >
                      <i className="ri-user-add-line"></i>
                    </button>
                    <button
                      onClick={() => handleEditBook(book)}
                      className="text-green-600 hover:text-green-800 p-1"
                      title="Edit Book"
                    >
                      <i className="ri-edit-line"></i>
                    </button>
                    <button
                      onClick={() => handleUpdatePrice(book)}
                      className="text-purple-600 hover:text-purple-800 p-1"
                      title="Update Price"
                    >
                      <i className="ri-price-tag-line"></i>
                    </button>
                    <button
                      onClick={() => handleToggleFeature(book.id)}
                      className="text-yellow-600 hover:text-yellow-800 p-1"
                      title="Toggle Featured"
                    >
                      <i className={book.is_featured ? "ri-star-fill" : "ri-star-line"}></i>
                    </button>
                    <button
                      onClick={() => handleDeleteBook(book.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete Book"
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

      {/* Mobile card view */}
      <div className="md:hidden space-y-4">
        {books.map((book) => (
          <div key={book.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-start space-x-4">
              <OptimizedImage
                src={constructImageUrl(book.cover_image_url)}
                alt={book.title}
                className="w-16 h-24 object-cover rounded flex-shrink-0"
                width={64}
                height={96}
                showPlaceholderOnError={false}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">{book.title}</h3>
                <p className="text-sm text-gray-500 truncate">{book.author_name}</p>
                <p className="text-xs text-gray-400 mt-1">{book.category_name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium text-gray-900">₦{book.price}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleAssignBook(book)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Assign to User"
                    >
                      <i className="ri-user-add-line text-sm"></i>
                    </button>
                    <button
                      onClick={() => handleEditBook(book)}
                      className="text-green-600 hover:text-green-800 p-1"
                      title="Edit Book"
                    >
                      <i className="ri-edit-line text-sm"></i>
                    </button>
                    <button
                      onClick={() => handleToggleFeature(book.id)}
                      className="text-yellow-600 hover:text-yellow-800 p-1"
                      title="Toggle Featured"
                    >
                      <i className={book.is_featured ? "ri-star-fill text-sm" : "ri-star-line text-sm"}></i>
                    </button>
                    <button
                      onClick={() => handleDeleteBook(book.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete Book"
                    >
                      <i className="ri-delete-bin-line text-sm"></i>
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <button
                    onClick={() => handleStatusChange(book.id, book.status === 'published' ? 'draft' : 'published')}
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      book.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {book.status === 'published' ? '✓ Published' : '○ Draft'}
                  </button>
                  {book.is_featured && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        showItemsPerPage={true}
      />
    </div>
  );

  const sections = [
    { id: "books", label: "Books", icon: "ri-book-line" },
    { id: "categories", label: "Categories", icon: "ri-price-tag-3-line" },
    { id: "authors", label: "Authors", icon: "ri-user-line" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium text-sm ${
              activeSection === section.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <i className={section.icon}></i>
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {activeSection === "books" && renderBooks()}
      {activeSection === "categories" && renderCategories()}
      {activeSection === "authors" && renderAuthors()}
      
      {showAddModal && modalType === "book" && (
        <BookUploadModal
          isOpen={showAddModal}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            loadData();
          }}
          categories={categories}
          authors={authors}
        />
      )}
      
      {showAddModal && modalType === "author" && (
        <AuthorModal
          isOpen={showAddModal}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            loadData();
          }}
        />
      )}
      
      {showAddModal && modalType === "category" && (
        <CategoryModal
          isOpen={showAddModal}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            loadData();
          }}
        />
      )}
      
      {showAssignModal && selectedBook && (
        <AssignBookModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            loadData();
          }}
          book={selectedBook}
        />
      )}
      
      {showEditModal && selectedBook && (
        <EditBookModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            loadData();
          }}
          book={{
            id: selectedBook.id,
            title: selectedBook.title,
            description: '',
            price: selectedBook.price,
            status: selectedBook.status,
            is_featured: selectedBook.is_featured,
            category_name: selectedBook.category_name,
            author_name: selectedBook.author_name
          }}
          categories={categories}
          authors={authors}
        />
      )}
      
      {showPriceModal && (
        <UpdatePriceModal
          isOpen={showPriceModal}
          onClose={() => setShowPriceModal(false)}
          onSuccess={() => {
            setShowPriceModal(false);
            loadData();
          }}
          book={priceModalMode === 'single' ? selectedBook : undefined}
          selectedBooks={priceModalMode === 'bulk' ? selectedBooks : undefined}
          mode={priceModalMode}
        />
      )}
    </div>
  );
}