'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface EditBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  book: {
    id: number;
    title: string;
    description: string;
    price: number;
    status: string;
    is_featured: boolean;
    category_name: string;
    author_name: string;
  };
  categories: Array<{ id: number; name: string; }>;
  authors: Array<{ id: number; name: string; }>;
}

export default function EditBookModal({ isOpen, onClose, onSuccess, book, categories, authors }: EditBookModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    status: 'draft',
    is_featured: false,
    category_id: '',
    author_id: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && book) {
      setFormData({
        title: book.title,
        description: book.description || '',
        price: book.price,
        status: book.status,
        is_featured: book.is_featured,
        category_id: '',
        author_id: ''
      });
    }
  }, [isOpen, book]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books/${book.id}/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          status: formData.status,
          is_featured: formData.is_featured,
          category_id: formData.category_id ? parseInt(formData.category_id) : null,
          author_id: formData.author_id ? parseInt(formData.author_id) : null
        })
      });

      if (response.ok) {
        toast.success('Book updated successfully');
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update book');
      }
    } catch (error) {
      toast.error('Error updating book');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Book</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Keep current category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Author</label>
              <select
                value={formData.author_id}
                onChange={(e) => setFormData({...formData, author_id: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Keep current author</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                className="mr-2"
              />
              Featured Book
            </label>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 border rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
              {loading ? 'Updating...' : 'Update Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}