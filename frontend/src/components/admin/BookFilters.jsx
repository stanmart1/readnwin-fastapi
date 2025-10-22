const BookFilters = ({ filters, categories, onFiltersChange }) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Search Input */}
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Search books..."
          value={filters.search}
          onChange={(e) => onFiltersChange(prev => ({ ...prev, search: e.target.value }))}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i className="ri-search-line text-gray-400"></i>
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={filters.status}
          onChange={(e) => onFiltersChange(prev => ({ ...prev, status: e.target.value }))}
          className="w-full sm:flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={filters.category_id || ''}
          onChange={(e) => onFiltersChange(prev => ({ 
            ...prev, 
            category_id: e.target.value ? parseInt(e.target.value) : undefined 
          }))}
          className="w-full sm:flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id} className="truncate">
              {category.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default BookFilters;
