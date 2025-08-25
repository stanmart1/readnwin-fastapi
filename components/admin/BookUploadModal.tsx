'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface BookUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: any[];
  authors: any[];
}

interface FormData {
  title: string;
  author_id: string;
  category_id: string;
  price: string;
  isbn: string;
  description: string;
  language: string;
  pages: string;
  publication_date: string;
  publisher: string;
  format: string;
  status: string;
  stock_quantity: string;
  inventory_enabled: boolean;
  low_stock_threshold: string;
  cover_image: File | null;
  ebook_file: File | null;
}

export default function BookUploadModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  categories, 
  authors 
}: BookUploadModalProps) {
  const [bookType, setBookType] = useState<'ebook' | 'physical'>('ebook');
  const [inventoryEnabled, setInventoryEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState<FormData>({
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
    status: 'published',
    stock_quantity: '',
    inventory_enabled: false,
    low_stock_threshold: '10',
    cover_image: null,
    ebook_file: null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
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
      inventory_enabled: false,
      low_stock_threshold: '10',
      cover_image: null,
      ebook_file: null
    });
    setErrors({});
    setBookType('ebook');
    setInventoryEnabled(false);
    setUploadProgress(0);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.author_id) {
      newErrors.author_id = 'Author is required';
    }
    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    if (!formData.cover_image) {
      newErrors.cover_image = 'Cover image is required';
    }

    // Book type specific validation
    if (bookType === 'physical') {
      if (!formData.publisher) {
        newErrors.publisher = 'Publisher is required for physical books';
      }
      
      // Inventory validation
      if (inventoryEnabled) {
        if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
          newErrors.stock_quantity = 'Stock quantity must be 0 or greater when inventory is enabled';
        }
        if (!formData.low_stock_threshold || parseInt(formData.low_stock_threshold) < 0) {
          newErrors.low_stock_threshold = 'Low stock threshold must be 0 or greater';
        }
      }
    }

    if (bookType === 'ebook') {
      if (!formData.ebook_file) {
        newErrors.ebook_file = 'Ebook file is required for digital books';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const submitData = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'cover_image' && key !== 'ebook_file' && value !== null && value !== '') {
          submitData.append(key, String(value));
        }
      });

      // Add files
      if (formData.cover_image) {
        submitData.append('cover_image', formData.cover_image);
      }
      if (formData.ebook_file) {
        submitData.append('ebook_file', formData.ebook_file);
      }

      // Set format based on book type
      submitData.set('format', bookType);
      
      // Set status to published by default
      submitData.set('status', 'published');
      
      // Set inventory settings
      submitData.set('inventory_enabled', inventoryEnabled.toString());
      
      // If inventory is disabled, set stock_quantity to null or 0
      if (!inventoryEnabled) {
        submitData.set('stock_quantity', '0');
        submitData.set('low_stock_threshold', '0');
      }

      setUploadProgress(25);

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });

      setUploadProgress(75);

      const result = await response.json();

      if (response.ok) {
        setUploadProgress(100);
        toast.success('Book created successfully!');
        
        // Close modal after success
        setTimeout(() => {
          onClose();
          onSuccess();
        }, 1000);
      } else {
        const errorMessage = result.message || result.error || 'Failed to create book';
        toast.error(errorMessage);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('Error creating book:', error);
      toast.error('An error occurred while creating the book');
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add New Book</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Book Type Selection */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-3">Book Type</label>
              <div className="flex space-x-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="ebook"
                    checked={bookType === 'ebook'}
                    onChange={(e) => {
                      setBookType(e.target.value as 'ebook' | 'physical');
                      setInventoryEnabled(false); // Disable inventory for ebooks
                    }}
                    className="mr-2"
                  />
                  <span className="font-medium">Digital Ebook</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="physical"
                    checked={bookType === 'physical'}
                    onChange={(e) => {
                      setBookType(e.target.value as 'ebook' | 'physical');
                    }}
                    className="mr-2"
                  />
                  <span className="font-medium">Physical Book</span>
                </label>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Selected:</span> {bookType === 'ebook' ? 'Digital Ebook' : 'Physical Book'}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter book title"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Author *</label>
                <select
                  value={formData.author_id}
                  onChange={(e) => handleInputChange('author_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.author_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Author</option>
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </select>
                {errors.author_id && <p className="text-red-500 text-sm mt-1">{errors.author_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.category_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ISBN</label>
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => handleInputChange('isbn', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ISBN number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="English">English</option>
                  <option value="French">French</option>
                  <option value="Spanish">Spanish</option>
                  <option value="German">German</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Russian">Russian</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending Review</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Only published books are available for purchase</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pages</label>
                <input
                  type="number"
                  value={formData.pages}
                  onChange={(e) => handleInputChange('pages', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Number of pages"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Publication Date</label>
                <input
                  type="date"
                  value={formData.publication_date}
                  onChange={(e) => handleInputChange('publication_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {bookType === 'physical' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Publisher *</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => handleInputChange('publisher', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.publisher ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Publisher name"
                  />
                  {errors.publisher && <p className="text-red-500 text-sm mt-1">{errors.publisher}</p>}
                </div>
              )}
            </div>

            {/* Inventory Management (Physical Books Only) */}
            {bookType === 'physical' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-blue-900">Inventory Management</h3>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inventoryEnabled}
                      onChange={(e) => {
                        setInventoryEnabled(e.target.checked);
                        if (!e.target.checked) {
                          // Reset inventory fields when disabled
                          handleInputChange('stock_quantity', '');
                          handleInputChange('low_stock_threshold', '10');
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="font-medium text-blue-900">Enable Inventory Tracking</span>
                  </label>
                </div>

                {inventoryEnabled ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-2">Stock Quantity *</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stock_quantity}
                        onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.stock_quantity ? 'border-red-500' : 'border-blue-300'
                        }`}
                        placeholder="Available units"
                      />
                      {errors.stock_quantity && <p className="text-red-500 text-sm mt-1">{errors.stock_quantity}</p>}
                      <p className="text-xs text-blue-700 mt-1">Number of units currently in stock</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-2">Low Stock Threshold</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.low_stock_threshold}
                        onChange={(e) => handleInputChange('low_stock_threshold', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.low_stock_threshold ? 'border-red-500' : 'border-blue-300'
                        }`}
                        placeholder="10"
                      />
                      {errors.low_stock_threshold && <p className="text-red-500 text-sm mt-1">{errors.low_stock_threshold}</p>}
                      <p className="text-xs text-blue-700 mt-1">Alert when stock falls below this number</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-blue-700">
                    <p>• Inventory tracking is disabled</p>
                    <p>• Books will be available for purchase without stock limitations</p>
                    <p>• No stock alerts will be generated</p>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter book description"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000 characters</p>
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('cover_image', e.target.files?.[0] || null)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cover_image ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.cover_image && <p className="text-red-500 text-sm mt-1">{errors.cover_image}</p>}
                <p className="text-xs text-gray-500 mt-1">Upload book cover image (JPG, PNG, WebP)</p>
              </div>

              {bookType === 'ebook' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ebook File *</label>
                  <input
                    type="file"
                    accept=".pdf,.epub,.mobi"
                    onChange={(e) => handleFileChange('ebook_file', e.target.files?.[0] || null)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.ebook_file ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.ebook_file && <p className="text-red-500 text-sm mt-1">{errors.ebook_file}</p>}
                  <p className="text-xs text-gray-500 mt-1">Upload ebook file (PDF, EPUB, MOBI)</p>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {isSubmitting && (
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Uploading...</span>
                  <span className="text-sm text-gray-500">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Book'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 