'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Book {
  id: number;
  title: string;
  author_name?: string;
  category_name?: string;
  purchase_date?: string;
  is_favorite?: boolean;
  format?: string;
  price?: number;
}

interface UserLibraryManagementProps {
  userId: number;
  userName: string;
  onClose: () => void;
}

export default function UserLibraryManagement({ userId, userName, onClose }: UserLibraryManagementProps) {
  const { user, isAuthenticated } = useAuth();
  const [userLibrary, setUserLibrary] = useState<Book[]>([]);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingBook, setAddingBook] = useState(false);
  const [removingBook, setRemovingBook] = useState<number | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Bulk assignment states
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<number[]>([]);
  const [bulkReason, setBulkReason] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [filterEbooksOnly, setFilterEbooksOnly] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUserLibrary();
    fetchAvailableBooks();
  }, [userId]);

  const fetchUserLibrary = async () => {
    try {
      const response = await Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: [] }) });
      if (response.ok) {
        const data = await response.json();
        setUserLibrary(data.library || []);
      } else {
        console.error('Failed to fetch user library');
      }
    } catch (error) {
      console.error('Error fetching user library:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBooks = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setAvailableBooks(data.books || []);
      }
    } catch (error) {
      console.error('Error fetching available books:', error);
    }
  };

  const addBookToLibrary = async () => {
    if (!selectedBookId) {
      setMessage({ type: 'error', text: 'Please select a book' });
      return;
    }

    setAddingBook(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/library`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: selectedBookId,
          reason: reason || 'Admin assignment'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setSelectedBookId(null);
        setReason('');
        fetchUserLibrary(); // Refresh the library
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add book' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while adding the book' });
    } finally {
      setAddingBook(false);
    }
  };

  const removeBookFromLibrary = async (bookId: number) => {
    setRemovingBook(bookId);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/library?bookId=${bookId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchUserLibrary(); // Refresh the library
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to remove book' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while removing the book' });
    } finally {
      setRemovingBook(null);
    }
  };

  const getBooksNotInLibrary = () => {
    const userBookIds = userLibrary.map(book => book.id);
    let filteredBooks = availableBooks.filter(book => !userBookIds.includes(book.id));
    
    // Filter by ebooks only if enabled
    if (filterEbooksOnly) {
      filteredBooks = filteredBooks.filter(book => book.format === 'ebook');
    }
    
    // Filter by search term
    if (searchTerm) {
      filteredBooks = filteredBooks.filter(book => 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filteredBooks;
  };

  const handleBulkAssignment = async () => {
    if (selectedBooks.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one book' });
      return;
    }

    setBulkLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/library/bulk-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: [userId],
          bookIds: selectedBooks,
          reason: bulkReason || 'Bulk admin assignment'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Successfully assigned ${data.results.success.length} books. ${data.results.skipped.length} were already in library.` 
        });
        setSelectedBooks([]);
        setBulkReason('');
        setShowBulkAssignment(false);
        fetchUserLibrary(); // Refresh the library
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to assign books' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while assigning books' });
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleBookSelection = (bookId: number) => {
    setSelectedBooks(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const selectAllBooks = () => {
    const availableBooks = getBooksNotInLibrary();
    setSelectedBooks(availableBooks.map(book => book.id));
  };

  const clearSelection = () => {
    setSelectedBooks([]);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center">
            <i className="ri-loader-4-line animate-spin text-2xl text-blue-600"></i>
            <span className="ml-2">Loading user library...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Library for {userName}</h2>
            <p className="text-gray-600">Assign and manage ebooks in user's library</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User's Current Library */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Library ({userLibrary.length})</h3>
            </div>
            
            {userLibrary.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No books in library</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {userLibrary.map((book) => (
                  <div key={book.id} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{book.title}</h4>
                        <p className="text-sm text-gray-500">{book.author_name}</p>
                        {book.format && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                            book.format === 'ebook' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {book.format === 'ebook' ? 'Ebook' : 'Physical'}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeBookFromLibrary(book.id)}
                        disabled={removingBook === book.id}
                        className={`ml-2 p-2 rounded-full ${
                          removingBook === book.id 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        } transition-colors`}
                        title="Remove from library"
                      >
                        {removingBook === book.id ? (
                          <i className="ri-loader-4-line animate-spin text-sm"></i>
                        ) : (
                          <i className="ri-delete-bin-line text-sm"></i>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Books for Assignment */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Available Books</h3>
              <button
                onClick={() => setShowBulkAssignment(!showBulkAssignment)}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                {showBulkAssignment ? 'Single Assignment' : 'Bulk Assignment'}
              </button>
            </div>

            {/* Filters */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filterEbooksOnly}
                    onChange={(e) => setFilterEbooksOnly(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Ebooks only</span>
                </label>
              </div>
              <input
                type="text"
                placeholder="Search books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {showBulkAssignment ? (
              /* Bulk Assignment Interface */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Selected: {selectedBooks.length} books
                  </span>
                  <div className="space-x-2">
                    <button
                      onClick={selectAllBooks}
                      className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {getBooksNotInLibrary().map((book) => (
                    <div key={book.id} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedBooks.includes(book.id)}
                          onChange={() => toggleBookSelection(book.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{book.title}</h4>
                          <p className="text-sm text-gray-500">{book.author_name}</p>
                          {book.format && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                              book.format === 'ebook' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {book.format === 'ebook' ? 'Ebook' : 'Physical'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedBooks.length > 0 && (
                  <div className="space-y-3">
                    <textarea
                      placeholder="Reason for assignment (optional)"
                      value={bulkReason}
                      onChange={(e) => setBulkReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      rows={2}
                    />
                    <button
                      onClick={handleBulkAssignment}
                      disabled={bulkLoading}
                      className={`w-full px-4 py-2 rounded-lg text-white ${
                        bulkLoading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {bulkLoading ? (
                        <>
                          <i className="ri-loader-4-line animate-spin mr-2"></i>
                          Assigning...
                        </>
                      ) : (
                        `Assign ${selectedBooks.length} Book${selectedBooks.length > 1 ? 's' : ''} to Library`
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Single Assignment Interface */
              <div className="space-y-4">
                <select
                  value={selectedBookId || ''}
                  onChange={(e) => setSelectedBookId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select a book to assign</option>
                  {getBooksNotInLibrary().map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} - {book.author_name}
                    </option>
                  ))}
                </select>

                {selectedBookId && (
                  <div className="space-y-3">
                    <textarea
                      placeholder="Reason for assignment (optional)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      rows={2}
                    />
                    <button
                      onClick={addBookToLibrary}
                      disabled={addingBook}
                      className={`w-full px-4 py-2 rounded-lg text-white ${
                        addingBook 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {addingBook ? (
                        <>
                          <i className="ri-loader-4-line animate-spin mr-2"></i>
                          Adding...
                        </>
                      ) : (
                        'Add to Library'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 