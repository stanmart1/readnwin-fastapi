'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface UpdatePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  book?: {
    id: number;
    title: string;
    price: number;
  };
  selectedBooks?: Array<{ id: number; title: string; price: number; }>;
  mode: 'single' | 'bulk';
}

export default function UpdatePriceModal({ isOpen, onClose, onSuccess, book, selectedBooks, mode }: UpdatePriceModalProps) {
  const [newPrice, setNewPrice] = useState(book?.price || 0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPrice <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (mode === 'single' && book) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books/${book.id}/price?price=${newPrice}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          toast.success('Price updated successfully');
          onSuccess();
          onClose();
        } else {
          const error = await response.json();
          toast.error(error.detail || 'Failed to update price');
        }
      } else if (mode === 'bulk' && selectedBooks) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/books/bulk-price-update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            book_ids: selectedBooks.map(b => b.id),
            price: newPrice
          })
        });

        if (response.ok) {
          toast.success(`Updated price for ${selectedBooks.length} books`);
          onSuccess();
          onClose();
        } else {
          const error = await response.json();
          toast.error(error.detail || 'Failed to update prices');
        }
      }
    } catch (error) {
      toast.error('Error updating price');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {mode === 'single' ? 'Update Book Price' : 'Bulk Update Prices'}
        </h2>
        
        {mode === 'single' && book && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium">{book.title}</p>
            <p className="text-sm text-gray-600">Current price: ₦{book.price}</p>
          </div>
        )}

        {mode === 'bulk' && selectedBooks && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium">{selectedBooks.length} books selected</p>
            <p className="text-sm text-gray-600">
              Price range: ₦{Math.min(...selectedBooks.map(b => b.price))} - ₦{Math.max(...selectedBooks.map(b => b.price))}
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">New Price (₦) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 border rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
              {loading ? 'Updating...' : 'Update Price'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}