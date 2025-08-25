'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface EnhancedBookUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: any[];
  authors: any[];
}

export default function EnhancedBookUploadModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  categories, 
  authors 
}: EnhancedBookUploadModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookType, setBookType] = useState<'ebook' | 'physical' | 'both'>('ebook');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [filePreview, setFilePreview] = useState<{cover?: string, ebook?: string, sample?: string}>({});
  
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    author_id: '',
    new_author_name: '',
    category_id: '',
    isbn: '',
    description: '',
    language: 'English',
    
    // Pricing & Availability
    ebook_price: '',
    physical_price: '',
    discount_percentage: '',
    is_featured: false,
    status: 'published',
    
    // Physical Book Details
    publisher: '',
    pages: '',
    publication_date: '',
    weight: '',
    dimensions: '',
    binding_type: 'paperback',
    
    // Inventory Management (optional)
    inventory_enabled: false,
    stock_quantity: '',
    low_stock_threshold: '10',
    
    // Digital Details
    file_size: '',
    drm_protected: false,
    download_limit: '3',
    
    // SEO & Marketing
    meta_title: '',
    meta_description: '',
    tags: '',
    
    // Files
    cover_image: null as File | null,
    ebook_file: null as File | null,
    sample_file: null as File | null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { id: 1, title: 'Book Type & Basic Info', icon: 'ri-book-line' },
    { id: 2, title: 'Pricing & Details', icon: 'ri-price-tag-line' },
    { id: 3, title: 'Files & Media', icon: 'ri-upload-line' },
    { id: 4, title: 'SEO & Publishing', icon: 'ri-rocket-line' }
  ];

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      title: '', author_id: '', new_author_name: '', category_id: '', isbn: '', description: '', language: 'English',
      ebook_price: '', physical_price: '', discount_percentage: '', is_featured: false, status: 'published',
      publisher: '', pages: '', publication_date: '', weight: '', dimensions: '', binding_type: 'paperback',
      inventory_enabled: false, stock_quantity: '', low_stock_threshold: '10',
      file_size: '', drm_protected: false, download_limit: '3',
      meta_title: '', meta_description: '', tags: '',
      cover_image: null, ebook_file: null, sample_file: null
    });
    setErrors({});
    setBookType('ebook');
    setUploadProgress(0);
    setUploadStatus('');
    setFilePreview({});
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Sanitize and validate title
      const sanitizedTitle = formData.title.trim().replace(/[<>"']/g, '');
      if (!sanitizedTitle || sanitizedTitle.length < 1) {
        newErrors.title = 'Title is required and must contain valid characters';
      } else if (sanitizedTitle.length > 200) {
        newErrors.title = 'Title must be less than 200 characters';
      }
      
      if (formData.author_id === 'new') {
        if (!formData.new_author_name || formData.new_author_name.trim().length < 2) {
          newErrors.new_author_name = 'Author name must be at least 2 characters';
        } else if (formData.new_author_name.trim().length > 100) {
          newErrors.new_author_name = 'Author name must be less than 100 characters';
        }
      } else if (!formData.author_id || parseInt(formData.author_id) <= 0) {
        newErrors.author_id = 'Valid author is required';
      }
      if (!formData.category_id || parseInt(formData.category_id) <= 0) {
        newErrors.category_id = 'Valid category is required';
      }
      
      // Validate ISBN if provided
      if (formData.isbn) {
        const isbn = formData.isbn.replace(/[-\s]/g, '');
        if (!/^(?:\d{9}[\dX]|\d{13})$/.test(isbn)) {
          newErrors.isbn = 'Invalid ISBN format';
        }
      }
    }

    if (step === 2) {
      if (bookType === 'ebook' || bookType === 'both') {
        const ebookPrice = parseFloat(formData.ebook_price);
        if (!formData.ebook_price || isNaN(ebookPrice) || ebookPrice <= 0 || ebookPrice > 999999.99) {
          newErrors.ebook_price = 'Valid ebook price is required (0.01 - 999,999.99)';
        }
      }
      if (bookType === 'physical' || bookType === 'both') {
        const physicalPrice = parseFloat(formData.physical_price);
        if (!formData.physical_price || isNaN(physicalPrice) || physicalPrice <= 0 || physicalPrice > 999999.99) {
          newErrors.physical_price = 'Valid physical book price is required (0.01 - 999,999.99)';
        }
        const sanitizedPublisher = formData.publisher.trim().replace(/[<>"']/g, '');
        if (!sanitizedPublisher) {
          newErrors.publisher = 'Publisher is required for physical books';
        } else if (sanitizedPublisher.length > 200) {
          newErrors.publisher = 'Publisher name must be less than 200 characters';
        }
        
        // Validate pages if provided
        if (formData.pages) {
          const pages = parseInt(formData.pages);
          if (isNaN(pages) || pages <= 0 || pages > 10000) {
            newErrors.pages = 'Pages must be between 1 and 10,000';
          }
        }
        
        // Validate stock quantity if inventory is enabled
        if (formData.inventory_enabled) {
          const stock = parseInt(formData.stock_quantity);
          if (isNaN(stock) || stock < 0 || stock > 999999) {
            newErrors.stock_quantity = 'Stock quantity must be between 0 and 999,999';
          }
        }
      }
    }

    if (step === 3) {
      if (!formData.cover_image) {
        newErrors.cover_image = 'Cover image is required';
      } else {
        // Validate cover image
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedImageTypes.includes(formData.cover_image.type)) {
          newErrors.cover_image = 'Cover image must be JPEG, PNG, WebP, or GIF';
        } else if (formData.cover_image.size > 5 * 1024 * 1024) {
          newErrors.cover_image = 'Cover image must be less than 5MB';
        }
      }
      
      if ((bookType === 'ebook' || bookType === 'both') && !formData.ebook_file) {
        newErrors.ebook_file = 'Ebook file is required';
      } else if (formData.ebook_file) {
        // Validate ebook file
        const allowedEbookTypes = ['application/epub+zip', 'application/pdf'];
        if (!allowedEbookTypes.includes(formData.ebook_file.type)) {
          newErrors.ebook_file = 'Ebook file must be EPUB or PDF';
        } else if (formData.ebook_file.size > 50 * 1024 * 1024) {
          newErrors.ebook_file = 'Ebook file must be less than 50MB';
        }
      }
      
      // Validate sample file if provided
      if (formData.sample_file) {
        if (formData.sample_file.type !== 'application/pdf') {
          newErrors.sample_file = 'Sample file must be PDF';
        } else if (formData.sample_file.size > 10 * 1024 * 1024) {
          newErrors.sample_file = 'Sample file must be less than 10MB';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadStatus('Starting upload...');

    try {
      // Final validation before submission
      if (!formData.title.trim() || (!formData.author_id && !formData.new_author_name) || !formData.category_id) {
        throw new Error('Required fields are missing');
      }
      
      // Handle new author creation
      let authorId = formData.author_id;
      if (formData.author_id === 'new' && formData.new_author_name.trim()) {
        try {
          setUploadStatus('Creating new author...');
          setUploadProgress(10);
          
          const token = localStorage.getItem('token');
          const authorResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/authors`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: formData.new_author_name.trim(),
              email: "",
              bio: "",
              website: ""
            })
          });
          
          if (authorResponse.ok) {
            const authorResult = await authorResponse.json();
            authorId = authorResult.author?.id || authorResult.id;
            setUploadProgress(20);
            setUploadStatus('Author created successfully!');
            toast.success(`Author "${formData.new_author_name}" created!`);
          } else {
            let errorMessage = 'Failed to create new author';
            try {
              const errorData = await authorResponse.json();
              if (typeof errorData.detail === 'string') {
                errorMessage = errorData.detail;
              } else if (errorData.message) {
                errorMessage = errorData.message;
              } else if (errorData.detail && Array.isArray(errorData.detail)) {
                errorMessage = errorData.detail.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
              }
            } catch (parseError) {
              errorMessage = `HTTP ${authorResponse.status}: ${authorResponse.statusText}`;
            }
            throw new Error(errorMessage);
          }
        } catch (error: any) {
          setUploadStatus('Failed to create author');
          const errorMessage = error.message || 'Unknown error occurred';
          console.error('Author creation failed:', error);
          throw new Error(`Failed to create new author: ${errorMessage}`);
        }
      }
      
      if (!formData.cover_image) {
        throw new Error('Cover image is required');
      }
      
      const submitData = new FormData();
      
      // Sanitize and map form fields to backend expected names
      const sanitizedTitle = formData.title.trim().replace(/[<>"']/g, '').substring(0, 200);
      submitData.append('title', sanitizedTitle);
      submitData.append('author_id', authorId);
      submitData.append('category_id', formData.category_id);
      
      const price = bookType === 'ebook' ? formData.ebook_price : formData.physical_price;
      const validatedPrice = Math.min(Math.max(parseFloat(price), 0.01), 999999.99);
      submitData.append('price', validatedPrice.toString());
      if (formData.isbn) {
        const cleanIsbn = formData.isbn.replace(/[-\s]/g, '');
        submitData.append('isbn', cleanIsbn);
      }
      if (formData.description) {
        // Sanitize description - remove HTML tags and limit length
        const sanitizedDesc = formData.description
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, '')
          .trim()
          .substring(0, 5000);
        submitData.append('description', sanitizedDesc);
      }
      submitData.append('language', formData.language);
      if (formData.pages) submitData.append('pages', formData.pages);
      if (formData.publisher) submitData.append('publisher', formData.publisher);
      if (formData.weight) submitData.append('weight_grams', formData.weight);
      if (formData.dimensions) submitData.append('dimensions', formData.dimensions);
      
      // Inventory fields (only if enabled)
      submitData.append('inventory_enabled', String(formData.inventory_enabled));
      if (formData.inventory_enabled) {
        submitData.append('stock_quantity', formData.stock_quantity || '0');
        submitData.append('low_stock_threshold', formData.low_stock_threshold || '10');
      }
      
      // Status and features
      submitData.append('status', formData.status);
      submitData.append('is_featured', String(formData.is_featured));
      
      // SEO fields
      if (formData.meta_title) submitData.append('seo_title', formData.meta_title);
      if (formData.meta_description) submitData.append('seo_description', formData.meta_description);
      if (formData.tags) submitData.append('seo_keywords', formData.tags);

      // Add files
      if (formData.cover_image) submitData.append('cover_image', formData.cover_image);
      if (formData.ebook_file) submitData.append('ebook_file', formData.ebook_file);
      if (formData.sample_file) submitData.append('sample_file', formData.sample_file);

      submitData.append('book_type', bookType);
      submitData.append('format', bookType);
      
      setUploadStatus('Uploading book data...');
      setUploadProgress(50);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: submitData
      });

      setUploadStatus('Processing upload...');
      setUploadProgress(80);
      const result = await response.json();

      if (response.ok) {
        setUploadProgress(100);
        setUploadStatus('Book created successfully!');
        toast.success(`Book "${formData.title}" created successfully!`);
        setTimeout(() => {
          onClose();
          onSuccess();
        }, 1500);
      } else {
        const errorMessage = result.detail || result.message || 'Failed to create book';
        setUploadStatus('Upload failed');
        toast.error(errorMessage);
        setUploadProgress(0);
        
        // Show detailed error information
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, message]) => {
            toast.error(`${field}: ${message}`);
          });
        }
      }
    } catch (error: any) {
      console.error('Book creation error:', error);
      const errorMessage = error.message || 'An error occurred while creating the book';
      setUploadStatus('Upload failed');
      toast.error(errorMessage);
      setUploadProgress(0);
      
      // Log detailed error for debugging
      console.error('Detailed error:', {
        message: error.message,
        stack: error.stack,
        formData: {
          title: formData.title,
          author_id: formData.author_id,
          new_author_name: formData.new_author_name,
          category_id: formData.category_id,
          files: {
            cover_image: formData.cover_image?.name,
            ebook_file: formData.ebook_file?.name,
            sample_file: formData.sample_file?.name
          }
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Book Type Selection */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">What type of book are you adding?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { value: 'ebook', label: 'Digital Only', icon: 'ri-smartphone-line', desc: 'EPUB files only' },
            { value: 'physical', label: 'Physical Only', icon: 'ri-book-line', desc: 'Printed books with inventory' },
            { value: 'both', label: 'Both Formats', icon: 'ri-stack-line', desc: 'Digital + Physical versions' }
          ].map((type) => (
            <label key={type.value} className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
              bookType === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                value={type.value}
                checked={bookType === type.value}
                onChange={(e) => setBookType(e.target.value as any)}
                className="sr-only"
              />
              <div className="text-center">
                <i className={`${type.icon} text-2xl mb-2 ${bookType === type.value ? 'text-blue-600' : 'text-gray-400'}`}></i>
                <div className="font-medium">{type.label}</div>
                <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Book Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter the book title"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Author *</label>
          <select
            value={formData.author_id}
            onChange={(e) => {
              setFormData(prev => ({ 
                ...prev, 
                author_id: e.target.value,
                new_author_name: e.target.value === 'new' ? prev.new_author_name : ''
              }));
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.author_id ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Author</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>{author.name}</option>
            ))}
            <option value="new">+ Add New Author</option>
          </select>
          {formData.author_id === 'new' && (
            <input
              type="text"
              value={formData.new_author_name}
              onChange={(e) => setFormData(prev => ({ ...prev, new_author_name: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 mt-2 ${
                errors.new_author_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter new author name"
            />
          )}
          {errors.author_id && <p className="text-red-500 text-sm mt-1">{errors.author_id}</p>}
          {errors.new_author_name && <p className="text-red-500 text-sm mt-1">{errors.new_author_name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Category *</label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.category_id ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">ISBN</label>
          <input
            type="text"
            value={formData.isbn}
            onChange={(e) => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="ISBN-13 or ISBN-10"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Describe the book content, plot, or key features..."
          maxLength={1000}
        />
        <div className="text-xs text-gray-500 mt-1">{formData.description.length}/1000 characters</div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Pricing */}
      <div className="bg-green-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(bookType === 'ebook' || bookType === 'both') && (
            <div>
              <label className="block text-sm font-medium mb-2">Digital Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">₦</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.ebook_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, ebook_price: e.target.value }))}
                  className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.ebook_price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.ebook_price && <p className="text-red-500 text-sm mt-1">{errors.ebook_price}</p>}
            </div>
          )}

          {(bookType === 'physical' || bookType === 'both') && (
            <div>
              <label className="block text-sm font-medium mb-2">Physical Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">₦</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.physical_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, physical_price: e.target.value }))}
                  className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.physical_price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.physical_price && <p className="text-red-500 text-sm mt-1">{errors.physical_price}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Physical Book Details */}
      {(bookType === 'physical' || bookType === 'both') && (
        <div className="bg-blue-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">Physical Book Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Publisher *</label>
              <input
                type="text"
                value={formData.publisher}
                onChange={(e) => setFormData(prev => ({ ...prev, publisher: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.publisher ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Publisher name"
              />
              {errors.publisher && <p className="text-red-500 text-sm mt-1">{errors.publisher}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Binding Type</label>
              <select
                value={formData.binding_type}
                onChange={(e) => setFormData(prev => ({ ...prev, binding_type: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="paperback">Paperback</option>
                <option value="hardcover">Hardcover</option>
                <option value="spiral">Spiral Bound</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Pages</label>
              <input
                type="number"
                value={formData.pages}
                onChange={(e) => setFormData(prev => ({ ...prev, pages: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Number of pages"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Weight (grams)</label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Book weight in grams"
              />
            </div>
          </div>

          {/* Optional Inventory Management */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900">Inventory Tracking</h4>
                <p className="text-sm text-gray-600">Optional: Track stock levels for physical books</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.inventory_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, inventory_enabled: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium">{formData.inventory_enabled ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>

            {formData.inventory_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">Initial Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Available units"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Alert when stock is low"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium mb-2">Cover Image *</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setFormData(prev => ({ ...prev, cover_image: file }));
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  setFilePreview(prev => ({ ...prev, cover: e.target?.result as string }));
                };
                reader.readAsDataURL(file);
              }
            }}
            className="hidden"
            id="cover-upload"
          />
          <label htmlFor="cover-upload" className="cursor-pointer">
            {filePreview.cover ? (
              <div className="space-y-2">
                <img src={filePreview.cover} alt="Cover preview" className="w-24 h-32 object-cover mx-auto rounded" />
                <p className="text-green-600 text-sm font-medium">✓ Cover image selected</p>
                <p className="text-xs text-gray-500">{formData.cover_image?.name}</p>
              </div>
            ) : (
              <div>
                <i className="ri-image-line text-4xl text-gray-400 mb-2"></i>
                <p className="text-gray-600">Click to upload cover image</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, WebP up to 5MB</p>
              </div>
            )}
          </label>
        </div>
        {errors.cover_image && <p className="text-red-500 text-sm mt-1">{errors.cover_image}</p>}
      </div>

      {/* Ebook File */}
      {(bookType === 'ebook' || bookType === 'both') && (
        <div>
          <label className="block text-sm font-medium mb-2">Ebook File *</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".epub,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setFormData(prev => ({ ...prev, ebook_file: file }));
                if (file) {
                  setFilePreview(prev => ({ ...prev, ebook: file.name }));
                }
              }}
              className="hidden"
              id="ebook-upload"
            />
            <label htmlFor="ebook-upload" className="cursor-pointer">
              {filePreview.ebook ? (
                <div className="space-y-2">
                  <i className="ri-file-check-line text-4xl text-green-500 mb-2"></i>
                  <p className="text-green-600 text-sm font-medium">✓ Ebook file selected</p>
                  <p className="text-xs text-gray-500">{filePreview.ebook}</p>
                  <p className="text-xs text-gray-400">{((formData.ebook_file?.size || 0) / (1024*1024)).toFixed(1)} MB</p>
                </div>
              ) : (
                <div>
                  <i className="ri-file-text-line text-4xl text-gray-400 mb-2"></i>
                  <p className="text-gray-600">Click to upload ebook file</p>
                  <p className="text-xs text-gray-500 mt-1">EPUB or PDF up to 50MB</p>
                </div>
              )}
            </label>
          </div>
          {errors.ebook_file && <p className="text-red-500 text-sm mt-1">{errors.ebook_file}</p>}
        </div>
      )}

      {/* Sample File */}
      <div>
        <label className="block text-sm font-medium mb-2">Sample/Preview File (Optional)</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setFormData(prev => ({ ...prev, sample_file: file }));
              if (file) {
                setFilePreview(prev => ({ ...prev, sample: file.name }));
              }
            }}
            className="hidden"
            id="sample-upload"
          />
          <label htmlFor="sample-upload" className="cursor-pointer">
            {filePreview.sample ? (
              <div className="space-y-2">
                <i className="ri-file-pdf-line text-4xl text-red-500 mb-2"></i>
                <p className="text-green-600 text-sm font-medium">✓ Sample file selected</p>
                <p className="text-xs text-gray-500">{filePreview.sample}</p>
              </div>
            ) : (
              <div>
                <i className="ri-eye-line text-4xl text-gray-400 mb-2"></i>
                <p className="text-gray-600">Upload sample pages for preview</p>
                <p className="text-xs text-gray-500 mt-1">PDF up to 10MB (Optional)</p>
              </div>
            )}
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      {/* SEO Settings */}
      <div className="bg-purple-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">SEO & Marketing</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Meta Title</label>
            <input
              type="text"
              value={formData.meta_title}
              onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="SEO title for search engines"
              maxLength={60}
            />
            <div className="text-xs text-gray-500 mt-1">{formData.meta_title.length}/60 characters</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="fiction, romance, bestseller (comma separated)"
            />
          </div>
        </div>
      </div>

      {/* Publishing Options */}
      <div className="bg-green-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">Publishing Options</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="pending">Pending Review</option>
            </select>
          </div>

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
              className="mr-3"
            />
            <span className="font-medium">Feature this book</span>
          </label>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Add New Book</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  <i className={step.icon}></i>
                </div>
                <div className="ml-3 hidden sm:block">
                  <div className={`text-sm font-medium ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'}`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-1 mx-4 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Progress Bar */}
        {isSubmitting && (
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium text-blue-800">{uploadStatus || 'Processing...'}</span>
              </div>
              <span className="text-sm text-blue-600 font-semibold">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            {uploadProgress > 0 && (
              <div className="mt-2 text-xs text-blue-600">
                {uploadProgress < 25 && 'Validating files...'}
                {uploadProgress >= 25 && uploadProgress < 50 && 'Creating author...'}
                {uploadProgress >= 50 && uploadProgress < 75 && 'Uploading files...'}
                {uploadProgress >= 75 && uploadProgress < 100 && 'Finalizing book...'}
                {uploadProgress === 100 && 'Complete!'}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-600 disabled:opacity-50"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Previous
          </button>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
                <i className="ri-arrow-right-line ml-2"></i>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Book'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}