import { getImageUrl } from '../../lib/fileService';

const BookTable = ({ books, selectedBooks, onSelectionChange, onBookAction, editLoading }) => {
  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange(books.map(book => book.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectBook = (bookId, checked) => {
    if (checked) {
      onSelectionChange([...selectedBooks, bookId]);
    } else {
      onSelectionChange(selectedBooks.filter(id => id !== bookId));
    }
  };

  return (
    <div className="space-y-4">
      {/* Books - Mobile Cards */}
      <div className="xl:hidden space-y-4">
        {books.map((book) => (
          <div key={book.id} className="bg-white rounded-lg shadow-md p-4 space-y-3">
            {/* Book Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedBooks.includes(book.id)}
                  onChange={(e) => handleSelectBook(book.id, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden relative flex-shrink-0">
                  <img
                    src={getImageUrl(book.cover_image_url || book.cover_image)}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                  {book.is_featured && (
                    <div className="absolute -top-1 -right-1">
                      <i className="ri-star-fill text-yellow-400 text-xs"></i>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 break-words">
                    {book.title}
                  </div>
                  <div className="text-sm text-gray-500 break-words">by {book.author_name}</div>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-1 ml-2">
                <span className="text-sm font-medium text-green-600">
                  ₦{book.price.toLocaleString()}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${
                  book.status === 'published' ? 'bg-green-500' :
                  book.status === 'draft' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`}>
                  {book.status}
                </span>
              </div>
            </div>

            {/* Book Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Category:</span>
                <span className="ml-1 font-medium text-gray-900 break-words">
                  {book.category_name}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Format:</span>
                <span className="ml-1 font-medium text-gray-900 break-words">
                  {book.format === 'ebook' ? 'Ebook' : 
                   book.format === 'physical' ? 'Physical' :
                   book.format === 'hybrid' ? 'Hybrid' :
                   book.format}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Stock:</span>
                <span className="ml-1 font-medium text-gray-900">
                  {book.stock_quantity}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-1 font-medium text-gray-900">
                  {new Date(book.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => onBookAction('view', book)}
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm whitespace-nowrap"
              >
                <i className="ri-eye-line mr-1"></i>
                View
              </button>
              <button
                onClick={() => onBookAction('edit', book)}
                disabled={editLoading}
                className={`flex items-center text-sm whitespace-nowrap ${
                  editLoading ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-800'
                }`}
              >
                <i className={`mr-1 ${
                  editLoading ? 'ri-loader-4-line animate-spin' : 'ri-edit-line'
                }`}></i>
                Edit
              </button>
              <button
                onClick={() => onBookAction('assign', book)}
                className="text-purple-600 hover:text-purple-800 flex items-center text-sm whitespace-nowrap"
              >
                <i className="ri-user-add-line mr-1"></i>
                Assign
              </button>
              <button
                onClick={() => onBookAction('toggleFeature', book)}
                className="text-yellow-600 hover:text-yellow-800 flex items-center text-sm whitespace-nowrap"
              >
                <i className={`ri-star-${book.is_featured ? 'fill' : 'line'} mr-1`}></i>
                {book.is_featured ? 'Unfeature' : 'Feature'}
              </button>
              <button
                onClick={() => onBookAction('toggleStatus', book)}
                className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm whitespace-nowrap"
              >
                <i className={`ri-toggle-${book.status === 'published' ? 'fill' : 'line'} mr-1`}></i>
                {book.status === 'published' ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => onBookAction('delete', book)}
                className="text-red-600 hover:text-red-800 flex items-center text-sm whitespace-nowrap"
              >
                <i className="ri-delete-bin-line mr-1"></i>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Books - Desktop Table */}
      <div className="hidden xl:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedBooks.length === books.length && books.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {books.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedBooks.includes(book.id)}
                      onChange={(e) => handleSelectBook(book.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-14 bg-gray-100 rounded overflow-hidden relative flex-shrink-0">
                        <img
                          src={getImageUrl(book.cover_image_url || book.cover_image)}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                        {book.is_featured && (
                          <div className="absolute -top-1 -right-1">
                            <i className="ri-star-fill text-yellow-400 text-xs"></i>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 break-words">
                          {book.title}
                        </div>
                        <div className="text-sm text-gray-500 break-words">
                          {book.format === 'ebook' ? 'Ebook' : 
                           book.format === 'physical' ? 'Physical' :
                           book.format === 'hybrid' ? 'Hybrid' :
                           book.format} • Stock: {book.stock_quantity}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 break-words">
                      {book.author_name}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-500 break-words">
                      {book.category_name}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-green-600">
                      ₦{book.price.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full text-white ${
                      book.status === 'published' ? 'bg-green-500' :
                      book.status === 'draft' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}>
                      {book.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onBookAction('view', book)}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer transition-colors duration-200"
                        title="View Book"
                      >
                        <i className="ri-eye-line"></i>
                      </button>
                      <button
                        onClick={() => onBookAction('edit', book)}
                        disabled={editLoading}
                        className={`cursor-pointer transition-colors duration-200 ${
                          editLoading ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-800'
                        }`}
                        title="Edit Book"
                      >
                        <i className={`${
                          editLoading ? 'ri-loader-4-line animate-spin' : 'ri-edit-line'
                        }`}></i>
                      </button>
                      <button
                        onClick={() => onBookAction('assign', book)}
                        className="text-purple-600 hover:text-purple-800 cursor-pointer transition-colors duration-200"
                        title="Assign to Users"
                      >
                        <i className="ri-user-add-line"></i>
                      </button>
                      <button
                        onClick={() => onBookAction('toggleFeature', book)}
                        className="text-yellow-600 hover:text-yellow-800 cursor-pointer transition-colors duration-200"
                        title={book.is_featured ? 'Remove from Featured' : 'Add to Featured'}
                      >
                        <i className={`ri-star-${book.is_featured ? 'fill' : 'line'}`}></i>
                      </button>
                      <button
                        onClick={() => onBookAction('toggleStatus', book)}
                        className="text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors duration-200"
                        title={book.status === 'published' ? 'Deactivate' : 'Activate'}
                      >
                        <i className={`ri-toggle-${book.status === 'published' ? 'fill' : 'line'}`}></i>
                      </button>
                      <button
                        onClick={() => onBookAction('delete', book)}
                        className="text-red-600 hover:text-red-800 cursor-pointer transition-colors duration-200"
                        title="Delete Book"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookTable;
