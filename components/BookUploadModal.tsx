'use client';

import React, { useState, useCallback } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, PlusIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';

interface BookFormData {
  title: string;
  subtitle?: string;
  author_id?: number;
  category_id?: number;
  isbn?: string;
  description?: string;
  short_description?: string;
  language: string;
  pages?: number;
  publication_date?: string;
  publisher?: string;
  price: number;
  original_price?: number;
  cost_price?: number;
  weight_grams?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  shipping_class?: string;
  stock_quantity?: number;
  low_stock_threshold?: number;
  inventory_enabled: boolean;
  status: 'draft' | 'published' | 'archived' | 'out_of_stock';
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_release: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
}

interface UploadedFiles {
  cover?: File;
  ebook?: File;
  audiobook?: File;
  sample?: File;
}

interface UploadProgress {
  cover?: number;
  ebook?: number;
  audiobook?: number;
  sample?: number;
}

interface BookUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (book: any) => void;
  editMode?: boolean;
  bookId?: number;
}

const uploadSteps = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Enter book title, author, and category',
    icon: '📝'
  },
  {
    id: 2,
    title: 'Upload Files',
    description: 'Upload cover image and book files',
    icon: '📁'
  },
  {
    id: 3,
    title: 'Pricing & Inventory',
    description: 'Set pricing and inventory options',
    icon: '💰'
  },
  {
    id: 4,
    title: 'Review & Publish',
    description: 'Review details and publish',
    icon: '✅'
  }
];

