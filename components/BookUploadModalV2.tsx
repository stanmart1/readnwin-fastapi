'use client';

import React, { useState } from 'react';

interface BookUploadModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onBookUploaded?: (bookData: any) => void;
  categories: Array<{ id: string; name: string }>;
  authors: Array<{ id: string; name: string }>;
}

export function BookUploadModalV2({ 
  isOpen, 
  onClose, 
  onBookUploaded, 
  categories, 
  authors 
}: BookUploadModalV2Props): React.ReactElement {
  const [uploadState, setUploadState] = useState({
    uploading: false,
    error: null as string | null
  });

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
    status: 'draft',
    is_featured: false
  });

  const [files, setFiles] = useState({
    cover_image: null as File | null,
    ebook_file: null as File | null
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover_image' | 'ebook_file') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const allowedTypes = type === 'cover_image' 
        ? ['image/jpeg', 'image/png', 'image/jpg']
        : ['application/pdf', 'application/epub+zip'];
      
      if (!allowedTypes.includes(file.type)) {
        setUploadState(prev => ({
          ...prev,
          error: `Invalid file type. Please select a valid ${type === 'cover_image' ? 'image' : 'ebook'} file.`
        }));
        return;
      }
      
      setFiles(prev => ({ ...prev, [type]: file }));
      setUploadState(prev => ({ ...prev, error: null }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, uploading: true, error: null }));

    try {
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') {
          formDataToSend.append(key, value.toString());
        }
      });

      // Append files
      if (files.cover_image) {
        formDataToSend.append('cover_image', files.cover_image);
      }
      if (files.ebook_file && formData.format === 'ebook') {
        formDataToSend.append('ebook_file', files.ebook_file);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      
      if (onBookUploaded) {
        onBookUploaded(result);
      }
      
      // Reset form
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
        status: 'draft',
        is_featured: false
      });
      setFiles({
        cover_image: null,
        ebook_file: null
      });
      
      onClose();
      
    } catch (error) {
      setUploadState(prev => ({ 
        ...prev, 
        uploading: false, 
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
    }
  };

  if (!isOpen) return <></>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-lg shadow-xl p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-semibold mb-6">Upload New Book</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block mb-2">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full border rounded p-2"
              />
            </div>

            <div>
              <label className="block mb-2">Format *</label>
              <select
                name="format"
                value={formData.format}
                onChange={handleInputChange}
                required
                className="w-full border rounded p-2"
              >
                <option value="ebook">E-Book</option>
                <option value="physical">Physical Book</option>
              </select>
            </div>

            <div>
              <label className="block mb-2">Author *</label>
              <select
                name="author_id"
                value={formData.author_id}
                onChange={handleInputChange}
                required
                className="w-full border rounded p-2"
              >
                <option value="">Select Author</option>
                {authors.map(author => (
                  <option key={author.id} value={author.id}>{author.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2">Category *</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                required
                className="w-full border rounded p-2"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2">Price *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full border rounded p-2"
              />
            </div>

            <div>
              <label className="block mb-2">ISBN</label>
              <input
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleInputChange}
                className="w-full border rounded p-2"
              />
            </div>

            {formData.format === 'physical' && (
              <div>
                <label className="block mb-2">Stock Quantity</label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full border rounded p-2"
                />
              </div>
            )}
          </div>

          <div className="w-full">
            <label className="block mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full border rounded p-2"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block mb-2">Cover Image *</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={(e) => handleFileSelect(e, 'cover_image')}
                required
                className="w-full border rounded p-2"
              />
            </div>

            {formData.format === 'ebook' && (
              <div>
                <label className="block mb-2">E-Book File *</label>
                <input
                  type="file"
                  accept=".pdf,.epub"
                  onChange={(e) => handleFileSelect(e, 'ebook_file')}
                  required
                  className="w-full border rounded p-2"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadState.uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {uploadState.uploading ? 'Uploading...' : 'Upload Book'}
            </button>
          </div>

          {uploadState.error && (
            <div className="text-red-600 mt-4">
              {uploadState.error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}