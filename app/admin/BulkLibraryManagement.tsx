'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface User {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  status: string;
}

interface Book {
  id: number;
  title: string;
  author_name?: string;
  category_name?: string;
  format?: string;
  price?: number;
}

interface BulkLibraryManagementProps {
  onClose: () => void;
  preSelectedBook?: Book;
}

export default function BulkLibraryManagement({ onClose, preSelectedBook }: BulkLibraryManagementProps) {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<number[]>(preSelectedBook ? [preSelectedBook.id] : []);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [filterEbooksOnly, setFilterEbooksOnly] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
    fetchBooks();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?limit=100');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/admin/books?limit=100');
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const handleBulkAssignment = async () => {
    if (selectedUsers.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one user' });
      return;
    }

    if (selectedBooks.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one book' });
      return;
    }

    setBulkLoading(true);
    try {
      const response = await fetch('/api/admin/users/library/bulk-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          bookIds: selectedBooks,
          reason: reason || 'Bulk admin assignment'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
        setMessage({ 
          type: 'success', 
          text: `Bulk assignment completed! ${data.summary.successful} successful, ${data.summary.failed} failed, ${data.summary.skipped} skipped.` 
        });
        setSelectedUsers([]);
        setSelectedBooks([]);
        setReason('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to assign books' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while assigning books' });
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleBookSelection = (bookId: number) => {
    setSelectedBooks(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  };

  const selectAllUsers = () => {
    const filteredUsers = getFilteredUsers();
    setSelectedUsers(filteredUsers.map(user => user.id));
  };

  const selectAllBooks = () => {
    const filteredBooks = getFilteredBooks();
    setSelectedBooks(filteredBooks.map(book => book.id));
  };

  const clearUserSelection = () => {
    setSelectedUsers([]);
  };

  const clearBookSelection = () => {
    setSelectedBooks([]);
  };

  const getFilteredUsers = () => {
    let filtered = users;
    
    if (userSearchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getFilteredBooks = () => {
    let filtered = books;
    
    if (filterEbooksOnly) {
      filtered = filtered.filter(book => book.format === 'ebook');
    }
    
    if (bookSearchTerm) {
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(bookSearchTerm.toLowerCase()) ||
        book.author_name?.toLowerCase().includes(bookSearchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center">
            <i className="ri-loader-4-line animate-spin text-2xl text-blue-600"></i>
            <span className="ml-2">Loading data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {preSelectedBook ? `Assign "${preSelectedBook.title}" to Users` : 'Bulk Library Management'}
            </h2>
            <p className="text-gray-600">
              {preSelectedBook 
                ? `Assign this ebook to multiple users at once` 
                : 'Assign ebooks to multiple users at once'
              }
            </p>
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

        {/* Results Display */}
        {results && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Assignment Results</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.summary.successful}</div>
                <div className="text-green-700">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.summary.failed}</div>
                <div className="text-red-700">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{results.summary.skipped}</div>
                <div className="text-yellow-700">Skipped</div>
              </div>
            </div>
          </div>
        )}

        <div className={`grid gap-6 ${preSelectedBook ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {/* Users Selection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Users</h3>
              <div className="space-x-2">
                <button
                  onClick={selectAllUsers}
                  className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                >
                  Select All
                </button>
                <button
                  onClick={clearUserSelection}
                  className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search users..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {getFilteredUsers().map((user) => (
                <div key={user.id} className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </h4>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">@{user.username}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2 text-sm text-gray-600">
              Selected: {selectedUsers.length} users
            </div>
          </div>

          {/* Books Selection - Only show if no pre-selected book */}
          {!preSelectedBook && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Select Books</h3>
                <div className="space-x-2">
                  <button
                    onClick={selectAllBooks}
                    className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearBookSelection}
                    className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filterEbooksOnly}
                    onChange={(e) => setFilterEbooksOnly(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Ebooks only</span>
                </div>
                <input
                  type="text"
                  placeholder="Search books..."
                  value={bookSearchTerm}
                  onChange={(e) => setBookSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {getFilteredBooks().map((book) => (
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

              <div className="mt-2 text-sm text-gray-600">
                Selected: {selectedBooks.length} books
              </div>
            </div>
          )}
        </div>

        {/* Assignment Controls */}
        {(selectedUsers.length > 0 || selectedBooks.length > 0) && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">Assignment Summary</h3>
            {preSelectedBook && (
              <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Selected Book:</h4>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{preSelectedBook.title}</h5>
                    <p className="text-sm text-gray-500">{preSelectedBook.author_name}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <i className="ri-file-text-line mr-1"></i>
                    Ebook
                  </span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-sm text-blue-700">Users:</span>
                <span className="ml-2 font-medium">{selectedUsers.length}</span>
              </div>
              <div>
                <span className="text-sm text-blue-700">Books:</span>
                <span className="ml-2 font-medium">{selectedBooks.length}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <textarea
                placeholder="Reason for assignment (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={2}
              />
              <button
                onClick={handleBulkAssignment}
                disabled={bulkLoading || selectedUsers.length === 0 || selectedBooks.length === 0}
                className={`w-full px-4 py-2 rounded-lg text-white ${
                  bulkLoading || selectedUsers.length === 0 || selectedBooks.length === 0
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
                  `Assign ${selectedBooks.length} Book${selectedBooks.length > 1 ? 's' : ''} to ${selectedUsers.length} User${selectedUsers.length > 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 