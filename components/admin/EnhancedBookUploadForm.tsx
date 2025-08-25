'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, CloudArrowUpIcon, DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';

interface EnhancedBookUploadFormProps {
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
  book_type: 'physical' | 'ebook' | 'both';
  stock_quantity: string;
  inventory_enabled: boolean;
  low_stock_threshold: string;
}

interface UploadedFiles {
  cover_image: File | null;
  ebook_file: File | null;
}

export default function EnhancedBookUploadForm({
  isOpen,
  onClose,
  onSuccess,
  categories,
  authors
}: EnhancedBookUploadFormProps) {
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
    book_type: 'ebook',
    stock_quantity: '',
    inventory_enabled: false,
    low_stock_threshold: '10'
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({
    cover_image: null,
    ebook_file: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

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
      book_type: 'ebook',
      stock_quantity: '',
      inventory_enabled: false,
      low_stock_threshold: '10'
    });
    setUploadedFiles({
      cover_image: null,
      ebook_file: null
    });
    setErrors({});
    setFileErrors({});
    setUploadProgress(0);
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
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

  const handleFileUpload = (field: keyof UploadedFiles, file: File | null) => {
    setUploadedFiles(prev => ({
      ...prev,
      [field]: file
    }));

    // Clear file error
    if (fileErrors[field]) {
      setFileErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.author_id) newErrors.author_id = 'Author is required';
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';

    // Book type specific validation
    if (formData.book_type === 'ebook' && !uploadedFiles.ebook_file) {
      newErrors.ebook_file = 'E-book file is required for ebook type';
    }

    if (formData.inventory_enabled && (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0)) {
      newErrors.stock_quantity = 'Valid stock quantity is required when inventory is enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateFiles = (): boolean => {
    const newFileErrors: Record<string, string> = {};

    // Cover image validation
    if (!uploadedFiles.cover_image) {
      newFileErrors.cover_image = 'Cover image is required';
    } else {
      const coverFile = uploadedFiles.cover_image;
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (coverFile.size > maxSize) {
        newFileErrors.cover_image = 'Cover image must be less than 10MB';
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(coverFile.type)) {
        newFileErrors.cover_image = 'Cover image must be JPEG, PNG, or WebP';
      }
    }

    // E-book file validation (if required)
    if (formData.book_type === 'ebook' && uploadedFiles.ebook_file) {
      const ebookFile = uploadedFiles.ebook_file;
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (ebookFile.size > maxSize) {
        newFileErrors.ebook_file = 'E-book file must be less than 100MB';
      }
      
      const allowedTypes = ['application/epub+zip', 'text/html', 'application/pdf'];
      const allowedExtensions = ['.epub', '.html', '.htm', '.pdf'];
      const fileExtension = ebookFile.name.toLowerCase().substring(ebookFile.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(ebookFile.type) && !allowedExtensions.includes(fileExtension)) {
        newFileErrors.ebook_file = 'E-book file must be EPUB, HTML, or PDF';
      }
    }

    setFileErrors(newFileErrors);
    return Object.keys(newFileErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !validateFiles()) {
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const submitData = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          submitData.append(key, String(value));
        }
      });

      // Add files
      if (uploadedFiles.cover_image) {
        submitData.append('cover_image', uploadedFiles.cover_image);
      }
      if (uploadedFiles.ebook_file) {
        submitData.append('ebook_file', uploadedFiles.ebook_file);
      }

      setUploadProgress(25);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitData
      });

      setUploadProgress(75);

      const result = await response.json();

      if (response.ok) {
        setUploadProgress(100);
        
        // Close modal after success
        setTimeout(() => {
          onClose();
          onSuccess();
        }, 1000);
      } else {
        const errorMessage = result.message || result.error || 'Failed to create book';
        setErrors({ submit: errorMessage });
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('Error creating book:', error);
      setErrors({ submit: 'An error occurred while creating the book' });
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      handleFileUpload('cover_image', acceptedFiles[0] || null);
    }
  });

  const { getRootProps: getEbookRootProps, getInputProps: getEbookInputProps } = useDropzone({
    accept: {
      'application/epub+zip': ['.epub'],
      'text/html': ['.html', '.htm'],
      'application/pdf': ['.pdf']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    onDrop: (acceptedFiles) => {
      handleFileUpload('ebook_file', acceptedFiles[0] || null);
    }
  });

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white rounded-xl shadow-2xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              Upload New Book
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter book title"
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author *
                  </label>
                  <select
                    value={formData.author_id}
                    onChange={(e) => handleInputChange('author_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.author_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select an author</option>
                    {authors.map((author) => (
                      <option key={author.id} value={author.id}>
                        {author.name}
                      </option>
                    ))}
                  </select>
                  {errors.author_id && <p className="text-red-500 text-sm mt-1">{errors.author_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.category_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.price ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Book Type *
                  </label>
                  <select
                    value={formData.book_type}
                    onChange={(e) => handleInputChange('book_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ebook">E-Book</option>
                    <option value="physical">Physical Book</option>
                    <option value="both">Both Formats</option>
                  </select>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">File Upload</h3>
                
                {/* Cover Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Image *
                  </label>
                  <div
                    {...getCoverRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      fileErrors.cover_image ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <input {...getCoverInputProps()} />
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    {uploadedFiles.cover_image ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{uploadedFiles.cover_image.name}</p>
                        <p className="text-xs text-gray-500">
                          {(uploadedFiles.cover_image.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600">
                          Drag & drop a cover image, or <span className="text-blue-600">browse</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP up to 10MB</p>
                      </div>
                    )}
                  </div>
                  {fileErrors.cover_image && <p className="text-red-500 text-sm mt-1">{fileErrors.cover_image}</p>}
                </div>

                {/* E-Book File Upload */}
                {formData.book_type !== 'physical' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-Book File {formData.book_type === 'ebook' ? '*' : ''}
                    </label>
                    <div
                      {...getEbookRootProps()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        fileErrors.ebook_file ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <input {...getEbookInputProps()} />
                      <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                      {uploadedFiles.ebook_file ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">{uploadedFiles.ebook_file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(uploadedFiles.ebook_file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-600">
                            Drag & drop an e-book file, or <span className="text-blue-600">browse</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">EPUB, HTML up to 50MB</p>
                        </div>
                      )}
                    </div>
                    {fileErrors.ebook_file && <p className="text-red-500 text-sm mt-1">{fileErrors.ebook_file}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => handleInputChange('isbn', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter ISBN"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <input
                    type="text"
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="English"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pages</label>
                  <input
                    type="number"
                    value={formData.pages}
                    onChange={(e) => handleInputChange('pages', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Number of pages"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publication Date</label>
                  <input
                    type="date"
                    value={formData.publication_date}
                    onChange={(e) => handleInputChange('publication_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => handleInputChange('publisher', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Publisher name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Book description"
                  />
                </div>
              </div>

              {/* Inventory Settings */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="inventory_enabled"
                    checked={formData.inventory_enabled}
                    onChange={(e) => handleInputChange('inventory_enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="inventory_enabled" className="ml-2 text-sm font-medium text-gray-700">
                    Enable inventory tracking
                  </label>
                </div>

                {formData.inventory_enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stock_quantity}
                        onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.stock_quantity ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0"
                      />
                      {errors.stock_quantity && <p className="text-red-500 text-sm mt-1">{errors.stock_quantity}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Low Stock Threshold
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.low_stock_threshold}
                        onChange={(e) => handleInputChange('low_stock_threshold', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="10"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {errors.submit && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Progress Bar */}
            {isSubmitting && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {uploadProgress < 25 && 'Preparing upload...'}
                  {uploadProgress >= 25 && uploadProgress < 75 && 'Uploading files...'}
                  {uploadProgress >= 75 && 'Processing book...'}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <CloudArrowUpIcon className="w-4 h-4" />
                <span>{isSubmitting ? 'Uploading...' : 'Upload Book'}</span>
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
