'use client';

import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

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

interface BookFiltersPanelProps {
  filters: BookFilters;
  onFilterChange: (filters: BookFilters) => void;
  categories: Array<{ id: string; name: string }>;
  authors: Array<{ id: string; name: string }>;
}

export default function BookFiltersPanel({
  filters,
  onFilterChange,
  categories,
  authors
}: BookFiltersPanelProps) {
  const handleFilterChange = (key: keyof BookFilters, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <FunnelIcon className="h-5 w-5 mr-2" />
          Filters
        </h3>
        <button
          onClick={() => onFilterChange({
            search: '',
            status: '',
            category_id: '',
            format: '',
            price_range: '',
            featured: false,
            bestseller: false,
            new_release: false,
            in_stock: false
          })}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search books..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={filters.category_id}
            onChange={(e) => handleFilterChange('category_id', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Format
          </label>
          <select
            value={filters.format}
            onChange={(e) => handleFilterChange('format', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Formats</option>
            <option value="ebook">E-Book</option>
            <option value="physical">Physical</option>
            <option value="audiobook">Audiobook</option>
          </select>
        </div>
      </div>

      {/* Toggle Filters */}
      <div className="mt-4 flex flex-wrap gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.featured}
            onChange={(e) => handleFilterChange('featured', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Featured Only</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.bestseller}
            onChange={(e) => handleFilterChange('bestseller', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Bestsellers Only</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.new_release}
            onChange={(e) => handleFilterChange('new_release', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">New Releases Only</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.in_stock}
            onChange={(e) => handleFilterChange('in_stock', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
        </label>
      </div>
    </div>
  );
}