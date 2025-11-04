import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';

const BookEditModal = ({ isOpen, onClose, book, categories, authors, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    stock_quantity: '0',
    track_inventory: true,
    is_featured: false,
    status: 'published',
    cover_image: null,
    ebook_file: null
  });
  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState({ cover: false, ebook: false });
  
  const coverInputRef = useRef(null);
  const ebookInputRef = useRef(null);

  useEffect(() => {
    if (book && isOpen) {
      setFormData({
        title: book.title || '',
        author_id: book.author_id?.toString() || '',
        category_id: book.category_id?.toString() || '',
        price: book.price?.toString() || '',
        isbn: book.isbn || '',
        description: book.description || '',
        language: book.language || 'English',
        pages: book.pages?.toString() || '',
        publication_date: book.publication_date || '',
        publisher: book.publisher || '',
        format: book.format || 'ebook',
        stock_quantity: book.stock_quantity?.toString() || '0',
        track_inventory: book.inventory_enabled || false,
        is_featured: book.is_featured || false,
        status: book.status || 'published',
        cover_image: null,
        ebook_file: null
      });
      setCurrentStep(1);
      setErrors({});
    }
  }, [book, isOpen]);
  
  const resetForm = () => {
    setCurrentStep(1);
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
      stock_quantity: '0',
      track_inventory: true,
      is_featured: false,
      status: 'published',
      cover_image: null,
      ebook_file: null
    });
    setErrors({});
  };
  
  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };
  
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.author_id) newErrors.author_id = 'Author is required';
      if (!formData.category_id) newErrors.category_id = 'Category is required';
      if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
      if (!formData.format) newErrors.format = 'Book type is required';
    }
    
    if (step === 2) {
      if (!formData.cover_image && !book?.cover_image_url) newErrors.cover_image = 'Cover image is required';
      if (formData.format === 'ebook' && !formData.ebook_file && !book?.file_path) {
        newErrors.ebook_file = 'Book file is required for ebooks';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleDrag = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(prev => ({ ...prev, [type]: true }));
    } else if (e.type === 'dragleave') {
      setDragActive(prev => ({ ...prev, [type]: false }));
    }
  };
  
  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const field = type === 'cover' ? 'cover_image' : 'ebook_file';
      handleFileChange(field, files[0]);
    }
  };
  
  const handleFileChange = (field, file) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const handleSubmit = async () => {
    if (!validateStep(2) || !book) return;
    
    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      const submitData = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'cover_image' && key !== 'ebook_file' && value !== null && value !== '') {
          submitData.append(key, String(value));
        }
      });
      
      if (formData.cover_image) {
        submitData.append('cover_image', formData.cover_image);
      }
      if (formData.ebook_file) {
        submitData.append('ebook_file', formData.ebook_file);
      }
      
      const response = await api.put(`/admin/books/${book.id}`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });
      
      const bookTitle = response.data.book?.title || formData.title;
      alert(`Book "${bookTitle}" updated successfully!`);
      
      setTimeout(() => {
        onSuccess();
        resetForm();
        onClose();
      }, 500);
    } catch (error) {
      console.error('Update error:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || 'Update failed';
      alert(`Update failed: ${errorMessage}`);
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen || !book) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Book</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Step {currentStep} of 2 - {currentStep === 1 ? 'Book Information' : 'Upload Files'}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              currentStep >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>1</div>
            <div className={`flex-1 h-1 rounded-full ${
              currentStep >= 2 ? 'bg-orange-600' : 'bg-gray-200'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              currentStep >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>2</div>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Book Details</span>
            <span>Upload Files</span>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto max-h-[calc(95vh-220px)]">
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Book Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all ${
                      errors.title ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Enter the book title"
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1"><i className="ri-error-warning-line mr-1"></i>{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Author *</label>
                  <select
                    value={formData.author_id}
                    onChange={(e) => handleInputChange('author_id', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all appearance-none bg-white ${
                      errors.author_id ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <option value="">Select an author</option>
                    {authors.map(author => (
                      <option key={author.id} value={author.id}>{author.name}</option>
                    ))}
                  </select>
                  {errors.author_id && <p className="text-red-500 text-sm mt-1"><i className="ri-error-warning-line mr-1"></i>{errors.author_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all appearance-none bg-white ${
                      errors.category_id ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  {errors.category_id && <p className="text-red-500 text-sm mt-1"><i className="ri-error-warning-line mr-1"></i>{errors.category_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Price (₦) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all ${
                      errors.price ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.price && <p className="text-red-500 text-sm mt-1"><i className="ri-error-warning-line mr-1"></i>{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Book Type *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleInputChange('format', 'ebook')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        formData.format === 'ebook'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <i className="ri-smartphone-line text-xl mb-1 block"></i>
                      <span className="text-sm font-medium">Digital Ebook</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('format', 'physical')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        formData.format === 'physical'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <i className="ri-book-line text-xl mb-1 block"></i>
                      <span className="text-sm font-medium">Physical Book</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ISBN</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => handleInputChange('isbn', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="978-0-000-00000-0"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Book description..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <label className="text-sm font-semibold text-gray-800">Featured Book</label>
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                      className="h-4 w-4"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between gap-3 pt-4 border-t">
                <button type="button" onClick={handleClose} className="px-6 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                  Cancel
                </button>
                <button type="button" onClick={handleNext} className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:from-orange-700 hover:to-amber-700 transition-colors font-medium">
                  Next Step →
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image * {formData.cover_image && <span className="text-green-600">✓ New</span>} {book?.cover_image_url && !formData.cover_image && <span className="text-blue-600">(keeping current)</span>}
                </label>
                <div
                  onDragEnter={(e) => handleDrag(e, 'cover')}
                  onDragLeave={(e) => handleDrag(e, 'cover')}
                  onDragOver={(e) => handleDrag(e, 'cover')}
                  onDrop={(e) => handleDrop(e, 'cover')}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    dragActive.cover ? 'border-orange-500 bg-orange-50' : 
                    errors.cover_image ? 'border-red-500' : 'border-gray-300 hover:border-orange-400'
                  }`}
                  onClick={() => coverInputRef.current?.click()}
                >
                  <i className="ri-image-add-line text-4xl text-gray-400 mb-2"></i>
                  <p className="text-sm text-gray-600">{formData.cover_image ? formData.cover_image.name : 'Drag & drop cover or click to browse'}</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG, WebP, GIF up to 10MB</p>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif"
                    onChange={(e) => e.target.files[0] && handleFileChange('cover_image', e.target.files[0])}
                    className="hidden"
                  />
                </div>
                {errors.cover_image && <p className="text-red-500 text-sm mt-1">{errors.cover_image}</p>}
              </div>

              {formData.format === 'ebook' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Book File {formData.ebook_file && <span className="text-green-600">✓ New</span>} {book?.file_path && !formData.ebook_file && <span className="text-blue-600">(keeping current)</span>}
                  </label>
                  <div
                    onDragEnter={(e) => handleDrag(e, 'ebook')}
                    onDragLeave={(e) => handleDrag(e, 'ebook')}
                    onDragOver={(e) => handleDrag(e, 'ebook')}
                    onDrop={(e) => handleDrop(e, 'ebook')}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      dragActive.ebook ? 'border-orange-500 bg-orange-50' : 
                      errors.ebook_file ? 'border-red-500' : 'border-gray-300 hover:border-orange-400'
                    }`}
                    onClick={() => ebookInputRef.current?.click()}
                  >
                    <i className="ri-file-pdf-line text-4xl text-gray-400 mb-2"></i>
                    <p className="text-sm text-gray-600">{formData.ebook_file ? formData.ebook_file.name : 'Drag & drop book file or click'}</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, EPUB, MOBI, HTML up to 500MB</p>
                    <input
                      ref={ebookInputRef}
                      type="file"
                      accept=".pdf,.epub,.mobi,.html,.htm"
                      onChange={(e) => e.target.files[0] && handleFileChange('ebook_file', e.target.files[0])}
                      className="hidden"
                    />
                  </div>
                  {errors.ebook_file && <p className="text-red-500 text-sm mt-1">{errors.ebook_file}</p>}
                </div>
              )}

              {isSubmitting && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-900">Updating...</span>
                    <span className="text-sm font-medium text-orange-900">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-orange-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <div className="flex justify-between gap-3 pt-4">
                <button type="button" onClick={handlePrevious} disabled={isSubmitting} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                  Previous
                </button>
                <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-gradient-to-r from-orange-600 to-purple-600 text-white rounded-lg hover:from-orange-700 hover:to-purple-700 transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Updating...' : 'Update Book'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookEditModal;
