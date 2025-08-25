"use client";

import { useState } from "react";
import { constructImageUrl } from "@/lib/imageUtils";

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
  description?: string;
  isbn?: string;
  publisher?: string;
  publication_date?: string;
}

interface BookDetailsModalProps {
  isOpen: boolean;
  book: Book;
  onClose: () => void;
  onEdit: (book: Book) => void;
}

export default function BookDetailsModal({ isOpen, book, onClose, onEdit }: BookDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'inventory' | 'analytics'>('details');

  if (!isOpen) return null;

  const handleEdit = () => {
    onEdit(book);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Book Details</h2>
            <div className="flex space-x-2">
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
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEdit}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <i className="ri-edit-line mr-1"></i>
              Edit
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
          {/* Book Overview */}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Book Cover */}
              <div className="flex-shrink-0">
                <div className="w-48 h-64 mx-auto lg:mx-0 relative">
                  <img
                    src={constructImageUrl(book.cover_image_url) || "/placeholder-book.jpg"}
                    alt={book.title}
                    className="w-full h-full object-cover rounded-lg shadow-lg"
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      book.format === 'ebook' ? 'bg-blue-500 text-white' : 
                      book.format === 'physical' ? 'bg-green-500 text-white' : 
                      'bg-purple-500 text-white'
                    }`}>
                      {book.format === 'ebook' ? 'Digital' : book.format === 'physical' ? 'Physical' : 'Both'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Book Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
                  <p className="text-lg text-gray-600 mb-1">by {book.author_name}</p>
                  <p className="text-sm text-gray-500">{book.category_name}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-bold text-green-600">₦{book.price.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">
                    Added {new Date(book.created_at).toLocaleDateString()}
                  </div>
                </div>

                {book.description && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{book.description}</p>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                  {book.pages && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900">{book.pages}</div>
                      <div className="text-xs text-gray-500">Pages</div>
                    </div>
                  )}
                  {book.file_size && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900">{book.file_size}</div>
                      <div className="text-xs text-gray-500">File Size</div>
                    </div>
                  )}
                  {book.inventory_enabled && book.stock_quantity !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900">{book.stock_quantity}</div>
                      <div className="text-xs text-gray-500">In Stock</div>
                    </div>
                  )}
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">{book.format}</div>
                    <div className="text-xs text-gray-500">Format</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="ri-information-line mr-2"></i>
                Details
              </button>
              {book.inventory_enabled && (
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === 'inventory'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <i className="ri-archive-line mr-2"></i>
                  Inventory
                </button>
              )}
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="ri-bar-chart-line mr-2"></i>
                Analytics
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Book Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Title:</span>
                        <span className="font-medium text-gray-900">{book.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Author:</span>
                        <span className="font-medium text-gray-900">{book.author_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium text-gray-900">{book.category_name}</span>
                      </div>
                      {book.isbn && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">ISBN:</span>
                          <span className="font-medium text-gray-900">{book.isbn}</span>
                        </div>
                      )}
                      {book.publisher && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Publisher:</span>
                          <span className="font-medium text-gray-900">{book.publisher}</span>
                        </div>
                      )}
                      {book.publication_date && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Published:</span>
                          <span className="font-medium text-gray-900">
                            {new Date(book.publication_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Technical Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Format:</span>
                        <span className="font-medium text-gray-900 capitalize">{book.format}</span>
                      </div>
                      {book.pages && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pages:</span>
                          <span className="font-medium text-gray-900">{book.pages}</span>
                        </div>
                      )}
                      {book.binding_type && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Binding:</span>
                          <span className="font-medium text-gray-900 capitalize">{book.binding_type}</span>
                        </div>
                      )}
                      {book.file_size && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">File Size:</span>
                          <span className="font-medium text-gray-900">{book.file_size}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium capitalize ${
                          book.status === 'published' ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {book.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active:</span>
                        <span className={`font-medium ${book.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {book.is_active ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Featured:</span>
                        <span className={`font-medium ${book.is_featured ? 'text-yellow-600' : 'text-gray-600'}`}>
                          {book.is_featured ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && book.inventory_enabled && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{book.stock_quantity || 0}</div>
                    <div className="text-sm text-blue-600">Current Stock</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-green-600">Sold This Month</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {book.stock_quantity && book.stock_quantity < 10 ? 'Low' : 'Good'}
                    </div>
                    <div className="text-sm text-orange-600">Stock Status</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Inventory Settings</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Track Inventory:</span>
                      <span className="font-medium text-green-600">Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Low Stock Alert:</span>
                      <span className="font-medium text-gray-900">10 units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Auto-reorder:</span>
                      <span className="font-medium text-gray-600">Disabled</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-blue-600">Total Views</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-green-600">Total Sales</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">₦0</div>
                    <div className="text-sm text-purple-600">Revenue</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">0%</div>
                    <div className="text-sm text-orange-600">Conversion</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Performance Insights</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-center">
                      Analytics data will be available once the book starts receiving views and sales.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <i className="ri-edit-line mr-2"></i>
                Edit Book
              </button>
              <button className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                <i className="ri-download-line mr-2"></i>
                Export
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}