export default function BookUploadModal({
  isOpen,
  onClose,
  onSuccess,
  editMode = false,
  bookId
}: BookUploadModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    language: 'English',
    price: 0,
    inventory_enabled: false,
    status: 'draft',
    is_featured: false,
    is_bestseller: false,
    is_new_release: false
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, uploadSteps.length));
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.author_id) newErrors.author_id = 'Author is required';
        if (!formData.category_id) newErrors.category_id = 'Category is required';
        if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
        break;
      case 2:
        if (!uploadedFiles.cover) newErrors.cover = 'Cover image is required';
        break;
      case 3:
        if (formData.inventory_enabled && (formData.stock_quantity || 0) < 0) {
          newErrors.stock_quantity = 'Stock quantity cannot be negative';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            formDataToSend.append(key, JSON.stringify(value));
          } else {
            formDataToSend.append(key, String(value));
          }
        }
      });

      // Add files
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        if (file) {
          formDataToSend.append(key === 'cover' ? 'cover_image' : `${key}_file`, file);
        }
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result.book);
        onClose();
      } else {
        const error = await response.json();
        setErrors({ submit: error.message || 'Failed to create book' });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof BookFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-6xl w-full bg-white rounded-xl shadow-2xl">
          <div className="flex h-full max-h-[90vh]">
            {/* Left Sidebar - Progress Steps */}
            <div className="w-80 bg-gray-50 p-6 rounded-l-xl">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  {editMode ? 'Edit Book' : 'Add New Book'}
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {uploadSteps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      currentStep === step.id
                        ? 'bg-blue-50 border border-blue-200'
                        : currentStep > step.id
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                        currentStep === step.id
                          ? 'bg-blue-600 text-white'
                          : currentStep > step.id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {currentStep > step.id ? '✓' : step.icon}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{step.title}</div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto">
                {currentStep === 1 && (
                  <BasicInfoStep
                    formData={formData}
                    updateFormData={updateFormData}
                    errors={errors}
                  />
                )}
                
                {currentStep === 2 && (
                  <FileUploadStep
                    uploadedFiles={uploadedFiles}
                    setUploadedFiles={setUploadedFiles}
                    uploadProgress={uploadProgress}
                    errors={errors}
                  />
                )}
                
                {currentStep === 3 && (
                  <PricingInventoryStep
                    formData={formData}
                    updateFormData={updateFormData}
                    errors={errors}
                  />
                )}
                
                {currentStep === 4 && (
                  <ReviewPublishStep
                    formData={formData}
                    uploadedFiles={uploadedFiles}
                    errors={errors}
                  />
                )}

                {/* Error Display */}
                {errors.submit && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{errors.submit}</p>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <button
                    onClick={handlePreviousStep}
                    disabled={currentStep === 1}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <div className="flex gap-3">
                    {currentStep < uploadSteps.length ? (
                      <button
                        onClick={handleNextStep}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Create Book
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// Step Components
function BasicInfoStep({
  formData,
  updateFormData,
  errors
}: {
  formData: BookFormData;
  updateFormData: (field: keyof BookFormData, value: any) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateFormData('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter book title"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtitle
            </label>
            <input
              type="text"
              value={formData.subtitle || ''}
              onChange={(e) => updateFormData('subtitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter subtitle (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Author *
            </label>
            <select
              value={formData.author_id || ''}
              onChange={(e) => updateFormData('author_id', e.target.value ? parseInt(e.target.value) : undefined)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.author_id ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select author</option>
              {/* Author options would be populated from API */}
            </select>
            {errors.author_id && <p className="text-red-500 text-xs mt-1">{errors.author_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category_id || ''}
              onChange={(e) => updateFormData('category_id', e.target.value ? parseInt(e.target.value) : undefined)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.category_id ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select category</option>
              {/* Category options would be populated from API */}
            </select>
            {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ISBN
            </label>
            <input
              type="text"
              value={formData.isbn || ''}
              onChange={(e) => updateFormData('isbn', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter ISBN (optional)"
            />
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
              onChange={(e) => updateFormData('price', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.price ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => updateFormData('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter book description"
          />
        </div>
      </div>
    </div>
  );
}

function FileUploadStep({
  uploadedFiles,
  setUploadedFiles,
  uploadProgress,
  errors
}: {
  uploadedFiles: UploadedFiles;
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFiles>>;
  uploadProgress: UploadProgress;
  errors: Record<string, string>;
}) {
  const onDrop = useCallback((acceptedFiles: File[], fileType: keyof UploadedFiles) => {
    if (acceptedFiles.length > 0) {
      setUploadedFiles(prev => ({ ...prev, [fileType]: acceptedFiles[0] }));
    }
  }, [setUploadedFiles]);

  const FileUploadZone = ({ 
    title, 
    fileType, 
    acceptedTypes, 
    maxSize, 
    description 
  }: {
    title: string;
    fileType: keyof UploadedFiles;
    acceptedTypes: string[];
    maxSize: string;
    description: string;
  }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (files) => onDrop(files, fileType),
      accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
      maxSize: parseInt(maxSize) * 1024 * 1024,
      multiple: false
    });

    const file = uploadedFiles[fileType];
    const progress = uploadProgress[fileType];

    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          {title}
        </label>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : file
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          
          {file ? (
            <div className="space-y-2">
              <CloudArrowUpIcon className="mx-auto h-8 w-8 text-green-500" />
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              {progress !== undefined && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadedFiles(prev => ({ ...prev, [fileType]: undefined }));
                }}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <CloudArrowUpIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">{description}</p>
              <p className="text-xs text-gray-500">
                Max size: {maxSize} • Accepted: {acceptedTypes.join(', ')}
              </p>
            </div>
          )}
        </div>
        
        {errors[fileType] && (
          <p className="text-red-500 text-xs">{errors[fileType]}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Files</h3>
        
        <div className="space-y-6">
          <FileUploadZone
            title="Cover Image *"
            fileType="cover"
            acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
            maxSize="5"
            description="Drag and drop a cover image, or click to browse"
          />
          
          <FileUploadZone
            title="Ebook File"
            fileType="ebook"
            acceptedTypes={['.pdf', '.epub', '.mobi']}
            maxSize="100"
            description="Drag and drop an ebook file, or click to browse"
          />
          
          <FileUploadZone
            title="Audiobook File (Optional)"
            fileType="audiobook"
            acceptedTypes={['audio/mpeg', 'audio/mp4', 'audio/wav']}
            maxSize="500"
            description="Drag and drop an audiobook file, or click to browse"
          />
          
          <FileUploadZone
            title="Sample PDF (Optional)"
            fileType="sample"
            acceptedTypes={['.pdf']}
            maxSize="10"
            description="Drag and drop a sample PDF, or click to browse"
          />
        </div>
      </div>
    </div>
  );
}

function PricingInventoryStep({
  formData,
  updateFormData,
  errors
}: {
  formData: BookFormData;
  updateFormData: (field: keyof BookFormData, value: any) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing & Inventory</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Price
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.original_price || ''}
              onChange={(e) => updateFormData('original_price', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost Price
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_price || ''}
              onChange={(e) => updateFormData('cost_price', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity
            </label>
            <input
              type="number"
              min="0"
              value={formData.stock_quantity || ''}
              onChange={(e) => updateFormData('stock_quantity', e.target.value ? parseInt(e.target.value) : undefined)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.stock_quantity ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0"
            />
            {errors.stock_quantity && <p className="text-red-500 text-xs mt-1">{errors.stock_quantity}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Low Stock Threshold
            </label>
            <input
              type="number"
              min="0"
              value={formData.low_stock_threshold || ''}
              onChange={(e) => updateFormData('low_stock_threshold', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="10"
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.inventory_enabled}
              onChange={(e) => updateFormData('inventory_enabled', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Enable inventory tracking</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => updateFormData('is_featured', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Featured book</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_bestseller}
              onChange={(e) => updateFormData('is_bestseller', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Bestseller</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_new_release}
              onChange={(e) => updateFormData('is_new_release', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">New release</span>
          </label>
        </div>
      </div>
    </div>
  );
}

function ReviewPublishStep({
  formData,
  uploadedFiles,
  errors
}: {
  formData: BookFormData;
  uploadedFiles: UploadedFiles;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Review & Publish</h3>
        
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Book Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Title:</span>
                <span className="ml-2 font-medium">{formData.title}</span>
              </div>
              {formData.subtitle && (
                <div>
                  <span className="text-gray-500">Subtitle:</span>
                  <span className="ml-2 font-medium">{formData.subtitle}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Price:</span>
                <span className="ml-2 font-medium">${formData.price}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 font-medium capitalize">{formData.status}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Uploaded Files</h4>
            <div className="space-y-2 text-sm">
              {uploadedFiles.cover && (
                <div className="flex items-center">
                  <span className="text-green-600">✓</span>
                  <span className="ml-2">Cover image: {uploadedFiles.cover.name}</span>
                </div>
              )}
              {uploadedFiles.ebook && (
                <div className="flex items-center">
                  <span className="text-green-600">✓</span>
                  <span className="ml-2">Ebook: {uploadedFiles.ebook.name}</span>
                </div>
              )}
              {uploadedFiles.audiobook && (
                <div className="flex items-center">
                  <span className="text-green-600">✓</span>
                  <span className="ml-2">Audiobook: {uploadedFiles.audiobook.name}</span>
                </div>
              )}
              {uploadedFiles.sample && (
                <div className="flex items-center">
                  <span className="text-green-600">✓</span>
                  <span className="ml-2">Sample: {uploadedFiles.sample.name}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Settings</h4>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-gray-500">Inventory tracking:</span>
                <span className="ml-2 font-medium">{formData.inventory_enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              {formData.inventory_enabled && (
                <div>
                  <span className="text-gray-500">Stock quantity:</span>
                  <span className="ml-2 font-medium">{formData.stock_quantity || 0}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Featured:</span>
                <span className="ml-2 font-medium">{formData.is_featured ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 