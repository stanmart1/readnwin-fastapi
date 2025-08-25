'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Package, Truck, XCircle, RefreshCw, CreditCard, DollarSign } from 'lucide-react';

interface OrderStatusManagerProps {
  orderId: number;
  currentStatus: string;
  onStatusUpdate: (orderId: number, newStatus: string, notes?: string) => Promise<void>;
  disabled?: boolean;
}

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', icon: AlertCircle, color: 'text-yellow-500' },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'text-green-500' },
  { value: 'payment_processing', label: 'Payment Processing', icon: CreditCard, color: 'text-orange-500' },
  { value: 'paid', label: 'Paid', icon: DollarSign, color: 'text-green-600' },
  { value: 'processing', label: 'Processing', icon: Package, color: 'text-purple-500' },
  { value: 'shipped', label: 'Shipped', icon: Truck, color: 'text-indigo-500' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-green-700' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-red-500' },
  { value: 'refunded', label: 'Refunded', icon: AlertCircle, color: 'text-gray-500' }
];

export default function OrderStatusManager({ 
  orderId, 
  currentStatus, 
  onStatusUpdate, 
  disabled = false 
}: OrderStatusManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === currentStatus) return;

    setIsUpdating(true);
    try {
      let finalNotes = notes;
      if (showNotes && !notes.trim()) {
        finalNotes = prompt('Please add notes for this status change:') || '';
      }
      
      await onStatusUpdate(orderId, newStatus, finalNotes || undefined);
      setNotes('');
      setShowNotes(false);
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getCurrentStatusIndex = () => {
    return ORDER_STATUSES.findIndex(status => status.value === currentStatus);
  };

  const isStatusAvailable = (statusValue: string) => {
    const currentIndex = getCurrentStatusIndex();
    const targetIndex = ORDER_STATUSES.findIndex(status => status.value === statusValue);
    
    // Allow moving to adjacent statuses or specific allowed transitions
    const allowedTransitions: { [key: string]: string[] } = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['payment_processing', 'cancelled'],
      'payment_processing': ['paid', 'cancelled'],
      'paid': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': ['refunded'],
      'cancelled': ['refunded'],
      'refunded': []
    };

    const allowed = allowedTransitions[currentStatus] || [];
    return allowed.includes(statusValue) || targetIndex > currentIndex;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status Management</h3>
      
      {/* Current Status */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Current Status:</p>
        <div className="flex items-center space-x-2">
          {(() => {
            const status = ORDER_STATUSES.find(s => s.value === currentStatus);
            const Icon = status?.icon || AlertCircle;
            return (
              <>
                <Icon className={`w-5 h-5 ${status?.color || 'text-gray-400'}`} />
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {currentStatus.replace('_', ' ')}
                </span>
              </>
            );
          })()}
        </div>
      </div>

      {/* Status Options */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 mb-2">Update Status:</p>
        {ORDER_STATUSES.map((status) => {
          const isCurrent = status.value === currentStatus;
          const isAvailable = isStatusAvailable(status.value);
          const Icon = status.icon;
          
          return (
            <button
              key={status.value}
              onClick={() => handleStatusUpdate(status.value)}
              disabled={disabled || isUpdating || isCurrent || !isAvailable}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                isCurrent
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : isAvailable
                  ? 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
                  : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 ${status.color}`} />
                <span className="font-medium capitalize">{status.label}</span>
              </div>
              {isCurrent && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Current
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notes Toggle */}
      <div className="mt-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showNotes}
            onChange={(e) => setShowNotes(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Add notes to status change</span>
        </label>
      </div>

      {/* Notes Input */}
      {showNotes && (
        <div className="mt-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter notes for this status change..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
      )}

      {/* Loading State */}
      {isUpdating && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Updating status...</span>
        </div>
      )}
    </div>
  );
} 