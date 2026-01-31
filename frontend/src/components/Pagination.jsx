import { useMemo } from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, loading = false, className = '' }) => {
  const pageNumbers = useMemo(() => {
    const delta = window.innerWidth < 640 ? 1 : 2; // Fewer pages on mobile
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((item, index, arr) => arr.indexOf(item) === index);
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center space-x-1 sm:space-x-2 ${className}`}>
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading}
        className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm"
      >
        <i className="ri-arrow-left-s-line sm:hidden"></i>
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center space-x-1">
        {pageNumbers.map((page, index) => (
          page === '...' ? (
            <span key={index} className="px-3 py-2 text-gray-400 font-medium">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={loading}
              className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 disabled:cursor-not-allowed shadow-sm ${
                currentPage === page
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100'
              }`}
            >
              {page}
            </button>
          )
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || loading}
        className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm"
      >
        <i className="ri-arrow-right-s-line sm:hidden"></i>
        <span className="hidden sm:inline">Next</span>
      </button>
    </div>
  );
};

export default Pagination;
